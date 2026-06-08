# BRANDING.md — LendPaper Visual Identity & Document Standards

This document is the single source of truth for all visual and layout decisions
in LendPaper's generated documents, UI, and web properties. When in conflict
with any other source, this file wins.

---

## 1. Brand Identity

### Trade Name
**LendPaper** — always written as one word, capital L, capital P.
Never: Lend Paper, lendpaper (lowercase in prose), LENDPAPER (all caps in prose).
In code: lowercase `lendpaper` for class names, routes, file names is fine.

### Wordmark
The LendPaper wordmark is `□ lendpaper.` — the document-fold glyph followed by
the wordmark in mixed weight (bold "lend", regular "paper") with a period.
- The period is part of the mark. Do not drop it in any branded context.
- Do not separate the glyph from the wordmark in any logo lockup.
- SVG source: `/assets/brand/lendpaper-mark.svg`

### Tagline (optional, used sparingly)
"Scenario Modeling Engine" — appears as a subordinate descriptor beneath the
wordmark on generated documents. Not required on all surfaces.

### LendPaper Fit
**Perfect.** Lean sales and underwriting desks are facing crushing transaction volumes. They are actively hunting for tools to eliminate manual calculation errors, speed up deal structuring, and maximize throughput per employee without adding W2 overhead.

### Canonical Product Terms
Write these exactly; do not coin synonyms.
- **Quote Log** — the cross-tool record of saved estimates (nav, sidebar, page
  titles). Two words, capital Q, capital L. Never "Quotes," "History," "Saved
  deals." See `CALCULATORS.md §15`.
- **Estimate** vs **Quote**: an *Estimate* is what a calculator produces (document
  disclaimers say "Estimate"); *Quote* is the product-surface word in nav/labels
  ("Quote Log"). Display-term standards: `CALCULATORS.md §14`.

---

## 2. Color System

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-brand-dark` | `#1A3C2E` | Primary brand green — main mark, CTA buttons, headers |
| `--color-brand-mid` | `#2D6A4F` | Artifact Mode favicon, secondary buttons, active states |
| `--color-brand-light` | `#D1FAE5` | Backgrounds, highlight rows in tables |
| `--color-accent-gold` | `#D4A017` | Document badge, early-payoff callout, accent only |
| `--color-text-primary` | `#111827` | Body text, table data |
| `--color-text-secondary` | `#6B7280` | Attribution footer, PLG copy, captions |
| `--color-text-tertiary` | `#9CA3AF` | Legal micro-copy, timestamps |
| `--color-border` | `#E5E7EB` | Hairline rules, table borders, dividers |
| `--color-bg-default` | `#FFFFFF` | Document background |
| `--color-bg-subtle` | `#F9FAFB` | Alternate table rows, input backgrounds |
| `--color-bg-callout` | `#F0FDF4` | Green callout boxes (early payoff, savings) |
| `--color-callout-border` | `#4ADE80` | Left border on green callout boxes |
| `--color-warning-bg` | `#FFFBEB` | Moderate risk / orange callout boxes |
| `--color-warning-text` | `#92400E` | Warning callout text |
| `--color-danger` | `#991B1B` | High/severe risk indicators |

### Color Rules
- **`#14532D` is DEPRECATED** (pre-2026-06 app accent). All UI/CSS uses
  `--color-brand-dark` `#1A3C2E` instead — rgba form `rgba(26,60,46,…)`.
  Legacy exceptions pending asset refresh: inline favicon data-URIs and
  `/public/assets/brand/og-image.png`. Migrate `#14532D` on sight when
  editing old code (unified across index.html + auth suite in LEN-78).
- Never use `--color-brand-dark` as a background for large areas — it's a mark
  and accent color, not a fill.
- The gold accent (`--color-accent-gold`) is reserved for savings/early-payoff
  callouts and the Artifact Mode favicon badge. Do not use for general UI.
- Status colors (green/orange/red) for DSCR risk bands are fixed:
  - Green (Low risk, <10%): `#16A34A`
  - Orange (Moderate, 10–20%): `#D97706`
  - Dark orange (High, 20–30%): `#EA580C`
  - Red (Severe, >30%): `#DC2626`

---

## 3. Typography

### Font Stack
Primary: `"Inter", system-ui, -apple-system, sans-serif`
Fallback for PDFs: `Arial, Helvetica, sans-serif`

### Type Scale (generated documents)

| Role | Size | Weight | Color Token |
|---|---|---|---|
| Document title | 18pt / 24px | 700 (Bold) | `--color-text-primary` |
| Section label | 8pt / 11px | 600, uppercase, tracked | `--color-text-secondary` |
| Data value (primary) | 28–36pt | 700 | `--color-brand-dark` |
| Data value (secondary) | 14pt | 600 | `--color-text-primary` |
| Table header | 9pt | 600 | `--color-text-primary` |
| Table body | 10pt | 400 | `--color-text-primary` |
| Callout body | 10pt | 400, with bold emphasis | `--color-text-primary` |
| PLG footer | 8pt | 400 | `--color-text-secondary` |
| Legal micro-copy | 7pt | 400 | `--color-text-tertiary` |

### Typography Rules
- ALL CAPS is used only for section labels (e.g., "FINANCING TERMS", "WEEKLY PAYMENT").
  Never for body copy or data values.
- Dollar amounts in primary data positions use the `$` prefix tight to the number
  with no space. Commas and decimal points always included.
- Percentages display as `XX.X%` — always one decimal place for consistency.

---

## 4. Generated Document Layout

### Page Structure (top to bottom)

```
┌──────────────────────────────────────────────────────────┐
│  [Broker Logo — left]         [LendPaper mark — right]  │  Header band
│  (tier-dependent)              · Scenario Modeling Engine│
├──────────────────────────────────────────────────────────┤  Hairline rule (0.5pt, --color-border)
│                                                          │
│                   DOCUMENT TITLE                         │  Title row
│                   Document subtitle                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Left panel: Inputs / Terms       Right panel: Output  │  Content area
│   (labels + fields)                (primary number +    │
│                                     supporting data)     │
│                                                          │
│   Callout box (savings, notes, etc.)                    │
│                                                          │
├──────────────────────────────────────────────────────────┤  Hairline rule
│  [PLG Footer — tier-dependent copy]                     │  Footer band
│  [Legal Micro-Copy — always present, all tiers]         │
└──────────────────────────────────────────────────────────┘
```

### Header Band Rules
- Two-column layout: broker logo left, LendPaper mark right.
- Free tier: left column is empty. LendPaper mark is full weight, centered or right.
- Pro: broker logo left (max 400px wide, 80px tall). LendPaper mark right, smaller.
- White-Label: broker logo left, full weight. LendPaper mark removed or micro-badge.
- Hairline rule: `0.5pt`, `--color-border`, full width, immediately below band.
- Document title begins below the hairline rule.

### Content Panel Rules
- Two-column layout for summary documents (Amortization summary, DSCR, SBA Fees).
- Left panel: input fields / financing terms. Right panel: primary output values.
- Primary output number (e.g., weekly payment): 28–36pt bold, `--color-brand-dark`.
- Supporting metrics below primary number: 14pt, labeled in uppercase section style.
- Callout boxes: left border 3pt `--color-callout-border`, background
  `--color-bg-callout`, 8px border-radius.

### Amortization Table Rules
- Full-width table, alternating row shading: white / `--color-bg-subtle`.
- Highlighted rows (e.g., early payoff date): background `--color-bg-callout`,
  left border 3pt `--color-brand-dark`.
- Column order: #, Date, Payment, Principal, Interest, Remaining Balance.
- All dollar values right-aligned. Row numbers and dates left-aligned.
- "If borrower pays off here →" block: full-width callout with payoff date,
  payoff balance, and borrower saves amount — displayed between table rows.

---

## 5. Footer Copy by Tier

Exact strings — do not paraphrase or modify. Stored in `/config/pdf-footer.js`
(or equivalent config layer). Pull from config, never hardcode in templates.

### Free Tier
```
⚙ Built with LendPaper Free  ·  lendpaper.com
Brokers: Remove branding, add your logo, and unlock custom calculators → lendpaper.com/upgrade
```

### Pro Tier
```
Generated via LendPaper  ·  lendpaper.com
Remove this footer and add your logo — ask about white-label plans.
```

### White-Label Tier
```
Powered by LendPaper  |  hello@lendpaper.com  |  lendpaper.com
```

### Enterprise Tier
Configurable per account. Default fallback is White-Label string above.

### Legal Micro-Copy (ALL TIERS — always present, never suppressed)
```
ESTIMATES ONLY — NOT FINANCIAL ADVICE. These figures are preliminary estimates
generated by the user (lender, broker, or ISO) using LendPaper software. LendPaper
is a software provider only — not a lender, broker, financial advisor, or
institution. LendPaper does not verify inputs, guarantee calculations, or determine
final loan terms. Actual terms are subject to lender underwriting and final approval.
Full terms: lendpaper.com/legal/estimates
```

---

## 6. Favicon System — Two States

### State A: Product Mode (Main Site / App)
Use the existing LendPaper mark as-is. No modification.

### State B: Artifact Mode (Generated Document Browser Tab)
Apply to all PDF viewer contexts and document-sharing URLs.

**Color:** Shift from `--color-brand-dark` (#1A3C2E) to `--color-brand-mid` (#2D6A4F).
Do not use grayscale — a hue shift within the green family signals "same brand,
different context" without reading as disabled.

**Shape — 32×32 and above:**
- Same document-fold glyph as the main mark.
- Add a small outbound arrow (↗) overlaid in the bottom-right quadrant.
- OR: use the filled version of the glyph (vs. outlined in Product Mode).

**Shape — 16×16:**
- Drop the arrow overlay. Too much noise at this size.
- Use the document-fold glyph alone in `--color-brand-mid`.

**Badge (optional, 32×32 and above):**
- 3–4px circular badge in `--color-accent-gold` (#D4A017), top-right corner of canvas.
- Purpose: trains repeat users to recognize "gold badge = LendPaper estimate document."

**Required deliverables:**
- `favicon-artifact-16.png`
- `favicon-artifact-32.png`
- `favicon-artifact-180.png` (Apple touch icon)
- `favicon-artifact.svg` (source)
- Store in `/public/favicons/`

---

## 7. Render Gate — Required Fields Before PDF Export

Block export and show `"Complete your inputs to generate this document."` if any
required field is null, zero, or holds its default/placeholder value.

| Document Type | Required Non-Zero Fields |
|---|---|
| Payment Breakdown / Amortization | Financing amount, term (months), cost per dollar borrowed |
| DSCR Analysis | At least one EBIDA field + at least one deal scenario amount |
| Fundability / Stacking | Revenue input, at least one position modeled |
| SBA 7(a) Fees | Loan amount, term (years), rate (%) |

---

## 8. Callout Box Variants

| Variant | Background | Left Border | Text Color | Use Case |
|---|---|---|---|---|
| Savings / Positive | `--color-bg-callout` | `--color-callout-border` | `--color-text-primary` | Early payoff savings, positive outcomes |
| Informational | `#F0F9FF` | `#38BDF8` | `--color-text-primary` | Explanatory quotes, "for every dollar..." |
| Warning / Moderate | `--color-warning-bg` | `#FCD34D` | `--color-warning-text` | Moderate risk stacking verdict |
| Danger / High | `#FEF2F2` | `#FCA5A5` | `--color-danger` | High or severe risk verdict |

---

## 9. Dark Surface Tokens (Registry / Utility Features)

Some features (e.g. state registry modals) use a dark surface distinct from the main light design system. Use these tokens exactly — do not substitute light-theme defaults.

| Token | Value | Usage |
|---|---|---|
| Dark surface bg | `#1c1c26` | Modal container background |
| Dark border | `rgba(255,255,255,0.10)` | Modal container border (0.5px) |
| Dark card bg | `rgba(255,255,255,0.04)` | Inner card / steps card |
| Dark card border | `rgba(255,255,255,0.08)` | Inner card border (0.5px) |
| Dark text primary | `#ffffff` | Titles |
| Dark text body | `rgba(255,255,255,0.50)` | Value prop paragraphs |
| Dark text secondary | `rgba(255,255,255,0.78)` | Step item text |
| Dark label | `rgba(255,255,255,0.28)` | Section labels (uppercase, 10.5px) |
| Dark icon | `rgba(255,255,255,0.30)` | Close button, subtle icons |
| Dark step bubble | `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.40)` text | Step number circles |
| Status — urgent | `rgba(220,80,80,0.15)` bg, `#e08080` text | Timeline/warning badges |
| Status — available | `rgba(30,160,100,0.15)` bg, `#4ecb8f` text | Online/available badges |

Modal container: `border-radius: 16px`, `padding: 1.75rem 1.75rem 1.5rem`, `max-width: 460px`.
Badge pills: `border-radius: 5px`, `padding: 4px 10px`, `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.5px`.

---

## 10. DSCR Risk Band Colors

These are fixed and must match exactly across the document and any UI representations.

| Band | Label | Range | Color |
|---|---|---|---|
| Low | Room to fund | < 10% | `#16A34A` (green dot) |
| Moderate | Tighten terms | 10–20% | `#D97706` (orange dot) |
| High | Likely overextended | 20–30% | `#EA580C` (dark orange dot) |
| Severe | Decline / restructure | > 30% | `#DC2626` (red dot) |

---

## 11. Design References (Screenshots)

**Open and visually inspect the image — do not rely on a textual description of it. The image is ground truth and wins over all prose descriptions.**

### Primary reference — use this first for any layout, spacing, color, or component decision:

`~/Desktop/Payment breakdown calculator screenshots/Payment Breakdown Screenshot (long image).png`

This shows the full calculator: two-column layout, input panel, hero payment, stats grid, savings callout, talk track, Copy/Save PDF buttons, amortization table with early-payoff highlighted row and expanded savings drawer, and legal footer.

### Supplemental — use only when the specific state is relevant:

| Use when... | Screenshot |
|---|---|
| Verifying live recalculation behavior | `Payment breakdown calc 1.png` + `Payment breakdown calc 2 (it updates live as numbers are plugged in).png` |
| Building or styling a dropdown/select input | `Payment Breakdown dropdown.png` |
| Building or styling a tooltip | `Payment breakdown hover.png` |
| Verifying print layout or PDF output | `Payment Breakdown Save as PDF page.png` |

All files are in: `~/Desktop/Payment breakdown calculator screenshots/`

---

## 12. Comparison & Decision UI Principles

These govern any UI where the user compares options or weighs a decision (payoff
summaries, scenario tiles, side-by-side outputs). Established with the Payment
Breakdown payoff-summary redesign (LEN-110).

1. **Parallel tile grammar.** When tiles are meant to be compared, give them
   identical internal structure — same fields, in the same order, in the same
   positions. Comparison should happen by reading *across* aligned rows, not by
   re-learning each tile. (Reference implementation: the three payoff tiles in
   `AmoScheduleCalculator.html` — Early payoff quote / Run-to-term cost / Total
   savings — each `eyebrow → big number → one-line sub → divider → the same stat rows`.)
2. **One home per number.** A headline figure appears in exactly one tile. Never
   duplicate a value as both a tag and a hero number — it creates "which number is
   real?" friction.
3. **Forward vs. backward zoning.** Separate decision/option content
   (forward-looking) from current-state/history (backward-looking) with a labeled
   band — e.g. the "To date" band beneath the payoff tiles. Keep each zone's
   contents consistent with its label: only historical/current-state facts go in a
   "To date" zone; only options/outcomes go in the decision zone.
4. **Broker vocabulary over merchant vocabulary** in B2B tools: "run to term,"
   "buy out," "factor rate," "payments eliminated" — not "save money," "interest,"
   "remaining balance." ("Balance" reads to merchants as the payoff amount;
   "remittance" is jargon.)
5. **Don't assert third-party terms.** Quote expiry, payoff timing, etc. are the
   lender's terms — surface the date (e.g. a valid-through pill), don't editorialize
   the deadline ("expires end of day"). Carry approximate financial figures with a
   `~` tilde (APR, factor) since we don't assert an exact APR on a factor-rate
   product.
6. **Hierarchy through accents, not fills.** Comparison tiles share a **white**
   background. Emphasis comes from borders and type — a green left-accent on the
   action tile, a green outline + green numerals on the "winner" tile — never from
   colored background fills. Filling every tile with its own tint flattens the
   comparison (the eye can't tell which tile is the action), reads as
   "AI-generated," and wastes ink in print. *Color the zone, not the cards:* a
   light-green container behind the tiles can signal "savings available," but the
   cards themselves stay white. (Reference: the three payoff tiles are all white;
   only the savings tile carries a green border + green numbers.)
7. **Degrade the grammar, don't fabricate the option.** When an option doesn't
   exist for a deal (e.g. a deal with **no pre-pay discount**), reuse the same tile
   grammar but render only the tiles that carry a real number — a single
   `Run-to-term cost` tile plus the To-date band. Never show an empty "Early
   payoff" tile or a "saves $0" line. Drop the green "savings-zone" container to a
   neutral surface and the date pill to gray, so color still honestly signals
   *whether a savings opportunity exists at all.* (Reference: the no-pre-pay branch
   of `renderDetailRow` in `AmoScheduleCalculator.html`.)

---

## 13. Calculator UI Components (canonical — LEN-123)

Shared component language so every calculator looks like one product. Full
behavioral spec + the output-column order live in `CALCULATORS.md §16–17`; this is
the visual token reference.

### Surfaces & accents
| Component | Background | Border / accent | Radius |
|---|---|---|---|
| Tinted strip / charge / prepared-by | `#F4F8F5` | `#E3EFE8` (when bordered) | `8–12px` |
| Savings / payoff banner | `#F0FDF4` | `4px` brand-dark left accent + `#BBF7D0` | `12px` |
| Modal card | `#FFFFFF` | shadow `0 24px 60px rgba(0,0,0,.25)` | `16px` |
| Instructional tile (modals) | `#FFFBEB` | `#FDE68A` | `10px` |

- **Amber** (`#FFFBEB`/`#FDE68A`/`#92400E`) is reserved for *instructional* and
  *compliance* moments only — never for computed values or decoration.
- **Selection accent order** for multi-select pills: green → blue → purple. Single
  selection is always green. (Blue/purple appear *only* here, never elsewhere in
  calculator UI — they remain banned for outputs and chrome per §2 color rules.)

### Buttons (calculator CTA hierarchy — supersedes "Copy on top")
- **Primary** (`Save Estimate as PDF`): solid `--color-brand-dark` fill, white text,
  full width, `10px` radius.
- **Secondary** (`Copy Scenario`): brand-dark outline, transparent fill, full width.
- **Tertiary**: plain text links (`#6B7280`, hover `--color-brand-mid`) in a footer
  row — used for `+ Compare scenarios` and `🕐 Quote Log`.

### Type tokens
- Metric label: `10px`/700/uppercase/`0.04em`/`#64748B`.
- Hero number: `42px`/700–900/brand-dark/mono numerals.
- Tabular numbers everywhere money or rates align in a grid
  (`font-variant-numeric: tabular-nums`).

### Modals
Vertically centered (`align-items:center`, no dead space), single `.open` toggle,
close on backdrop-click + `Escape`. Pill-tabs for mode switches. (Reference shells:
`#payoffModal`, `#compareModal` in `AmoScheduleCalculator.html`.)

---

## Compliance & Legal Copy — see LEGAL.md

Regulatory content is **never** duplicated here. For anything compliance-related
in copy or visuals, reference `markdowns/LEGAL.md`:

- Prohibited words/phrases in any copy → LEGAL.md §5 + §9.1 (No Absolutes)
- Misrepresentation rules (product/rate/term/timing) → LEGAL.md §9.2
- Outreach copy (SMS/email/calls, opt-out language) → LEGAL.md §8
- The canonical "not legal advice" disclaimer → LEGAL.md §14 (auto-injected by
  `compliance.js` — never hardcode it in a layout)
