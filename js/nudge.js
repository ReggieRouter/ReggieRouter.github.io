// js/nudge.js
// Cross-tool nudge engine (LEN-191). Knows nothing about copy — rules + text
// live in nudge-config.js. Renders one calm, dismissible card pinned to the
// bottom-right; persists frequency/dismissal state in localStorage.
//
// Design language: matches the tour callout (white card, 0.5px hairline border,
// soft shadow, brand-green accent). One clean outline — no double ring
// (LendPaper single-outline rule). No dots, no badges.

import { NUDGE_VERSION, POLICY } from './nudge-config.js';

const CARD_Z = 8800;   // below the tour overlay (9000+), above page chrome

// ── State (localStorage) ─────────────────────────────────────────────────────
const K_LAST      = NUDGE_VERSION + '_last';        // ts of last nudge shown
const K_DISMISSED = NUDGE_VERSION + '_dismissed';   // ids the user closed
const K_ACTED     = NUDGE_VERSION + '_acted';       // ids the user clicked
const K_SHOWN     = NUDGE_VERSION + '_shown';       // { id: count }

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

export function wasDismissed(id) { return readJSON(K_DISMISSED, []).includes(id); }
export function wasActedOn(id)   { return readJSON(K_ACTED, []).includes(id); }
export function timesShown(id)   { return (readJSON(K_SHOWN, {})[id]) || 0; }

export function inCooldown(now) {
  const last = parseInt(localStorage.getItem(K_LAST) || '0', 10);
  if (!last) return false;
  return (now - last) < POLICY.cooldownHours * 3600 * 1000;
}

function recordShown(id, now) {
  const shown = readJSON(K_SHOWN, {});
  shown[id] = (shown[id] || 0) + 1;
  writeJSON(K_SHOWN, shown);
  localStorage.setItem(K_LAST, String(now));
}
function recordDismissed(id) {
  const d = readJSON(K_DISMISSED, []);
  if (!d.includes(id)) { d.push(id); writeJSON(K_DISMISSED, d); }
}
function recordActed(id) {
  const a = readJSON(K_ACTED, []);
  if (!a.includes(id)) { a.push(id); writeJSON(K_ACTED, a); }
}

// ── Eligibility (per-rule, before policy) ────────────────────────────────────
// Returns true if the rule could be shown right now, ignoring the global
// cooldown/one-per-load gates (those are applied by the trigger).
export function ruleEligible(rule, ctx) {
  if (!rule || !rule.id) return false;
  if (wasDismissed(rule.id) || wasActedOn(rule.id)) return false;
  if (timesShown(rule.id) >= POLICY.maxShows) return false;
  // page scope
  const pages = rule.pages;
  if (pages && pages !== '*' && !pages.includes(ctx.page)) return false;
  // extra predicate
  if (typeof rule.when === 'function' && !rule.when(ctx)) return false;
  return true;
}

// ── Render ───────────────────────────────────────────────────────────────────
let cardEl = null;
let autoTimer = null;

function ensureStyle() {
  if (document.getElementById('lp-nudge-style')) return;
  const s = document.createElement('style');
  s.id = 'lp-nudge-style';
  s.textContent = `
    @keyframes lp-nudge-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    #lp-nudge-card {
      position: fixed; right: 20px; bottom: 20px; z-index: ${CARD_Z};
      width: 320px; max-width: calc(100vw - 40px);
      background: #fff; border: 0.5px solid rgba(0,0,0,0.12);
      border-radius: 14px; padding: 15px 16px 14px;
      box-shadow: 0 8px 30px rgba(17,24,39,0.13);
      font-family: inherit; animation: lp-nudge-in .32s cubic-bezier(.4,0,.2,1);
    }
    #lp-nudge-card .lp-nudge-kicker {
      font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
      color: #2D6A4F; font-weight: 600; margin-bottom: 5px;
    }
    #lp-nudge-card .lp-nudge-text {
      font-size: 13px; line-height: 1.5; color: #1f2937; margin: 0 0 12px;
    }
    #lp-nudge-card .lp-nudge-row {
      display: flex; align-items: center; gap: 8px;
    }
    #lp-nudge-card .lp-nudge-cta {
      font-size: 12.5px; font-weight: 600; text-decoration: none;
      background: #1D9E75; color: #fff; border: none; border-radius: 8px;
      padding: 8px 14px; cursor: pointer; line-height: 1; white-space: nowrap;
    }
    #lp-nudge-card .lp-nudge-cta:hover { background: #178a66; }
    #lp-nudge-card .lp-nudge-later {
      font-size: 12px; background: none; border: none; cursor: pointer;
      color: #9ca3af; padding: 6px 4px; margin-left: auto;
    }
    #lp-nudge-card .lp-nudge-later:hover { color: #6b7280; }
    #lp-nudge-card .lp-nudge-x {
      position: absolute; top: 9px; right: 11px; font-size: 16px; line-height: 1;
      background: none; border: none; cursor: pointer; color: #c4c7cc; padding: 2px;
    }
    #lp-nudge-card .lp-nudge-x:hover { color: #6b7280; }
    @media (max-width: 520px) {
      #lp-nudge-card { left: 16px; right: 16px; width: auto; bottom: 16px; }
    }
  `;
  document.head.appendChild(s);
}

export function closeNudge() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  if (cardEl) {
    cardEl.style.transition = 'opacity .2s ease, transform .2s ease';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'translateY(8px)';
    const el = cardEl; cardEl = null;
    setTimeout(() => el.remove(), 220);
  }
}

/**
 * showNudge(rule, { onCta, onDismiss })
 * Renders the card and records the "shown" tick. Caller is responsible for
 * having checked policy/eligibility first.
 */
export function showNudge(rule, hooks = {}) {
  ensureStyle();
  closeNudge();

  const now = Date.now ? safeNow() : 0;
  cardEl = document.createElement('div');
  cardEl.id = 'lp-nudge-card';
  cardEl.setAttribute('role', 'status');
  cardEl.style.position = 'fixed';
  cardEl.innerHTML = `
    <button class="lp-nudge-x" aria-label="Dismiss">&times;</button>
    <div class="lp-nudge-kicker"></div>
    <p class="lp-nudge-text"></p>
    <div class="lp-nudge-row">
      <a class="lp-nudge-cta"></a>
      <button class="lp-nudge-later">Not now</button>
    </div>`;
  cardEl.querySelector('.lp-nudge-kicker').textContent = rule.kicker || 'Suggestion';
  cardEl.querySelector('.lp-nudge-text').textContent   = rule.text;
  const ctaEl = cardEl.querySelector('.lp-nudge-cta');
  ctaEl.textContent = rule.cta || 'Open';
  ctaEl.href = rule.href || '#';

  // CTA → record acted, let navigation proceed
  ctaEl.addEventListener('click', () => {
    recordActed(rule.id);
    if (hooks.onCta) hooks.onCta(rule);
    // navigation proceeds via the href
  });
  // ✕ and "Not now" → dismiss (✕ = permanent, Not now = soft close, both record)
  const dismiss = () => {
    recordDismissed(rule.id);
    if (hooks.onDismiss) hooks.onDismiss(rule);
    closeNudge();
  };
  cardEl.querySelector('.lp-nudge-x').addEventListener('click', dismiss);
  cardEl.querySelector('.lp-nudge-later').addEventListener('click', dismiss);

  document.body.appendChild(cardEl);
  recordShown(rule.id, now);

  if (POLICY.autoDismissSec > 0) {
    autoTimer = setTimeout(closeNudge, POLICY.autoDismissSec * 1000);
  }
  return cardEl;
}

// Date.now() is disallowed in some sandboxes; guard it for the engine's own use.
function safeNow() {
  try { return Date.now(); } catch (e) { return 0; }
}
