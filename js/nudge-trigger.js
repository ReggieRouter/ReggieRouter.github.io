// js/nudge-trigger.js
// Decides whether to surface a cross-tool nudge on the current page (LEN-191).
// Import on any gated page (after auth), alongside tour-trigger.js:
//   <script type="module" src="/js/nudge-trigger.js"></script>
//
// Reads the LEN-51 usage signal (localStorage 'lp_tool_usage') so nudges are
// only offered to users engaged enough to benefit, and never collide with a
// page's first-run tour.

import { NUDGE_RULES, POLICY } from './nudge-config.js';
import { PAGE_TOURS }          from './tour-config.js';
import { ruleEligible, showNudge, inCooldown } from './nudge.js';

// LEN-51 keys (shared signal — do not fork)
const LP_USAGE_KEY   = 'lp_tool_usage';
const LP_PERSONA_KEY = 'lp_persona';

function currentPage() {
  return window.location.pathname.replace(/^\//, '') || 'index.html';
}

function buildCtx(page) {
  let usage = {};
  try { usage = JSON.parse(localStorage.getItem(LP_USAGE_KEY)) || {}; } catch (e) {}
  const persona = localStorage.getItem(LP_PERSONA_KEY) || '';
  const openedCount = Object.keys(usage).filter(id => usage[id] && usage[id].count > 0).length;
  return {
    page, usage, persona, openedCount,
    hasOpened: (id) => !!(usage[id] && usage[id].count > 0),
  };
}

// The page's own first-run tour, if any, owns the first impression. If that
// tour hasn't been seen yet, stay quiet this load.
function pageTourPending(page) {
  const t = PAGE_TOURS[page];
  if (!t || !t.storageKey) return false;
  return !localStorage.getItem(t.storageKey);
}

function pickRule(ctx) {
  for (const rule of NUDGE_RULES) {
    // engagement gate (per-rule override via rule.minToolsOpened)
    const need = (rule.minToolsOpened != null) ? rule.minToolsOpened : POLICY.minToolsOpened;
    if (ctx.openedCount < need) continue;
    if (ruleEligible(rule, ctx)) return rule;
  }
  return null;
}

function now() { try { return Date.now(); } catch (e) { return 0; } }

function init() {
  const page = currentPage();

  // Gate 1: never compete with a pending first-run tour — only when the tour
  // engine is actually wired on this page (tour-trigger.js sets this when present).
  if (window.__LP_TOURS_ENABLED__ && pageTourPending(page)) return;

  // Gate 2: global cooldown — at most one nudge per cooldown window, app-wide.
  if (inCooldown(now())) return;

  // Gate 3: pick the first eligible, engagement-gated rule for this page.
  const ctx = buildCtx(page);
  const rule = pickRule(ctx);
  if (!rule) return;

  // Small delay so the page settles and the nudge feels like a response, not a
  // pop-up that races the load.
  setTimeout(() => showNudge(rule), 1100);
}

// Manual API — let a page request its nudge evaluation after an async render
// (e.g. a calculator that paints results late). Honors all the same gates.
window.lpMaybeNudge = init;

document.addEventListener('DOMContentLoaded', init);
