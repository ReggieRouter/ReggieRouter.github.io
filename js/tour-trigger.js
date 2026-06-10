// js/tour-trigger.js
// Fires the correct micro-tour for the current page on first visit.
// No cross-page state, no resume logic. Each page is self-contained.
// Import on every gated page (after auth check).
//
// Also wires the PDF button pulse (first 3 sessions until clicked).
// Print video is handled separately in tour-print.js.
//
// Usage:
//   <script type="module" src="/js/tour-trigger.js"></script>

import { startTour }                              from './tour.js';
import { TOUR_VERSION, PAGE_TOURS, SAMPLE_DEAL } from './tour-config.js';

// LEN-191 (handoff §0): mark the tour engine as wired on this page so the nudge
// engine defers to a pending tour. Restraint for an impatient audience —
// ONE coach mark globally, tracked by this flag.
window.__LP_TOURS_ENABLED__ = true;
const SEEN_ANY_KEY = TOUR_VERSION + '_seen_any';

// ── Helpers ────────────────────────────────────────────────────────────────

function currentPage() {
  return window.location.pathname.replace(/^\//, '') || 'index.html';
}

function showNavLink() {
  const el = document.getElementById('lp-tour-nav-link');
  if (el) el.style.display = '';
}

// ── Sample deal pre-load ───────────────────────────────────────────────────

function preloadSampleDeal() {
  const map = {
    '[data-tour-input="amount"]':        SAMPLE_DEAL.amount,
    '[data-tour-input="term"]':          SAMPLE_DEAL.term,
    '[data-tour-input="rate"]':          SAMPLE_DEAL.rate,
    '[data-tour-input="prepay-month"]':  SAMPLE_DEAL.prepayMonth,
  };
  for (const [sel, val] of Object.entries(map)) {
    const el = document.querySelector(sel);
    if (el) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  // NOTE (LEN-82): the [data-tour="tt-copy-sms"] target on the Payment
  // Breakdown page is the real "Copy Scenario" button (icon + label), so we do
  // NOT overwrite its text content with a synthesized SMS. buildSMS remains
  // available in tour-config.js for any future dedicated SMS surface.
}

// ── PDF button pulse ───────────────────────────────────────────────────────
// Pulses the PDF button for first 3 sessions until it's been clicked once.

const PDF_CLICKED_KEY = TOUR_VERSION + '_pdf_clicked';
const PDF_SESSION_KEY = TOUR_VERSION + '_pdf_sessions';

function wirePdfPulse() {
  const btn = document.querySelector('[data-tour="pb-save-pdf"]');
  if (!btn) return;
  if (localStorage.getItem(PDF_CLICKED_KEY)) return;

  const sessions = parseInt(localStorage.getItem(PDF_SESSION_KEY) || '0', 10);
  if (sessions >= 3) return;
  localStorage.setItem(PDF_SESSION_KEY, sessions + 1);

  // inject pulse ring CSS if not already present
  if (!document.getElementById('lp-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'lp-pulse-style';
    style.textContent = `
      @keyframes lp-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(29,158,117,.45); }
        70%  { box-shadow: 0 0 0 10px rgba(29,158,117,0); }
        100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
      }
      .lp-pulse { animation: lp-pulse 1.8s ease-out infinite; }
    `;
    document.head.appendChild(style);
  }
  btn.classList.add('lp-pulse');

  btn.addEventListener('click', () => {
    btn.classList.remove('lp-pulse');
    localStorage.setItem(PDF_CLICKED_KEY, 'true');
  }, { once: true });
}

// ── Main ───────────────────────────────────────────────────────────────────

// init(force): force=true bypasses all suppression gates (manual "Take a tour").
function init(force) {
  const page = currentPage();
  const config = PAGE_TOURS[page];
  if (!config) return;

  // PDF pulse is independent of the micro-tour — soft, non-blocking; the primary
  // attention cue for an impatient audience. Runs on every eligible load.
  wirePdfPulse();

  if (!force) {
    // Already saw THIS page's tour.
    if (localStorage.getItem(config.storageKey)) { showNavLink(); return; }
    // Never auto-launch a spotlight on the dashboard — users need to orient.
    if (page === 'index.html') { showNavLink(); return; }
    // ONE coach mark globally: once any tour was seen, don't auto-fire elsewhere.
    if (localStorage.getItem(SEEN_ANY_KEY)) { showNavLink(); return; }
    // Desktop-only; the pulse still runs on mobile.
    if (window.innerWidth < 768) return;
    // Don't compete with the first-login welcome modal.
    const welcome = document.getElementById('lp-welcome-modal');
    if (welcome && welcome.style.display === 'flex') return;
  }

  // Pre-load sample deal on the Amortization page before the tour fires.
  if (page === 'calculators/AmoScheduleCalculator.html') preloadSampleDeal();

  const fire = () => {
    startTour(config.steps, () => {
      localStorage.setItem(config.storageKey, 'true');
      localStorage.setItem(SEEN_ANY_KEY, '1');   // one coach mark, globally
      showNavLink();
    });
  };

  setTimeout(fire, force ? 0 : 600);
}

// ── Global replay ("Take a tour") — always works, ignores suppression ────────

window.replayTour = function () {
  if (!PAGE_TOURS[currentPage()]) return;
  init(true);
};

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () { init(false); });
