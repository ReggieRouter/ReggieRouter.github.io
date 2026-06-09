# LendPaper — PDF Export Standards & Anti-Regression Guide

**Read this before touching any PDF export, print stylesheet, or html2canvas config. Many bugs documented here have been fixed — do not re-introduce them.**

---

## 1. Anti-Fraud Watermark System — NEVER Remove or Weaken

Every PDF exported via `PDF_HELPER.generatePDF()` must carry all three layers. These exist to prevent fraud and limit legal exposure from falsified or disputed estimates.

| Layer | What it is | How it's injected |
|---|---|---|
| 1 — Visible header ID | `Doc #LP-YYYYMMDD-XXXXXX · [date]` in small gray text below document title | `initPrintLayout(title, quoteId)` |
| 2 — Visible per-page stamp | `LP-YYYYMMDD-XXXXXX · lendpaper.com` fixed bottom-right, 6pt gray | `#lp-quote-stamp` div with `position:fixed` |
| 3 — Invisible forensic fingerprint | White text div containing Quote ID + timestamp, origin URL, user agent, screen size, timezone | `#lp-doc-fingerprint` — invisible on screen, extractable via PDF text tools |

All three use the **same Quote ID** (generated once per export via `generateQuoteId()`).

**Rules:**
- Never call `window.print()` directly — always route through `PDF_HELPER.generatePDF()`
- Never comment out, remove, or override any of these three layers
- Every new calculator or PDF export path must use `PDF_HELPER.generatePDF()`

---

## 2. html2canvas Configuration (Anti-Clipping)

**The single most recurring PDF bug is left-side content clipping.** Root cause: ancestor CSS transforms (e.g. CRM iframe `scale(0.8)`) warp `getBoundingClientRect()` coordinates that html2canvas uses for measurement.

### Required config — never omit these:

```javascript
html2canvas(element, {
  scrollX: 0,
  scrollY: 0,
  // ... other options
})
```

`scrollX: 0, scrollY: 0` must always be present. Dropping them causes the canvas capture to shift content left, clipping the first column of tables (the `$` and leading digits disappear).

### Required CSS during capture (`pdf-export-mode` class on body):

```css
body.pdf-export-mode html,
body.pdf-export-mode body {
  margin: 0 !important;
  padding: 0 !important;
}

body.pdf-export-mode * {
  min-width: 0 !important;
  max-width: 100% !important;
  letter-spacing: normal !important;
}

/* Strip transforms on top-level layout wrappers */
body.pdf-export-mode .modal-shell,
body.pdf-export-mode .lp-container,
body.pdf-export-mode main,
body.pdf-export-mode .lp-card {
  position: static !important;
  transform: none !important;
}

/* Collapse two-column layouts for capture */
body.pdf-export-mode .calc-body,
body.pdf-export-mode .panel-row {
  display: block !important;
  flex-direction: column !important;
}
```

### Nuclear scroll reset (run before capture):

```javascript
// Before calling html2canvas:
window.scrollTo(0, 0);
document.documentElement.scrollLeft = 0;
document.documentElement.scrollTop = 0;
document.body.scrollLeft = 0;
document.body.scrollTop = 0;
// Reset all elements
document.querySelectorAll('*').forEach(el => {
  if (el.scrollLeft) el.scrollLeft = 0;
});
```

---

## 3. Render Gate — Block Export on Incomplete Inputs

Before generating any PDF, validate that required fields are non-zero and non-default. If validation fails, show:

> "Complete your inputs to generate this document."

Never allow a blank or default-state document to be downloaded.

| Document Type | Required Non-Zero Fields |
|---|---|
| Payment Breakdown / Amortization | Financing amount, term (months), cost per dollar borrowed |
| DSCR Analysis | At least one EBIDA field + at least one deal scenario amount |
| Fundability / Stacking | Revenue input, at least one position modeled |
| SBA 7(a) Fees | Loan amount, term (years), rate (%) |

---

## 3A. Optional Document Metadata — PDF Details footer module (LEN-160)

Every calculator carries one optional metadata module (`#pdfDocDetails`,
`.lp-doc-details`) that personalizes the saved PDF. It is the **single source of
truth** for the PDF's prepared-header fields. It is screen-only chrome (`no-print`)
and **must never change PDF math, validation, watermarking, compliance, or
Estimate Log behavior.**

### UI contract (the footer module)

- Lives at the **bottom of the input column**, visually secondary to the financing
  inputs — **not** a full-width floating bar above the inputs. (Multi-card calcs —
  Amortization, SBA — render the single module below the cards, left-aligned.)
- Collapsed state (mockup `lendpaper-doc-details-footer-module-mockup.svg`): a small
  document icon, the kicker `PDF DETAILS`, the title `Prepared for the saved estimate`,
  the helper line `Prepared by · Company · Prepared for`, and an `Edit` + `+`/`–`
  affordance. It is a `<details>`/`<summary>` disclosure.
- Mint guidance / how-to boxes use a real **30×30 close target** with reserved right
  padding so text never runs under it (injected by `PDF_HELPER.initDismissibles`;
  Amortization's per-card intro box matches the same size).

### The three optional fields — exactly these, nothing else

| Field | id | Meaning | Blank behavior |
|---|---|---|---|
| Prepared by | `pdfPreparedBy` | Person preparing the estimate | Omit the prepared-by line if blank |
| Company | `pdfPreparedByCompany` | Preparer / company name | Combined into the prepared-by line (`Prepared by Jane · Northline Capital`) |
| Prepared for | `pdfPreparedFor` | Borrower / merchant — may include use of funds | Omit the prepared-for line if blank |

Rules:

- All three are optional; export is never gated on them.
- `Prepared for` may carry borrower name **plus** use of funds on one line.
- **Never print an empty metadata shell** such as `Prepared for —` or `Prepared by —`.
- Do not reintroduce `Deal name` / `Lender / program` fields — they were removed in
  LEN-160; the PDF no longer renders a deal-name subtitle or a lender/program cell.

---

## 4. Print Stylesheet (Standard — All Calculators)

All calculators share this base. Drop into a `print.css` or global `@media print` block.

### Page setup

```css
@page {
  size: letter;
  margin: 0.6in 0.55in 0.85in 0.55in; /* top right bottom left */
}

@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #0f2438;
    font-size: 10.5pt;
    line-height: 1.45;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Kill viewport-height containers — these cause blank top of page 1 */
  .hero, .intro, .calculator-shell, .form-wrapper,
  [class*="min-h-screen"], [style*="min-height: 100vh"], [style*="min-height:100vh"] {
    min-height: 0 !important;
    height: auto !important;
  }

  .container, .card, .scenario-card, main, section {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
    padding-left: 0 !important;
    padding-right: 0 !important;
    overflow: visible !important;
  }

  .currency, .stat-value, .amount { white-space: nowrap; }

  /* Collapse two-column layouts: hide inputs, promote results */
  .calculator-layout, .split-view, .two-col-shell, .calc-body, .panel-row {
    display: block !important;
  }

  .input-col, .form-col, .terms-panel, .left-panel, .left-col {
    display: none !important;
  }

  .results-col, .output-col, .right-panel, .right-col {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
  }
}
```

### Hide screen-only chrome

```css
@media print {
  .no-print,
  nav, header.site-nav, .sidebar, .topbar,
  button, .btn, .save-pdf-btn,
  input, select, textarea, .form-controls, .field-group,
  .tooltip, .expand-toggle, .help-icon,
  .step-editor,
  .input-col, .form-col, .terms-panel, .left-col {
    display: none !important;
  }
}

.print-only { display: none; }
@media print { .print-only { display: block; } }
```

### Page-break behavior

```css
@media print {
  .kpi-tile, .verdict-card, .callout, .quote-block,
  .summary-card, .legend, .disclaimer-block, .pdf-header {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  h1, h2, h3, h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  p, li { orphans: 3; widows: 3; }
}
```

### Tables (amortization)

```css
@media print {
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }   /* repeats on every page */
  tfoot { display: table-footer-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }

  /* Prepay highlight row + callout must stay together */
  .prepay-block { break-inside: avoid; page-break-inside: avoid; }
}
```

### Running footer (appears on every page)

```css
@page {
  @bottom-center { content: element(pdfRunningFooter); }
}

@media print {
  .pdf-running-footer {
    position: running(pdfRunningFooter);
    font-size: 8pt;
    color: #64748b;
    text-align: center;
    line-height: 1.4;
  }
  .pdf-running-footer .disclaimer { display: block; margin-bottom: 3px; }
  .pdf-running-footer .plug { display: block; color: #94a3b8; }
}
```

---

## 4A. Calm PDF Design System (LEN-141) — the canonical look

The borrower-facing PDF look is the **calm** system: quiet typography, a soft
white-card language, a single green focus tile, and an amber estimate notice.
It is owned by one shared stylesheet so the five calculators read as one product
in a multi-PDF packet — **do not redefine these tokens or re-invent the notice/
header/footer per calculator.**

**Source of truth:** `public/assets/css/pdf-calm.css` — linked by every
calculator, scoped entirely to `body.pdf-export-mode` (zero on-screen effect).
Reference implementation: the Payment Breakdown PDF (`AmoScheduleCalculator.html`
`#pdf-document` + `buildPdfDocument()`). Original spec artifact:
`payment_breakdown_pdf_calm_mockup.html` (LEN-135).

### Palette tokens (on `body.pdf-export-mode`)

| Token | Value | Use |
|---|---|---|
| `--pdf-ink` | `#101827` | Primary text |
| `--pdf-muted` | `#65758b` | Labels, captions, secondary text |
| `--pdf-soft` | `#f7faf9` | Soft card / strip / table-head fills |
| `--pdf-line` | `#dbe4e8` | Hairline borders |
| `--pdf-green` | `#1A3C2E` | Primary fill (focus tile), totals — **brand green** |
| `--pdf-green-mid` | `#17613f` | Green accents (eyebrows, savings) |
| `--pdf-green-soft` | `#effaf3` | Highlighted schedule row |
| `--pdf-amber-bg/line/ink` | `#fffdf4` / `#f3d675` / `#7c4a03` | Estimate notice |
| `--pdf-mint-line/bg` | `#b7efcc` / `#fbfffc` | Early-payoff cards |

The mockup's green (`#173f31`) **maps to brand `#1A3C2E`** per BRANDING.md — the
mockup is a spec artifact, not production colour. All filled elements carry
`print-color-adjust: exact` so they survive the print capture.

### Shared chrome (applied to every calculator automatically)

- **Estimate notice.** `PDF_HELPER.mountEstimateNotice(element)` (called inside
  `generatePDF`) injects the amber `.lp-pdf-notice` at the top of the captured
  body and removes it after the dialog. It **no-ops for Payment Breakdown**
  (which renders its own calm-native notice inside `#pdf-document`). Never
  hardcode a second notice in a calculator that already gets the injected one.
- **Prepared-for/by block.** The shared `mountDocContext()` output
  (`.lp-doc-context` / `.dc-for` / `.dc-meta` / `.dc-by`) is restyled to the calm
  card by `pdf-calm.css`. Keep using `mountDocContext()`; don't restyle it locally.
- **Footer partials.** `.print-footer-legal` + `.print-watermark` are quieted to
  the calm muted footer by `pdf-calm.css`.
- **Typography.** `pdf-calm.css` sets Inter on the printed content. The
  PDF_HELPER tiered header keeps its own inline font and is unaffected.

### Component library (for body migration — `body.pdf-export-mode .lp-pdf-*`)

Migrate a calculator's PDF body onto these incrementally (Payment Breakdown is
the worked example; the others currently get the shared chrome only):

| Class | What it is |
|---|---|
| `.lp-pdf-topline` + `.lp-pdf-brand` / `.lp-pdf-company` / `.lp-pdf-meta` | Header: brand kicker / Prepared-For box / preparer meta |
| `.lp-pdf-notice` | Amber estimate banner |
| `.lp-pdf-card` (`.soft`) | White / soft rounded card |
| `.lp-pdf-focus` (`.primary`) + `.lp-pdf-value` | Hero focus tile (green primary) |
| `.lp-pdf-row` (`.total`) | Label … value definition row |
| `.lp-pdf-details` | 6-up deal-details grid |
| `.lp-pdf-table` | Calm schedule / data table |
| `.lp-pdf-foot` (`.code`) | In-body two-column footer |

**Rule of thumb:** new calculators and PDF-body rewrites compose from
`.lp-pdf-*` and the tokens above — they must not introduce a new green, a new
notice colour, or a bespoke header/footer.

---

## 5. Print Partials (Add to Every Calculator)

### Print header

```html
<header class="print-only pdf-header">
  <img src="/assets/lendpaper-logo.svg" alt="LendPaper" class="pdf-logo" />
  <h1 class="pdf-title">{{ calculator_title }}</h1>
  <p class="pdf-meta">Generated {{ date }} · Estimate</p>
</header>
```

Per-calculator titles:

| Calculator | Title |
|---|---|
| Fundability | Fundability Estimate |
| DSCR | DSCR Analysis |
| SBA 7(a) Fees | SBA 7(a) Rates & Fees |
| Amortization | Amortization Schedule |
| Payment Breakdown | Payment Breakdown |

```css
@media print {
  .pdf-header { text-align: center; margin-bottom: 0.25in; padding-bottom: 0.15in; border-bottom: 1px solid #e5e7eb; }
  .pdf-logo { height: 26px; margin-bottom: 8px; }
  .pdf-title { font-size: 18pt; font-weight: 700; margin: 4px 0; color: #0f2438; }
  .pdf-meta { font-size: 9pt; color: #6b7280; margin: 0; }
}
```

### Running footer HTML

```html
<footer class="print-only pdf-running-footer">
  <span class="disclaimer">
    These figures are estimates for informational purposes only. Actual loan terms, rates, and fees will be determined by the lender upon final review.
  </span>
  <span class="plug">
    Powered by LendPaper · hello@lendpaper.com · lendpaper.com — Ask about whitelabeling and custom tools.
  </span>
</footer>
```

---

## 6. Per-Calculator Print Notes

### DSCR — most problematic
- PDF must show **analysis output only** — not the editor form
- Build a `.dscr-print-view` block: entity type, tax form, EBIDA breakdown, BDSCR/GDSCR, verdict
- In `@media print`: `display: none` on `.dscr-form`, `.step-editor`, all input controls; `display: block` on `.dscr-print-view`
- Blank top of page 1 = `min-height: 100vh` on form shell → fixed by global reset above

### Fundability
- Wrap verdict card in `.verdict-card` — must never split across pages
- Wrap DSR band rows in `.legend` — must stay intact
- Orphaned footer fix: running footer in §5 resolves this

### SBA Fees
- Right-edge clipping: global container-width rule in §4 should fix it; verify `.scenario-card` has no fixed width overriding
- Confirm currency values wrapped in `.currency` for `white-space: nowrap`

### Payment Breakdown / Amortization (calm rebuild — LEN-141, supersedes LEN-110/124)

Print-only borrower document, built into the hidden `#pdf-document` by
`buildPdfDocument()` from live state — the on-screen results column is untouched.
Follows the §4A calm system. **This is the reference implementation; match it
when migrating other calculators.**

- **Header:** the `.topline` — brand kicker / **Prepared For** box (empty state
  `Borrower not specified`) / preparer meta (`Prepared by {preparer}` ·
  `Using LendPaper technology`). The legacy `.print-header-content` is suppressed.
- **Page 1:** eyebrow (scenario label) + **"Proposal summary"** title + lead, then:
  - Two hero focus cards — **Gross Funding** (green primary tile) and the
    frequency **Payment** (mono value).
  - **Funds To Borrower** card — `Gross funding → Origination fee deducted →
    Estimated funds received` (the origination fee is explained here, never made
    the centerpiece).
  - **Repayment Summary** card — total repayment / finance charge / total cost
    incl. origination fee / term.
  - **Deal Details** 6-up grid (Factor / Est. APR / **Origination Fee** /
    Frequency / Start / Maturity).
  - Compact **Early Payoff** preview (Example date / Estimated buyout / Estimated
    savings) + illustrative notice. Detailed tiles live in the schedule, not here.
- **Schedule (page 2+):** a six-column calm table (`#`, Date, Payment, Principal,
  Interest, Principal Balance). The selected payoff row gets the green highlight +
  `.pill`, and expands into the inline three-tile **`.inline-payoff`** panel
  (Early Payoff Quote / Run-To-Term Cost / Estimated Savings) + amber lender note.
- **Multi-scenario** (page break per card) and **multi-option payoff** (≤3:
  green / blue / purple via `pdfOptClass`) are preserved.
- Per-page legal micro-copy + page numbers come from the `@page` margin boxes;
  the in-body calm `.pdf-footer` renders once at the end. Colours are forced with
  `print-color-adjust: exact`. Table header repeats via `thead { display:
  table-header-group }`.

---

## 7. Puppeteer / Headless Pipeline (if applicable)

If PDFs are generated server-side, use Puppeteer's native header/footer instead of `position: running()`:

```js
await page.pdf({
  format: 'Letter',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '0.6in', right: '0.55in', bottom: '0.85in', left: '0.55in' },
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width:100%;font-size:8pt;color:#64748b;text-align:center;padding:0 0.55in;line-height:1.4;">
      <div>These figures are estimates for informational purposes only. Actual loan terms, rates, and fees will be determined by the lender upon final review.</div>
      <div style="color:#94a3b8;">Powered by LendPaper · hello@lendpaper.com · lendpaper.com — Ask about whitelabeling and custom tools.</div>
    </div>`,
});
```

If using Puppeteer, remove the `@page { @bottom-center }` rule from §4 to avoid double footers.

---

## 8. Pre-Ship Checklist

Run each calculator through Save as PDF → verify:

- [ ] No blank space at top of page 1
- [ ] LendPaper logo + calculator title appear cleanly at top
- [ ] No KPI tile, callout, or verdict card splits across pages
- [ ] No table row splits mid-row (amortization)
- [ ] Table header repeats on every page (amortization)
- [ ] Prepay highlight row + payoff callout stay on the same page
- [ ] No content clips at right edge
- [ ] Disclaimer + LendPaper plug appears on **every** page footer
- [ ] Brand colors render: green left bars, orange verdict, green highlight row
- [ ] No Save PDF button, no nav, no input fields, no step editors appear in output
- [ ] Page breaks at section boundaries — not mid-paragraph or mid-callout
- [ ] DSCR shows analysis output, not the editor
- [ ] Anti-fraud watermark: quote ID in header, stamp bottom-right, forensic fingerprint invisible text

Test in: Chrome print preview (primary path), Safari print preview.

---

## 9. Known Failure Modes (Do Not Reintroduce)

### iframe/CRM portal coordinate warping
**Root cause:** CRM dashboards use CSS transforms (`transform: scale(0.8)`) on iframe wrappers. `html2canvas` uses `getBoundingClientRect()` which inherits ancestor scaling. Coordinates are mathematically warped — `left: 100px` reads as `75px` under `scale(0.75)`. Result: canvas shifts left, clipping first-column content (`$`, leading digits).
**Fix:** Nuclear scroll reset + `scrollX: 0, scrollY: 0` in html2canvas config + `position: static; transform: none` on top-level layout wrappers.

### Canvas size mismatch on `onclone`
**Root cause:** html2canvas calculates canvas size from live DOM *before* cloning. Injecting `pdf-export-mode` class inside `onclone` causes size to be calculated at live DOM width (e.g. 1280px) but content rendered at clone width (e.g. 800px). Result: content compressed to ~62% with massive whitespace.
**Fix:** Inject `pdf-export-mode` on the live DOM before calling html2canvas, not inside `onclone`.

### Off-screen clone container size mismatch
**Root cause:** Cloning to an off-screen container at a different width than the live DOM causes the same canvas mismatch as above.
**Fix:** Capture in-place on the live DOM with class injection, not via a detached clone container.

### Blank top of page 1
**Root cause:** `min-height: 100vh` on hero/form wrapper — in print, `1vh ≈ 1%` of page height, creating a full empty page.
**Fix:** Global `min-height: 0 !important` reset on those containers in `@media print`.

### Orphaned footer on last page
**Root cause:** Footer is a regular block at end of content — nothing keeps it attached or makes it repeat.
**Fix:** `position: running(pdfRunningFooter)` via `@page` margin boxes.

---

## 10. Regression Log

| Issue | Affected | Status | Fix reference |
|---|---|---|---|
| Blank top of page 1 | DSCR, Amortization, Payment Breakdown | ✅ Fixed | `min-height: 0` reset — §4 |
| Double header printing | Payment Breakdown | ✅ Fixed | `nav, header.site-nav` in no-print list — §4 |
| Fundability split-tab chrome printing | Fundability | ✅ Fixed | `break-inside: avoid` + tab controls in no-print — §4 |
| Orphaned footer on own page | Fundability | ✅ Fixed | Running footer `position: running()` — §4 |
| Right-edge text clipping | SBA Fees | ✅ Fixed | Container overflow reset — §4 |
| Left-side content clipping (iframe portals) | All | ✅ Fixed | scrollX/scrollY + scroll reset — §2 |
| Two-column layout prints as website | Payment Breakdown | 🔧 Spec'd | Hide `.input-col`, promote `.results-col` — §4, §6 |
| Input form prints into PDF | DSCR, Amortization | 🔧 Spec'd | `display: none` on form; `.dscr-print-view` + `.print-only` summary — §4, §6 |
| Table rows split mid-row | Amortization | 🔧 Spec'd | `break-inside: avoid` on `tr` — §4 |

When a new calculator ships, add a row here for any issues found on first PDF review.

---

## State Compliance Disclosures in PDFs — see LEGAL.md

PDF exports participate in the compliance engine (LEN-88). Regulatory content
lives in `markdowns/LEGAL.md` only — reference, don't copy:

- `PDF_HELPER.generatePDF()` STEP 7.5 calls `LPCompliance.buildPdfBlock()`:
  when a borrower state is selected and that state has PDF rules (LEGAL.md §13),
  a disclosure block + source links + the §14 disclaimer is appended to the
  printed element, rendered only in `pdf-export-mode`, and cleaned up after
  the dialog closes
- No state selected, or no rule for the state → nothing is added (by design)
- The block is marked `page-break-inside: avoid` and styled at 7.5pt to match
  the §3 micro-copy footer aesthetic
- Never hardcode state disclosure strings in pdf-helper or a calculator; they
  live in `compliance-rules.js` (PDF surface strings) mirrored from LEGAL.md
