#!/usr/bin/env node
/* verify-bank-profile-parity.js — LEN-343
   Proves the server-side BankProfile aggregation in
   supabase/functions/plaid-exchange/index.ts is a faithful port of the client
   aggregation in js/bank-import.js: both are run against the same fixture
   transactions (tools/qa/fixtures/bank-statement-sample.csv) and must produce
   deep-equal BankProfiles.

   How: the Edge Function keeps its aggregation inside AGGREGATION-PORT-BEGIN/
   END markers, written annotation-light so this script can extract the region
   into a temp .mts module and execute it with Node's native type stripping
   (Node >= 22.18 / 23.6 — this repo's QA baseline is Node 24).

   Run:  node tools/qa/verify-bank-profile-parity.js   (no Plaid keys needed)
   Exits non-zero on any mismatch. Standalone like verify-compliance-sources.js
   — deliberately NOT wired into `npm test` (Playwright baseline stays 32/0/2).
*/
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'bank-statement-sample.csv');
const CLIENT_SRC = path.join(ROOT, 'js', 'bank-import.js');
const SERVER_SRC = path.join(ROOT, 'supabase', 'functions', 'plaid-exchange', 'index.ts');

async function main() {
  const csv = fs.readFileSync(FIXTURE, 'utf8');

  /* ── 1. Client profile: run js/bank-import.js as the browser would. ── */
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(CLIENT_SRC, 'utf8'), sandbox, { filename: 'bank-import.js' });
  const clientProfile = sandbox.window.LPBankImport.parseText(csv, 'bank-statement-sample.csv');

  /* ── 2. Server profile: extract the marked port region from the Edge
     Function and run it in Node (native type stripping via a .mts temp). ── */
  const serverText = fs.readFileSync(SERVER_SRC, 'utf8');
  const m = serverText.match(/AGGREGATION-PORT-BEGIN[\s\S]*?─+\n([\s\S]*?)\n\/\/ ─+\n\/\/ AGGREGATION-PORT-END/);
  assert(m, 'AGGREGATION-PORT markers not found in plaid-exchange/index.ts');
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lp-parity-')), 'region.mts');
  fs.writeFileSync(tmp, m[1] + '\nexport { buildProfile };\n');
  const { buildProfile } = await import('file://' + tmp);

  /* Fixture txns in the parsers' internal shape. The fixture is deliberately
     plain (ISO dates, single signed Amount column, no quoting) so this minimal
     parse is provably equivalent to the client's tolerant CSV parser — any
     accidental divergence fails the deep-equal below. */
  const txns = csv.trim().split('\n').slice(1).map((line) => {
    const [d, desc, amt, bal] = line.split(',');
    const p = d.split('-');
    return {
      date: new Date(+p[0], +p[1] - 1, +p[2]),
      desc: desc.toUpperCase(),
      amount: parseFloat(amt),
      balance: parseFloat(bal),
    };
  });
  const serverProfile = buildProfile(txns, clientProfile.source);

  /* ── 3. Parity: byte-identical JSON (same literal shape on both sides —
     this also asserts identical key order; plain deepStrictEqual would
     false-fail on cross-realm prototypes from the vm sandbox). ── */
  assert.strictEqual(JSON.stringify(serverProfile, null, 1), JSON.stringify(clientProfile, null, 1),
    'server-side BankProfile diverges from js/bank-import.js');

  /* ── 4. Sanity: the fixture exercises every aggregation feature. ── */
  const p = clientProfile;
  assert.strictEqual(p.schemaVersion, 1);
  assert.strictEqual(p.monthsCovered, 7, 'Dec 2025 – Jun 2026');
  assert.deepStrictEqual(p.fullMonths.at(-1), '2026-05', 'partial June dropped from full months');
  assert.strictEqual(p.depositTrend, 'up');
  assert.strictEqual(p.nsfCount, 2);
  assert.ok(p.negativeDays >= 1, 'negative-balance day detected');
  assert.ok(p.avgMonthlyDeposits > 70000 && p.avgMonthlyDeposits < 90000, 'avg deposits plausible');
  const ff = p.recurringDebits.find((r) => r.description.indexOf('FORWARD FINANCING') === 0);
  assert.ok(ff && ff.cadence === 'daily' && ff.isLikelyFinancing, 'daily financing debit tagged');
  assert.ok(p.estimatedExistingDebtService >= ff.monthlyTotal, 'financing debits roll into debt service');
  const payroll = p.recurringDebits.find((r) => r.description.indexOf('GUSTO') === 0);
  assert.ok(payroll && payroll.cadence === 'weekly' && !payroll.isLikelyFinancing, 'weekly payroll untagged');
  assert.ok(!p.recurringDebits.some((r) => /TFR|TRANSFER/.test(r.description)), 'transfers excluded');
  assert.strictEqual(p.confidence.deposits, 'high');
  assert.strictEqual(p.confidence.balances, 'medium');

  console.log('PASS — server aggregation is parity with js/bank-import.js');
  console.log('  txns=' + p.txnCount + ' months=' + p.monthsCovered +
    ' avgDeposits=$' + p.avgMonthlyDeposits.toLocaleString('en-US') +
    ' trend=' + p.depositTrend + ' nsf=' + p.nsfCount + ' negDays=' + p.negativeDays +
    ' debtService=$' + p.estimatedExistingDebtService.toLocaleString('en-US') + '/mo');
}

main().catch((err) => { console.error('FAIL —', err.message); process.exit(1); });
