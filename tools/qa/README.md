# LendPaper pre-release QA harness (LEN-129)

Executable checks for the parts of release-readiness a checklist **can't** verify:
calculator math, "did it actually fire," and bugs that keep coming back. Run this
before pushing anything calculator-related — it's the regression net a static
checklist can't be.

It drives the **real** calculator HTML headless (Playwright + a local static
server), so it tests the shipping pages, not a refactored copy.

## What it covers

| Suite | File | Catches |
|---|---|---|
| **Math oracle** | `tests/math.spec.js` | (A) wrong numbers. Expected values are computed **independently** here, not read back from the page — so a changed formula fails. Covers AmoSchedule, DSCR, Fundability, SBA. |
| **Golden file** | `tests/golden.spec.js` | (A) drift from reality. Drives AmoSchedule with a **real PEAC lender schedule** and asserts all 24 periods (payment/interest/principal/balance) match to the cent. Ground truth, not our own math. |
| **Smoke** | `tests/smoke.spec.js` | (C) bugs / (E) items not firing. Loads each calc on **desktop + mobile** viewports, fails on any uncaught JS error, and asserts results actually populate. |
| **Regressions** | `tests/regressions.spec.js` | (D) recurring formatting/structure bugs: the banned 📎 paperclip tooltip, the sticky-table CSS rule, the native-print PDF pipeline. |

Not covered here (needs a human eye — see the visual checklist, LEN-129 follow-up):
text overruns, white space, "looks off." And cross-branch merge risk (F) lives in
Linear, not code.

## Run it

```bash
cd tools/qa
npm install            # one-time; Playwright browsers are already on the dev machine
npm test               # all suites
npm run test:math      # just the math oracle
npm run test:golden    # just the PEAC golden-file check
npm run test:smoke     # just smoke
npm run test:regress   # just regressions
npm run report         # open the HTML report after a run
```

The PEAC golden fixture lives in `fixtures/`. If PEAC ships an updated schedule,
drop the new `.xlsx` in and run `python3 fixtures/extract-peac.py` to regenerate
`fixtures/peac-amortization.json`.

The config starts a throwaway static server (`python3 -m http.server`) at the repo
root so the calculators' relative asset paths resolve exactly as in production.
No build step, no changes to the calculator files.

## Known state on first run

- **`regressions.spec.js` → paperclip test is RED.** That's correct: the banned
  📎 emoji is live in `FundabilityCalculator.html` (9×) and `SBAFeesCalculator.html`
  (6×). Replace each with the circle-i SVG tooltip icon and it goes green.
- **`smoke.spec.js` → AmoSchedule test is RED.** Real bug: line ~1111 of
  `AmoScheduleCalculator.html` has a top-level `return` inside a
  `<script type="module">`, which is illegal — so the whole module fails to parse
  and `requireApprovedUser()` (auth gate) + `logUsage('amortization','view')`
  silently never run. Fix: `if (profile) logUsage('amortization','view');` (no bare
  `return`). Touches auth-gating — coordinate with the auth-flow work before pushing.
- **Daily-APR test is `fixme` (listed, not run).** AmoSchedule's daily branch
  counts ~260 periods/yr but annualizes APR at 252/yr (~3% understated). Deferred
  under LEN-17; remove `.fixme` once reconciled.

## Adding a fixture

1. Pick known inputs and compute the expected outputs **by hand / independently**
   (don't copy the page's formula — that defeats the oracle).
2. Add a `test(...)` in `math.spec.js`: `setField()` the inputs, then `expectClose()`
   each output. Use `readNum()` to parse `$1,234.56` / `18.7%` / `1.25x` strings.
3. Element IDs/selectors for each calculator are documented inline in `math.spec.js`.
