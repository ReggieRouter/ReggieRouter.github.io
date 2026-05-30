# Lendpaper — Risk appetite column: final display spec

**Product:** Lendpaper — lender results table  
**Change type:** Label rename + display pattern update  
**Status:** Ready for implementation

---

## What changed from the prior draft

The earlier spec (Option A) used a colored pill/badge shape. This spec replaces it with a left-border stripe pattern (Option B) after review. Rationale: pill shapes read as dashboard UI to broker audiences; the left stripe delivers the same color signal in a form that feels native to a data table.

---

## Column header

| Before | After |
|--------|-------|
| Risk band | Risk appetite |

"Risk appetite" frames the column as describing who the lender will lend to, not a judgment on the lender itself.

---

## Cell display — left stripe + plain text

Replace any dot, badge, or pill with a **3px solid left border** on the text element, no background fill, no border-radius.

### Stripe + label spec

| Value | Border color | Text color | Label |
|-------|-------------|------------|-------|
| Low only | `#639922` | `#27500A` | Low only |
| Low–Moderate | `#639922` | `#27500A` | Low–Moderate |
| Moderate only | `#BA7517` | `#633806` | Moderate only |
| Moderate–High | `#BA7517` | `#633806` | Moderate–High |
| High only | `#993C1D` | `#712B13` | High only |
| All (ISO) | `#185FA5` | `#0C447C` | All |
| Unknown / not confirmed | `var(--color-border-secondary)` | `var(--color-text-tertiary)` | — |

### Typography
- Font size: 12px, weight 500
- Left border: 3px solid, no border-radius (flat edge, not rounded)
- Left padding (text offset from stripe): 8px
- No background fill on any state
- No pill shape, no border on other sides

### CSS reference

```css
.risk-cell {
  display: inline-block;
  padding-left: 8px;
  font-size: 12px;
  font-weight: 500;
  border-left: 3px solid;
  border-radius: 0;
}

.risk-low       { border-color: #639922; color: #27500A; }
.risk-moderate  { border-color: #BA7517; color: #633806; }
.risk-high      { border-color: #993C1D; color: #712B13; }
.risk-iso       { border-color: #185FA5; color: #0C447C; }
.risk-unknown   { border-color: var(--color-border-secondary); color: var(--color-text-tertiary); }
```

---

## ISO lenders

ISO (Independent Sales Organization) lenders route across all tiers — this is a structural distinction from a lender that independently accepts all risk. Display differently to reflect this:

- **Stripe color:** Blue (`#185FA5`) — not the red used for high-risk, which would be misleading
- **Label:** All
- **Optional:** Add a small ISO badge on the lender name cell (`font-size: 10px, border: 0.5px solid #185FA5, color: #185FA5, border-radius: 3px, padding: 1px 5px`) so brokers understand why the value is "All" without needing a tooltip

Blue is intentional: it signals "routing entity" rather than "risk tier," avoiding the implication that the lender itself is risky.

---

## Unknown / unconfirmed risk data

Use a **gray stripe + em-dash** for lenders where risk band data has not been confirmed.

- **Stripe:** `var(--color-border-secondary)` — same width and position as confirmed states, so column visual rhythm is preserved
- **Label:** `—` (em-dash), `color: var(--color-text-tertiary)`
- **Do not use** "Not disclosed" (implies the lender is withholding data) or "Varies by product" (unless that is specifically and verifiably true for that lender)

### Important distinction for data team

The gray stripe + dash must only represent **genuinely unknown data** — lenders where tier information has not yet been confirmed. It should not be used as a default for newly onboarded lenders pending review. If a lender is incomplete at launch, use a separate row-level incomplete indicator rather than populating the risk column with a dash. Brokers who notice the dash correlating with new lenders will stop trusting the column.

---

## Logic for determining the label

- Lender serves one tier only → show that tier name (`Low only`, `Moderate only`, `High only`)
- Lender serves two adjacent tiers → show range (`Low–Moderate`, `Moderate–High`)
- Lender is an ISO → show `All` with blue stripe regardless of underlying tier data
- Lender serves all three tiers (non-ISO) → confirm with data team whether this should map to `All` (blue) or `High only` (red) — they are logically different cases
- Tier data not confirmed → show `—` with gray stripe

---

## Edge cases — confirm with data team

- [ ] Are there lenders with non-contiguous tier coverage (e.g. Low + High but not Moderate)? Suggested fallback: gray stripe + `Varies` — only if this is a real and known condition, not a data gap
- [ ] Is tier data stored per-lender as a range, list of values, or single max value? Label logic above assumes a list
- [ ] How is ISO status flagged in the data model? The ISO stripe + label should be driven by a lender-type field, not inferred from tier coverage

---

## What stays the same

- Row layout and column order unchanged
- Filter/sort behavior on this column unchanged (sort by max tier served; ISO sorts to top or bottom — confirm preference)
- No changes to other columns

---

## Accessibility

- Left border color is not the only signal — the text label is always present and sufficient on its own
- Ensure color contrast ratio ≥ 4.5:1 for all text/background combos. All values above pass WCAG AA against a white background
- For dark mode: confirm stripe hex values against dark surface backgrounds; text color variables should use the CSS var equivalents from the design system rather than hardcoded hex where possible
