/* ════════════════════════════════════════════════════════════
   LendPaper · js/bank-autofill.js — BankProfile → calculator fields
   LEN-342 (P1 of markdowns/BANK_DATA.md). Requires js/bank-import.js.
   LEN-343 (P2): optional Plaid Link path inside the same drop-zone UI —
   signed-in users can connect a bank (sandbox); the stateless Edge
   Functions return the same BankProfile shape into the same apply path.

   Loaded ONLY behind the ?bankimport=1 query flag — with the flag absent
   neither this file nor bank-import.js is fetched and the page is
   byte-identical to the unflagged experience.

   Rules (BANK_DATA.md §3):
   - Prefilled fields stay fully editable; nothing auto-saves.
   - Provenance = plain-text "from bank data" kicker (NO dot badges).
   - Timing / cash-flow shape is suggest-only — never set for the user.
   - Estimate-only framing extends to derived numbers: "derived from
     statements you provided — verify before underwriting."
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KICKER_TEXT = 'from bank data';
  var DISCLAIMER = 'Derived from statements you provided — verify before underwriting. Estimate only.';

  function fmt$(n) {
    return n == null ? '—' : '$' + Math.round(n).toLocaleString('en-US');
  }

  /* ── shared styles (single-outline focus rule: border-color only,
     never a box-shadow ring on top of a border) ─────────────── */
  var CSS = [
    '.lp-bankdrop{margin:0 0 18px;font-family:inherit}',
    '.lp-bankdrop-zone{display:block;width:100%;text-align:center;cursor:pointer;background:#fff;',
    '  border:1.5px dashed #b9c4bc;border-radius:12px;padding:14px 16px;transition:border-color .15s,background .15s}',
    '.lp-bankdrop-zone:hover,.lp-bankdrop-zone:focus-visible,.lp-bankdrop-zone.is-over{border-color:#2D6A4F;background:#f4f8f5;outline:none}',
    '.lp-bankdrop-kicker{display:block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b746e}',
    '.lp-bankdrop-main{display:block;margin-top:4px;font-size:12.5px;font-weight:600;color:#1A3C2E;line-height:1.45}',
    '.lp-bankdrop-main u{text-decoration:underline}',
    '.lp-bankdrop-priv{display:block;margin-top:5px;font-size:11px;font-weight:600;color:#2D6A4F}',
    '.lp-bankdrop-result{margin-top:10px;background:#f4f8f5;border:1px solid #d6e3da;border-radius:12px;padding:12px 14px;text-align:left}',
    '.lp-bankdrop-result h4{margin:0;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2D6A4F}',
    '.lp-bankdrop-row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid #e0e9e3;font-size:12.5px;color:#1c211e}',
    '.lp-bankdrop-row:last-of-type{border-bottom:0}',
    '.lp-bankdrop-row .f{color:#4b554f}',
    '.lp-bankdrop-row .v{font-weight:700;white-space:nowrap}',
    '.lp-bankdrop-row .c{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6b746e;font-weight:600;margin-left:5px}',
    '.lp-bankdrop-note{margin-top:8px;font-size:11.5px;line-height:1.5;color:#4b554f}',
    '.lp-bankdrop-legal{margin-top:7px;font-size:10.5px;line-height:1.5;color:#6b746e}',
    '.lp-bankdrop-err{margin-top:10px;font-size:12px;color:#9a3d3b;background:#fbf1f0;border:1px solid #ecd2d0;border-radius:10px;padding:9px 12px}',
    '.lp-bank-kicker{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:lowercase;color:#2D6A4F;margin-left:7px;white-space:nowrap}',
    /* LEN-343 — Plaid connect link (single-outline focus rule: one outline, never a box-shadow ring) */
    '.lp-bankdrop-plaidrow{margin-top:7px;text-align:center}',
    '.lp-bankdrop-plaid{background:none;border:0;padding:0;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;color:#2D6A4F;text-decoration:underline}',
    '.lp-bankdrop-plaid:hover{color:#1A3C2E}',
    '.lp-bankdrop-plaid:focus-visible{outline:1.5px solid #2D6A4F;outline-offset:2px}',
    '.lp-bankdrop-plaid[disabled]{opacity:.55;cursor:default;text-decoration:none}',
    '.lp-bankdrop-signin{font-size:11px;color:#6b746e}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('lp-bankdrop-css')) return;
    var s = document.createElement('style');
    s.id = 'lp-bankdrop-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── kicker helpers (plain text, removed the moment the user edits) ── */
  function addKicker(labelEl, key) {
    if (!labelEl || labelEl.querySelector('.lp-bank-kicker')) return;
    var k = document.createElement('span');
    k.className = 'lp-bank-kicker';
    k.dataset.bankKicker = key;
    k.textContent = KICKER_TEXT;
    labelEl.appendChild(k);
  }
  function removeKicker(key) {
    document.querySelectorAll('.lp-bank-kicker[data-bank-kicker="' + key + '"]')
      .forEach(function (k) { k.remove(); });
  }

  /* ── Plaid Link path (LEN-343 — P2, sandbox) ─────────────────
     Lives behind the SAME ?bankimport=1 flag: this module isn't even
     fetched without it, so flag-off pages carry zero Plaid code. The Edge
     Functions are stateless (see supabase/functions/plaid-exchange) — the
     browser receives only the derived BankProfile, exactly like a
     statement drop; no tokens or raw transactions ever reach this code. */
  var PLAID_CDN = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';

  function lpSession() {
    /* js/auth.js keeps supabase-js's DEFAULT storageKey (sb-<ref>-auth-token,
       load-bearing per LEN-285) — reading it directly keeps this file a classic
       script with no imports, and the key name yields the functions host. */
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var m = k && k.match(/^sb-([a-z0-9]+)-auth-token$/);
        if (!m) continue;
        var s = JSON.parse(localStorage.getItem(k));
        if (s && s.access_token) {
          return { token: s.access_token, fnBase: 'https://' + m[1] + '.supabase.co/functions/v1' };
        }
      }
    } catch (e) { /* no session */ }
    return null;
  }

  function callFn(sess, name, body) {
    return fetch(sess.fnBase + '/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sess.token },
      body: JSON.stringify(body || {})
    }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (data) {
        if (!resp.ok) {
          var msg = data && data.error === 'not_configured'
            ? 'Bank connection isn’t configured yet — drop a statement file instead.'
            : resp.status === 401 ? 'Your session expired — sign in again to connect a bank.'
            : 'Bank connection failed (' + ((data && data.error) || resp.status) + '). Try a statement file instead.';
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function loadPlaidJs() {
    return new Promise(function (resolve, reject) {
      if (window.Plaid) return resolve();
      var s = document.createElement('script');
      s.src = PLAID_CDN;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Couldn’t load Plaid Link — check your connection and try again.')); };
      document.head.appendChild(s);
    });
  }

  /* ── drop zone ───────────────────────────────────────────── */
  function buildDropZone(onProfile) {
    var wrap = document.createElement('div');
    wrap.className = 'lp-bankdrop no-print';
    wrap.innerHTML =
      '<div class="lp-bankdrop-zone" role="button" tabindex="0" aria-label="Import a bank statement file">' +
        '<span class="lp-bankdrop-kicker">Autofill from bank data</span>' +
        '<span class="lp-bankdrop-main">Drop a bank statement export here (.csv, .ofx, .qfx) — or <u>browse</u></span>' +
        '<span class="lp-bankdrop-priv">🔒 parsed in your browser — nothing uploads</span>' +
      '</div>' +
      '<input type="file" accept=".csv,.ofx,.qfx,.qbo,.txt" style="display:none">' +
      '<div class="lp-bankdrop-result" hidden></div>';

    var zone = wrap.querySelector('.lp-bankdrop-zone');
    var fileInput = wrap.querySelector('input[type=file]');
    var result = wrap.querySelector('.lp-bankdrop-result');

    function fail(name, err) {
      result.hidden = false;
      result.innerHTML = '<div class="lp-bankdrop-err">Couldn’t read ' +
        (name ? '<b>' + name.replace(/[<>&]/g, '') + '</b>' : 'that file') +
        ' — ' + String(err && err.message || err).replace(/[<>&]/g, '') +
        '. Try your bank’s CSV or Quicken (OFX/QFX) export.</div>';
    }
    function handleFile(file) {
      if (!file || !window.LPBankImport) return;
      window.LPBankImport.parseFile(file).then(function (profile) {
        onProfile(profile, result);
      }).catch(function (err) { fail(file.name, err); });
    }

    ['dragover', 'dragenter'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-over'); });
    });
    zone.addEventListener('drop', function (e) { handleFile(e.dataTransfer.files[0]); });
    zone.addEventListener('click', function () { fileInput.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener('change', function () {
      handleFile(fileInput.files[0]);
      fileInput.value = '';
    });

    /* ── LEN-343: Plaid connect link, same flag, same apply path. Rendered as
       a sibling row right under the zone (not nested in the role=button zone,
       which would break keyboard semantics). Signed-out users see a plain
       "sign in" line — the Edge Functions require a Supabase JWT. ── */
    function plaidErr(msg) {
      result.hidden = false;
      result.innerHTML = '<div class="lp-bankdrop-err">' +
        String(msg && msg.message || msg).replace(/[<>&]/g, '') + '</div>';
    }
    var plaidRow = document.createElement('div');
    plaidRow.className = 'lp-bankdrop-plaidrow';
    if (lpSession()) {
      plaidRow.innerHTML = '<button type="button" class="lp-bankdrop-plaid">or connect your bank (sandbox)</button>';
      var pBtn = plaidRow.querySelector('button');
      pBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (pBtn.disabled) return;
        var sess = lpSession(); // re-read: the token may have refreshed since mount
        if (!sess) { plaidErr('Sign in to connect a bank.'); return; }
        var idle = pBtn.textContent;
        var busy = function (label) { pBtn.disabled = !!label; pBtn.textContent = label || idle; };
        busy('connecting…');
        loadPlaidJs().then(function () {
          return callFn(sess, 'plaid-create-link-token');
        }).then(function (data) {
          window.Plaid.create({
            token: data.link_token,
            onSuccess: function (publicToken) {
              busy('pulling transactions…');
              callFn(sess, 'plaid-exchange', { public_token: publicToken }).then(function (out) {
                busy(null);
                if (out && out.bankProfile) onProfile(out.bankProfile, result);
                else plaidErr('The bank connection returned no profile — try a statement file instead.');
              }).catch(function (err) { busy(null); plaidErr(err); });
            },
            onExit: function () { busy(null); }
          }).open();
        }).catch(function (err) { busy(null); plaidErr(err); });
      });
    } else {
      plaidRow.innerHTML = '<span class="lp-bankdrop-signin">sign in to connect a bank</span>';
    }
    wrap.insertBefore(plaidRow, result);

    return wrap;
  }

  function summaryHTML(profile, rows, note) {
    var span = profile.periodStart + ' → ' + profile.periodEnd +
      ' · ' + profile.monthsCovered + ' mo · ' + profile.txnCount + ' transactions';
    return '<h4>Filled from your statement</h4>' +
      '<div class="lp-bankdrop-note" style="margin-top:2px">' + span + '</div>' +
      rows.map(function (r) {
        return '<div class="lp-bankdrop-row"><span class="f">' + r[0] + '</span>' +
          '<span><span class="v">' + r[1] + '</span><span class="c">' + r[2] + '</span></span></div>';
      }).join('') +
      (note ? '<div class="lp-bankdrop-note">' + note + '</div>' : '') +
      '<div class="lp-bankdrop-legal">All fields stay editable and nothing is saved automatically. ' + DISCLAIMER + '</div>';
  }

  /* ════════ Payment Fit (AffordabilityCalculator.html) ════════
     depositsInput ← avgMonthlyDeposits (high)
     expensesInput ← estimatedMonthlyExpenses (medium)
     timing / cash-flow shape ← suggest-only note, never set        */
  function applyPaymentFit(profile, resultEl) {
    var rows = [], setKeys = [];
    var setField = function (id, value, labelSelFallback) {
      var el = document.getElementById(id);
      if (!el || value == null) return false;
      el.value = Math.round(value).toLocaleString('en-US');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      var label = el.closest('div') && el.closest('div').parentElement
        ? el.closest('div').parentElement.querySelector('.field-label') : null;
      addKicker(label || labelSelFallback, id);
      setKeys.push(id);
      return true;
    };

    if (setField('depositsInput', profile.avgMonthlyDeposits)) {
      rows.push(['Expected monthly deposits', fmt$(profile.avgMonthlyDeposits), profile.confidence.deposits]);
    }
    if (profile.estimatedMonthlyExpenses != null) {
      var more = document.getElementById('upsideMore');
      if (more) more.open = true; // never hide a filled field behind the disclosure
      if (setField('expensesInput', profile.estimatedMonthlyExpenses)) {
        rows.push(['Business expenses / mo', fmt$(profile.estimatedMonthlyExpenses), 'medium']);
      }
    }

    var notes = [];
    if (profile.depositTrend === 'down') {
      notes.push('Deposit trend reads <b>down</b> across the statement — consider setting Cash flow shape to “Uncertain” (suggestion only, your call).');
    } else {
      notes.push('Deposit trend reads <b>' + profile.depositTrend + '</b> — the default “Consistent” cash-flow shape looks reasonable (suggestion only).');
    }
    if (profile.estimatedExistingDebtService > 0) {
      notes.push('Statement shows ~<b>' + fmt$(profile.estimatedExistingDebtService) + '/mo</b> in likely existing-financing debits — context for the payment this file can carry.');
    }

    resultEl.hidden = false;
    resultEl.innerHTML = summaryHTML(profile, rows, notes.join(' '));

    // user edits the field → provenance no longer holds, drop the kicker
    setKeys.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var onEdit = function (e) { if (e.isTrusted) { removeKicker(id); el.removeEventListener('input', onEdit); } };
      el.addEventListener('input', onEdit);
    });
  }

  function mountPaymentFit() {
    var host = document.querySelector('.lp-inputs');
    if (!host) return;
    var zone = buildDropZone(applyPaymentFit);
    host.insertBefore(zone, host.firstChild);
  }

  /* ════════ Deal Analysis (calculators/deal-read/) ════════════
     Deposits-by-month panel ← monthlyDeposits (high); Monthly revenue
     follows the calc's own recency-weighted average (the same math the
     panel applies when months are typed by hand). NSF / negative-day
     counts surface as a context line only (LEN-325 readiness scoring is
     unmerged — no hook on main, deliberately not refactored here).     */
  var drKickersWanted = {};

  function applyDealRead(profile, resultEl) {
    /* globals from read.js (classic scripts): S, save, renderInputs,
       renderRead, renderBand, depAvg, depMonths */
    if (typeof S === 'undefined' || typeof renderInputs !== 'function') return;

    var rows = [];
    var now = new Date();
    var curKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var filledMonths = 0, neededCount = 0;
    (profile.monthlyDeposits || []).forEach(function (m) {
      var parts = m.month.split('-');
      var monthsAgo = (now.getFullYear() - +parts[0]) * 12 + (now.getMonth() + 1 - +parts[1]);
      if (monthsAgo < 0 || monthsAgo > 11) return; // panel shows at most 12 months back
      if (m.total <= 0) return;
      S.deposits[m.month] = Math.round(m.total);
      filledMonths++;
      if (monthsAgo + 1 > neededCount) neededCount = monthsAgo + 1;
    });
    if (!filledMonths) {
      resultEl.hidden = false;
      resultEl.innerHTML = '<div class="lp-bankdrop-err">The statement parsed, but every month is older than the 12-month window this panel tracks.</div>';
      return;
    }
    S.depCount = Math.min(12, Math.max(S.depCount, neededCount, 4));
    S.depOpen = true;

    // Monthly revenue ← the calc's own recency-weighted average of the
    // completed months (identical to typing the deposits by hand).
    var av = (typeof depAvg === 'function') ? depAvg() : null;
    if (av) {
      S.rev = av.avg;
      rows.push(['Monthly revenue (proxy)', fmt$(av.avg) + '/mo', 'medium']);
    }
    rows.push(['Deposits by month', filledMonths + ' month' + (filledMonths === 1 ? '' : 's') + ' filled', profile.confidence.deposits]);

    save();
    drKickersWanted = { rev: !!av, deposits: true };
    renderInputs();
    if (typeof renderRead === 'function') renderRead();
    if (typeof renderBand === 'function') renderBand();
    applyDealReadKickers();

    var ctx = [];
    if (profile.nsfCount > 0) ctx.push('<b>' + profile.nsfCount + '</b> NSF / returned-item event' + (profile.nsfCount === 1 ? '' : 's'));
    if (profile.negativeDays != null && profile.negativeDays > 0) ctx.push('<b>' + profile.negativeDays + '</b> negative-balance day' + (profile.negativeDays === 1 ? '' : 's'));
    if (profile.estimatedExistingDebtService > 0) ctx.push('~<b>' + fmt$(profile.estimatedExistingDebtService) + '/mo</b> in likely existing-financing debits');
    var note = ctx.length
      ? 'Underwriting context from the statement: ' + ctx.join(' · ') + '. Worth addressing before submission.'
      : 'No NSF events or negative-balance days detected in the statement — a clean operating account strengthens the file.';

    resultEl.hidden = false;
    resultEl.innerHTML = summaryHTML(profile, rows, note);
  }

  /* read.js re-renders #inputs wholesale — re-apply kickers after each
     render, and stop once the user hand-edits the field. */
  function applyDealReadKickers() {
    if (drKickersWanted.rev) {
      var revField = document.querySelector('.field[data-field="rev"] > label');
      addKicker(revField, 'dr-rev');
    }
    if (drKickersWanted.deposits) {
      var depLabel = document.querySelector('.dep-toggle .dep-tg-t');
      addKicker(depLabel, 'dr-deposits');
    }
  }
  function watchDealReadEdits(container) {
    container.addEventListener('input', function (e) {
      if (!e.isTrusted || !e.target) return;
      if (e.target.id === 'in-rev' && drKickersWanted.rev) {
        drKickersWanted.rev = false; removeKicker('dr-rev');
      }
      if (e.target.closest && e.target.closest('.dep-in') && drKickersWanted.deposits) {
        drKickersWanted.deposits = false; removeKicker('dr-deposits');
        // hand-edited deposits recompute rev via onDeposit → rev kicker stale too
        drKickersWanted.rev = false; removeKicker('dr-rev');
      }
    });
  }

  function mountDealRead() {
    var sheet = document.querySelector('main.sheet');
    var split = document.querySelector('main.sheet .split');
    var inputs = document.getElementById('inputs');
    if (!sheet || !split || !inputs) return;
    var zone = buildDropZone(applyDealRead);
    sheet.insertBefore(zone, split); // outside #inputs — renderInputs() wipes that node
    watchDealReadEdits(inputs);

    // re-apply kickers whenever read.js rebuilds the inputs column
    if (typeof renderInputs === 'function') {
      var orig = renderInputs;
      window.renderInputs = function () {
        orig.apply(this, arguments);
        applyDealReadKickers();
      };
    }
  }

  /* ── entry point ─────────────────────────────────────────── */
  window.LPBankAutofill = {
    init: function (opts) {
      injectStyles();
      var calc = opts && opts.calc;
      if (calc === 'payment-fit') mountPaymentFit();
      else if (calc === 'deal-read') mountDealRead();
    }
  };
})();
