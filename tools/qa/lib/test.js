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
    await page.addInitScript(() => { window.__LP_QA_BYPASS__ = true; });
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
