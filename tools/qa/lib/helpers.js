// Shared helpers for the LendPaper QA harness (LEN-129).
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const CALC = {
  amo: '/calculators/AmoScheduleCalculator.html',
  dscr: '/calculators/DSCRCalculator.html',
  fund: '/calculators/FundabilityCalculator.html',
  sba: '/calculators/SBAFeesCalculator.html',
};

// Read the raw source of a repo file (for static regression assertions).
function readSource(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

// Parse a money / percent / ratio string ("$1,234.56", "18.7%", "2.52", "1.25x")
// into a Number. Returns NaN if there's no numeric content.
function readNum(text) {
  if (text == null) return NaN;
  const cleaned = String(text).replace(/[^0-9.\-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
  return parseFloat(cleaned);
}

// Set a form control's value and fire the inline oninput/onchange handler the
// calculators listen on. Works for <input> and <select>.
async function setField(page, selector, value, eventType = 'input') {
  await page.locator(selector).first().evaluate((el, { value, eventType }) => {
    el.value = String(value);
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
  }, { value, eventType });
}

// Assert a numeric output is within `tol` of expected, with a readable message.
function expectClose(expect, label, actual, expected, tol = 0.5) {
  expect(Number.isFinite(actual), `${label}: got non-numeric "${actual}"`).toBe(true);
  expect(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ~${expected} (±${tol}), got ${actual}`
  ).toBe(true);
}

// Hosts whose console/network noise we ignore in the smoke test — none of these
// are required for the calculators' math, only for styling/fonts/analytics.
const ALLOWED_NOISE_HOSTS = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'jsdelivr.net',
  'supabase.co',
  'supabase.in',
  'google-analytics.com',
  'googletagmanager.com',
];

function isAllowedNoise(text) {
  if (!text) return false;
  return ALLOWED_NOISE_HOSTS.some((h) => text.includes(h));
}

module.exports = {
  REPO_ROOT,
  CALC,
  readSource,
  readNum,
  setField,
  expectClose,
  ALLOWED_NOISE_HOSTS,
  isAllowedNoise,
};
