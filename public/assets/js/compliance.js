/**
 * LendPaper Compliance Engine (LEN-88)
 *
 * State-triggered regulatory compliance layer. Fires automatically on borrower
 * state selection — never requires manual activation by a salesperson, and
 * renders NOTHING unless a rule is actually relevant.
 *
 * Source of truth: markdowns/LEGAL.md Part II.
 * Data:            public/assets/js/compliance-rules.js (load BEFORE this file).
 *
 * Public API (window.LPCompliance):
 *   isEnabled()                    — master toggle (admin, per-browser; default ON)
 *   setEnabled(bool)               — admin backend only
 *   getState() / setState("NY")    — borrower state, persisted in localStorage
 *   rulesFor(code)                 — merged federal + state rule object
 *   disclosures(code, surface)     — strings for "calculator"|"pdf"|"talktrack"|"sms"|"email"|"internal"
 *   underwritingDocs(code)         — extra docs required by state
 *   productAvailability(code, key) — { available, note }
 *   lintText(text)                 — prohibited-language findings [{match, suggestion}]
 *   disclaimerText()/disclaimerHTML() — canonical "not legal advice" string (LEGAL.md §14)
 *   injectDisclaimer(el)           — append disclaimer to any element surfacing legal info
 *   buildPdfBlock()                — DOM node of state disclosures for PDF export (or null)
 *   sourceLinksFor(code)           — [{name, url}] primary authoritative sources
 *
 * Surfaces opt in by adding <div data-lp-compliance-host></div>; the engine
 * renders a compact borrower-state selector + state note there on page load.
 * On state change it dispatches "lp:compliance:statechange" on document.
 */
(function () {
  'use strict';

  var RULES = window.LP_COMPLIANCE_RULES;
  if (!RULES) { console.warn('[LPCompliance] compliance-rules.js not loaded — engine disabled.'); return; }

  var KEY_TOGGLE = 'lp_compliance_layer';   // "off" disables (this browser only)
  var KEY_STATE  = 'lp_borrower_state';

  var US_STATES = { AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', DC:'Washington, D.C.' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var LPCompliance = {

    // ── Master toggle (admin testing; per-browser; live users always ON) ──
    isEnabled: function () {
      try { return localStorage.getItem(KEY_TOGGLE) !== 'off'; } catch (e) { return true; }
    },
    setEnabled: function (on) {
      try {
        if (on) localStorage.removeItem(KEY_TOGGLE);
        else localStorage.setItem(KEY_TOGGLE, 'off');
      } catch (e) {}
      document.dispatchEvent(new CustomEvent('lp:compliance:toggle', { detail: { enabled: this.isEnabled() } }));
      this._renderAllHosts();
    },

    // ── Borrower state ────────────────────────────────────────────────────
    getState: function () {
      try { return localStorage.getItem(KEY_STATE) || ''; } catch (e) { return ''; }
    },
    setState: function (code) {
      code = (code || '').toUpperCase();
      try {
        if (code) localStorage.setItem(KEY_STATE, code);
        else localStorage.removeItem(KEY_STATE);
      } catch (e) {}
      document.dispatchEvent(new CustomEvent('lp:compliance:statechange', { detail: { state: code, rules: this.rulesFor(code) } }));
      this._renderAllHosts();
    },

    stateName: function (code) { return US_STATES[(code || '').toUpperCase()] || code; },
    allStates: function () { return US_STATES; },

    // ── Rules access ──────────────────────────────────────────────────────
    rulesFor: function (code) {
      code = (code || this.getState() || '').toUpperCase();
      var state = RULES.states[code] || null;
      return { code: code, name: this.stateName(code), federal: RULES.federal, state: state };
    },

    disclosures: function (code, surface) {
      if (!this.isEnabled()) return [];
      var r = this.rulesFor(code);
      var out = [];
      if (r.state && r.state.disclosures && r.state.disclosures[surface]) out.push(r.state.disclosures[surface]);
      return out;
    },

    underwritingDocs: function (code) {
      if (!this.isEnabled()) return [];
      var r = this.rulesFor(code);
      return (r.state && r.state.underwritingDocs) ? r.state.underwritingDocs.slice() : [];
    },

    productAvailability: function (code, productKey) {
      var r = this.rulesFor(code);
      var p = r.state && r.state.products && r.state.products[productKey];
      if (!this.isEnabled() || !p) return { available: true, note: null };
      return { available: p.available !== false, note: p.note || null };
    },

    sourceLinksFor: function (code) {
      var r = this.rulesFor(code);
      var ids = (r.state && r.state.sourceIds) || [];
      return ids.map(function (id) { return RULES.sources[id]; }).filter(Boolean);
    },

    // ── Language linter (LEGAL.md §5 + §9.1) ─────────────────────────────
    lintText: function (text) {
      if (!this.isEnabled() || !text) return [];
      var findings = [];
      RULES.prohibitedPhrases.forEach(function (rule) {
        var m = String(text).match(rule.pattern);
        if (m) findings.push({ match: m[0], suggestion: rule.suggestion });
      });
      return findings;
    },

    // ── Canonical disclaimer (LEGAL.md §14 — single source, never hardcode)
    disclaimerText: function () { return RULES.disclaimer; },
    disclaimerHTML: function () {
      return '<em style="font-size:11px;color:#6B7280;line-height:1.45;display:block;">' + esc(RULES.disclaimer) + '</em>';
    },
    injectDisclaimer: function (el) {
      if (!el || el.querySelector('[data-lp-disclaimer]')) return;
      var d = document.createElement('div');
      d.setAttribute('data-lp-disclaimer', '1');
      d.style.cssText = 'margin-top:8px;';
      d.innerHTML = this.disclaimerHTML();
      el.appendChild(d);
    },

    // ── PDF export block (consumed by pdf-helper.js generatePDF) ─────────
    // Returns a node rendered only in pdf-export-mode, or null when nothing
    // is relevant (no state selected / state has no PDF disclosures).
    buildPdfBlock: function () {
      if (!this.isEnabled()) return null;
      var code = this.getState();
      if (!code) return null;
      var notes = this.disclosures(code, 'pdf');
      if (!notes.length) return null;

      var wrap = document.createElement('div');
      wrap.id = 'lp-compliance-print-block';
      wrap.style.cssText = 'display:none;margin-top:14pt;padding-top:8pt;border-top:0.5pt solid #E5E7EB;page-break-inside:avoid;';
      var html = '';
      notes.forEach(function (n) {
        html += '<div style="font-size:7.5pt;color:#374151;line-height:1.5;margin-bottom:5pt;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' + esc(n) + '</div>';
      });
      var links = this.sourceLinksFor(code);
      if (links.length) {
        html += '<div style="font-size:6.5pt;color:#6B7280;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">Sources: '
          + links.map(function (l) { return '<a href="' + esc(l.url) + '" style="color:#6B7280;">' + esc(l.name) + '</a>'; }).join(' · ')
          + '</div>';
      }
      wrap.innerHTML = html;
      this.injectDisclaimer(wrap);
      this._ensurePrintCSS();
      return wrap;
    },

    _ensurePrintCSS: function () {
      if (document.getElementById('lp-compliance-print-css')) return;
      var s = document.createElement('style');
      s.id = 'lp-compliance-print-css';
      s.textContent = 'body.pdf-export-mode #lp-compliance-print-block{display:block !important;}';
      document.head.appendChild(s);
    },

    // ── Host UI: compact borrower-state selector + conditional note ──────
    // Pages opt in with <div data-lp-compliance-host></div>. Silent when the
    // selected state has nothing to say.
    _renderHost: function (host) {
      if (!this.isEnabled()) { host.innerHTML = ''; return; }
      var self = this;
      var current = this.getState();
      var opts = '<option value="">Borrower state…</option>' + Object.keys(US_STATES).sort().map(function (c) {
        return '<option value="' + c + '"' + (c === current ? ' selected' : '') + '>' + esc(US_STATES[c]) + '</option>';
      }).join('');

      var noteHTML = '';
      if (current) {
        var calcNotes = this.disclosures(current, 'calculator');
        if (calcNotes.length) {
          // circle-i icon (house rule: never the paperclip emoji)
          var icon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
          noteHTML = '<div data-lp-compliance-note style="display:flex;gap:7px;align-items:flex-start;max-width:560px;margin-top:6px;padding:8px 10px;background:#F0FDF4;border:1px solid #DCFCE7;border-radius:8px;font-size:12px;color:#374151;line-height:1.5;">'
            + icon + '<div>' + calcNotes.map(esc).join('<br>') + '</div></div>';
        }
      }

      host.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:flex-end;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
        + '<label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#6B7280;">'
        + 'Borrower state'
        + '<select data-lp-state-select style="font-size:12px;color:#374151;border:1px solid #E5E7EB;border-radius:6px;padding:3px 6px;background:#fff;max-width:160px;">' + opts + '</select>'
        + '</label>' + noteHTML + '</div>';

      var sel = host.querySelector('[data-lp-state-select]');
      if (sel) sel.addEventListener('change', function () { self.setState(this.value); });

      if (noteHTML) this.injectDisclaimer(host.querySelector('[data-lp-compliance-note] > div'));
    },

    _renderAllHosts: function () {
      var self = this;
      document.querySelectorAll('[data-lp-compliance-host]').forEach(function (h) { self._renderHost(h); });
    },

    init: function () { this._renderAllHosts(); }
  };

  window.LPCompliance = LPCompliance;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { LPCompliance.init(); });
  } else {
    LPCompliance.init();
  }
})();
