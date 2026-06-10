-- LendPaper — Login failure capture: `login_failures` table  (LEN-259)
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Captures every failed sign-in so we can see WHO bounced and WHY (error code).
-- The #1 cause is corporate email "link prefetch" — a security scanner GETs the
-- one-time magic link, consumes the token, and the user's real click then lands
-- on "Email link is invalid or has expired". This table makes that visible.
--
-- Written from the logged-OUT (anon) client at the moment of failure, so the
-- insert policy must allow `anon`. Nothing sensitive is stored: the email is the
-- one the person was already typing in, and `url` has its tokens stripped before
-- it ever reaches here (see auth-callback.html / login.html).

create table if not exists public.login_failures (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text,                  -- attempted email (from login-time stash; may be null)
  stage             text,                  -- 'callback' | 'send' | 'exchange' | 'timeout' | 'no_credentials'
  error_code        text,                  -- e.g. 'otp_expired', 'access_denied', '429'
  error_description text,                  -- human-readable reason from the provider
  user_agent        text,                  -- to spot in-app browsers / scanners
  url               text,                  -- page URL with tokens stripped
  meta              jsonb not null default '{}'::jsonb
);

create index if not exists login_failures_created_idx
  on public.login_failures (created_at desc);
create index if not exists login_failures_email_idx
  on public.login_failures (lower(email));

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.login_failures enable row level security;

-- Anyone (incl. the logged-out user who just failed) may record a failure.
-- Insert-only: they can never read the table back.
drop policy if exists "login_failures_insert_anyone" on public.login_failures;
create policy "login_failures_insert_anyone" on public.login_failures
  for insert to anon, authenticated with check (true);

-- Only admins may read the failures (mirrors the lp-panel admin gate).
drop policy if exists "login_failures_select_admin" on public.login_failures;
create policy "login_failures_select_admin" on public.login_failures
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
