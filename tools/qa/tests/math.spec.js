// math.spec.js — independent math ORACLE for the four LendPaper calculators.
//
// The expected values here are computed independently (plain closed-form
// arithmetic), NOT read back from the page's own code. That's the whole point:
// if someone changes a formula, this catches it. During the build this oracle
// already caught a wrong hand-calc ($5,297 vs the correct $6,469.88 SBA payment).
//
// LEN-129.
const { test, expect } = require('@playwright/test');
const { CALC, readNum, setField, expectClose } = require('../lib/helpers');

test.describe('AmoSchedule — factor-rate amortization', () => {
  test('100k @ 1.25x, 12 mo monthly, 0% fee', async ({ page }) => {
    await page.goto(CALC.amo);
    await page.waitForSelector('#amt-1');

    await setField(page, '#amt-1', 100000);
    await setField(page, '#factor-1', 1.25);
    await setField(page, '#term-1', 12);
    await setField(page, '#fee-1', 0);
    await setField(page, '#freq-1', 'monthly', 'change'); // default is weekly

    // Oracle: payback = amt * factor; pmt = payback / 12; finance = payback - amt
    await expect.poll(async () => readNum(await page.textContent('#outPayback-1')))
      .toBeGreaterThan(0);

    expectClose(expect, 'payback', readNum(await page.textContent('#outPayback-1')), 125000, 0.5);
    expectClose(expect, 'monthly payment', readNum(await page.textContent('#valPmt-1')), 10416.67, 0.5);
    expectClose(expect, 'finance charge', readNum(await page.textContent('#outFinance-1')), 25000, 0.5);
    expectClose(expect, 'factor', readNum(await page.textContent('#outFactor-1')), 1.25, 0.001);

    // APR is an IRR solve; assert a sanity band rather than re-implement the solver.
    // A 1.25x / 12-mo declining-balance loan lands near ~45% effective APR.
    const apr = readNum(await page.textContent('#outApr-1'));
    expect(apr, `APR out of sane band: ${apr}`).toBeGreaterThan(38);
    expect(apr, `APR out of sane band: ${apr}`).toBeLessThan(52);
  });
});

test.describe('DSCR — debt service coverage', () => {
  test('EBIDA 200k vs 500k/10yr/10% loan → BDSCR 2.52 (pass)', async ({ page }) => {
    await page.goto(CALC.dscr);
    await page.waitForSelector('.ent-card');

    // EBIDA inputs are disabled until an entity/tax form is chosen.
    await page.locator('.ent-card').first().click();
    await page.waitForSelector('#ebidaInputs input:not([disabled])');

    // First EBIDA field is Net Earnings.
    await setField(page, '#ebidaInputs input >> nth=0', 200000);

    // Scenario card 1: [0]=Amount, [1]=Term, [2]=Rate
    const scen = '.scen-card[data-scen-id="1"] input[type="number"]';
    await setField(page, `${scen} >> nth=0`, 500000);
    await setField(page, `${scen} >> nth=1`, 10);
    await setField(page, `${scen} >> nth=2`, 10);

    // Ensure BDSCR mode is showing.
    await page.evaluate(() => { if (typeof setMode === 'function') setMode('bdscr'); });

    // Oracle: mp = amortize(500k, 10%, 10yr) = 6607.54/mo; annual DS = 79290.44;
    //         BDSCR = 200000 / 79290.44 = 2.52
    const bdscr = readNum(await page.textContent('.dscr-bdscr .dscr-val'));
    expectClose(expect, 'BDSCR', bdscr, 2.52, 0.02);
    await expect(page.locator('.dscr-bdscr .dscr-val')).toHaveClass(/dscr-pass/);
  });
});

test.describe('Fundability — net requirement + position risk', () => {
  test('50k @ 50% net; 1.40x/120 biz-days; $450/day existing; 120k revenue', async ({ page }) => {
    await page.goto(CALC.fund);
    await page.waitForSelector('#funding_amt');

    await setField(page, '#funding_amt', 50000);
    await setField(page, '#net_pct', 50);
    await setField(page, '#monthly_rev', 120000);
    await setField(page, '#factor', 1.40);
    await setField(page, '#term_val', 120);
    await setField(page, '#term_unit', 'bizdays', 'change');
    // Default existing position created on load ($450/day); set it explicitly.
    await setField(page, '.pos-amt >> nth=0', 450);
    await setField(page, '.pos-freq >> nth=0', 'daily', 'change');

    // Net oracle: min-to-borrower = 50k*0.5 = 25k; max payoff = 25k
    expectClose(expect, 'min to borrower', readNum(await page.textContent('#hero_val')), 25000, 0.5);
    expectClose(expect, 'max payoff', readNum(await page.textContent('#res_payoff')), 25000, 0.5);

    // Risk oracle: newPayback=70k; /120 = 583.33/day; *21.67 = 12,640.8/mo
    //   existing 450/day *21.67 = 9,751.5/mo; total = 22,392.3/mo
    //   DSR = 22,392.3 / 120,000 = 18.66% -> "18.7%"; position 2 -> "2nd"; Moderate
    expectClose(expect, 'monthly debt service', readNum(await page.textContent('#res_monthly')), 22392, 5);
    expectClose(expect, 'DSR %', readNum(await page.textContent('#hero_dsr')), 18.7, 0.2);
    await expect(page.locator('#hero_pos')).toHaveText('2nd');
    await expect(page.locator('#verdict_headline')).toHaveText(/Moderate risk/);
  });
});

test.describe('SBA 7(a) — guaranty fee tiers + amortization', () => {
  test('tier 2: 500k loan (default) → fees + payment', async ({ page }) => {
    await page.goto(CALC.sba);
    await page.waitForSelector('#loanAmount-1');

    await setField(page, '#loanAmount-1', 500000);
    await setField(page, '#termYears-1', 10);
    await setField(page, '#rateSpread-1', 2.75);
    await setField(page, '#pkgFee-1', 2500);
    await setField(page, '#closeFee-1', 3000);

    // Oracle: guarAmt=375k; sbaFee=375k*0.03=11,250; total=11,250+2,500+3,000=16,750
    // pmt @ (6.75+2.75)% over 120 mo on 500k = 6,469.88; payback=776,385; interest=276,385
    expectClose(expect, 'SBA guaranty fee', readNum(await page.textContent('#res-sba-fee-1')), 11250, 1);
    expectClose(expect, 'total upfront fees', readNum(await page.textContent('#res-total-fees-1')), 16750, 1);
    expectClose(expect, 'monthly payment', readNum(await page.textContent('#res-monthly-pmt-1')), 6470, 1.5);
    expectClose(expect, 'total interest', readNum(await page.textContent('#res-interest-cost-1')), 276385, 2);
    expectClose(expect, 'total payback', readNum(await page.textContent('#res-total-payback-1')), 776385, 2);
  });

  test('tier 1: 100k loan → 85% guaranty @ 2% = $1,700', async ({ page }) => {
    await page.goto(CALC.sba);
    await page.waitForSelector('#loanAmount-1');
    await setField(page, '#loanAmount-1', 100000);
    // guarAmt = 100k*0.85 = 85k; sbaFee = 85k*0.02 = 1,700
    expectClose(expect, 'SBA fee (tier 1)', readNum(await page.textContent('#res-sba-fee-1')), 1700, 1);
  });

  test('tier 3: 1.5M loan → 3.5%/3.75% split = $39,687.50', async ({ page }) => {
    await page.goto(CALC.sba);
    await page.waitForSelector('#loanAmount-1');
    await setField(page, '#loanAmount-1', 1500000);
    // guarAmt = 1.5M*0.75 = 1.125M; fee = 1M*0.035 + 125k*0.0375 = 35,000 + 4,687.50 = 39,687.50
    expectClose(expect, 'SBA fee (tier 3)', readNum(await page.textContent('#res-sba-fee-1')), 39687.5, 1);
  });
});
