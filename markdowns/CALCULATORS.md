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

### Intro / definition banner (every calculator, no exceptions)
Appears at the top of the input panel. Explains what the calculator does in one or
two sentences. **Standard treatment is left-accent style** — no filled background
(LEN-147, supersedes mint-green filled treatment from LEN-142):
```css
.lp-definition, .lp-howto {
  border-left: 3px solid var(--lp-green);   /* --lp-green: #1A3C2E */
  padding-left: 12px;
  font-size: 12px;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 20px;
  position: relative;  /* required for injected × button */
}
strong { color: #1A3C2E; font-weight: 700; }
```
- Brand green is `#1A3C2E` (never `#14532D`).
- **Always dismissible** — see "Intro / how-to banner — must be dismissible" below.

### Document details + borrower state placement standard (LEN-147)
The compliance host (`[data-lp-compliance-host]`) and document-details panel
(`#pdfDocDetails`) **must live at the bottom of the left input column**, inside the
card, wrapped in a `<div class="lp-deal-context no-print">`. They must never float
above the card in `.lp-main` (which uses flex-row layout and would render siblings
as a centered row).

Placement in the HTML (inside `.lp-inputs` or the left column, after all user inputs):
```html
<div class="lp-deal-context no-print">
  <div data-lp-compliance-host></div>
  <details id="pdfDocDetails" class="lp-doc-details">
    <summary>+ Document details</summary>
    <!-- five standard fields (pdfPreparedBy, pdfPreparedByCompany,
         pdfPreparedFor, pdfDealName, pdfLender) -->
  </details>
</div>
```

Fields should be persisted to localStorage via `PDF_HELPER.persistFields(scopeKey, ids[])`.
Call it on DOMContentLoaded with `['borrowerState','pdfPreparedBy','pdfPreparedByCompany',
'pdfPreparedFor','pdfDealName','pdfLender']` (include whatever IDs exist in that calc).

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
- Clickable rows: inject a detail row directly below the selected row (`colspan` spans
  all columns; only one detail row open at a time)
- **Pre-pay enabled → payoff panel** (the LEN-110 redesign, see BRANDING.md §12):
  - `Early payoff` eyebrow + a green valid-through **date pill**
  - **Three parallel-grammar tiles**, all white-backed: `Early payoff quote`
    (action — green left-accent) / `Run-to-term cost` (muted) / `Total savings`
    (green border + green numerals). Identical internal structure: `eyebrow → big
    number → one-line sub → divider → same stat rows`.
  - A labeled **"To date"** band beneath the tiles (Paid so far / Payments made /
    Contract progress / Payment amount) — backward-looking facts only.
  - `Copy payoff quote` button → paste-ready plain-text quote (no-print).
  - Container may carry a light-green "savings-zone" tint; the tiles stay white.
- **Pre-pay disabled (deal offers no discount) → degraded grammar:** same tile
  system, but render **only** a single muted `Run-to-term cost` tile + the "To date"
  band, on a **neutral** (gray) container with a gray date pill. Never show an
  "Early payoff" tile or a "saves $0" line.
- Hierarchy comes from borders + type, never from colored tile fills (BRANDING.md §12.6).

### Modals
- Vertically centered in viewport, minimal dead space
- `align-items: center` on main flex container

### Action buttons (exact labels — deviation is a bug)
**Updated standard (LEN-123, supersedes the old "Copy on top" rule; consistency pass LEN-11).**
Identical on **every** calculator. CTA stack, top to bottom, inside
`.action-buttons.flex.flex-col.gap-3`:
- Primary: `Save Estimate as PDF` — class `lp-cta-primary`, solid brand-dark fill (`#1A3C2E`),
  white text, full width, leading **printer SVG** icon
- Secondary: `Copy Scenario` — class `lp-cta-secondary`, brand-dark outline, transparent fill,
  full width, leading **copy SVG** icon
- Footer row (subtle text links): `+ Compare scenarios` (left) · `🕐 Estimate Log` (right)

`Save Estimate as PDF` is **always present** — never skip it. Both the PDF save and
`Copy Scenario` fire `saveEstimate()` (see §15 Estimate Log).

**Exact label copy** — do not paraphrase: `Save Estimate as PDF`, `Copy Scenario`.
- **Only exception:** single-result tools with no scenarios (e.g. Fundability) use
  `Copy results` instead of `Copy Scenario`. Everything else stays verbatim.
- Never use the compact `lp-print-btn` / `lp-copy-btn` icon-button variant or the bare
  labels `Save as PDF` / `Copy` / `Copy Results` — those are pre-LEN-11 drift.
- Copy-button **icons are SVG only** — never an emoji (no 📋 / 📎). The banned-paperclip
  rule extends to all clipboard glyphs on buttons.

### Document details panel (PDF branding — LEN-11)
Optional broker/deal metadata that personalizes the exported PDF. **Identical on every
calculator** (single shared pattern, no per-calc drift).

- Collapsible panel placed above the cards container, `no-print`:
  `<details id="pdfDocDetails" class="lp-doc-details no-print">` with summary
  `Document details — optional, appears on the PDF`.
- **Five fields, exact ids + labels** (all optional, blank degrades gracefully):

  | Label | id | Placeholder |
  |---|---|---|
  | Prepared by | `pdfPreparedBy` | `Your name` |
  | Company | `pdfPreparedByCompany` | `Your company` |
  | Prepared for | `pdfPreparedFor` | `Merchant / borrower name` |
  | Deal name | `pdfDealName` | `e.g. Q3 Working Capital` |
  | Lender / program | `pdfLender` | `e.g. Northline Capital` |

- Read with a `*Context()` helper: `preparedBy = [pdfPreparedBy, pdfPreparedByCompany]`
  joined ` · `; `preparedFor`, `dealName`, `lender` passed through trimmed.
- **Rendering rule (critical):** `PDF_HELPER.generatePDF()` calls `initPrintLayout()`
  internally, which **overwrites `.print-header-content`** — so anything written to the
  tier header before export is wiped. Render the prepared-by/for block into the **captured
  body** (`.lp-doc-context` prepended into `.lp-main`, or the hidden print template),
  **never** the page header. Tear the injected node down in `finally`.
- `pdfPreparedFor` flows to `saveEstimate({ prepared_for })` (see §15). Hide empty fields
  on the PDF; never print a blank "Prepared for —" line.
- DSCR keeps its stricter gate (requires Prepared-for + Deal name before Save enables);
  all other calcs treat the five fields as optional.

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

### Intro / how-to banner — must be dismissible (LEN-139, updated LEN-147)
The intro banner at the top of a calculator (`.lp-howto`, `.lp-definition`, `.lp-intro`) is
**always dismissible**. A banner with no close affordance reads as a permanent nag.

**Standard mechanism (LEN-147):** Add `data-lp-dismiss="<calc>_<slug>"` to the banner element
and call `PDF_HELPER.initDismissibles()` on DOMContentLoaded. The helper auto-injects a `×`
button top-right, hides the element on click, and persists the state to
`localStorage['lp_dismiss_<calc>_<slug>']`. The element stays hidden on subsequent loads.

Example:
```html
<div class="lp-definition" data-lp-dismiss="dscr_intro">
  <strong>What this calculator does.</strong> One or two sentences.
</div>
```
```javascript
document.addEventListener('DOMContentLoaded', function() {
  PDF_HELPER.initDismissibles();
});
```

- A small restore `i` button in the card header (`class="lp-intro-toggle-btn"`) calls
  `showIntro()` — shown only while the banner is dismissed.
- Tab-switching must **not** re-show a dismissed banner. Route visibility through a
  single `updateIntroVisibility()` that ANDs the active-tab check with the dismiss flag;
  never set `.lp-howto` `display` directly in a tab handler.
- Per-banner localStorage keys (`lp_dismiss_<calc>_<slug>`) replace the old site-wide
  `lendpaper_intro_dismissed` key. The AmoScheduleCalculator uses the old key and is
  exempt from migration.

### Constrained shared inputs — no orphan tinted band (LEN-139)
When an input is constrained narrower than its container (e.g. a shared "amount"
field capped to the left-column width so it doesn't bleed into the results column),
its strip must **not** keep a full-width tinted (`#f8fafc`) fill. The empty tinted
area beside a short field reads as a layout bug. Use the card color (`#fff`) for the
strip and let the field define its footprint; separate with a border only, not a fill.

**Match the panel grid — never hardcode a px width (LEN-156).** A full-width strip
that sits *above* a two-column panel must mirror the panel's grid columns so its
field tracks the left column at **every** viewport. A fixed `max-width` (e.g. the old
`380px`) only aligns at the one width it was tuned for and overhangs to the right at
every narrower two-column width — the recurring "row expands too far right" bug.
Pattern:
```css
.shared-strip { display: grid; grid-template-columns: minmax(0,0.82fr) minmax(0,1fr); }
.shared-strip > * { grid-column: 1; margin-left: 24px; margin-right: 24px; } /* gutter on the cell */
@media (max-width: 760px) { .shared-strip { grid-template-columns: 1fr; } }   /* collapse with the panel */
```
Put the gutter on the cell as `margin` (not container `padding`, which narrows the
grid, and not input `padding`, which sits inside the bordered field) so the columns
divide the full strip width exactly like `.lp-inputs`. Verify alignment headlessly
across 1280→380px: the strip field's left/right edges must match the left-column
field's to the pixel.

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

## 6a. Canonical Tool Names (LEN-143 — deviation is a bug)

One name per tool, identical across **tile (`tools.js`) · page `<title>` · on-screen header · PDF doc-title**. Rule of thumb: plain-English job-to-be-done name; keep an acronym only where brokers use it daily (DSCR, SBA, NAICS); never name a tool after an optional feature.

| Tool id | Canonical name | PDF doc-title | Slug (frozen) | Notes |
|---|---|---|---|---|
| `amo` | **Amortization** | `AMORTIZATION` | `/tools/payment-breakdown` | Was "Payment Breakdown". Pre-pay/payoff is a feature → subtitle, never the name. Slug frozen for SEO. `logUsage('amortization')` unchanged. |
| `deal-read` | **Deal Analysis** | (memo) | `/tools/deal-read` | Was "Deal Read". Not "File Analysis" — takes typed inputs, no file upload. *(Lands via the launch branch.)* |
| `affordability` | **Payment Fit** | `PAYMENT FIT` | `/tools/affordability` | Was "Affordability Check" (LEN-150). Names the primary carry gate; subtitle "Payment & Return Read" carries the ROI half. Slug + `logUsage('affordability')` + `calculator_type:'affordability'` frozen for continuity. Optional upside module is **"Net Upside"** (was "ROI Assumptions") — it outputs `$net/mo`, not a return %. |
| `fundability` | **Net & Position** | `NET & POSITION` | `/tools/fundability` | Was "Fundability". Names its two outputs (net requirement + stacking position); separates it from DSCR. `'fundability'` analytics keys + slug kept for continuity. |
| `dscr` | **DSCR** | `DSCR ANALYSIS` | `/tools/dscr` | og:title keeps "DSCR Calculator" for search. |
| `sba-rates` | **SBA Fees** | `SBA 7(a) RATES & FEES` | `/tools/sba-fees` | Was "SBA Scenario Builder"/"SBA rates & fees". Formal PDF/H1 title stays "SBA 7(a) Rates & Fees". |

**Frozen:** slugs and `logUsage`/`calculator_type` keys never change on a rename (SEO + analytics continuity). Display strings only.

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

## 8. Amortization — Formula Reference

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

---

## State Compliance Layer — see LEGAL.md

Calculators participate in the compliance engine (LEN-88). Regulatory content
lives in `markdowns/LEGAL.md` only — reference, don't copy:

- State disclosure rules surfaced in calculators → LEGAL.md §10 + §13 (matrix)
- Engine + data: `public/assets/js/compliance.js` + `compliance-rules.js`,
  loaded after `pdf-helper.js` in every calculator
- Every calculator includes `<div data-lp-compliance-host>` (after the
  `print-header-content` block) — the engine renders a borrower-state selector
  there and stays silent unless the selected state has a rule
- State selection persists across calculators (`lp_borrower_state`) and fires
  `lp:compliance:statechange` — new calculators get this for free by including
  the two scripts + host div
- Never hardcode state-specific notes in a calculator; add them to
  `compliance-rules.js` (and LEGAL.md §13) instead

---

## 14. Display Terminology Standards (LEN-123)

Apply these display terms consistently across **all** calculators going forward.
Canonicalized from the Payment Breakdown handoff (2026-06-08).

| Use this | Not this |
|---|---|
| Buyout amount | Payoff, Payoff amount |
| Finance charge | Interest, Interest charge |
| Maturity | Maturity date, End date |
| Funded | Loan amount, Principal |
| Total payback | Total repayment, Total cost |
| Factor rate | Multiplier, Cost per dollar (in labels) |
| Borrower state | State, Location |
| Prepared by | Submitted by, From |
| Estimate | Quote (use *Estimate* everywhere — nav, CTAs, and document disclaimers) |
| Estimate Log | Quote Log, Quotes, History, Saved deals (the saved-estimates surface) |

Notes:
- **"Finance charge"** is the chosen display label (it replaces the old "Total
  interest"). It is a TILA/Reg-Z term of art; this is a deliberate copy decision,
  not a claim that an MCA is a loan. The §3 compliance rule still holds: never
  pitch an MCA's cost as "interest" or call the product a "loan."
- **Borrower State** field: optional, lighter styling, `[i]` tooltip
  ("Will check for state-specific disclosure requirements …"). It drives the
  compliance engine via `LPCompliance.setState()` + `_renderAllHosts()`; the
  engine's own host selector is hidden (the field is the single entry point).
- **Prepared by**: single free-text field, green-tinted block at the bottom of the
  input column. Feeds the PDF deal-summary; if blank, the line is omitted (no
  broken layout). Placeholder: `e.g. John Smith · ABC Funding Solutions`.

### Payoff banner (output column)
Between the secondary metrics row and the talk track. Line 1: tag icon +
`Save $X with early payoff by <date>` then a muted plain-text `···` affordance
(not a button/pill) that opens the **Payoff Points modal**. Line 2:
`Buyout amount: $X` + `[i]` tooltip. Do not repeat Maturity here (it lives in the
secondary metrics row).

---

## 15. Estimate Log (cross-tool, LEN-123)

A cross-tool log of every estimate generated on the site (Payment Breakdown, DSCR,
Fundability, NAICS, Deal Read, future calculators). Page: `/quote-log`. Nav: left
panel, below the tool links.

**Every calculator must fire `saveEstimate()`** on PDF generation **and** on
"Copy Scenario". The shared utility is `js/quote-log.js` — import it as a module
(`<script type="module" src="../js/quote-log.js"></script>`); it exposes
`window.saveEstimate` / `window.LPQuoteLog`.

```javascript
saveEstimate({
  calculator_type: 'payment_breakdown',   // own string per calculator
  params: { /* everything needed to restore calculator state */ },
  pdf_generated: true,                     // false for Copy Scenario
  prepared_for: "Joe's Landscaping"        // optional
});
```

- `params` is **schemaless per calculator** — each calculator owns its own shape;
  no migration when a new calculator is added.
- Records persist to Supabase (`estimates`, tied to `user_id`) and are mirrored to
  `localStorage` so the log works offline / logged-out / before the table exists.
- **Restore** re-fills the calculator from `params` via `sessionStorage` —
  **never the URL** (no PII in URLs, §9). Calculators call
  `LPQuoteLog.consumeRestorePayload('<type>')` on load; wired in all shipped
  calculators (Payment Breakdown, DSCR, Fundability, SBA Fees). When fields can't
  be fully restored (e.g. an estimate saved before a field existed), show a
  "review before generating a new PDF" banner. Module-script calculators (DSCR)
  must run restore on `load`, not at parse time, so `window.LPQuoteLog` exists.
- **Freemium:** Free shows the last 10 (display cap only — all rows are retained
  in the DB for Pro eligibility). Pro: full history, deal naming, shareable links,
  CSV export.
- **Soft-gated (LEN-127):** `/quote-log` never hard-redirects. Logged-out users
  see their `localStorage` quotes + a "Sign in to sync" banner; signed-in free
  users hitting the 10 cap see the "Upgrade to Pro" note. Use `getProfile()`,
  not `requireApprovedUser()`, on this page.
- Schema + RLS migration: `supabase/estimates.sql`.

---

## 16. Output Column Hierarchy (canonical — all calculators)

Reference build: Payment Breakdown (`calculators/AmoScheduleCalculator.html`).
Replicate this top-to-bottom order so every calculator reads the same way:

1. **Hero number** — the one figure the rep needs in 10s. `42px`, weight 700/900,
   brand-dark, monospace numerals. Secondary equivalent (e.g. `≈ $X/mo`) muted,
   below, never inline with the hero.
2. **Deal-math row** — three equal cells: `Funded` / `Total payback` / `Finance
   charge`. They form an identity the borrower can verify (Funded + Finance charge
   = Total payback). The `Finance charge` cell stays subdued — a faint `#F4F8F5`
   tint + muted value — so it reads as the derived cost without a full-width strip.
   (Earlier 2-up + full-width strip was retired 6/8 — looked unbalanced.)
3. **Secondary metrics row** — exactly **4 equal cells**, small monospace values,
   tiny uppercase labels (`Factor rate` / `Est. APR` / `Cost per dollar` / `Maturity`).
   Carry the `pdf-stats-grid` class so print styling applies. APR always `*`-footnoted.
   The `≈ $X/mo` hero sub-figure is right-aligned within the card.
4. **Payoff / savings banner** — see §14. Green-tinted, brand left-accent.
5. **Talk track** — "What you tell the borrower," collapsible (∧/∨), scrollable body
   (`max-height:80px`); secondary footer holds the APR `*` note. See §5.
6. **CTA stack** — Save Estimate as PDF (primary) / Copy Scenario (secondary) /
   footer text links. See §5.

### Component tokens (reuse, don't reinvent)
- **Metric label:** `10px`, weight 700, uppercase, `0.04em` tracking, `#64748B`.
- **Metric value:** `16px` weight 800 (`#111827`); secondary-row values `13px`
  weight 700, `font-variant-numeric: tabular-nums`.
- **Charge strip / tinted block:** `#F4F8F5` bg, `8px` radius.
- **Optional input** (e.g. Borrower State): lighter border `#EEF2EF`, `#FAFCFA`
  bg, `— optional` suffix in `#9CA3AF`, lowercase circle-`i` tooltip (never a
  paperclip, never a status dot).
- **Prepared-by block:** `#F4F8F5` bg, `#E3EFE8` border, `12px` radius; the
  section label is brand-dark; sub-note `10.5px` `#6B7280`.

## 17. Modal Standard (Payoff Points, Compare, future)

All calculator modals share one shell so they look identical:
- **Backdrop** `rgba(15,23,42,0.45)`, flex-centered (`align-items:center` — no dead
  space, BRANDING §12). Toggle a single `.open` class; close on backdrop click and
  on `Escape`.
- **Card** white, `16px` radius, `max-width:520px` (`760px` for side-by-side like
  Compare), `max-height:88vh` scroll. Header = title (16/800) + `×` close.
- **Instructional context** uses the **amber tile** (`#FFFBEB` bg, `#FDE68A`
  border) — the only place amber appears in calculator UI besides compliance flags.
- **Mode switches** use the **pill-tab** pattern (`.lp-tab`, active = brand-dark
  fill). Selectable options use **pills** (`.lp-pill`); multi-select accents go
  green → blue → purple in that order.
- Modals never carry computed-output color rules from §4 onto their own chrome.
