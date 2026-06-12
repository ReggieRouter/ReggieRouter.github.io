/* ════════════════════════════════════════════════════════════
   LendPaper · js/bank-import.js — bank-statement parsers → BankProfile
   LEN-342 (P1 of markdowns/BANK_DATA.md). 100% client-side: the file
   NEVER leaves the browser — no network calls in this module, ever.

   Exposes window.LPBankImport:
     parseFile(File)            → Promise<BankProfile>
     parseText(text, filename)  → BankProfile (throws on unparseable input)
   BankProfile shape: BANK_DATA.md §2 (every consumer must tolerate nulls).
   Loaded only behind the ?bankimport=1 flag — inert by default.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Known funder names (BANK_DATA.md §2 — matched against recurring
     debit descriptions to tag existing financing). Curated from the
     published waterfall lender set: distinctive, multi-word descriptors
     most likely to appear verbatim in ACH debit memos. Uppercase. ── */
  var FINANCING_NAMES = [
    'FORWARD FINANCING', 'ONDECK', 'ON DECK', 'KAPITUS', 'FUNDBOX',
    'CAN CAPITAL', 'RAPID FINANCE', 'CREDIBLY', 'EXPANSION CAPITAL',
    'MULLIGAN FUNDING', 'FORA FINANCIAL', 'BLUEVINE', 'FUNDING CIRCLE',
    'NATIONAL FUNDING', 'RELIANT FUNDING', 'QUICKBRIDGE', 'SBG FUNDING',
    'LIBERTAS', 'EVEREST BUSINESS FUNDING', 'GREENBOX CAPITAL',
    'PEARL CAPITAL', 'FUNDKITE', 'BYZFUNDER', 'WALL FUNDING',
    'VOX FUNDING', 'MANTIS FUNDING', 'TVT CAPITAL', 'VELOCITY CAPITAL',
    'BIZ2CREDIT', 'SMARTBIZ', 'LENDINGCLUB', 'SHOPIFY CAPITAL',
    'STRIPE CAPITAL', 'SQUARE CAPITAL', 'PAYPAL WORKING CAPITAL',
    'LENDISTRY', 'NEWTEK', 'BRITECAP', 'KALAMATA', 'BUSINESS BACKER',
    'GOKAPITAL', 'NATIONAL BUSINESS CAPITAL', 'KNIGHT CAPITAL',
    'WEBBANK', 'CELTIC BANK'
  ];
  /* Generic financing-shaped descriptors — weaker signal, still tagged. */
  var FINANCING_GENERIC = /\b(LOAN PMT|LOAN PAYMENT|LN PYMT|LN PMT|MCA|MERCHANT CASH|DAILY ACH|CAPITAL ACH|ADVANCE PMT|RTR PMT)\b/;

  var TRANSFER_RE = /\b(TRANSFER|XFER|ONLINE TFR|SWEEP|INTERNAL TFR)\b|ZELLE TO SELF/;
  // \bNSF\b — a bare substring match would false-positive on "traNSFer"
  var NSF_RE = /\bNSF\b|INSUFFICIENT FUND|RETURNED ITEM|RETURN ITEM|OD FEE|OVERDRAFT/;

  /* ── helpers ─────────────────────────────────────────────── */
  function parseMoneyCell(raw) {
    if (raw == null) return NaN;
    var s = String(raw).trim();
    if (!s) return NaN;
    var neg = /^\(.*\)$/.test(s) || /-\s*$/.test(s) || /^-/.test(s.replace(/[$\s]/g, ''));
    var n = parseFloat(s.replace(/[()$,\s]/g, '').replace(/-/g, ''));
    if (isNaN(n)) return NaN;
    return neg ? -n : n;
  }

  function parseDateCell(raw) {
    if (!raw) return null;
    var s = String(raw).trim().replace(/"/g, '');
    var d = null, m;
    if ((m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/))) {
      d = new Date(+m[1], +m[2] - 1, +m[3]);
    } else if ((m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/))) {
      var y = +m[3]; if (y < 100) y += 2000;
      d = new Date(y, +m[1] - 1, +m[2]);
    } else {
      d = new Date(s);
    }
    return (d && !isNaN(d.getTime())) ? d : null;
  }

  /* Quote-aware CSV line split (handles commas inside quotes, "" escapes). */
  function splitCSVLine(line) {
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(function (c) { return c.trim(); });
  }

  /* ── CSV parser (tolerant header detection) ──────────────── */
  function parseCSV(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) throw new Error('Not enough rows');

    // Header row may not be line 0 (some banks emit preamble) — scan first 10.
    var headerIdx = -1, head = null;
    for (var i = 0; i < Math.min(lines.length, 10); i++) {
      var cells = splitCSVLine(lines[i].toLowerCase());
      if (cells.some(function (c) { return /date/.test(c); }) &&
          cells.some(function (c) { return /amount|debit|credit|withdraw|deposit/.test(c); })) {
        headerIdx = i; head = cells; break;
      }
    }
    if (headerIdx < 0) throw new Error('No header row with date + amount columns found');

    function col(patterns) {
      for (var p = 0; p < patterns.length; p++) {
        for (var c = 0; c < head.length; c++) {
          if (head[c].indexOf(patterns[p]) >= 0) return c;
        }
      }
      return -1;
    }
    var iDate = col(['posting date', 'posted date', 'transaction date', 'trans date', 'date']);
    var iDesc = col(['description', 'memo', 'payee', 'details', 'narrative', 'transaction']);
    var iAmt  = col(['amount']);
    var iDeb  = col(['debit', 'withdraw', 'money out']);
    var iCred = col(['credit', 'deposit', 'money in']);
    var iBal  = col(['running balance', 'balance']);
    // "amount" column that is actually the debit/credit pair header ("Amount Debit")
    if (iAmt >= 0 && iAmt === iDeb) iAmt = -1;

    var txns = [];
    for (var r = headerIdx + 1; r < lines.length; r++) {
      var c = splitCSVLine(lines[r]);
      if (c.length < 2) continue;
      var date = parseDateCell(c[iDate]);
      if (!date) continue;
      var amt = NaN;
      if (iAmt >= 0) {
        amt = parseMoneyCell(c[iAmt]);
      } else if (iDeb >= 0 || iCred >= 0) {
        var deb = iDeb >= 0 ? parseMoneyCell(c[iDeb]) : NaN;
        var cred = iCred >= 0 ? parseMoneyCell(c[iCred]) : NaN;
        // Debit columns are typically positive magnitudes — normalize to negative.
        amt = (isNaN(cred) ? 0 : Math.abs(cred)) - (isNaN(deb) ? 0 : Math.abs(deb));
        if (isNaN(deb) && isNaN(cred)) amt = NaN;
      }
      if (isNaN(amt) || amt === 0) continue;
      var bal = iBal >= 0 ? parseMoneyCell(c[iBal]) : NaN;
      txns.push({
        date: date,
        desc: String(c[iDesc] || '').toUpperCase(),
        amount: amt,
        balance: isNaN(bal) ? null : bal
      });
    }
    return txns;
  }

  /* ── OFX / QFX / QBO parser (SGML or XML flavors) ────────── */
  function parseOFX(text) {
    var txns = [];
    var re = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi, m;
    while ((m = re.exec(text))) {
      var block = m[1];
      var f = function (tag) {
        var r = block.match(new RegExp('<' + tag + '>([^<\\r\\n]+)', 'i'));
        return r ? r[1].trim() : null;
      };
      var dt = f('DTPOSTED'), amtRaw = f('TRNAMT');
      if (!dt || amtRaw == null) continue;
      var amt = parseFloat(amtRaw);
      if (isNaN(amt) || amt === 0) continue;
      var d = new Date(+dt.slice(0, 4), +dt.slice(4, 6) - 1, +dt.slice(6, 8));
      if (isNaN(d.getTime())) continue;
      txns.push({
        date: d,
        desc: ((f('NAME') || '') + ' ' + (f('MEMO') || '')).trim().toUpperCase(),
        amount: amt,
        balance: null
      });
    }
    return txns;
  }

  /* ── BankProfile builder (BANK_DATA.md §2) ───────────────── */
  function monthKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function isFinancingDesc(desc) {
    for (var i = 0; i < FINANCING_NAMES.length; i++) {
      if (desc.indexOf(FINANCING_NAMES[i]) >= 0) return true;
    }
    return FINANCING_GENERIC.test(desc);
  }

  function buildProfile(txns, source) {
    txns.sort(function (a, b) { return a.date - b.date; });
    var byMonth = {};
    txns.forEach(function (t) {
      var k = monthKey(t.date);
      var m = byMonth[k] || (byMonth[k] = { dep: 0, depN: 0, deb: 0, days: {} });
      m.days[t.date.getDate()] = 1;
      if (TRANSFER_RE.test(t.desc)) return; // transfers are neither revenue nor expense
      if (t.amount > 0) { m.dep += t.amount; m.depN++; }
      else m.deb += -t.amount;
    });
    var months = Object.keys(byMonth).sort();
    if (!months.length) throw new Error('No dated transactions found');

    // Full months: drop a likely-partial trailing month (and leading month if
    // its activity starts late) so averages aren't dragged down by stubs.
    var full = months.slice();
    if (full.length > 2) {
      var last = byMonth[full[full.length - 1]];
      var lastDay = Math.max.apply(null, Object.keys(last.days).map(Number));
      if (lastDay < 25) full = full.slice(0, -1);
      var first = byMonth[full[0]];
      var firstDay = Math.min.apply(null, Object.keys(first.days).map(Number));
      if (full.length > 2 && firstDay > 7) full = full.slice(1);
    }

    var monthlyDeposits = months.map(function (k) {
      return { month: k, total: Math.round(byMonth[k].dep * 100) / 100, count: byMonth[k].depN };
    });
    function avgOf(keys) {
      if (!keys.length) return 0;
      return keys.reduce(function (s, k) { return s + byMonth[k].dep; }, 0) / keys.length;
    }
    var avgMonthlyDeposits = avgOf(full);
    var firstHalf = full.slice(0, Math.ceil(full.length / 2));
    var secondHalf = full.slice(Math.ceil(full.length / 2));
    var depositTrend = !secondHalf.length ? 'flat'
      : avgOf(secondHalf) > avgOf(firstHalf) * 1.07 ? 'up'
      : avgOf(secondHalf) < avgOf(firstHalf) * 0.93 ? 'down' : 'flat';

    /* Recurring debits: group by digit-stripped description prefix, ≥4 hits. */
    var groups = {};
    txns.forEach(function (t) {
      if (t.amount >= 0 || TRANSFER_RE.test(t.desc)) return;
      var key = t.desc.replace(/[\d#*]/g, '').replace(/\s+/g, ' ').slice(0, 22).trim();
      if (!key) return;
      (groups[key] = groups[key] || []).push(t);
    });
    var recurringDebits = Object.keys(groups).filter(function (k) {
      return groups[k].length >= 4;
    }).map(function (k) {
      var g = groups[k];
      var amts = g.map(function (t) { return -t.amount; }).sort(function (a, b) { return a - b; });
      var med = amts[Math.floor(amts.length / 2)];
      var spanDays = Math.max((g[g.length - 1].date - g[0].date) / 864e5, 1);
      var perDay = g.length / spanDays;
      var cadence = perDay > 0.6 ? 'daily' : perDay > 0.12 ? 'weekly' : 'monthly';
      var monthlyTotal = med * (cadence === 'daily' ? 21 : cadence === 'weekly' ? 4.33 : 1);
      return {
        description: k, cadence: cadence, amount: med,
        monthlyTotal: Math.round(monthlyTotal),
        isLikelyFinancing: isFinancingDesc(k), occurrences: g.length
      };
    }).sort(function (a, b) { return b.monthlyTotal - a.monthlyTotal; });

    /* Balance-derived signals (null when no running-balance column). */
    var withBal = txns.filter(function (t) { return t.balance != null; });
    var negDays = null, avgDailyBalance = null, endingBalances = null;
    if (withBal.length) {
      var lastPerDay = {}, lastPerMonth = {};
      withBal.forEach(function (t) {
        lastPerDay[t.date.toDateString()] = t.balance;
        lastPerMonth[monthKey(t.date)] = t.balance;
      });
      var dayVals = Object.keys(lastPerDay).map(function (k) { return lastPerDay[k]; });
      avgDailyBalance = dayVals.reduce(function (s, v) { return s + v; }, 0) / dayVals.length;
      negDays = dayVals.filter(function (v) { return v < 0; }).length;
      endingBalances = Object.keys(lastPerMonth).sort().map(function (k) {
        return { month: k, balance: lastPerMonth[k] };
      });
    }
    var nsfCount = txns.filter(function (t) { return NSF_RE.test(t.desc); }).length;

    var estDebt = recurringDebits.filter(function (r) { return r.isLikelyFinancing; })
      .reduce(function (s, r) { return s + r.monthlyTotal; }, 0);
    var estExpenses = full.length
      ? full.reduce(function (s, k) { return s + byMonth[k].deb; }, 0) / full.length : null;

    return {
      schemaVersion: 1,
      source: source,
      institution: null, accountMask: null, accountType: null,
      periodStart: txns[0].date.toISOString().slice(0, 10),
      periodEnd: txns[txns.length - 1].date.toISOString().slice(0, 10),
      monthsCovered: months.length,
      fullMonths: full.slice(),
      txnCount: txns.length,
      monthlyDeposits: monthlyDeposits,
      avgMonthlyDeposits: Math.round(avgMonthlyDeposits),
      depositTrend: depositTrend,
      avgDailyBalance: avgDailyBalance == null ? null : Math.round(avgDailyBalance),
      endingBalances: endingBalances,
      nsfCount: nsfCount,
      negativeDays: negDays,
      recurringDebits: recurringDebits,
      estimatedExistingDebtService: Math.round(estDebt),
      estimatedMonthlyExpenses: estExpenses == null ? null : Math.round(estExpenses),
      confidence: {
        deposits: full.length >= 3 ? 'high' : 'medium',
        balances: withBal.length ? 'medium' : 'none',
        obligations: 'low'
      }
    };
  }

  /* ── public API ──────────────────────────────────────────── */
  function parseText(text, filename) {
    var isOFX = /<STMTTRN>/i.test(text) || /\.(ofx|qfx|qbo)$/i.test(filename || '');
    var txns = isOFX ? parseOFX(text) : parseCSV(text);
    if (!txns.length) throw new Error('No transactions could be parsed');
    return buildProfile(txns, isOFX ? 'statement-ofx' : 'statement-csv');
  }

  function parseFile(file) {
    return file.text().then(function (text) { return parseText(text, file.name); });
  }

  window.LPBankImport = {
    parseFile: parseFile,
    parseText: parseText,
    FINANCING_NAMES: FINANCING_NAMES
  };
})();
