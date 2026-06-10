-- LEN-232 — fix: invited-user signup blocked by profiles_role_check
--
-- Symptom: an invited user (Google sign-in) hit a red error on the final
-- onboarding step and could not finish — even "Skip for now" failed:
--   new row for relation "profiles" violates check constraint "profiles_role_check"
--
-- Cause: onboarding.html writes profile.role = invite.role, and since LEN-175/LEN-206
-- the invite role is a PERSONA KEY (dealmath/placement/sba/compliance/diligence/sales).
-- The live profiles table still carries an OLD profiles_role_check constraint (created
-- before personas existed — it is not in any tracked .sql file) that rejects those values.
-- This hits ONLY invited users, since non-invited signups never set role.
--
-- Run this once in the Supabase SQL editor.

-- ── Step A: diagnose first (run, eyeball the output) ─────────────────────────
-- See exactly what the current constraint allows, and what role values already
-- exist (so the ALTER below doesn't fail on legacy rows):
--
--   select pg_get_constraintdef(oid)
--     from pg_constraint where conname = 'profiles_role_check';
--   select role, count(*) from public.profiles group by role order by 2 desc;
--
-- If Step A surfaces legacy role values NOT in the list below, add them to the
-- in (...) set before running Step B (otherwise the ADD CONSTRAINT will fail).

-- ── Step B: widen the constraints to the 6 canonical persona keys + NULL ─────
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in
    ('dealmath','placement','sba','compliance','diligence','sales'));

-- Keep the persona-column constraint in sync (it predates the 'sales' persona
-- added in LEN-206, so it would reject 'sales' if persona is ever written).
alter table public.profiles
  drop constraint if exists profiles_persona_check;
alter table public.profiles
  add constraint profiles_persona_check
  check (persona is null or persona in
    ('dealmath','placement','sba','compliance','diligence','sales'));

-- ── Step C: verify ───────────────────────────────────────────────────────────
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conname in ('profiles_role_check','profiles_persona_check');
--
-- Then have the blocked user retry signup end-to-end.
--
-- Note: the onboarding.html code change for LEN-232 ALSO fail-safes this — if the
-- DB rejects the role, the user is now let in WITHOUT a role instead of seeing a red
-- error. Running this SQL is still required so invited users keep their assigned role.
