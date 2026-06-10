// legislation.spec.js — Compliance Desk (Beta, formerly "Legislation Tracker") smoke.
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

  // Federal panel: compact "top stories" cards populated from local data (LEN-168).
  await page.waitForSelector('#fedItems .fed-card', { timeout: 10_000 });
  expect(await page.locator('#fedItems .fed-card').count()).toBeGreaterThanOrEqual(2);

  // Jurisdiction chips render and are clickable → state panel (fast-answer) opens (LEN-210).
  const firstChip = page.locator('#chips .chip').first();
  await firstChip.waitFor({ timeout: 10_000 });
  expect(await page.locator('#chips .chip').count()).toBeGreaterThan(5);
  await firstChip.click();
  await expect(page.locator('#detailBody .detail-state')).toBeVisible();
  expect(await page.locator('#detailBody .mini-stat').count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('#detailBody .detail-action.primary')).toBeVisible();

  // Map → table bridge appears on selection and jumps into a state-filtered table (LEN-210).
  await expect(page.locator('#bridge')).toHaveClass(/show/);
  await page.locator('#bridgeJump').click();
  await expect(page.locator('#tableView')).toBeVisible();
  await expect(page.locator('#appliedFilters')).toHaveClass(/show/);
  const stateRows = await page.locator('#tableBody tr').count();
  expect(stateRows).toBeGreaterThan(0);

  // Clearing the state filter restores the full table.
  await page.locator('#jurisFilter button[data-juris="all"]').click();
  await expect(page.locator('#appliedFilters')).not.toHaveClass(/show/);
  const allRows = await page.locator('#tableBody tr').count();
  expect(allRows).toBeGreaterThan(5);
  expect(allRows).toBeGreaterThan(stateRows);

  // Federal laws are in the table + the Federal/State facet filters (LEN-168).
  await page.locator('#jurisFilter button[data-juris="federal"]').click();
  const fedRows = await page.locator('#tableBody tr').count();
  expect(fedRows).toBeGreaterThanOrEqual(5);
  expect(fedRows).toBeLessThan(allRows);
  // Acronyms are searchable.
  await page.locator('#tableSearch').fill('TCPA');
  expect(await page.locator('#tableBody tr').count()).toBe(1);
  await page.locator('#tableSearch').fill('');
  await page.locator('#jurisFilter button[data-juris="all"]').click();

  // Clicking an intel panel expands it into a large modal (LEN-210).
  await page.locator('#panelFederal').click();
  await expect(page.locator('#panelModal')).toHaveClass(/open/);
  expect(await page.locator('#pmBody .pm-item').count()).toBeGreaterThanOrEqual(5);
  await page.locator('#panelModal .modal-close').click();
  await expect(page.locator('#panelModal')).not.toHaveClass(/open/);

  expect(errors, `Legislation page errors:\n${errors.join('\n')}`).toEqual([]);
});
