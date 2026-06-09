// legislation.spec.js — Legislation Tracker (Beta) smoke.
//
// The map itself fetches us-atlas from a CDN (allowlisted, and the page degrades
// gracefully if it fails), so this test asserts the parts that render from the
// LOCAL seed data: the Federal panel, the jurisdiction chips, the state detail
// panel, and the table view. Gated like the calculators — the shared fixture's
// __LP_QA_BYPASS__ lets it render headless. LEN-129 / legislation-tracker.
const { test, expect } = require('../lib/test');
const { isAllowedNoise } = require('../lib/helpers');

test('legislation: federal panel, chips, detail, and table all render', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => { if (!isAllowedNoise(`${e.message}\n${e.stack || ''}`)) errors.push(`[pageerror] ${e.message}`); });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = `${m.text()} @ ${(m.location() && m.location().url) || ''}`;
    if (isAllowedNoise(text) || /favicon/i.test(text)) return;
    errors.push(`[console] ${text}`);
  });

  await page.goto('/legislation.html', { waitUntil: 'load' });

  // Federal panel populated from local data (3 seed items).
  await page.waitForSelector('#fedItems .fed-item', { timeout: 10_000 });
  expect(await page.locator('#fedItems .fed-item').count()).toBeGreaterThanOrEqual(2);

  // Jurisdiction chips render and are clickable → detail panel opens.
  const firstChip = page.locator('#chips .chip').first();
  await firstChip.waitFor({ timeout: 10_000 });
  expect(await page.locator('#chips .chip').count()).toBeGreaterThan(5);
  await firstChip.click();
  await expect(page.locator('#detailBody .detail-state')).toBeVisible();
  await expect(page.locator('#detailBody .bill-name').first()).toBeVisible();

  // Table view toggle shows rows from the same data.
  await page.locator('#btn-table').click();
  await expect(page.locator('#tableView')).toBeVisible();
  expect(await page.locator('#tableBody tr').count()).toBeGreaterThan(5);

  expect(errors, `Legislation page errors:\n${errors.join('\n')}`).toEqual([]);
});
