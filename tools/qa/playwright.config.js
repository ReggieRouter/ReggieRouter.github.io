// LendPaper QA harness — Playwright config (LEN-129)
// Serves the repo root over a local static server so the calculators' relative
// asset paths (../public/..., ../js/...) resolve exactly as they do in prod,
// then drives each page headless.
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

// repo root is two levels up from tools/qa
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PORT = process.env.QA_PORT ? Number(process.env.QA_PORT) : 8099;

module.exports = defineConfig({
  testDir: './tests',
  // Run serially-ish; these are fast and the static server is shared.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // The calculators run their math inline; we don't need the external CDNs
    // for correctness, but allow them so the page renders realistically.
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile viewport — surfaces layout-driven JS errors and lets future
    // visual checks run against a phone-sized screen.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Zero-dependency static server. Python 3 is present on the dev machine.
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    cwd: REPO_ROOT,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
