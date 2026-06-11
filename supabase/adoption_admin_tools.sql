-- LendPaper — Adoption admin tools (exclude + merge)
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Backs two controls on the admin Adoption tab (lp-panel.html):
--   • exclude_from_metrics — drop a person (and their activity) from every
--     adoption count, like an admin account. For test/internal logins.
--   • merged_into          — point a duplicate profile at the canonical one so
--     a person who signed in with 2+ emails counts as a single member; their
--     events/estimates roll up under the canonical id.
--
-- Idempotent: safe to re-run. Admin already has UPDATE on profiles (the panel
-- edits status/is_admin/full_name today), so no new policy is needed.

alter table public.profiles
  add column if not exists exclude_from_metrics boolean not null default false;

alter table public.profiles
  add column if not exists merged_into uuid references public.profiles (id) on delete set null;

-- A profile can't be merged into itself.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_merged_into_not_self'
  ) then
    alter table public.profiles
      add constraint profiles_merged_into_not_self check (merged_into is null or merged_into <> id);
  end if;
end $$;

create index if not exists profiles_merged_into_idx on public.profiles (merged_into);
create index if not exists profiles_exclude_idx on public.profiles (exclude_from_metrics) where exclude_from_metrics;
