-- LendPaper — Granular admin permissions (LEN-249)
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Backs per-person feature access: lp-panel.html tabs + the standalone
-- lp-hire.html recruiter feed.
--
-- Model:
--   * is_admin = true        → super-admin: full access to everything (lp-panel
--                              all tabs + lp-hire). Can never be locked out.
--   * profiles.permissions   → text[] of scope keys granted to a non-super-admin.
--
-- Scope keys (must match ADMIN_SCOPES in lp-panel.html):
--   lp_hire     → lp-hire.html recruiter feed (NOT a lp-panel tab)
--   dashboard   → lp-panel Dashboard
--   members     → lp-panel Members
--   registry    → lp-panel lender review (sidebar) + Registry + Overrides
--   compliance  → lp-panel Compliance
--   adoption    → lp-panel Adoption
--   staging     → lp-panel Staging
--
-- Idempotent: safe to re-run.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Add the permissions column
-- ──────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists permissions text[] not null default '{}';

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Super-admin safety — never lock Steve out of the newly-gated panel
-- ──────────────────────────────────────────────────────────────────────────
update public.profiles set is_admin = true
  where lower(email) = 'stephengowa@gmail.com';

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Grants
-- ──────────────────────────────────────────────────────────────────────────
-- Justin Rothblat → LP Hire only (he can open lp-hire.html, blocked from lp-panel).
update public.profiles set permissions = array['lp_hire']
  where lower(email) = 'justinrothblat@gmail.com';

-- Add more grants the same way, e.g.:
--   update public.profiles set permissions = array['registry']            -- data person
--     where lower(email) = 'someone@example.com';
--   update public.profiles set permissions = array['lp_hire','members']   -- multiple scopes
--     where lower(email) = 'someone@example.com';
-- Or just use lp-panel → Members → "Access" on each person.

-- ──────────────────────────────────────────────────────────────────────────
-- NOTE on enforcement
-- ──────────────────────────────────────────────────────────────────────────
-- Gating is client-side (lp-panel.html / lp-hire.html read the signed-in user's
-- profile and hide/deny accordingly) — this matches the existing trust model:
-- both pages were already client-gated, and only trusted people get logins.
-- For a hard server boundary, add RLS policies on job_postings / etc. keyed off
-- (is_admin OR permissions @> array['<scope>']). Tracked as a LEN-249 follow-up.
