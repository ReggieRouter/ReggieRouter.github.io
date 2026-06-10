// Extended Playwright test fixture for the LendPaper QA harness (LEN-129).
//
// Hard auth gates (LEN-68) redirect unauthenticated page loads to /login.html,
// which would break every calculator test. Client gates are UX only — real data
// protection is Supabase RLS — so we set a test-only window flag that auth.js
// honors (window.__LP_QA_BYPASS__) to render gated pages headless.
//
// Specs import { test, expect } from here instead of '@playwright/test'.
const base = require('@playwright/test');

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.__LP_QA_BYPASS__ = true;
      // First-run spotlight tours render a full-viewport overlay that intercepts
      // the first click (click-anywhere-to-dismiss, e.g. Compliance Desk .spot-block,
      // LEN-168) — which flakes interaction tests under parallel load. Mark them
      // "seen" so the harness exercises the page itself, not the coachmark. Same
      // category as the auth bypass above; add keys here as new tours land. (LEN-213)
      try { localStorage.setItem('lp_cd_tour_v2', '1'); } catch (e) {}
    });
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
