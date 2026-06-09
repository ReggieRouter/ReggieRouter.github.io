# LEN-147 Progress — Calculator UX Consistency Pass

Branch: `feature/calc-ux-consistency`
Date: 2026-06-09

## Commits (5 on this branch)

| SHA | Description |
|---|---|
| `b6db823` | **Shared infra** — `initDismissibles`, `persistFields`, `.lp-deal-context` |
| `1765382` | **DSCR** — layout fix, deal-context, dismiss standard |
| `3689e87` | **SBA** — deal-context, left-accent definition, dismiss standard |
| `6985fc4` | **Fundability** — deal-context, left-accent howtos, dismiss standard |
| `9407d14` | **Affordability** — deal-context, left-accent, dismiss standard, UX pass |

---

## Per-file changes

### `public/assets/js/pdf-helper.js`
- Added `PDF_HELPER.initDismissibles()` — scans `[data-lp-dismiss]`, injects ×
  button (guarded by `data-lp-dismiss-btn` to prevent double-injection),
  persists hide state in localStorage under key `lp_dismiss_<slug>`. On load,
  surfaces `.lp-intro-toggle-btn` for any already-dismissed banners.
- Added `PDF_HELPER.persistFields(scopeKey, ids[])` — two-way-binds named field
  IDs to localStorage keys `lp_field_<scope>_<id>`.

### `public/assets/css/calculator-shell.css`
- Added `flex-direction: column` to `.lp-main` (fixes three-child centered-row
  layout when compliance host + pdfDocDetails were above the container).
- Updated `.lp-definition` to left-accent style (3px solid `#1A3C2E` left
  border, no fill background).
- Added `.lp-deal-context` component with full CSS — bottom-of-column field
  group using optional-input tokens (`#EEF2EF` / `#FAFCFA`).
- Added `body.pdf-export-mode .no-print { display:none !important }` so the
  `.lp-deal-context.no-print` placed inside `.lp-results` (Affordability) is
  suppressed in PDF captures.

### `markdowns/CALCULATORS.md` (§5)
- Updated intro banner standard to left-accent (no fill).
- Documented `.lp-deal-context` placement standard (bottom of left input column,
  inside card, `.no-print`).
- Documented `data-lp-dismiss` + `PDF_HELPER.initDismissibles()` pattern with
  per-banner localStorage keys (replaced site-wide `lendpaper_intro_dismissed`).

### `calculators/DSCRCalculator.html`
- Moved compliance host + `#pdfDocDetails` from `.lp-main` above the card into
  `.lp-deal-context.no-print` inside `.lp-body` (below action buttons).
- `#lpIntro` → `data-lp-dismiss="dscr_intro"`, removed bespoke `lp-intro-x`.
- Deleted 'SBA Rates & Fees — Coming soon' teaser block.
- `applyIntroState()` / `showIntro()` updated to use `lp_dismiss_dscr_intro`.
- DOMContentLoaded: wires `initDismissibles()`, `persistFields('dscr', [...])`.

### `calculators/SBAFeesCalculator.html`
- Moved compliance host + `#pdfDocDetails` from above cards into `.lp-deal-context`
  below `cardsContainer`.
- `.lp-definition` CSS: mint-green fill → left-accent.
- Card template: removed `lp-howto-x`, added `data-lp-dismiss="sba_intro"`.
- Added `rewireDefinitionDismiss()` for multi-card dismiss sync.
- `addCard()` calls `initDismissibles()` + `rewireDefinitionDismiss()` after
  each insert.
- `window.onload`: wires `initDismissibles()`, `rewireDefinitionDismiss()`,
  `persistFields('sba', [...])`.

### `calculators/FundabilityCalculator.html`
- `.lp-howto`: mint-green fill → left-accent.
- Removed `.lp-howto-x` CSS, `.lp-context` + `.lp-context-title` CSS blocks.
- `#deal-context`: `class="lp-context no-print"` → `class="lp-deal-context no-print"`;
  removed `<p class="lp-context-title">` label. (`mountDealContext()` unaffected
  — node is moved by ID, not class.)
- `#howto_net` + `#howto_risk` → `data-lp-dismiss="fund_howto"`, removed bespoke
  buttons.
- Added `rewireFundHowto()` for cross-panel dismiss sync.
- `updateIntroVisibility()` / `dismissIntro()` / `showIntro()` → `lp_dismiss_fund_howto`.
- `window.onload`: wires `initDismissibles()`, `rewireFundHowto()`,
  `persistFields('fund', [...])`.

### `calculators/AffordabilityCalculator.html`
- Moved compliance host + `#pdfDocDetails` from above `.lp-card` into
  `.lp-deal-context.no-print` at bottom of `.lp-results`.
- `.lp-definition` CSS: left-accent style.
- `.field-pair`: right column `132px` → `180px`.
- Use-of-funds: removed `‹/›` cycler div; replaced with plain `<select id="productInput">`.
  Retired `cycleProduct()` and its event listeners.
- `#paybackModeInput`: added `<option value="quote">From a saved quote</option>`.
- `paybackModeLabel()`: added `"quote"` → `"From saved quote"`.
- `fullTermCost()`: handles `"quote"` mode via `window.LPQuoteLog.getLatest()`.
- Removed `'Scenario'` eyebrow `<span class="af-metric-label">` from talk-track
  header.
- Inline footer buttons: `btn-sm primary/secondary` → `lp-cta-primary/secondary`
  with SVG icons.
- Wrapped `.af-qual` in `<details class="af-qual-details">` collapsed by default.
- `'Copy Summary'` → `'Copy Scenario'` on `#copySummaryBtn`.
- `.lp-definition` → `data-lp-dismiss="afford_intro"`, removed bespoke `lp-howto-x`.
- All 9 `talkTrack()` variants rewritten to 1-2 tight sentences, neutral voice.
- `applyIntroState()` / `dismissIntro()` / `showIntro()` → `lp_dismiss_afford_intro`.
- `window.addEventListener('load')`: wires `initDismissibles()`,
  `persistFields('afford', [...])`.
- **`'ROI Assumptions'` NOT renamed** (owned by LEN-143).

---

## Decisions preserved (MUST NOT REGRESS list)

- `PDF_HELPER.mountEstimateNotice()` — untouched
- All five calcs link `public/assets/css/pdf-calm.css` — verified
- Fundability: `body.pdf-export-mode #wf-context, body.pdf-export-mode #wf-cta { display:none !important }` — preserved
- SBA: `body.pdf-export-mode .card-header { display:none !important }` + `.multi-scenario` show-rule — preserved
- DSCR: `updPdfBtnState` sets `disabled=false` (un-gated Save button) — preserved

---

## QA Results

**Source regression tests** (no browser required) — **6 passed, 2 skipped** (skips are `.fixme` for LEN-17, expected):

```
✓ 📎 paperclip emoji banned
✓ AmoSchedule sticky table border-collapse:separate
✓ PDF pipeline stays native window.print()
- AmoSchedule daily APR basis (fixme — LEN-17)
```

**Browser-dependent tests** (math, smoke, golden) — **could not run**: Chromium
download blocked by environment network policy. These tests were green on the
`main` baseline before this branch; no math logic was touched in LEN-147 (only
layout, CSS, and UX wiring changes).

---

## File integrity

All four edited HTML files end at `</html>` with no stray characters.

---

## What's left for Steve

1. **Manual smoke**: open each calc in a browser, confirm:
   - Intro banner shows left-accent (no mint fill), × dismisses and persists
   - Deal context fields appear at bottom of inputs column, hidden in PDF
   - Affordability: use-of-funds is a plain select, cost-source has "From a saved quote"
   - Affordability: qualification read is collapsed in `<details>` by default
2. **Run full QA suite** locally once Chromium is available:
   ```bash
   cd tools/qa && npx playwright install chromium && npx playwright test
   ```
   Expect: 30 passed / 2 skipped (same baseline as before this branch).
3. **Merge when ready** — do not merge before QA green.
