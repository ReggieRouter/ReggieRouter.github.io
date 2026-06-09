-- LendPaper — Adoption & Goals (LEN-57)
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Backs the admin Adoption tab in lp-panel.html (funnel + per-person /
-- per-company adoption + goal tracking).
--
-- Three parts:
--   1. adoption_goals          — admin-defined targets (person / company / global)
--   2. admin read access       — let the admin SELECT every user's activity
--                                (without this every metric silently reads 0)
--   3. usage_events hardening   — ensure the table + its own RLS exist
--
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Goals table
-- ──────────────────────────────────────────────────────────────────────────
-- Generic scope/metric/target shape so a company target, a "% members active"
-- target, and a per-person target all fit with no schema churn.

create table if not exists public.adoption_goals (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('company','person','global')),
  scope_value text,                       -- company name | profiles.id (text) | null for global
  metric      text not null check (metric in (
                'estimates_count',        -- count of estimates in the window
                'pct_engaged',            -- % of members at Engaged+ (0-100)
                'pct_adopted',            -- % of members at Adopted+ (0-100)
                'engaged_members',        -- # members at Engaged+
                'adopted_members',        -- # members at Adopted+
                'power_members',          -- # members at Power user
                'distinct_tools')),       -- # distinct tools touched
  target      numeric not null,
  window_days integer not null default 30,
  label       text,                       -- optional human label
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

create index if not exists adoption_goals_scope_idx
  on public.adoption_goals (scope, scope_value);

alter table public.adoption_goals enable row level security;

-- Admin-only (all verbs) — gated on the same profiles.is_admin flag the panel
-- already uses to distinguish the admin account.
drop policy if exists "adoption_goals_admin_all" on public.adoption_goals;
create policy "adoption_goals_admin_all" on public.adoption_goals
  for all
  using      (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ──────────────────────────────────────────────────────────────────────────
-- 3. usage_events — ensure the table + base RLS exist
--    (auth.js logUsage() inserts {user_id, tool, event}; the table was created
--     ad-hoc and has no committed schema. Define it here so this migration is
--     self-contained.)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tool       text not null,              -- 'waterfall', 'legislation', 'dscr', ...
  event      text not null default 'view',
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_created_idx
  on public.usage_events (created_at desc);

alter table public.usage_events enable row level security;

-- Each user may insert their own events (matches logUsage()).
drop policy if exists "usage_events_insert_own" on public.usage_events;
create policy "usage_events_insert_own" on public.usage_events
  for insert with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Admin read access (the unlock for adoption metrics)
--    RLS policies are permissive (OR'd), so these are additive — they do NOT
--    weaken the existing owner-only policies, they just also let the admin read.
-- ──────────────────────────────────────────────────────────────────────────
drop policy if exists "usage_events_admin_select" on public.usage_events;
create policy "usage_events_admin_select" on public.usage_events
  for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "estimates_admin_select" on public.estimates;
create policy "estimates_admin_select" on public.estimates
  for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
