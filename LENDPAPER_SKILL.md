---
name: lendpaper-calculator
description: Build LendPaper calculator tools and UI components. Use when building any LendPaper deal math, underwriting, amortization, MCA, SBA, or financing calculator — or any LendPaper page, tool, or UI component. References LendPaper brand, user personas, design system, and UX patterns.
---

# LendPaper Calculator Skill

## Project Overview

**LendPaper** is a free-to-use web platform for SMB alternative finance professionals — reps at lenders like Bitty, PEAC, OnDeck, ECG, ISOs like Lendio, brokers, and some bank reps. Tools help them run fast deal math, model financing scenarios, and share polished outputs with borrowers, managers, and CRMs.

**Business model:** Free for end users. Revenue via:
- White-label licensing (financial services companies)
- Custom tool builds
- Training services
- Compliance tooling (strong sell for regulated environments)

**Footer CTA everywhere:** `Custom tooling & white-labeling available. info@lendpaper.com`

---

## User Persona

**Primary:** SMB alt-finance sales reps and brokers
- Predominantly male, often ADHD tendencies
- High-velocity, high-stakes deal flow — need in-and-out fast
- Working in Slack, CRMs (Salesforce, HubSpot, etc.), email
- Mix of experienced closers and newer sellers who need guidance
- Desktop-first (at desk), but frequently mobile (floor, calls)
- Often sharing outputs: PDF to borrower, Slack to manager, paste to CRM

**Design mindset:** Treat every interaction like they're on a live call with a borrower on hold.

---

## Product Terminology & Compliance Rules

> ⚠️ **Critical:** Not all products are loans. MCAs (Merchant Cash Advances) are NOT loans — they are purchases of future receivables. Calling an MCA a "loan" or the cost "interest" is legally incorrect and potentially a compliance violation.

| Term to AVOID | Use Instead |
|---|---|
| "Loan" (for MCA) | "financing," "advance," "product" |
| "Interest" (for MCA) | "cost," "factor cost," "total cost of capital" |
| "Interest rate" (for MCA) | "cost per dollar borrowed," "factor rate" |
| "APR" for MCAs | Only show APR with disclaimer; some states require it |

**APR disclosure:** Required in CA and NY. Show contextually — not as a blocker, but as a footnote or tooltip near the APR display.

**Safe universal language:** "financing amount," "total payback," "cost per dollar," "payment," "term," "payoff balance," "borrower saves."

**Disclaimer (always in footer of calculators):**
> `FIGURES ARE ESTIMATES FOR INFORMATIONAL PURPOSES ONLY. ACTUAL TERMS DETERMINED BY LENDER UPON FINAL REVIEW.`

---

## Site Navigation Structure

```
Left sidebar (persistent, narrow):
  TOOLS
    Deal math       [count badge]
    Risk & UW       [count badge]
    Data & leads    [count badge]
  REFERENCE
    Glossary
    Contact

Top bar: LendPaper logo (left) | Search tools, terms... (right)
```

---

## Design System

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
--lp-warning:      #F59E0B;   /* Use sparingly for compliance flags */
```

### Typography
- **Labels:** `0.65rem`, uppercase, letter-spacing wide, `--lp-gray-label`
- **Hero numbers:** `2.5–3rem`, bold, `--lp-green-dark`
- **Body / inputs:** `0.875rem`, `--lp-text`
- **Subtitles / tool name:** small caps or uppercase tracking, muted

### Layout
- Calculator card: max-width ~960px, centered, white card, subtle shadow
- Two-column inside card: inputs left (~45%), results right (~55%)
- Sidebar: ~100px wide, fixed, minimal
- Mobile: stack columns, sidebar collapses to top nav or hamburger

### Component Patterns

**Input fields:**
- Light border, subtle focus ring in green
- Labels above, small and uppercase
- Info icon (ⓘ) inline on fields with definitions — tooltip on hover/tap
- Dollar prefix icon where applicable

**Results panel:**
- Hero number (weekly/monthly payment) at top — BIG
- Sub-metrics in 2-col grid: Total Payback, Total Interest, Cost per Dollar, APR
- APR always with asterisk + footnote re: CA/NY disclosure

**Savings callout (green card):**
- Shows pre-pay savings prominently: "Saves $X if paid off by [Date]"
- Payoff balance + pre-pay date shown
- Drives toward the close — key sales tool

**"What You Tell the Borrower" section:**
- Collapsed by default (^ chevron)
- Pre-written borrower-facing language using safe terminology
- Includes contextual compliance note (APR disclosure reminder)
- Reps copy this verbatim into calls/emails

**Action buttons:**
- `COPY RESULTS` — primary, dark green fill — copies formatted text for Slack/CRM paste
- `SAVE AS PDF` — secondary, outline — generates branded PDF

**Amortization table:**
- Pre-pay discount toggle (default: 25%, toggleable)
- Tip text: "Click any payment row to see payoff details right there — no scrolling around."
- Clickable rows: expand inline to show payoff date, payoff balance, borrower savings
- Highlighted row = selected payoff point
- No modal. No scroll-jump. Inline expand only.

**+ COMPARE button:**
- Top right of calculator card
- Opens side-by-side scenario comparison (deal A vs deal B)

---

## UX Principles

1. **Speed over completeness.** The rep is on a live call. Every extra click or scroll costs deals.
2. **Progressive disclosure.** Show the number first. Hide the explanation. Expandable sections for "why" and "what to say."
3. **Copy-first outputs.** Every result should be instantly copyable in a format that pastes cleanly into Slack, email, or a CRM note.
4. **Pre-written language.** Don't make reps write their own borrower pitch. Give them the sentence. They just need to read it.
5. **Compliance as a whisper, not a wall.** Show APR disclosures and legal notes — but as footnotes or collapsed sections, never as blocking UI.
6. **Mobile aware.** Many reps are on the floor or on a call. Inputs must be thumb-friendly; hero numbers must be readable at a glance.
7. **No jargon overload.** New sellers use this too. Tooltips (ⓘ) on technical fields. Glossary in sidebar.

---

## Calculator Types (Tool Categories)

### Deal Math
- **Payment Breakdown** ← primary example (amortization, weekly/monthly payment, pre-pay modeling)
- Scenario Comparison (A vs B side-by-side)
- MCA Factor Rate → Effective APR converter
- Renewal / Stacking calculator

### Risk & UW
- Position stacking analysis
- Debt service coverage ratio
- Bank statement average daily balance
- Revenue to advance ratio

### Data & Leads
- (TBD — likely lead scoring, pipeline math, commission calculators)

---

## Payment Breakdown Calculator — Full Spec

### Inputs
| Field | Type | Notes |
|---|---|---|
| Financing Amount | Currency input | Dollar prefix |
| Cost per Dollar Borrowed | Decimal (e.g. 1.25) | ⓘ tooltip: "Also called factor rate. 1.25 means you pay back $1.25 for every $1 borrowed." |
| Term | Number + "mos" unit | Integer months |
| Origination Fee | Percent | Optional, defaults 0 |
| Payment Frequency | Select | Weekly, Daily, Monthly, Bi-weekly |
| Start Date | Date picker | Defaults to today |

### Computed Outputs
| Output | Formula |
|---|---|
| Total Payback | `principal × factor_rate` |
| Total Interest / Cost | `total_payback − principal` |
| Weekly Payment | `total_payback / (term_weeks)` |
| Monthly Payment | `≈ weekly × 52/12` (show as approx) |
| Cost per Dollar | `factor_rate − 1` (e.g. 0.25 = 25¢) |
| APR | Calculated from effective rate over term — standard amortization APR |
| Pre-pay savings | At each row: `remaining_payback_without_prepay − payoff_balance_with_discount` |

### Amortization Logic
- Standard declining balance amortization
- Pre-pay discount: typically 25% off remaining balance (toggleable)
- Each row: payment #, date, payment amount, principal, interest/cost, remaining balance
- Clickable row expansion: shows payoff date, payoff balance, borrower saves $X

### Copy Results Format (for Slack/CRM)
```
--- LendPaper Payment Breakdown ---
Financing: $100,000
Factor Rate: 1.25 | Term: 12 months
Weekly Payment: $2,403.85 (~$10,417/mo)
Total Payback: $125,000 | Total Cost: $25,000
APR: 52.2%* | Cost per Dollar: 25¢
Pre-pay (7 pmts): Payoff $103,388.77 — saves $4,784.30
*APR disclosure required in CA and NY
Generated by LendPaper
```

### PDF Output
- LendPaper logo top center
- Tool name + "Scenario Modeling Engine" subtitle
- Inputs summary block (left) + Results block (right)
- Full amortization table
- Footer: disclaimer + lendpaper.com
- Clean, print-optimized, no dark backgrounds

---

## File & Asset Conventions

- All assets stored in `~/Desktop/Lendpaper/` folder
- Reference and update `Gemini.md` in that folder for persistent project context
- Primary dev workflow: design/prototype here → push via Claude Code or Google AGY
- Component naming: `lp-[component]` (e.g. `lp-amortization-table`, `lp-results-panel`)

---

## White-Label / Custom Tooling Pitch

Always include subtle footer: `Custom tooling & white-labeling available. info@lendpaper.com`

Pitch points when relevant:
- Full white-label (logo, colors, domain)
- Custom calculator builds for specific products (SBA 7a, EIDL, equipment, LOC)
- Compliance tooling (APR disclosure automation, state-specific rules)
- Sales training integration

---

## Claude Working Instructions

When building LendPaper tools:
1. Default to HTML/CSS/JS in a single file unless React is specified
2. Always use the design system colors and patterns above
3. Always include the footer disclaimer
4. Always include `Copy Results` and `Save as PDF` buttons
5. Use progressive disclosure — collapse secondary info by default
6. Pre-write the "What You Tell the Borrower" copy using compliant language
7. Make amortization rows clickable with inline expand (no scroll, no modal)
8. Test mental model: "Rep is on a live call. Can they get the number in 10 seconds?"
9. When in doubt about loan vs. MCA language — use neutral universal terms
10. Footer always: `Custom tooling & white-labeling available. info@lendpaper.com`
