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
    <div style="font-size:10px;letter-spacing:.05em;text-transform:uppercase;
                color:#888;margin-bottom:4px" id="lp-tc-step"></div>
    <div style="font-size:13px;font-weight:500;margin-bottom:6px;
                color:#111" id="lp-tc-title"></div>
    <div style="font-size:12px;line-height:1.65;margin-bottom:14px;
                color:#555" id="lp-tc-body"></div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="display:flex;gap:3px;flex:1" id="lp-tc-dots"></div>
      <button id="lp-tc-skip"
        style="font-size:11px;background:none;border:none;cursor:pointer;
               padding:3px 6px;color:#aaa">Skip</button>
      <button id="lp-tc-next"
        style="font-size:12px;font-weight:500;background:#1D9E75;color:#fff;
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
    padding:       '16px 18px',
    width:         '252px',
    zIndex:        CALLOUT_Z,
    boxShadow:     '0 4px 20px rgba(0,0,0,0.12)',
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
  renderStep(0);
}

export function skipTour() {
  endTour('skip');
}
