-- Diagnose: "Invite failed: new row violates row-level security policy for table 'invites'"
-- Cause: the invites INSERT is gated by `with check (public.is_admin())`, and that
-- helper is returning false for the account signed into lp-panel.
-- Run these in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

-- 1) See what is_admin() actually checks (it's the LEN-62 helper, live-DB only).
select pg_get_functiondef('public.is_admin()'::regprocedure);

-- 2) Look at your admin profile row. Use the SAME Google email you sign into the
--    panel with. If is_admin is false/null here, that's the whole problem.
select id, email, is_admin
from public.profiles
where lower(email) = lower('stephengowa@gmail.com');

-- 3) Show every profile currently flagged admin (catches "signed in as the wrong row").
select id, email, is_admin from public.profiles where is_admin is true;

-- ── FIX (run after confirming step 2 shows is_admin = false/null) ──
-- Most is_admin() definitions resolve to `profiles.is_admin = true for auth.uid()`.
-- Set the flag on YOUR row (match on the email you actually log in with):
-- update public.profiles set is_admin = true
--   where lower(email) = lower('stephengowa@gmail.com');

-- If step 1 shows is_admin() checks a hardcoded email / app_metadata instead of
-- profiles.is_admin, fix it there instead — paste the function def back to Claude.
