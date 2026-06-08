// regressions.spec.js — locks in bugs that have come back repeatedly, so they
// can't silently return. These are SOURCE assertions (fast, no browser needed).
//
// NOTE: the paperclip test is RED on `main` right now — that's the harness doing
// its job. The 📎 tooltip icon is a standing-banned regression (reverted 4×) that
// is currently live in Fundability + SBA. Fix those, and this goes green.
// LEN-129.
const { test, expect } = require('@playwright/test');
const { readSource } = require('../lib/helpers');

const CALC_FILES = [
  'calculators/AmoScheduleCalculator.html',
  'calculators/DSCRCalculator.html',
  'calculators/FundabilityCalculator.html',
  'calculators/SBAFeesCalculator.html',
];

test.describe('Recurring regressions', () => {
  test('📎 paperclip emoji is banned as a tooltip icon (use the circle-i SVG)', () => {
    const offenders = [];
    for (const f of CALC_FILES) {
      const src = readSource(f);
      const count = (src.match(/📎/g) || []).length;
      if (count > 0) offenders.push(`${f}: ${count}×`);
    }
    expect(
      offenders,
      `Banned 📎 paperclip found (standing rule: always use the circle-i SVG):\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });

  test('AmoSchedule sticky table keeps border-collapse:separate (collapse breaks sticky th in Chrome)', () => {
    const src = readSource('calculators/AmoScheduleCalculator.html');
    // The documented fix: separate borders + sticky on th. Guard both halves.
    expect(src, 'sticky table lost border-collapse:separate').toMatch(/border-collapse:\s*separate/);
    expect(src, 'sticky table lost position:sticky on the header').toMatch(/position:\s*sticky/);
  });

  test('PDF pipeline stays native window.print() (no reintroduced html2canvas clip risk)', () => {
    const helper = readSource('public/assets/js/pdf-helper.js');
    expect(helper, 'pdf-helper.js no longer calls window.print()').toMatch(/window\.print\s*\(/);
    // The old left-clipping bug lived in an html2canvas pipeline. If html2canvas
    // comes back, the scrollX/scrollY:0 guard must come back with it.
    if (/html2canvas/.test(helper)) {
      expect(helper, 'html2canvas reintroduced WITHOUT scrollX/scrollY:0 (left-clip risk)')
        .toMatch(/scrollX:\s*0[\s\S]*scrollY:\s*0|scrollY:\s*0[\s\S]*scrollX:\s*0/);
    }
  });

  // KNOWN ISSUE — deferred under LEN-17. AmoSchedule's daily branch counts
  // periods at 21.66/mo (≈260/yr) but annualizes APR with pYear=252, so daily
  // APR is understated ~3%. Marked fixme so it stays visible without failing the
  // suite; delete `.fixme` once LEN-17 reconciles the basis.
  test.fixme('AmoSchedule daily APR uses a consistent period/annualization basis', () => {
    const src = readSource('calculators/AmoScheduleCalculator.html');
    // 21.66 periods/mo implies ~260 periods/yr; pYear=252 is the inconsistent half.
    expect(src, 'daily APR still annualizes with pYear=252 against a ~260/yr period count')
      .not.toMatch(/pYear\s*=\s*252/);
  });
});
