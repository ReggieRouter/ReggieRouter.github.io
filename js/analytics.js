// LendPaper — anonymous + logged-in usage tracking (LEN-285)
//
// Open access means most traffic has no user_id. Every visitor gets a stable
// per-browser session id so usage_events can count anonymous activity from
// first visit; signed-in events carry user_id as before.
//
// Schema note: usage_events columns are `tool` and `event` (what logUsage in
// auth.js has always written) plus `session_id` and `metadata` added for this
// rollout. Tool keys are FROZEN (LEN-143) — reuse the existing logUsage keys
// ('amortization', 'dscr', 'deal-read', …), never invent new spellings.
//
// Usage (module pages):   import { logEvent } from '../js/analytics.js';
// Usage (non-module JS):  window.lpAnalytics?.logEvent(tool, event, metadata)
// logEvent NEVER throws — analytics must never break a tool.

import { supabase } from './auth.js';

const LP_SESSION_KEY = 'lp_session_id';

function getSessionId() {
  // Safari private browsing throws on localStorage.setItem — fall back through
  // sessionStorage to an ephemeral id rather than ever erroring.
  try {
    let id = localStorage.getItem(LP_SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LP_SESSION_KEY, id);
    }
    return id;
  } catch (e) {
    try {
      let id = sessionStorage.getItem(LP_SESSION_KEY);
      if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(LP_SESSION_KEY, id); }
      return id;
    } catch (e2) {
      return crypto.randomUUID(); // last resort: ephemeral per-call id
    }
  }
}

async function getCurrentUserId() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (e) { return null; }
}

async function logEvent(tool, event, metadata = {}) {
  try {
    // STAGING GUARD: only the production hostname writes usage_events —
    // staging/preview instances must never pollute the adoption funnel.
    if (!/(^|\.)lendpaper\.com$/.test(location.hostname)) return;
    const userId = await getCurrentUserId();
    const { error } = await supabase.from('usage_events').insert({
      session_id: getSessionId(),
      tool,
      event,
      user_id: userId,
      metadata,
    });
    if (error) console.warn('[LP analytics] non-fatal:', error.message);
  } catch (e) {
    console.warn('[LP analytics] non-fatal:', e?.message);
  }
}

window.lpAnalytics = { logEvent, getSessionId };

export { logEvent, getSessionId };
