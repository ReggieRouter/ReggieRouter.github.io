// LendPaper — lightweight first-run spotlight tour (LEN-190)
//
// Self-contained, zero-dependency tour. Deliberately NOT the LEN-82 global tour
// engine (js/tour-*.js) — that lives on an unmerged branch and is wired via
// data-tour across the SPA. This one coaches a single page (the Deal Log) and
// can be lifted into other standalone pages later.
//
//   import { runTour } from '/js/deal-log-tour.js';
//   runTour(steps, { onDone });
//
// step = { el, title, body, kicker?, pad? }
//   el     — CSS selector | Element | null (null = centered intro/outro card)
//   title  — heading
//   body   — supporting line (may contain trusted HTML)
//   kicker — optional uppercase eyebrow
//   pad    — spotlight padding around the target (px, default 8)

const Z = 2147483000;
let active = null;

function qs(sel) {
  if (!sel) return null;
  if (sel instanceof Element) return sel;
  try { return document.querySelector(sel); } catch (e) { return null; }
}

function injectStyle() {
  if (document.getElementById('lp-tour-style')) return;
  const s = document.createElement('style');
  s.id = 'lp-tour-style';
  s.textContent = `
  .lp-tour-overlay{position:fixed;inset:0;z-index:${Z};}
  .lp-tour-hole{position:absolute;border-radius:12px;box-shadow:0 0 0 9999px rgba(17,24,39,.62);
    transition:left .25s cubic-bezier(.4,0,.2,1),top .25s cubic-bezier(.4,0,.2,1),width .25s cubic-bezier(.4,0,.2,1),height .25s cubic-bezier(.4,0,.2,1);
    pointer-events:none;outline:2px solid rgba(255,255,255,.85);outline-offset:0;}
  .lp-tour-hole.nohole{left:50%;top:50%;width:0;height:0;outline:none;}
  .lp-tour-pop{position:absolute;z-index:${Z + 1};max-width:320px;background:#fff;border:1px solid #E5E7EB;
    border-radius:14px;box-shadow:0 18px 48px rgba(17,24,39,.28);padding:18px 18px 14px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;}
  .lp-tour-pop.center{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);max-width:380px;}
  .lp-tour-kick{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#2D6A4F;margin-bottom:6px;}
  .lp-tour-title{font-size:17px;font-weight:800;letter-spacing:-.01em;margin:0 0 6px;}
  .lp-tour-body{font-size:13.5px;line-height:1.5;color:#4B5563;margin:0 0 14px;}
  .lp-tour-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .lp-tour-dots{display:flex;gap:5px;}
  .lp-tour-dot{width:6px;height:6px;border-radius:999px;background:#D1D5DB;transition:width .2s,background .2s;}
  .lp-tour-dot.on{background:#2D6A4F;width:16px;}
  .lp-tour-btns{display:flex;gap:8px;}
  .lp-tour-btn{font-size:12.5px;font-weight:600;border-radius:8px;padding:7px 13px;cursor:pointer;
    border:1px solid #E5E7EB;background:#fff;color:#374151;}
  .lp-tour-btn:hover{background:#F9FAFB;}
  .lp-tour-btn.primary{background:#1A3C2E;border-color:#1A3C2E;color:#fff;}
  .lp-tour-btn.primary:hover{background:#15331f;}
  .lp-tour-skip{position:absolute;top:11px;right:13px;font-size:11px;color:#9CA3AF;cursor:pointer;
    background:none;border:none;font-weight:600;padding:0;}
  .lp-tour-skip:hover{color:#4B5563;}
  @media (max-width:480px){ .lp-tour-pop{max-width:88vw;} }
  `;
  document.head.appendChild(s);
}

function runTour(steps, opts = {}) {
  if (!Array.isArray(steps) || !steps.length) return null;
  injectStyle();
  if (active) active.destroy();

  let i = 0;
  const overlay = document.createElement('div');
  overlay.className = 'lp-tour-overlay';
  const hole = document.createElement('div');
  hole.className = 'lp-tour-hole';
  const pop = document.createElement('div');
  pop.className = 'lp-tour-pop';
  overlay.appendChild(hole);
  overlay.appendChild(pop);
  document.body.appendChild(overlay);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  function cleanup(done) {
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    document.body.style.overflow = prevOverflow;
    active = null;
    if (done && typeof opts.onDone === 'function') opts.onDone();
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup(true);
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  }
  function next() { if (i < steps.length - 1) { i++; render(); } else cleanup(true); }
  function prev() { if (i > 0) { i--; render(); } }

  function place() {
    const step = steps[i];
    const el = qs(step.el);
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = step.pad == null ? 8 : step.pad;
      hole.classList.remove('nohole');
      hole.style.left = (r.left - pad) + 'px';
      hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px';
      hole.style.height = (r.height + pad * 2) + 'px';
      pop.classList.remove('center');
      const popH = pop.offsetHeight || 170;
      const popW = pop.offsetWidth || 320;
      let top = r.bottom + pad + 12;
      if (top + popH > window.innerHeight - 12) top = Math.max(12, r.top - pad - 12 - popH);
      let left = r.left;
      if (left + popW > window.innerWidth - 12) left = window.innerWidth - 12 - popW;
      if (left < 12) left = 12;
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    } else {
      hole.classList.add('nohole');
      pop.classList.add('center');
      pop.style.left = '';
      pop.style.top = '';
    }
  }

  function render() {
    const step = steps[i];
    const el = qs(step.el);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const isLast = i === steps.length - 1;
    const dots = steps.map((_, k) => `<span class="lp-tour-dot ${k === i ? 'on' : ''}"></span>`).join('');
    pop.innerHTML = `
      <button class="lp-tour-skip" data-act="skip">Skip tour</button>
      ${step.kicker ? `<div class="lp-tour-kick">${step.kicker}</div>` : ''}
      <h3 class="lp-tour-title">${step.title}</h3>
      <p class="lp-tour-body">${step.body}</p>
      <div class="lp-tour-foot">
        <div class="lp-tour-dots">${dots}</div>
        <div class="lp-tour-btns">
          ${i > 0 ? '<button class="lp-tour-btn" data-act="back">Back</button>' : ''}
          <button class="lp-tour-btn primary" data-act="next">${isLast ? 'Got it' : 'Next'}</button>
        </div>
      </div>`;
    pop.querySelector('[data-act="skip"]').onclick = () => cleanup(true);
    const backBtn = pop.querySelector('[data-act="back"]');
    if (backBtn) backBtn.onclick = prev;
    pop.querySelector('[data-act="next"]').onclick = next;
    // Position after layout + once the smooth-scroll settles.
    requestAnimationFrame(place);
    setTimeout(place, 280);
  }

  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  document.addEventListener('keydown', onKey);
  active = { destroy: () => cleanup(false), next, prev };
  render();
  return active;
}

export { runTour };
export default runTour;
