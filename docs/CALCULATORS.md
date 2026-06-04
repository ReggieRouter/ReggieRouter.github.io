# LendPaper — Calculator Standards & QA Bible

**Calculators handle real financial decisions. Precision is non-negotiable. Read this entire file before building or editing any calculator.**

---

## 1. User Persona

Primary: SMB alt-finance sales reps and brokers — on a live call with a borrower on hold.
- High-velocity deal flow, desktop-first, frequently mobile
- Sharing outputs to PDF, Slack, CRM note

**Design test:** Can they get the number in 10 seconds from a cold load?

---

## 2. UX Principles

1. **Speed over completeness.** Every extra click costs deals.
2. **Progressive disclosure.** Show the number first. Collapse explanations.
3. **Copy-first outputs.** Every result pastes cleanly into Slack, email, CRM.
4. **Pre-written language.** Don't make reps write their own pitch. Give them the sentence.
5. **Compliance as a whisper.** APR disclosures and legal notes as footnotes — never blocking UI.
6. **Mobile aware.** Thumb-friendly inputs; hero numbers readable at a glance.

---

## 3. Compliance Terminology — Non-Negotiable

> MCAs are NOT loans. They are purchases of future receivables. Calling an MCA a "loan" or the cost "interest" is a compliance violation.

| Avoid | Use Instead |
|---|---|
| "Loan" (for MCA) | "financing," "advance," "product" |
| "Interest" (for MCA) | "cost," "factor cost," "total cost of capital" |
| "Interest rate" (for MCA) | "cost per dollar borrowed," "factor rate" |
| "APR" unqualified for MCAs | Show with disclaimer — required in CA (SB 1235) and NY (SB 5470) |
| "Loan amount" | "Financing amount" |

**APR rule:** Always show APR. Always add superscript `*` + footnote: `* APR disclosure required in CA and NY`. Never gate on a state selector.

**MCA legal structure:** MCAs and RBF are legally sales of future receivables at a discount — no absolute repayment covenant. This exempts them from traditional usury caps. Never frame them as debt instruments.

**Cold calling copy:** Any broker/BDR solicitation guidance must reference TCPA and DNC Registry constraints with statutory violation fees.

---

## 4. Layout & Design System

### Colors
```css
--lp-green-dark:   #1B3A2D;   /* Primary actions, nav, headers */
--lp-green-mid:    #2D5A3D;   /* Hover states */
--lp-green-light:  #E8F5EE;   /* Savings callouts, highlights, row accents */
--lp-green-accent: #3D8B5E;   /* Links, toggles active */
--lp-white:        #FFFFFF;
--lp-gray-bg:      #F8F9FA;   /* Page background */
--lp-gray-border:  #E5E7EB;
--lp-gray-label:   #6B7280;   /* Field labels, secondary text */
--lp-text:         #111827;   /* Primary text */
--lp-text-muted:   #9CA3AF;
--lp-warning:      #F59E0B;   /* Compliance flags only */
```

**Color rules:**
- Hero/output values: `--lp-green-dark` ONLY — never red, orange, or gray
- `#EF4444` (red) = invalid input border ONLY. Never on computed output values.
- No purple, indigo, or blue anywhere in calculator UI.
- Positive values: `#14532D`. Neutral values: `#111827`.

### Typography
- Labels: `0.65rem`, uppercase, wide letter-spacing, `--lp-gray-label`
- Hero numbers: `2.5–3rem`, bold, `--lp-green-dark`
- Body / inputs: `0.875rem`, `--lp-text`

### Calculator card
- max-width ~960px, centered, white card, subtle shadow
- Two-column: inputs left (~45%), results right (~55%)
- Mobile: stack columns; sidebar collapses to hamburger

---

## 5. Required Components

### Definition card (every calculator, no exceptions)
Appears at top of input panel. Explains what the calculator does.
```css
.lp-definition {
  background: transparent;
  border: none;
  border-left: 3px solid var(--lp-green, #14532D);
  color: #64748b;
  font-size: 11px;
  line-height: 1.6;
  padding-left: 10px;
  margin-bottom: 16px;
}
```
No gray box. No full border. Left accent only.

### Tooltip icon
Lowercase `i` only. No circles, question marks, or other shapes.
`title` attribute for simple hover text; component for richer content.

### Hero number panel
- Primary output number: big, bold, `--lp-green-dark`
- Sub-metrics in 2-col grid: Total Payback, Total Cost, Cost per Dollar, APR
- APR always with `*` + footnote below Copy/Save buttons

### "What You Tell the Borrower" callout
Up/down arrow nav column separated by 0.5px hairline border.

```
┌─────────────────────────────────────┬──────┐
│ WHAT YOU TELL THE BORROWER          │  ▲   │
│                                     │      │
│ [quote text]                        │  ▼   │
│                                     │      │
│ [track name + counter — hover only] │      │
└─────────────────────────────────────┴──────┘
```

- Chevrons: `ti-chevron-up` / `ti-chevron-down`, gray default, green on hover
- Track name + counter (`Payment summary · 1 / 4`): hidden by default, visible on hover
- Wrap-around; keyboard `↑`/`↓` supported when callout focused
- Variants:

| # | Name | Condition |
|---|---|---|
| 1 | Payment summary | Always |
| 2 | APR cost | Always |
| 3 | Per-dollar pitch | Always |
| 4 | Pre-pay discount | Only when pre-pay checkbox is checked |

If user is on variant 4 and unchecks pre-pay: snap back to variant 1 silently.

### Amortization table
- Hint text: `Click any row to quantify the pre-pay discount`
- Clickable rows: inject a detail row directly below the selected row
  - `colspan` spans all columns
  - Same green bg as selected row (`#e8f5ec`)
  - Same left accent (`box-shadow: inset 2px 0 0 #0a4d2c`)
  - Text: italic, 12px, green — `↳ Borrower saves $X,XXX.XX by paying off here · buyout $X,XXX.XX`
- Pre-pay disabled: row still highlights; no detail row; never show "saves $0"
- Only one detail row at a time

### Modals
- Vertically centered in viewport, minimal dead space
- `align-items: center` on main flex container

### Action buttons (exact labels — deviation is a bug)
- `Copy` — solid dark green fill (#14532D), white text
- `Save PDF` — dark green outline (#14532D), transparent background
- `Save PDF` is **always present** — never skip it
- `Copy` above `Save PDF`, always

### Copy output format
```
[Calculator Name] — LendPaper
─────────────────────────────
{Label padded 20 chars}   : {value}
─────────────────────────────
Powered by LendPaper | hello@lendpaper.com | lendpaper.com — Custom branding available
```

### Scenario comparison (`+ Compare` button)
- Top-right of calculator card
- Side-by-side cards must show a delta line beneath monthly payment when 2+ scenarios active
- Format: `Scenario B costs $X,XXX more/less/mo` — updates reactively

---

## 6. Field Naming Standards

| Field | Canonical Label | Notes |
|---|---|---|
| Financing amount | "Financing amount" | Never "Loan amount" |
| Factor rate | "Factor Rate" | "Cents on the dollar" in tooltip only, never in label |
| Origination fee | `%` \| `$` toggle left of input | Reconverts on toggle; store consistently, convert at display |
| Pre-pay | "Model pre-pay discount" | Exact label |

**Cost per dollar display:** If fractional part is zero (25.0¢) → `25¢`. If meaningful (25.3¢) → up to 2 decimals, strip trailing zeros.

---

## 7. Core JavaScript Framework (Authoritative — Do Not Reinvent)

```javascript
const WATERMARK_FOOTER = "Powered by LendPaper | hello@lendpaper.com | lendpaper.com — Custom branding available";

function cleanNumericInput(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
}

function shouldShortCircuit(...inputs) {
  return inputs.some(input => input === null || input === undefined);
}

function formatCurrency(num) {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined) return '—%';
  return num.toFixed(decimals) + '%';
}

function renderScenarioDelta(elementId, scenarioAValue, scenarioBValue, unitLabel = '/mo') {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (shouldShortCircuit(scenarioAValue, scenarioBValue)) { el.textContent = ''; return; }
  const diff = scenarioBValue - scenarioAValue;
  el.style.cssText = 'font-size:12px;color:#6B7280;margin-top:4px;';
  el.textContent = `Scenario B costs ${formatCurrency(Math.abs(diff))} ${diff >= 0 ? 'more' : 'less'}${unitLabel}`;
}

function handleLendPaperCopy(calculatorName, dataPairs) {
  const borderLine = "─────────────────────────────";
  let payload = `[${calculatorName}] — LendPaper\n${borderLine}\n`;
  Object.entries(dataPairs).forEach(([label, value]) => {
    payload += `${label.padEnd(20)}: ${value}\n`;
  });
  payload += `${borderLine}\n${WATERMARK_FOOTER}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(payload).then(() => showLendPaperToast?.());
  }
}

function showLendPaperToast() {
  let toast = document.getElementById('lp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lp-toast';
    toast.textContent = 'Copied!';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#14532D;color:#fff;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;opacity:0;transition:opacity 150ms;pointer-events:none;z-index:9999;';
    document.body.appendChild(toast);
  }
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}
```

---

## 8. Payment Breakdown — Formula Reference

| Output | Formula |
|---|---|
| Total Payback | `principal × factor_rate` |
| Total Cost | `total_payback − principal` |
| Weekly Payment | `total_payback / term_weeks` |
| Monthly Payment | `≈ weekly × 52/12` (show as approximate) |
| Cost per Dollar | `factor_rate − 1` (e.g. 0.25 = 25¢) |
| APR | Standard amortization APR over effective term |
| Pre-pay savings | `remaining_payback − payoff_balance_with_discount` |

Inputs: Financing Amount, Factor Rate, Term (months), Origination Fee (% or $), Payment Frequency, Start Date.
Amortization: standard declining balance. Pre-pay discount default: 25% off remaining balance (toggleable).

---

## 9. Routing Rules

- Each tool has a `presentation` flag in the registry: `"modal"` (quick tools) or `"page"` (long-output tools like amortization).
- Direct URL load always renders full page regardless of flag.
- Calculator is **one component** — modal and page are frames around identical internals at the same width. Never hand-style the full-page version separately.
- Prefill via URL params is fine for generic numbers (NOI, rate, term).
- **Hard rule: Never put PII in URLs** — no names, EINs, addresses. URLs leak into history, logs, referrer headers.

---

## 10. Glossary UI Standards

- Terms like `Factor Rate`, `Amortization`, `DSCR`, `APR`, `UCC-1` must be dynamically cross-linked at runtime using dot-underlined `.glossary-link` hyperlinks.
- Clicking a cross-link triggers smooth-scroll + temporary pulsing gold highlight transition (`.g-item-highlight`, `#D4A017`).
- Category filter bar: scrollable pills with count badges per category (Underwriting, Credit, Legal & Compliance, CRE & ABL, Equipment & Factoring, Sales & Brokerage, Core Finance).
- Detailed calculations/examples: collapsible accordions with gold left borders (`.g-example-entry`).

---

## 11. Pre-Ship QA Checklist

**Run every item before deploying a calculator. Any failure is a P0 blocker.**

### Math & output integrity
- [ ] All numeric inputs pass through `cleanNumericInput()` — returns null on empty or non-finite
- [ ] `shouldShortCircuit()` guards every calculation — outputs show `—` when inputs missing, never NaN or 0
- [ ] Formula outputs verified by hand against at least one known-good example
- [ ] APR shown with `*` and footnote `* APR disclosure required in CA and NY`
- [ ] No computed output renders in red. Red = invalid input border ONLY.
- [ ] No purple, indigo, or blue in the UI

### Compliance terminology
- [ ] MCA: "financing amount" not "loan amount"
- [ ] MCA: "cost" / "total cost" not "interest"
- [ ] Factor Rate used as canonical label; "cents on the dollar" in tooltip only
- [ ] APR footnote present and correct

### Layout
- [ ] Modal shrinks to fit content — no gray void below short forms
- [ ] Two-column: inputs left, results right
- [ ] Definition card present using `.lp-definition` style (transparent bg, left accent only)
- [ ] No file ends with stray characters — verify HTML closes at `</html>` exactly

### Copy & labels
- [ ] Intro sentence starts with: See, Find, Compare, or Calculate — under 18 words
- [ ] All result labels above hero numbers are sentence case
- [ ] ALL CAPS only in: 11px field labels, 12px column headers, 10px system badges, 10px legal footer
- [ ] Button labels ≤ 2 words

### Export
- [ ] Copy button labeled `Copy`, Save PDF labeled `Save PDF` — both present, Copy above Save PDF
- [ ] Copy toast fires for 2 seconds
- [ ] Save PDF is dark green outline, transparent fill
- [ ] PDF output: LendPaper logo top, legal disclaimer, watermark — see PDF.md

### Accessibility
- [ ] Tab sequence targets row elements first; no vertical trapping
- [ ] Interactive inputs show `2px solid #14532D` focus ring with 2px offset

### Footer
- [ ] `Custom tooling & white-labeling available. hello@lendpaper.com`
- [ ] `FIGURES ARE ESTIMATES FOR INFORMATIONAL PURPOSES ONLY. ACTUAL TERMS DETERMINED BY LENDER UPON FINAL REVIEW.`

---

## 12. SEO Requirements

- Every route: `<link rel="canonical" href="https://lendpaper.com/...">` in `<head>`
- Every SPA dashboard: visually-hidden `<h1>` for semantic search intent
- `robots.txt` must reference `/sitemap.xml` listing all indexable URLs

---

## 13. Design References (Screenshots)

**Open and visually inspect the image — do not rely on a textual description of it. The image is ground truth and wins over all prose descriptions.**

### Primary reference — start here for every calculator build or edit:

`~/Desktop/Payment breakdown calculator screenshots/Payment Breakdown Screenshot (long image).png`

This is the canonical style guide. Check your work against it for layout, spacing, color, typography, button placement, table styling, callout cards, and footer copy.

### Supplemental — use only when the specific state is relevant:

| Use when... | Screenshot |
|---|---|
| Verifying live recalculation / dynamic output behavior | `Payment breakdown calc 1.png` + `Payment breakdown calc 2 (it updates live as numbers are plugged in).png` |
| Building or styling a dropdown/select | `Payment Breakdown dropdown.png` |
| Building or styling a tooltip | `Payment breakdown hover.png` |
| Verifying print layout or PDF output | `Payment Breakdown Save as PDF page.png` |

All files: `~/Desktop/Payment breakdown calculator screenshots/`
