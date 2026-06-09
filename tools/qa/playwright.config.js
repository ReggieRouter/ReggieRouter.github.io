// LendPaper QA harness — Playwright config (LEN-129)
// Serves the repo root over a local static server so the calculators' relative
// asset paths (../public/..., ../js/...) resolve exactly as they do in prod,
// then drives each page headless.
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

// repo root is two levels up from tools/qa
const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Default port is derived from the worktree path so two worktrees running the
// harness at once get their OWN server. A fixed port + reuseExistingServer makes
// the second run reuse the first's server (rooted in the wrong worktree): shared
// files still serve, but that worktree's unique files 404 (LEN-146). QA_PORT wins.
function portFromPath(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
  return 8100 + (h % 800); // 8100–8899
}
const PORT = process.env.QA_PORT ? Number(process.env.QA_PORT) : portFromPath(REPO_ROOT);

module.exports = defineConfig({
  testDir: './tests',
  // The visual screenshot pass is opt-in (npm run test:visual) — it writes PNGs,
  // it isn't a pass/fail gate, so keep it out of the default run.
  testIgnore: process.env.QA_VISUAL ? [] : ['**/visual.spec.js'],
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
