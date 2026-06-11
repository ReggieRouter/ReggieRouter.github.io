-- LendPaper — Dashboard personalization (LEN-51): profiles.persona
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Stores the job-to-be-done "persona" captured by the onboarding JTBD step. The
-- dashboard uses it to seed each user's login-1 featured top row
-- (index.html → PERSONA_TOOLS): dealmath / placement / sba / compliance /
-- diligence / sales (sales added by LEN-206).
--
-- Graceful by design: until this runs, persona lives only in the browser
-- (localStorage 'lp_persona') and the dashboard still personalizes by usage + pins.
-- Onboarding writes this column best-effort, so the write is a harmless no-op
-- before the migration and starts persisting (durable, cross-device) after it.

alter table public.profiles
  add column if not exists persona text;

-- Keep it to the known keys, but allow NULL (users who skip the question, or who
-- onboarded before this shipped). When adding a persona, widen this list AND the
-- live profiles_role_check (see supabase/profiles_role_fix.sql / LEN-232).
alter table public.profiles
  drop constraint if exists profiles_persona_check;
alter table public.profiles
  add constraint profiles_persona_check
  check (persona is null or persona in ('dealmath','placement','sba','compliance','diligence','sales'));

-- No RLS change needed: profiles already lets a user update their own row
-- (auth.js writes profiles.last_seen under the existing self-update policy).

-- Verify (should return one row: persona):
--   select column_name from information_schema.columns
--    where table_name = 'profiles' and column_name = 'persona';
