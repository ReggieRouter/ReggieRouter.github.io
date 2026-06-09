// golden.spec.js — verify AmoSchedule against a REAL lender's amortization
// schedule (PEAC), used as a ground-truth oracle.
//
// PEAC's sheet is the same product family as ours (factor-rate, declining-balance
// allocation where interest = balance × IRR-period-rate). During the build, our
// engine reproduced all 24 of PEAC's periods to the cent. This test locks that
// in: if our allocation, rounding, period count, or factor math ever drifts from
// a schedule a lender actually sends borrowers, this goes red.
//
// Regenerate the fixture from the workbook: fixtures/extract-peac.py
// LEN-129.
const { test, expect } = require('../lib/test');
const { CALC, readNum, setField } = require('../lib/helpers');
const golden = require('../fixtures/peac-amortization.json');

// Cent-level: our table renders to 2 decimals and the golden is rounded to 2.
const TOL = 0.02;

test.describe('AmoSchedule vs PEAC reference schedule (golden file)', () => {
  test(`matches PEAC: $${golden.inputs.loan} @ ${golden.inputs.factor}x, ${golden.inputs.termMonths} mo`, async ({ page }) => {
    await page.goto(CALC.amo);
    await page.waitForSelector('#amt-1');

    const { loan, factor, termMonths, originationFeePct } = golden.inputs;
    await setField(page, '#amt-1', loan);
    await setField(page, '#factor-1', factor);
    await setField(page, '#term-1', termMonths);
    await setField(page, '#fee-1', originationFeePct); // fee doesn't affect the schedule, set for fidelity
    await setField(page, '#freq-1', 'monthly', 'change');
    await page.waitForTimeout(300);

    // Headline figures.
    expect(Math.abs(readNum(await page.textContent('#outPayback-1')) - golden.expected.totalPayback))
      .toBeLessThanOrEqual(TOL);
    expect(Math.abs(readNum(await page.textContent('#valPmt-1')) - golden.expected.monthlyPayment))
      .toBeLessThanOrEqual(TOL);

    // Pull only the real payment rows (tr.amo-row) — the table also injects a
    // payoff detail row that is not part of the schedule.
    const rows = await page.$$eval('#tableBody-1 tr.amo-row', (trs) =>
      trs.map((tr) => {
        const td = tr.querySelectorAll('td');
        const n = (s) => parseFloat((s || '').replace(/[^0-9.\-]/g, ''));
        return {
          period: n(td[0] && td[0].textContent),
          payment: n(td[2] && td[2].textContent),
          principal: n(td[3] && td[3].textContent),
          interest: n(td[4] && td[4].textContent),
          balance: n(td[5] && td[5].textContent),
        };
      })
    );

    expect(rows.length, 'period count differs from PEAC').toBe(golden.expected.periods);

    const mismatches = [];
    golden.schedule.forEach((g, i) => {
      const o = rows[i];
      for (const k of ['payment', 'interest', 'principal', 'balance']) {
        if (!o || Math.abs(o[k] - g[k]) > TOL) {
          mismatches.push(`P${g.period}.${k}: ours=${o ? o[k] : 'MISSING'} peac=${g[k]}`);
        }
      }
    });
    expect(mismatches, `Schedule drifted from PEAC golden file:\n  ${mismatches.join('\n  ')}`).toEqual([]);
  });
});
