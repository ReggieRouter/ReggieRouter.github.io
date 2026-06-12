// js/completion-cue.js
// Completion cue (LEN-288). The moment every required input on a calculator
// first becomes valid in a visit, draw the eye to the outputs:
//   visits 1–2 (per calc): calm flash on the takeaway box, then the Save PDF
//     CTA ~300ms behind it (teaches WHERE the output lives);
//   visit 3+: no flash — a small dismissible plain-text note near the takeaway
//     nudges the talk track (teaches WHAT NEXT). No dots, no badges, no pulse.
// Flash = single green box-shadow ring (#1A3C2E) — one clean outline, never a
// border + ring double (BRANDING.md §2). Respects prefers-reduced-motion.
// Counters are per-calculator localStorage keys using the frozen calculator_type
// slugs: lp_cue_<slug>_count / lp_cue_<slug>_done. Works for anonymous users.
//
// Usage (classic script, after this file loads):
//   LPCompletionCue.init({
//     slug: 'sba_fees',               // frozen calculator_type slug
//     takeaway: '.takeaway',          // selector or fn → element (first visible wins)
//     cta: '.lp-cta-primary',         // selector or fn → element
//     isComplete: function(){...},    // true when every required field is valid
//     noteAnchor: '#read',            // optional — stable element the note sits above
//     events: ['input','change'],     // optional — which user events re-check
//     noteText: '...'                 // optional copy override
//   });

(function () {
  var CSS = [
    '@keyframes lpCuePulse {',
    '  0%, 100% { box-shadow: 0 0 0 0 rgba(26,60,46,0); }',
    '  25%, 75% { box-shadow: 0 0 0 3px rgba(26,60,46,0.40); }',
    '  50%      { box-shadow: 0 0 0 1px rgba(26,60,46,0.12); }',
    '}',
    '.lp-cue-flash { animation: lpCuePulse 1.5s ease-in-out 1; }',
    '@media (prefers-reduced-motion: reduce) { .lp-cue-flash { animation: none; } }',
    '.lp-cue-note { display: flex; align-items: baseline; gap: 8px; margin: 10px 0 6px;',
    '  padding: 10px 12px; background: #F8FAF9; border: 1px solid #D9E7DF; border-radius: 10px; }',
    '.lp-cue-note-kicker { font-size: 10px; font-weight: 800; letter-spacing: 0.08em;',
    '  text-transform: uppercase; color: #1A3C2E; white-space: nowrap; }',
    '.lp-cue-note-text { flex: 1; font-size: 12px; line-height: 1.5; color: #334155; }',
    '.lp-cue-note-x { background: none; border: none; cursor: pointer; color: #94A3B8;',
    '  font-size: 16px; line-height: 1; padding: 2px 4px; font-family: inherit; }',
    '.lp-cue-note-x:hover { color: #1A3C2E; }',
    'body.pdf-export-mode .lp-cue-note { display: none !important; }',
    '@media print { .lp-cue-note { display: none !important; } }'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('lp-cue-style')) return;
    var s = document.createElement('style');
    s.id = 'lp-cue-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function key(slug, suffix) { return 'lp_cue_' + slug + '_' + suffix; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Selector string (first visible match wins) or fn → element.
  function resolve(sel) {
    if (!sel) return null;
    if (typeof sel === 'function') { try { return sel(); } catch (e) { return null; } }
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) { if (els[i].offsetParent !== null) return els[i]; }
    return els[0] || null;
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove('lp-cue-flash');
    void el.offsetWidth;
    el.classList.add('lp-cue-flash');
    el.addEventListener('animationend', function h() {
      el.classList.remove('lp-cue-flash');
      el.removeEventListener('animationend', h);
    });
  }

  function showNote(cfg) {
    if (document.querySelector('.lp-cue-note')) return;
    var anchor = resolve(cfg.noteAnchor) || resolve(cfg.takeaway);
    if (!anchor || !anchor.parentNode) return;
    var note = document.createElement('div');
    note.className = 'lp-cue-note no-print';
    var text = cfg.noteText || 'Use this talk track with your borrower — or save the PDF to send it.';
    note.innerHTML = '<span class="lp-cue-note-kicker">Next step</span>' +
      '<span class="lp-cue-note-text"></span>' +
      '<button class="lp-cue-note-x" type="button" aria-label="Dismiss">&times;</button>';
    note.querySelector('.lp-cue-note-text').textContent = text;
    note.querySelector('.lp-cue-note-x').addEventListener('click', function () {
      lsSet(key(cfg.slug, 'done'), '1');
      note.remove();
    });
    anchor.insertAdjacentElement('beforebegin', note);
  }

  function init(cfg) {
    if (!cfg || !cfg.slug || typeof cfg.isComplete !== 'function') return;
    injectCss();
    var fired = false; // once per page visit
    var timer = null;

    // Engaging with the takeaway or the Save PDF CTA retires the note for good.
    document.addEventListener('click', function (e) {
      var tk = resolve(cfg.takeaway), cta = resolve(cfg.cta);
      if ((tk && tk.contains(e.target)) || (cta && cta.contains(e.target))) {
        lsSet(key(cfg.slug, 'done'), '1');
        var n = document.querySelector('.lp-cue-note');
        if (n) n.remove();
      }
    }, true);

    function onComplete() {
      fired = true;
      var n = parseInt(lsGet(key(cfg.slug, 'count')) || '0', 10) || 0;
      n += 1;
      lsSet(key(cfg.slug, 'count'), String(n));
      if (n <= 2) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        flash(resolve(cfg.takeaway));
        setTimeout(function () { flash(resolve(cfg.cta)); }, 300);
      } else if (lsGet(key(cfg.slug, 'done')) !== '1') {
        showNote(cfg);
      }
    }

    function check() {
      if (fired) return;
      if (document.body.classList.contains('pdf-export-mode')) return;
      var ok = false;
      try { ok = !!cfg.isComplete(); } catch (e) {}
      if (ok) onComplete();
    }

    // Re-check on user events only (debounced) — never fires from a bare page
    // load or a programmatic Deal Log restore.
    function queue() {
      if (fired) return;
      clearTimeout(timer);
      timer = setTimeout(check, 150);
    }
    (cfg.events || ['input', 'change']).forEach(function (ev) {
      document.addEventListener(ev, queue, true);
    });
  }

  window.LPCompletionCue = { init: init };
})();
