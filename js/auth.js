import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) return null;
  return data;
}

// Gated calculators run inside the SPA tool <iframe> (index.html). A plain
// window.location redirect would only navigate that iframe, leaving the app
// sidebar/header visible around the login page. These helpers escape to the
// top window so login/pending/waitlist take over the whole screen.
function navTop(path) {
  try {
    if (window.self !== window.top) { window.top.location.href = path; return; }
  } catch (e) { /* cross-origin top: fall through */ }
  window.location.href = path;
}
function currentTopPath() {
  try {
    if (window.self !== window.top) return window.top.location.pathname;
  } catch (e) { /* cross-origin top: fall through */ }
  return window.location.pathname;
}

// Call at top of any gated page. Redirects if not logged in or not approved.
async function requireApprovedUser(redirectTo = '/login.html') {
  // Test-only bypass: the QA harness (LEN-129) sets this window flag via
  // addInitScript so gated pages render headless. Never set in production —
  // client gates are UX only; data is protected server-side by Supabase RLS.
  if (typeof window !== 'undefined' && window.__LP_QA_BYPASS__) {
    return { id: 'qa-bypass', status: 'approved', full_name: 'QA Harness' };
  }
  const profile = await getProfile();
  if (!profile) {
    sessionStorage.setItem('redirectAfterLogin', currentTopPath());
    navTop(redirectTo);
    return null;
  }
  if (profile.status === 'pending') {
    navTop('/pending.html');
    return null;
  }
  if (profile.status === 'denied' || profile.status === 'waitlist') {
    // denied.html is intentionally unrouted — both land on the waitlist soft landing
    navTop('/waitlist.html');
    return null;
  }
  // Update last_seen
  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', profile.id);
  return profile;
}

// Log a tool usage event
async function logUsage(tool, event = 'view') {
  const session = await getSession();
  if (!session) return;
  await supabase.from('usage_events').insert({
    user_id: session.user.id,
    tool,
    event
  });
}

async function signOut() {
  await supabase.auth.signOut();
  navTop('/index.html');
}

export { supabase, getSession, getProfile, requireApprovedUser, logUsage, signOut };
