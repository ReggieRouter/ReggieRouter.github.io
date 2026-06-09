-- Admin-initiated invites (LEN-105)
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Until this runs, the "+ Invite" button / "Invited" tab show a "Couldn't load
-- invites" error, and onboarding.html silently treats everyone as non-invited
-- (safe fallback) — so shipping the code before running this never breaks signup.

-- 1) Invites table
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text,
  company     text,
  role        text,
  invited_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

-- If the table was created from the earlier (name+email only) version, add the
-- new columns. Safe to run repeatedly.
alter table public.invites add column if not exists company text;
alter table public.invites add column if not exists role    text;

-- One invite per email (lowercased by the app before insert/lookup)
create unique index if not exists invites_email_key on public.invites (lower(email));

-- 2) RLS
alter table public.invites enable row level security;

-- Admin (Steve) — full control. Reuses the is_admin() helper from LEN-62.
drop policy if exists "Admin manages invites" on public.invites;
create policy "Admin manages invites"
  on public.invites for all
  using (public.is_admin())
  with check (public.is_admin());

-- An invited user can read the row matching their own JWT email, so
-- onboarding.html can look up its own invite (role + approval).
drop policy if exists "Invitee reads own invite" on public.invites;
create policy "Invitee reads own invite"
  on public.invites for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ...and stamp accepted_at on it.
drop policy if exists "Invitee accepts own invite" on public.invites;
create policy "Invitee accepts own invite"
  on public.invites for update
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));
