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

// Call at top of any gated page. Redirects if not logged in or not approved.
async function requireApprovedUser(redirectTo = '/login.html') {
  const profile = await getProfile();
  if (!profile) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = redirectTo;
    return null;
  }
  if (profile.status === 'pending') {
    window.location.href = '/pending.html';
    return null;
  }
  if (profile.status === 'denied') {
    window.location.href = '/denied.html';
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
  window.location.href = '/index.html';
}

export { supabase, getSession, getProfile, requireApprovedUser, logUsage, signOut };
