// smoke.spec.js — "does it load and fire?" for every calculator.
//
// Catches the (C) bugs and (E) items-not-firing class: an uncaught exception in
// the inline calc code, or a results element that never populates. Runs on both
// the desktop and mobile projects (see playwright.config.js), so a layout-driven
// JS error on a phone viewport shows up here too.
//
// External CDN / font / analytics noise is allowlisted — none of it is required
// for the math, which runs inline. A failed LOCAL include still fails the test.
// LEN-129.
const { test, expect } = require('@playwright/test');
const { CALC, isAllowedNoise } = require('../lib/helpers');

// Per-calculator: a selector that must exist once loaded, and a "live value"
// selector whose text must be non-empty/non-placeholder (proves the calc ran).
const PAGES = [
  { key: 'amo',  url: CALC.amo,  ready: '#valPmt-1',        live: '#valPmt-1' },
  { key: 'dscr', url: CALC.dscr, ready: '.scen-card',       live: '.dscr-val' },
  { key: 'fund', url: CALC.fund, ready: '#hero_val',        live: '#hero_val' },
  { key: 'sba',  url: CALC.sba,  ready: '#res-total-fees-1', live: '#res-total-fees-1' },
  // Affordability has no default numeric inputs (tiles read $0 cold), so the
  // "did it fire?" probe is the borrower talk track, which update() always builds.
  { key: 'afford', url: CALC.afford, ready: '#heroVerdict', live: '#talkBody' },
];

function attachErrorCollector(page) {
  const errors = [];
  page.on('pageerror', (e) => {
    const text = `${e.message}\n${e.stack || ''}`;
    if (!isAllowedNoise(text)) errors.push(`[pageerror] ${e.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = (msg.location() && msg.location().url) || '';
    const text = `${msg.text()} @ ${url}`;
    // Ignore third-party noise and the favicon 404; a broken LOCAL include is kept.
    if (isAllowedNoise(text) || /favicon/i.test(text)) return;
    errors.push(`[console] ${text}`);
  });
  return errors;
}

for (const p of PAGES) {
  test(`smoke: ${p.key} loads, fires, and throws no uncaught errors`, async ({ page }) => {
    const errors = attachErrorCollector(page);

    await page.goto(p.url, { waitUntil: 'load' });
    await page.waitForSelector(p.ready, { timeout: 10_000 });

    // Give inline onload calc + webfont swap a beat to settle.
    await page.waitForTimeout(400);

    // The live result must render something real (not blank, not "$0", not "—").
    const liveText = (await page.locator(p.live).first().textContent() || '').trim();
    expect(liveText, `${p.key}: live result "${p.live}" never populated`).not.toBe('');
    expect(liveText, `${p.key}: live result "${p.live}" stuck at placeholder`).not.toMatch(/^(\$0|—|0)$/);

    expect(errors, `${p.key} uncaught errors:\n${errors.join('\n')}`).toEqual([]);
  });
}
