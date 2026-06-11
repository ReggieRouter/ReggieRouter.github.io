// LendPaper — Quote Log (shared utility)
// Cross-tool estimate logging. Every calculator fires saveEstimate() on PDF
// generation and on "Copy Scenario". Records persist to Supabase (tied to
// user_id) and are mirrored to localStorage so the log works offline, while
// logged out, and before the `estimates` table exists in Supabase.
//
// Schema + freemium model: markdowns/CALCULATORS.md → "Quote Log".
// Migration: supabase/estimates.sql
//
// Usage (any calculator):
//   import '../js/quote-log.js';            // exposes window.saveEstimate / window.LPQuoteLog
//   await saveEstimate({ calculator_type, params, pdf_generated, prepared_for });

import { supabase, getSession } from './auth.js';
import { logEvent } from './analytics.js';

const LS_KEY = 'lp_quote_log';
const RESTORE_KEY = 'lp_restore_estimate';
const FREE_DISPLAY_LIMIT = 10;          // Free tier: last 10 visible (storage retains all)

// calculator_type → display label (Quote Log "Calculator" column)
const CALC_LABELS = {
  payment_breakdown: 'Payment Breakdown',
  dscr: 'DSCR',
  fundability: 'Fundability',
  naics: 'NAICS Tool',
  deal_read: 'Deal Read',
  sba_fees: 'SBA 7(a) Fees',
};

// calculator_type → SPA slug (used by Restore)
const CALC_PAGES = {
  payment_breakdown: '/tools/payment-breakdown',
  dscr: '/tools/dscr',
  fundability: '/tools/fundability',
  naics: '/tools/naics',
  deal_read: '/tools/deal-read',
  sba_fees: '/tools/sba-fees',
};

function calcLabel(type) { return CALC_LABELS[type] || (type || '—'); }
function calcPageFor(type) { return CALC_PAGES[type] || '/'; }

// ── Doc ID ──────────────────────────────────────────────────────────────────
// Matches the PDF anti-fraud format: LP-YYYYMMDD-XXXXXX (6 unambiguous chars).
function genDocId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let rand = '';
  try {
    const arr = new Uint32Array(6);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) rand += chars[arr[i] % chars.length];
  } catch (e) {
    for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LP-${ymd}-${rand}`;
}

// ── localStorage mirror ───────────────────────────────────────────────────────
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch (e) { return []; }
}
function writeLocal(rows) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 200))); } // hard cap
  catch (e) { /* quota / private mode — ignore */ }
}
function pushLocal(record) {
  const rows = readLocal();
  if (!rows.some(r => r.doc_id === record.doc_id)) rows.unshift(record);
  writeLocal(rows);
}

// ── Save ──────────────────────────────────────────────────────────────────────
// Fire on PDF generation and on "Copy Scenario". Never throws — logging an
// estimate must never block the calculator's primary action.
async function saveEstimate(opts = {}) {
  const record = {
    doc_id: opts.doc_id || genDocId(),
    calculator_type: opts.calculator_type || 'unknown',
    created_at: new Date().toISOString(),
    params: opts.params || {},
    pdf_generated: !!opts.pdf_generated,
    prepared_by: opts.prepared_by || (opts.params && opts.params.prepared_by) || null,
    prepared_for: opts.prepared_for || null,
  };

  // Always mirror locally (offline / logged-out / pre-migration safety net)
  pushLocal(record);

  // Anonymous-friendly usage event (LEN-285) — PDF gen + Copy Scenario are the
  // deliberate "run" moments every calculator funnels through. No params in
  // metadata (they can carry PII like prepared_for).
  logEvent(record.calculator_type, 'calculator_run', { doc_id: record.doc_id, pdf_generated: record.pdf_generated });

  // Persist to Supabase when signed in and the table exists
  let signedIn = false;
  try {
    const session = await getSession();
    if (session) {
      signedIn = true;
      const { error } = await supabase.from('estimates').insert({
        doc_id: record.doc_id,
        user_id: session.user.id,
        calculator_type: record.calculator_type,
        params: record.params,
        pdf_generated: record.pdf_generated,
        prepared_by: record.prepared_by,
        prepared_for: record.prepared_for,
      });
      if (error) console.warn('[QuoteLog] DB insert skipped (local mirror kept):', error.message);
    }
  } catch (e) {
    console.warn('[QuoteLog] save error (local mirror kept):', e);
  }

  // Announce the save so the save gate (LEN-285) can offer sign-in to
  // anonymous users. Fire-and-forget; never blocks the calculator.
  try {
    window.dispatchEvent(new CustomEvent('lp:estimate-saved', { detail: { record, signedIn } }));
  } catch (e) {}
  return record;
}

// ── Fetch ──────────────────────────────────────────────────────────────────────
// Returns newest-first. Free tier caps DISPLAY at last 10 (DB retains all for
// Pro upgrade eligibility — the cap is a display concern, not a storage one).
async function fetchEstimates({ pro = false } = {}) {
  let rows = [];
  try {
    const session = await getSession();
    if (session) {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) rows = data;
    }
  } catch (e) { /* fall back to local */ }

  // Merge in local-only records (saved while logged out or before migration)
  const seen = new Set(rows.map(r => r.doc_id));
  for (const r of readLocal()) if (!seen.has(r.doc_id)) rows.push(r);
  rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

  return pro ? rows : rows.slice(0, FREE_DISPLAY_LIMIT);
}

// ── Stats (header tiles) ───────────────────────────────────────────────────────
function computeStats(rows) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let thisMonth = 0, pdfs = 0, dealSum = 0, dealCount = 0;
  for (const r of rows) {
    if (String(r.created_at || '').slice(0, 7) === ym) thisMonth++;
    if (r.pdf_generated) pdfs++;
    const amt = Number(r.params && (r.params.amount ?? r.params.financing_amount ?? r.params.loan_amount));
    if (Number.isFinite(amt) && amt > 0) { dealSum += amt; dealCount++; }
  }
  return {
    estimatesThisMonth: thisMonth,
    avgDealSize: dealCount ? dealSum / dealCount : null,
    pdfsGenerated: pdfs,
  };
}

// ── Restore ──────────────────────────────────────────────────────────────────
// Restore re-fills a calculator from `params`. PII (names) lives in params, so
// we hand off via sessionStorage — NEVER the URL (CALCULATORS.md §9).
function restoreEstimate(record, opts = {}) {
  try {
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(record));
    if (opts.autoPdf) sessionStorage.setItem('lp_restore_autopdf', '1');
  } catch (e) {}
  window.location.href = calcPageFor(record.calculator_type);
}
// A calculator calls this on load. Returns the record iff it targets this type,
// then clears it so a refresh doesn't re-restore.
function consumeRestorePayload(calculatorType) {
  let raw = null;
  try { raw = sessionStorage.getItem(RESTORE_KEY); } catch (e) { return null; }
  if (!raw) return null;
  let rec;
  try { rec = JSON.parse(raw); } catch (e) { return null; }
  if (rec && rec.calculator_type === calculatorType) {
    try { sessionStorage.removeItem(RESTORE_KEY); } catch (e) {}
    return rec;
  }
  return null;
}

const LPQuoteLog = {
  saveEstimate, fetchEstimates, computeStats,
  restoreEstimate, consumeRestorePayload,
  genDocId, calcLabel, calcPageFor,
  FREE_DISPLAY_LIMIT,
};

// Expose as globals so non-module calculator code can call them directly.
window.LPQuoteLog = LPQuoteLog;
window.saveEstimate = saveEstimate;

export { saveEstimate, fetchEstimates, computeStats, restoreEstimate, consumeRestorePayload, genDocId, calcLabel, calcPageFor, FREE_DISPLAY_LIMIT };
export default LPQuoteLog;
