// js/tour.js
// Tour engine. Knows nothing about copy — all that lives in tour-config.js.
// Queries elements by data-tour attribute, never by ID or class.
// Safe to import on any page; skips steps whose targets aren't present.

const OVERLAY_Z  = 9000;
const SPOT_Z     = 9001;
const CALLOUT_Z  = 9002;

let overlayEl, spotEl, calloutEl;
let currentSteps = [];
let currentIndex = 0;
let onDoneCb     = null;
let activeClickHandler = null;
let scrollLocked = false;

// ── Scroll freeze ────────────────────────────────────────────────────────────
// While a step is open the page must hold still — otherwise the user scrolls and
// the fixed spotlight/callout drift off the target. We block USER scroll (wheel,
// touch, scroll keys) but leave programmatic scrollIntoView free so the engine
// can still center each step's target. (Body overflow:hidden would block that.)

const SCROLL_KEYS = new Set([32, 33, 34, 35, 36, 38, 40]); // space, pgup/dn, end, home, ↑, ↓

function blockScrollEvent(e) { e.preventDefault(); }

function blockScrollKeys(e) {
  // Let keys through when the user is focused inside the callout (buttons, etc.).
  if (calloutEl && calloutEl.contains(document.activeElement)) return;
  if (SCROLL_KEYS.has(e.keyCode)) e.preventDefault();
}

function lockScroll() {
  if (scrollLocked) return;
  scrollLocked = true;
  window.addEventListener('wheel',     blockScrollEvent, { passive: false });
  window.addEventListener('touchmove', blockScrollEvent, { passive: false });
  window.addEventListener('keydown',   blockScrollKeys,  false);
}

function unlockScroll() {
  if (!scrollLocked) return;
  scrollLocked = false;
  window.removeEventListener('wheel',     blockScrollEvent, { passive: false });
  window.removeEventListener('touchmove', blockScrollEvent, { passive: false });
  window.removeEventListener('keydown',   blockScrollKeys,  false);
}

// ── DOM setup ──────────────────────────────────────────────────────────────

function ensureDOM() {
  if (overlayEl) return;

  overlayEl = document.createElement('div');
  overlayEl.id = 'lp-tour-overlay';
  Object.assign(overlayEl.style, {
    display:         'none',
    position:        'fixed',
    inset:           '0',
    background:      'rgba(0,0,0,0)',
    zIndex:          OVERLAY_Z,
    pointerEvents:   'none',
    transition:      'background 0.25s ease',
  });

  spotEl = document.createElement('div');
  spotEl.id = 'lp-tour-spotlight';
  Object.assign(spotEl.style, {
    display:         'none',
    position:        'fixed',
    borderRadius:    '10px',
    zIndex:          SPOT_Z,
    pointerEvents:   'none',
    boxShadow:       '0 0 0 4000px rgba(0,0,0,0.52)',
    transition:      'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  });

  calloutEl = document.createElement('div');
  calloutEl.id = 'lp-tour-callout';
  calloutEl.innerHTML = `
    <div style="font-size:10px;font-weight:600;letter-spacing:.06em;
                text-transform:uppercase;color:#9aa0a6;margin-bottom:5px"
         id="lp-tc-step"></div>
    <div style="font-size:14px;font-weight:700;letter-spacing:-0.01em;
                margin-bottom:5px;color:#111" id="lp-tc-title"></div>
    <div style="font-size:12.5px;font-weight:500;line-height:1.5;
                margin-bottom:13px;color:#3c4043" id="lp-tc-body"></div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="display:flex;gap:3px;flex:1" id="lp-tc-dots"></div>
      <button id="lp-tc-skip"
        style="font-size:11px;font-weight:500;background:none;border:none;
               cursor:pointer;padding:3px 6px;color:#9aa0a6">Skip</button>
      <button id="lp-tc-next"
        style="font-size:12px;font-weight:600;background:#1D9E75;color:#fff;
               border:none;border-radius:7px;padding:7px 14px;cursor:pointer">
        Next &#8594;
      </button>
    </div>`;
  Object.assign(calloutEl.style, {
    display:       'none',
    position:      'fixed',
    background:    '#fff',
    border:        '0.5px solid rgba(0,0,0,0.12)',
    borderRadius:  '12px',
    padding:       '14px 15px',
    width:         '248px',
    zIndex:        CALLOUT_Z,
    boxShadow:     '0 6px 22px rgba(0,0,0,0.16)',
    fontFamily:    "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    WebkitFontSmoothing: 'auto',
  });

  document.body.append(overlayEl, spotEl, calloutEl);

  calloutEl.querySelector('#lp-tc-next').addEventListener('click', advance);
  calloutEl.querySelector('#lp-tc-skip').addEventListener('click', () => endTour('skip'));
}

// ── Positioning ────────────────────────────────────────────────────────────

function spotlightEl(el) {
  const r   = el.getBoundingClientRect();
  const pad = 6;
  Object.assign(spotEl.style, {
    display: 'block',
    top:     (r.top  - pad) + 'px',
    left:    (r.left - pad) + 'px',
    width:   (r.width  + pad * 2) + 'px',
    height:  (r.height + pad * 2) + 'px',
  });
}

function positionCallout(el, position) {
  const r   = el.getBoundingClientRect();
  const cw  = 252;
  const gap = 14;
  const vp  = { w: window.innerWidth, h: window.innerHeight };

  let top  = Math.max(8, r.top);
  let left;

  if (position === 'left' && r.left - cw - gap > 8) {
    left = r.left - cw - gap;
  } else if (position === 'right' && r.right + cw + gap < vp.w - 8) {
    left = r.right + gap;
  } else if (r.left - cw - gap > 8) {
    left = r.left - cw - gap;
  } else {
    left = r.right + gap;
  }

  // clamp vertically so callout never goes off-screen bottom
  const calloutH = calloutEl.offsetHeight || 180;
  if (top + calloutH > vp.h - 8) top = vp.h - calloutH - 8;

  Object.assign(calloutEl.style, {
    top:  top  + 'px',
    left: left + 'px',
  });
}

// ── Rendering a step ───────────────────────────────────────────────────────

function renderStep(index) {
  const step = currentSteps[index];
  if (!step) { endTour('complete'); return; }

  const el = document.querySelector(`[data-tour="${step.id}"]`);
  if (!el) {
    console.warn(`[LendPaper Tour] Step not found: ${step.id} — skipping`);
    currentIndex++;
    renderStep(currentIndex);
    return;
  }

  // scroll element into view if needed
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => {
    spotlightEl(el);
    overlayEl.style.display = 'block';
    overlayEl.style.background = 'rgba(0,0,0,0)'; // transparent — spotlight handles dim
    spotEl.style.display = 'block';
    calloutEl.style.display = 'block';

    calloutEl.querySelector('#lp-tc-step').textContent =
      `Step ${index + 1} of ${currentSteps.length}`;
    calloutEl.querySelector('#lp-tc-title').textContent = step.title;
    calloutEl.querySelector('#lp-tc-body').textContent  = step.body;

    const nextBtn = calloutEl.querySelector('#lp-tc-next');
    nextBtn.textContent = step.last ? 'Got it \u2713' : 'Next \u2192';

    // dots
    const dotsEl = calloutEl.querySelector('#lp-tc-dots');
    dotsEl.innerHTML = currentSteps.map((_, i) =>
      `<div style="width:5px;height:5px;border-radius:50%;background:${
        i === index ? '#1D9E75' : '#ddd'}"></div>`
    ).join('');

    positionCallout(el, step.position);

    // if this step advances on click, wire it up
    if (step.trigger === 'click') {
      if (activeClickHandler) el.removeEventListener('click', activeClickHandler);
      activeClickHandler = () => {
        el.removeEventListener('click', activeClickHandler);
        activeClickHandler = null;
        setTimeout(advance, 400); // slight delay so user sees the click effect
      };
      el.addEventListener('click', activeClickHandler);
      // hide Next button — the click IS the advance
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
    }
  }, 80);
}

// ── Controls ───────────────────────────────────────────────────────────────

function advance() {
  currentIndex++;
  if (currentIndex >= currentSteps.length) {
    endTour('complete');
  } else {
    renderStep(currentIndex);
  }
}

function endTour(reason) {
  unlockScroll();
  overlayEl.style.display = 'none';
  spotEl.style.display    = 'none';
  calloutEl.style.display = 'none';
  if (activeClickHandler) {
    // clean up any orphaned click listener
    document.querySelectorAll('[data-tour]').forEach(el =>
      el.removeEventListener('click', activeClickHandler));
    activeClickHandler = null;
  }
  if (typeof onDoneCb === 'function') onDoneCb(reason);
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * startTour(steps, onDone)
 *   steps  — array from TOUR_STEPS (already filtered to current page if needed)
 *   onDone — callback(reason: 'complete' | 'skip')
 */
export function startTour(steps, onDone) {
  ensureDOM();
  currentSteps = steps;
  currentIndex = 0;
  onDoneCb     = onDone || null;
  lockScroll();
  renderStep(0);
}

export function skipTour() {
  endTour('skip');
}
