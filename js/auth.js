import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// LEN-244 — fix "forced to re-login every visit". Gated calculators run inside the SPA
// tool <iframe> (index.html), and BOTH the shell and each calculator import this module —
// so two same-origin GoTrueClient instances would each auto-refresh the SAME refresh token,
// rotating it out from under each other and leaving an INVALID token in localStorage. The
// next visit reads that dead token, the refresh fails, and the user lands back on /login.
// Fix: only the top window refreshes the token. The iframe'd calculators still persist and
// READ the shared session (and pick up the parent's refreshes via the storage event), they
// just don't run their own refresh loop. A calculator opened as its OWN top-level page
// (deep link / bookmark) is window.top, so it keeps autoRefresh and works standalone.
const inIframe = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
// NOTE (LEN-285): keep the DEFAULT storageKey (sb-<ref>-auth-token). Renaming it
// would log out every existing user and break the sb-* localStorage scan the
// LEN-153 landing uses to pick its pre-paint state.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: !inIframe,
    detectSessionInUrl: !inIframe,
  },
});

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

// Call at top of any gated page (Quote Log is the only one left — LEN-285 opened
// the tools). Redirects if not logged in; denied accounts are the only status
// still blocked. pending/waitlist statuses are treated as approved (open access).
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
  if (profile.status === 'denied') {
    navTop('/denied.html');
    return null;
  }
  // Update last_seen
  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', profile.id);
  return profile;
}

// Open-access companion to requireApprovedUser: resolves the logged-in user (or
// the full profile via getProfile) WITHOUT ever redirecting or throwing. Tool
// pages call this to decorate the UI for signed-in users; visitors get null.
async function getOptionalUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (e) {
    return null; // never block or throw — open pages must always render
  }
}
if (typeof window !== 'undefined') window._lpGetOptionalUser = getOptionalUser;

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
  // Clear the cached greeting name so a shared machine never greets the next
  // visitor with the previous user's name (LEN-285).
  try { localStorage.removeItem('lp_first_name'); } catch (e) {}
  navTop('/index.html');
}

export { supabase, getSession, getProfile, requireApprovedUser, getOptionalUser, logUsage, signOut };
