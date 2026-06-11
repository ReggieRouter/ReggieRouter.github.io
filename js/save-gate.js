// LendPaper — save gate (LEN-285)
//
// Open access: tools never require login; signing in exists to SAVE deals.
// quote-log.js dispatches 'lp:estimate-saved' after every saveEstimate() (PDF
// generation / Copy Scenario — the deliberate save moments). For anonymous
// users this module offers sign-in via a banner → modal; the deal is stashed
// in sessionStorage and persisted to the user's Deal Log right after OAuth
// lands them back on the tool.
//
// Intent keys (consumed HERE, on the tool page, never in auth-callback —
// reading + removing BEFORE the re-save is what prevents duplicate saves):
//   post-login-action = 'save-quote'
//   post-login-data   = JSON estimate record
//   auth-return-to    = tool URL auth-callback redirects back to
//
// Public API (for a future dedicated button): window.LPSaveGate.requestSave(record)

import { supabase, getOptionalUser } from './auth.js';
import { saveEstimate } from './quote-log.js';
import { logEvent } from './analytics.js';

const ACTION_KEY = 'post-login-action';
const DATA_KEY = 'post-login-data';
const RETURN_KEY = 'auth-return-to';
const DISMISS_KEY = 'lp_save_gate_dismissed';

function topHref() {
  try { if (window.self !== window.top) return window.top.location.href; } catch (e) {}
  return window.location.href;
}
function navTop(url) {
  try { if (window.self !== window.top) { window.top.location.href = url; return; } } catch (e) {}
  window.location.href = url;
}

// ── UI ───────────────────────────────────────────────────────────────────────
const CSS = `
.lp-sg-toast { position:fixed; right:18px; bottom:18px; z-index:9000; max-width:340px;
  background:#fff; border:1px solid rgba(0,0,0,0.10); border-radius:14px; padding:14px 16px;
  box-shadow:0 8px 30px rgba(15,35,26,0.14); font-family:'Inter',-apple-system,system-ui,sans-serif;
  font-size:13px; color:#111827; line-height:1.5; animation:lpSgRise .35s cubic-bezier(.22,1,.36,1) both; }
@keyframes lpSgRise { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
.lp-sg-toast strong { display:block; font-weight:700; margin-bottom:3px; }
.lp-sg-toast .lp-sg-row { display:flex; gap:8px; margin-top:10px; }
.lp-sg-toast button { font-family:inherit; font-size:12.5px; font-weight:600; cursor:pointer; border-radius:8px; padding:8px 13px; }
.lp-sg-toast .lp-sg-cta { background:#1A3C2E; color:#fff; border:none; }
.lp-sg-toast .lp-sg-cta:hover { background:#142E23; }
.lp-sg-toast .lp-sg-dismiss { background:none; border:1px solid rgba(0,0,0,0.12); color:#6B7280; }
.lp-sg-toast .lp-sg-dismiss:hover { color:#111827; }
.lp-sg-backdrop { position:fixed; inset:0; z-index:9100; background:rgba(15,23,18,0.45);
  display:flex; align-items:center; justify-content:center; padding:24px;
  font-family:'Inter',-apple-system,system-ui,sans-serif; }
.lp-sg-modal { width:100%; max-width:400px; background:#fff; border:1px solid rgba(0,0,0,0.08);
  border-radius:18px; padding:32px 30px; box-shadow:0 10px 44px rgba(0,0,0,0.18);
  animation:lpSgRise .35s cubic-bezier(.22,1,.36,1) both; }
.lp-sg-modal h2 { margin:0 0 7px; font-size:21px; font-weight:700; letter-spacing:-0.02em; color:#111827; }
.lp-sg-modal p { margin:0 0 22px; font-size:13.5px; color:#6B7280; line-height:1.55; }
.lp-sg-modal .lp-sg-oauth { display:flex; align-items:center; justify-content:center; gap:10px;
  width:100%; padding:12px 16px; border:none; border-radius:11px; color:#fff;
  font-family:inherit; font-weight:600; font-size:14px; cursor:pointer; transition:opacity .18s; }
.lp-sg-modal .lp-sg-oauth:hover { opacity:.88; }
.lp-sg-modal .lp-sg-google { background:#1A3C2E; margin-bottom:10px; }
.lp-sg-modal .lp-sg-ms { background:#2F2F2F; }
.lp-sg-modal .lp-sg-cancel { display:block; margin:18px auto 0; background:none; border:none;
  font-family:inherit; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; }
.lp-sg-modal .lp-sg-cancel:hover { color:#111827; }
.lp-sg-modal svg { width:18px; height:18px; flex-shrink:0; }
.lp-fv-bar { position:fixed; left:50%; bottom:14px; transform:translateX(-50%); z-index:8900;
  display:flex; align-items:center; gap:12px; max-width:calc(100vw - 28px);
  background:#fff; border:1px solid rgba(0,0,0,0.10); border-radius:999px; padding:9px 10px 9px 18px;
  box-shadow:0 8px 30px rgba(15,35,26,0.16); font-family:'Inter',-apple-system,system-ui,sans-serif;
  font-size:13px; color:#111827; white-space:nowrap; animation:lpSgRise .35s cubic-bezier(.22,1,.36,1) both; }
.lp-fv-bar button { font-family:inherit; font-weight:600; cursor:pointer; }
.lp-fv-bar .lp-fv-cta { background:#1A3C2E; color:#fff; border:none; border-radius:999px; padding:8px 15px; font-size:12.5px; }
.lp-fv-bar .lp-fv-cta:hover { background:#142E23; }
.lp-fv-bar .lp-fv-x { background:none; border:none; color:#6B7280; font-size:16px; line-height:1; padding:4px 8px; }
.lp-fv-bar .lp-fv-x:hover { color:#111827; }
@media (max-width:560px){ .lp-fv-bar { white-space:normal; border-radius:16px; } }
`;

const GOOGLE_SVG = '<svg viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>';
const MS_SVG = '<svg viewBox="0 0 18 18"><path d="M0 0h8.55v8.55H0z" fill="#F25022"/><path d="M9.45 0H18v8.55H9.45z" fill="#7FBA00"/><path d="M0 9.45h8.55V18H0z" fill="#00A4EF"/><path d="M9.45 9.45H18V18H9.45z" fill="#FFB900"/></svg>';

let cssMounted = false;
function mountCss() {
  if (cssMounted) return;
  cssMounted = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

function simpleToast(text) {
  mountCss();
  const el = document.createElement('div');
  el.className = 'lp-sg-toast';
  el.innerHTML = '<strong>Saved to your Deal Log</strong>';
  el.appendChild(document.createTextNode(text));
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function showSaveGateModal(record) {
  mountCss();
  if (document.querySelector('.lp-sg-backdrop')) return;
  const back = document.createElement('div');
  back.className = 'lp-sg-backdrop';
  back.innerHTML = `
    <div class="lp-sg-modal" role="dialog" aria-modal="true" aria-labelledby="lpSgTitle">
      <h2 id="lpSgTitle">Sign in to save this deal</h2>
      <p>Your Quote Log keeps every quote you generate. Free — takes 10 seconds.</p>
      <button type="button" class="lp-sg-oauth lp-sg-google">${GOOGLE_SVG} Continue with Google</button>
      <button type="button" class="lp-sg-oauth lp-sg-ms">${MS_SVG} Continue with Microsoft</button>
      <button type="button" class="lp-sg-cancel">Cancel</button>
    </div>`;
  document.body.appendChild(back);
  back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
  back.querySelector('.lp-sg-cancel').addEventListener('click', () => back.remove());

  async function go(provider, opts) {
    // Stash the intent — consumed (and cleared) by this module after OAuth.
    // record may be null (sign-in nudge, no deal yet): just return to the tool.
    try {
      if (record) {
        sessionStorage.setItem(ACTION_KEY, 'save-quote');
        sessionStorage.setItem(DATA_KEY, JSON.stringify(record));
      }
      sessionStorage.setItem(RETURN_KEY, topHref());
    } catch (e) {}
    // OAuth can't run inside the SPA tool iframe (Google refuses to be framed):
    // get the URL without redirecting, then send the TOP window there.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/auth-callback.html', skipBrowserRedirect: true, ...opts },
    });
    if (!error && data && data.url) navTop(data.url);
  }
  back.querySelector('.lp-sg-google').addEventListener('click', () => go('google'));
  back.querySelector('.lp-sg-ms').addEventListener('click', () => go('azure', { scopes: 'email' }));
}

// Post-save offer for anonymous users — a banner, not an auto-modal, so it
// never fights the PDF print modal that opens at the same moment (LEN-218).
let bannerShownThisLoad = false;
function offerSignIn(record) {
  try { if (sessionStorage.getItem(DISMISS_KEY) === '1') return; } catch (e) {}
  if (bannerShownThisLoad) return;
  bannerShownThisLoad = true;
  // Adoption-funnel signal (LEN-286): anonymous user hit the save gate.
  logEvent(record.calculator_type || 'unknown', 'save_gate_shown', { doc_id: record.doc_id });
  mountCss();
  const el = document.createElement('div');
  el.className = 'lp-sg-toast';
  el.innerHTML = `
    <strong>Saved on this device</strong>
    Sign in to keep this deal in your Deal Log — synced everywhere you work.
    <div class="lp-sg-row">
      <button type="button" class="lp-sg-cta">Save this deal</button>
      <button type="button" class="lp-sg-dismiss">Not now</button>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('.lp-sg-cta').addEventListener('click', () => { el.remove(); showSaveGateModal(record); });
  el.querySelector('.lp-sg-dismiss').addEventListener('click', () => {
    el.remove();
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  });
}

// ── Wiring ───────────────────────────────────────────────────────────────────
// Ticket-spec entry point for an explicit "Save this deal" button.
async function requestSave(record) {
  const user = await getOptionalUser();
  if (!user) { showSaveGateModal(record); return; }
  await saveEstimate(record);
  simpleToast('This deal is in your Deal Log.');
}
window.LPSaveGate = { requestSave, showSaveGateModal };

// Every saveEstimate() announces itself (see quote-log.js). Anonymous → offer.
window.addEventListener('lp:estimate-saved', (e) => {
  const { record, signedIn } = e.detail || {};
  if (!signedIn && record) offerSignIn(record);
});

// Consume a pending post-login save. Keys are removed BEFORE the re-save so a
// reload can never double-save (the duplicate-saves glitch in LEN-285).
(async () => {
  let action = null, raw = null;
  try {
    action = sessionStorage.getItem(ACTION_KEY);
    raw = sessionStorage.getItem(DATA_KEY);
  } catch (e) { return; }
  if (action !== 'save-quote' || !raw) return;
  try { sessionStorage.removeItem(ACTION_KEY); sessionStorage.removeItem(DATA_KEY); } catch (e) {}
  const user = await getOptionalUser();
  if (!user) return; // login was abandoned — intent already cleared
  let record;
  try { record = JSON.parse(raw); } catch (e) { return; }
  await saveEstimate(record); // doc_id dedupe keeps the local mirror clean
  simpleToast('This deal is in your Deal Log.');
})();

// ── First-visit nudges (LEN-287) — anonymous users only ──────────────────────
// 1. Sign-in nudge: sticky footer bar after the FIRST real input interaction.
//    "Sign in to save your work." → opens the save-gate modal (no deal payload).
// 2. PDF prompt: after sustained interaction + a quiet pause, IF the page's PDF
//    button exists and is enabled (each calc only renders/enables it when the
//    form can produce real output). CTA clicks the calculator's own button so
//    every PDF still routes through PDF_HELPER (watermarks, compliance block).
// Neither is a modal; each shows at most once per session. Logged-in users
// never see either — their experience is unchanged.
const PDF_TRIGGERS = [
  '[data-tour="pb-save-pdf"]',                          // Amortization
  '#savePdfBtn',                                        // Payment Fit
  '#pdfBtn',                                            // DSCR
  '.lp-cta-primary[onclick*="handleLendPaperSavePDF"]', // SBA Fees / Net & Position
  '[onclick*="openPdf()"]',                             // Deal Analysis (PDF overlay)
];
function findPdfButton() {
  for (const sel of PDF_TRIGGERS) {
    const el = document.querySelector(sel);
    if (el && !el.disabled) return el;
  }
  return null;
}

const NUDGE_SEEN = 'lp_signin_nudge_seen';
const PDFP_SEEN = 'lp_pdf_prompt_seen';
let fvBar = null;
function hideFvBar() { if (fvBar) { fvBar.remove(); fvBar = null; } }
function showFvBar(text, ctaLabel, onCta, seenKey) {
  hideFvBar();
  mountCss();
  fvBar = document.createElement('div');
  fvBar.className = 'lp-fv-bar';
  const span = document.createElement('span');
  span.textContent = text;
  const cta = document.createElement('button');
  cta.type = 'button'; cta.className = 'lp-fv-cta'; cta.textContent = ctaLabel;
  cta.addEventListener('click', () => { hideFvBar(); onCta(); });
  const x = document.createElement('button');
  x.type = 'button'; x.className = 'lp-fv-x'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
  x.addEventListener('click', hideFvBar);
  fvBar.append(span, cta, x);
  document.body.appendChild(fvBar);
  try { sessionStorage.setItem(seenKey, '1'); } catch (e) {}
}

(async () => {
  const user = await getOptionalUser();
  if (user) return; // logged-in experience unchanged (LEN-287)
  const seen = (k) => { try { return sessionStorage.getItem(k) === '1'; } catch (e) { return true; } };

  let interactions = 0;
  let pdfIdleTimer = null;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (!t || !/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    if (t.closest('.lp-sg-backdrop, .lp-fv-bar')) return;
    interactions++;
    if (interactions === 1 && !seen(NUDGE_SEEN)) {
      showFvBar('Sign in to save your work.', 'Sign in', () => showSaveGateModal(null), NUDGE_SEEN);
    }
    // PDF prompt: enough touched fields + a quiet pause + the calc's own PDF
    // button present and enabled (= form complete enough for real output).
    if (interactions >= 3 && !seen(PDFP_SEEN)) {
      clearTimeout(pdfIdleTimer);
      pdfIdleTimer = setTimeout(() => {
        if (seen(PDFP_SEEN)) return;
        const btn = findPdfButton();
        if (!btn) return;
        showFvBar('Turn this into a lender-ready PDF.', 'Generate PDF', () => btn.click(), PDFP_SEEN);
      }, 1800);
    }
  }, true);

  // A save happened (PDF generated / scenario copied) — both prompts are moot.
  window.addEventListener('lp:estimate-saved', () => {
    clearTimeout(pdfIdleTimer);
    hideFvBar();
    try { sessionStorage.setItem(PDFP_SEEN, '1'); } catch (e) {}
  });
})();

export { requestSave, showSaveGateModal };
