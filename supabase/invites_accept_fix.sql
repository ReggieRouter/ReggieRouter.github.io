-- LEN-245: make invite acceptance persist (airtight write side).
-- Symptom: lp-panel → Members → Invited showed everyone as "Awaiting sign-in"
-- even after they signed in, because invites.accepted_at was never written —
-- the live table drifted across migrations (accepted_at vs legacy used_at)
-- and/or the invitee UPDATE policy was missing, so onboarding's stamp failed.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent — safe to re-run. Touches only acceptance; does NOT alter the
-- admin INSERT / is_admin() policy (that's a separate concern).

-- 1) Ensure the canonical acceptance column exists.
alter table public.invites add column if not exists accepted_at timestamptz;

-- 2) Backfill from the legacy `used_at` column, if this DB still has it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'invites' and column_name = 'used_at'
  ) then
    update public.invites
       set accepted_at = used_at
     where accepted_at is null and used_at is not null;
  end if;
end $$;

-- 3) Backfill from profiles: anyone who already signed in (a profile exists for
--    the invite email) but was never stamped. This corrects the SOURCE data for
--    the people currently stuck — the Justins, Chris, Molly, etc.
update public.invites i
   set accepted_at = p.created_at
  from public.profiles p
 where i.accepted_at is null
   and lower(p.email) = lower(i.email);

-- 4) Ensure the RLS policies that let an invitee read + stamp their OWN invite
--    exist (these live in invites.sql but may predate this DB). Scoped tightly
--    to the invitee's own JWT email — no wider access.
alter table public.invites enable row level security;

drop policy if exists "Invitee reads own invite" on public.invites;
create policy "Invitee reads own invite"
  on public.invites for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Invitee accepts own invite" on public.invites;
create policy "Invitee accepts own invite"
  on public.invites for update
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5) Sanity check — see who's now stamped vs still awaiting.
select email,
       accepted_at,
       case when accepted_at is null then 'awaiting' else 'accepted' end as status
from public.invites
order by accepted_at nulls first, created_at desc;
