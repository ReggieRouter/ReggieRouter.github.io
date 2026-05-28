# LendPaper — PDF Export Spec

**For:** AGY
**Scope:** Print stylesheet + minor markup additions for the "Save as PDF" buttons across all calculators. **On-screen UI is out of scope** — this is purely `@media print` work plus a few shared header/footer partials.

---

## 1. Context

Every calculator currently dumps its on-screen DOM through the browser's native Save-as-PDF and inherits viewport-sized layouts, hidden form controls, fixed-width containers, etc. Result: blank space at the top of pages, content cut off at the right edge, mid-row table breaks, and the LendPaper footer stranded alone on its own page. We need a dedicated print stylesheet plus standardized print-only header and footer partials that ship with every calculator.

## 2. Issues to fix (referencing current PDFs)

| # | Issue | Where it shows up | Root cause |
|---|---|---|---|
| 1 | Large blank space at top of page 1 | DSCR PDF, Amortization PDF | `min-height: 100vh` (or similar) on hero/form wrapper. In print, `1vh` ≈ 1% of the page height, so a viewport-height container creates a full empty page. |
| 2 | LendPaper footer orphaned on its own page | Fundability PDF (footer alone on page 2) | Footer is a regular block at end of content; nothing keeps it attached to preceding content or repeats it as a running footer. |
| 3 | Text clipped at right edge ("over [the] life of the loan") | SBA Fees PDF | Fixed-width or overflow-hidden container wider than printable page. |
| 4 | Table rows split mid-row | Amortization PDF, around the page breaks | No `break-inside: avoid` on `tr`. Table header doesn't repeat. |
| 5 | On-screen input form prints into the PDF | DSCR PDF (entity-type cards, step labels, input fields), Amortization PDF (financing inputs panel) | Form controls aren't hidden in `@media print`. |
| 6 | Disclaimer + LendPaper plug placement inconsistent | All four | No standardized print-only footer partial. |
| 7 | Two-column layout (input panel + results) prints side-by-side | Payment Breakdown PDF | Flex/grid two-column shell not collapsed for print; input column must be hidden, results column promoted to full width. |

---

## 3. The print stylesheet

Drop this into a dedicated file (`print.css`) loaded on every calculator page, or into a global `@media print` block. All rules below assume that file is in scope.

### 3.1 Page setup and global resets

```css
@page {
  size: letter;
  margin: 0.6in 0.55in 0.85in 0.55in; /* top right bottom left — bottom is larger to hold running footer */
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

  /* Preserve brand colors (green left bars, orange verdict callout, etc.) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Kill viewport-height containers — these cause the blank top of page 1 */
  .hero, .intro, .calculator-shell, .form-wrapper,
  [class*="min-h-screen"], [style*="min-height: 100vh"], [style*="min-height:100vh"] {
    min-height: 0 !important;
    height: auto !important;
  }

  /* Containers should respect page width, not their on-screen fixed widths */
  .container, .card, .scenario-card, main, section {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
    padding-left: 0 !important;
    padding-right: 0 !important;
    overflow: visible !important;
  }

  /* Currency strings should never wrap mid-number */
  .currency, .stat-value, .amount { white-space: nowrap; }

  /* Collapse two-column calculator shells — results go full-width, input panel disappears.
     Class names below are the convention; verify against each calculator's actual markup. */
  .calculator-layout, .split-view, .two-col-shell,
  .calc-body, .panel-row {
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

### 3.2 Hide on-screen-only chrome

```css
@media print {
  .no-print,
  nav, header.site-nav, .sidebar, .topbar,
  button, .btn, .save-pdf-btn,
  input, select, textarea, .form-controls, .field-group,
  .tooltip, .expand-toggle, .help-icon,
  .step-editor, /* DSCR step inputs */
  .input-col, .form-col, .terms-panel, .left-col /* two-column input panels */ {
    display: none !important;
  }
}
```

Add a `.print-only` utility for elements that should *only* appear in PDFs:

```css
.print-only { display: none; }
@media print { .print-only { display: block; } }
```

### 3.3 Page-break behavior

```css
@media print {
  /* Keep these blocks intact across pages */
  .kpi-tile, .verdict-card, .callout, .quote-block,
  .summary-card, .legend, .disclaimer-block,
  .pdf-header {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Headings stay with their following content */
  h1, h2, h3, h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* No stranded single lines */
  p, li { orphans: 3; widows: 3; }
}
```

### 3.4 Tables (amortization)

```css
@media print {
  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead { display: table-header-group; }   /* repeats header on every page */
  tfoot { display: table-footer-group; }

  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* The prepay highlight row + its "IF BORROWER PAYS OFF HERE" callout must stay together.
     Wrap them in a shared <tbody class="prepay-block"> and apply: */
  .prepay-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

### 3.5 Running header & footer

The cleanest cross-page footer uses `@page` margin boxes. **This works reliably in Chromium-based "Save as PDF" and in Puppeteer (with `printBackground: true`).** If the production pipeline is Puppeteer, prefer Puppeteer's `headerTemplate` / `footerTemplate` options for stronger guarantees — see §6.

```css
@page {
  @bottom-center {
    content: element(pdfRunningFooter);
  }
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

Optional page numbers — pick **one** layout and commit:

```css
@page {
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 8pt;
    color: #94a3b8;
  }
}
```

---

## 4. Shared print partials (HTML)

Add these two partials to every calculator's print region. They render only in PDFs.

### 4.1 Print header

```html
<header class="print-only pdf-header">
  <img src="/assets/lendpaper-logo.svg" alt="LendPaper" class="pdf-logo" />
  <h1 class="pdf-title">{{ calculator_title }}</h1>
  <p class="pdf-meta">Generated {{ date }} · Estimate</p>
</header>
```

Per-calculator titles:

| Calculator | `calculator_title` |
|---|---|
| Fundability | Fundability Estimate |
| DSCR | DSCR Analysis |
| SBA 7(a) Fees | SBA 7(a) Rates & Fees |
| Amortization | Amortization Schedule |

```css
@media print {
  .pdf-header {
    text-align: center;
    margin-bottom: 0.25in;
    padding-bottom: 0.15in;
    border-bottom: 1px solid #e5e7eb;
  }
  .pdf-logo { height: 26px; margin-bottom: 8px; }
  .pdf-title { font-size: 18pt; font-weight: 700; margin: 4px 0; color: #0f2438; }
  .pdf-meta { font-size: 9pt; color: #6b7280; margin: 0; }
}
```

### 4.2 Running footer (disclaimer + LendPaper plug)

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

This footer is positioned as a `running()` element in §3.5 so it appears on every page, not just the last one. That single change fixes the orphaned-footer issue on the Fundability PDF.

---

## 5. Per-calculator notes

### Fundability
- Wrap the verdict card (Moderate / Low / High / Severe block) in `.verdict-card` so it never splits across pages.
- Wrap the four DSR band rows in `.legend` so the legend stays intact.
- Orphaned footer on page 2 → fixed by the running footer in §3.5.

### DSCR — biggest current offender
- The PDF is currently rendering the entire **on-screen input form**: entity-type selector cards, step numbers, "EBIDA & financials" headers, raw input fields, placeholder values like `$4444`. **The PDF should show analysis output, not the editor.**
- Build a `.dscr-print-view` block that renders a clean read-only summary:
  - Entity type + tax form
  - Required tax docs
  - EBIDA breakdown (line items + totals)
  - BDSCR result
  - GDSCR result (if applicable)
  - Verdict / recommendation
- In `@media print`: `display: none` on `.dscr-form`, `.step-editor`, and all input controls; `display: block` on `.dscr-print-view`.
- The blank top of page 1 is from a `min-height: 100vh` (or equivalent) on the form shell — covered by the global reset in §3.1.

### SBA Fees
- Right-edge clipping on "over [the] life of the loan" → container overflow. The global container-width rule in §3.1 should fix it; verify `.scenario-card` doesn't have its own fixed `width` or `padding-right` overriding.
- Confirm all currency values are wrapped in `.currency` so `white-space: nowrap` applies.

### Payment Breakdown (MCA / Working Capital)
- **Core issue:** On-screen layout is two columns — TERMS input panel on the left, payment results on the right. In print, this renders as a split-column website view rather than a clean document.
- Hide the left column (TERMS inputs: amount, cost-per-dollar, term, origination fee, frequency, start date) — `display: none` on `.input-col` / `.terms-panel` / `.left-col`. The global rule in §3.1 should cover this if class names match; verify against actual markup.
- Results column (weekly payment, total payback, total interest, cost per dollar, APR, early-payoff callout, narrative quote) goes full-width — `width: 100%` on `.results-col` / `.right-col`.
- Add a print-only **Loan Parameters** summary (`.print-only`) at the top of the print view: amount, term, origination fee, payment frequency, start date. Mirrors the Amortization pattern.
- Wrap the early-payoff callout (green savings block) in `.callout` so `break-inside: avoid` applies — it must never split across pages.
- Wrap the narrative quote block in `.quote-block` for the same reason.
- The dark left sidebar / app chrome rail must not print — confirm `.sidebar`, `.app-rail`, `.dark-rail` are in the no-print list (§3.2).
- The LendPaper logo + "Scenario Modeling" byline that appear in the top-right on-screen should be suppressed in favor of the standardized `.pdf-header` partial (§4.1).
- Per-calculator title for the header partial: **"Payment Breakdown"** (or the specific product name if it varies by lender config).

### Amortization
- Hide the input panel (financing amount, term, payment frequency, start date inputs) in print. Replace with a small read-only **"Loan Parameters"** summary block (`.print-only`) at the top: amount, term, frequency, start date, cost per dollar, origination fee, APR.
- Repeat table header on every page — covered by `thead { display: table-header-group }` in §3.4.
- Group the highlighted prepay row + the "IF BORROWER PAYS OFF HERE" callout row into a single `<tbody class="prepay-block">` so they stay together. Currently this risks splitting.
- Blank top of page 1 → same `min-height: 100vh` issue, same global fix.

---

## 6. If the pipeline is Puppeteer / headless Chrome

If PDFs are generated server-side via Puppeteer (vs. the user clicking the browser's Save as PDF), use Puppeteer's native header/footer instead of `position: running()` — it's more reliable across edge cases:

```js
await page.pdf({
  format: 'Letter',
  printBackground: true,           // required for brand colors / left bars
  displayHeaderFooter: true,
  margin: { top: '0.6in', right: '0.55in', bottom: '0.85in', left: '0.55in' },
  headerTemplate: '<div></div>',   // empty — we render header inline
  footerTemplate: `
    <div style="width:100%; font-size:8pt; color:#64748b; text-align:center; padding:0 0.55in; line-height:1.4;">
      <div>These figures are estimates for informational purposes only. Actual loan terms, rates, and fees will be determined by the lender upon final review.</div>
      <div style="color:#94a3b8;">Powered by LendPaper · hello@lendpaper.com · lendpaper.com — Ask about whitelabeling and custom tools.</div>
    </div>
  `,
});
```

If we go this route, drop the `@page { @bottom-center }` rule from §3.5 to avoid double footers.

---

## 7. Pre-ship checklist

Run each of the four calculators → Save as PDF → verify:

- [ ] No blank space at top of page 1
- [ ] LendPaper logo + calculator title appear cleanly at top of page 1
- [ ] No KPI tile, callout, or verdict card splits across pages
- [ ] No table row splits mid-row (amortization)
- [ ] Table header repeats on every page (amortization)
- [ ] Prepay highlight row + payoff callout stay on the same page
- [ ] No content clips at right edge
- [ ] Disclaimer + LendPaper plug appears on **every** page footer
- [ ] Brand colors render: green left bars on callouts, orange verdict card, green highlight row
- [ ] No Save-as-PDF button, no nav, no input fields, no step editors appear in the PDF
- [ ] Page breaks land at section boundaries, not mid-paragraph or mid-callout
- [ ] DSCR PDF shows analysis output, not the editor

Test in: Chrome print preview (the most common path for `Save as PDF`), Safari print preview, and the production headless pipeline if there is one.

---

## 8. Notes

- All this is `@media print` only. **Do not change the on-screen experience.**
- When new calculators ship, they should reuse the same `.pdf-header`, `.pdf-running-footer`, and shared print classes (`.kpi-tile`, `.callout`, `.verdict-card`, `.summary-card`). Goal: one print stylesheet covers the whole product.
- If a Puppeteer pipeline is added later, switch to §6's approach for the footer and remove the `@page` margin-box footer to avoid duplicates.

---

## 9. Regression log

Track confirmed fixes here so they don't regress as new calculators ship. Each row documents a bug that has been observed, spec'd, and verified fixed.

| Issue | Affected calc(s) | Status | Fix in spec |
|---|---|---|---|
| Blank space at top of page 1 | DSCR, Amortization, Payment Breakdown | ✅ Resolved | `min-height: 0` reset — §3.1 |
| Double header (page title + site nav both print) | Payment Breakdown | ✅ Resolved | `nav, header.site-nav` hidden — §3.2 |
| Fundability split-tab chrome printing | Fundability | ✅ Resolved | `break-inside: avoid` + tab controls in no-print list — §3.2, §3.3 |
| LendPaper footer orphaned on its own page | Fundability | ✅ Resolved | Running footer via `position: running()` — §3.5 |
| Text clipped at right edge | SBA Fees | ✅ Resolved | Container overflow reset — §3.1 |
| Two-column layout prints as website view | Payment Breakdown | 🔧 Spec'd | Hide `.input-col`, promote `.results-col` to full-width — §3.1, §5 |
| On-screen input form prints into PDF | DSCR, Amortization | 🔧 Spec'd | `display: none` on form shell; `.dscr-print-view` and `.print-only` summary — §3.2, §5 |
| Table rows split mid-row | Amortization | 🔧 Spec'd | `break-inside: avoid` on `tr`; `thead { display: table-header-group }` — §3.4 |

When a new calculator ships, add a row here for any new issues observed on the first PDF review before the fix is merged.
