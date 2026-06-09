// visual.spec.js — capture each calculator at desktop / tablet / phone widths so
// the human visual pass is "scan 12 screenshots" instead of "resize a browser 12
// times." This is NOT a pass/fail gate — it just produces images to eyeball
// against VISUAL-CHECKLIST.md (text overruns, whitespace, things that look off).
//
// Opt-in: `npm run test:visual` (sets QA_VISUAL=1). Output: screenshots/ (gitignored).
// LEN-129.
const path = require('path');
const { test } = require('@playwright/test');
const { CALC, setField } = require('../lib/helpers');

const OUT = path.join(__dirname, '..', 'screenshots');
const WIDTHS = [
  { label: 'desktop', w: 1280, h: 900 },
  { label: 'tablet', w: 768, h: 1024 },
  { label: 'phone', w: 375, h: 812 },
];

// Light, representative inputs so each screenshot shows a populated result state.
async function populate(page, key) {
  if (key === 'amo') {
    await setField(page, '#amt-1', 100000);
    await setField(page, '#factor-1', 1.25);
    await setField(page, '#term-1', 12);
    await setField(page, '#freq-1', 'monthly', 'change');
  } else if (key === 'dscr') {
    await page.locator('.ent-card').first().click();
    await page.waitForSelector('#ebidaInputs input:not([disabled])');
    await setField(page, '#ebidaInputs input >> nth=0', 200000);
    await setField(page, '.scen-card[data-scen-id="1"] input[type="number"] >> nth=0', 500000);
  } else if (key === 'afford') {
    await setField(page, '#paymentInput', 929);
    await setField(page, '#frequencyInput', 'monthly', 'change');
    await setField(page, '#depositsInput', 16000);
    await setField(page, '#paybackInput', 44611);
    await setField(page, '#upsideInput', 3000);
    await setField(page, '#expensesInput', 9000);
  }
  // fund + sba populate from their on-load defaults.
}

for (const [key, url] of Object.entries(CALC)) {
  test(`visual: ${key}`, async ({ page }) => {
    for (const v of WIDTHS) {
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await populate(page, key);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${key}-${v.label}-${v.w}.png`), fullPage: true });
    }
  });
}
