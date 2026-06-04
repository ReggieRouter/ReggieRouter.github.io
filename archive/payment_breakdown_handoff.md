# Payment Breakdown — UI Handoff

## Context

This tool is used by **MCA brokers** (sellers of financing), not borrowers. Every UX decision should optimize for helping brokers pitch faster and more precisely. We are not touching calculation or amortization logic — only presentation, labeling, and interaction patterns.

---

## Form panel changes

### 1. Rename "Loan amount" → "Financing amount"
MCAs are not technically loans. Update the field label only — no logic change.

### 2. Origination fee — add $/% toggle
- Add a segmented control (`%` | `$`) to the **left** of the origination fee input
- Default state: `%` selected
- Toggling `%` → `$` converts the displayed value (e.g. `3.0%` of `$100,000` → `$3,000`)
- Toggling back reconverts
- Input suffix updates to match the active mode (`%` or `$`)
- Underlying stored value should remain consistent — convert at display layer

### 3. Pre-pay checkbox label
- Change to: `Model pre-pay discount`
- "Pre-pay discount" is the correct industry term for this product
- The input below the checkbox (the % value) keeps its existing behavior

### 4. Pre-pay % input — fix alignment
- Number inside the input should be **left-aligned** (`text-align: left`)
- `%` suffix stays pinned right — that's fine, keep it

### 5. Remove state selector
- If a borrower state dropdown was added in a prior session, remove it
- APR compliance is handled via footnote on the output panel (see below)

---

## Output panel — stats grid

### 6. Cost per dollar — conditional decimal display
- If the fractional portion is zero (e.g. `25.0¢`), display as `25¢`
- If meaningful (e.g. `25.3¢`, `25.75¢`), show up to 2 decimal places, strip trailing zeros
- Rule: `value % 1 === 0` → integer display; otherwise round to 2 decimal places
- Apply this same logic everywhere cost-per-dollar is rendered

### 7. APR — asterisk + tooltip + footnote
- Add a superscript `*` directly after the APR label text
- Set `title="Required disclosure in CA and NY"` on the asterisk for hover tooltip
- Add an italic footnote **below the Copy/Save buttons**: `* APR disclosure required in CA and NY`
- APR is always shown — do not gate visibility on any state selector

---

## Output panel — talk track callout box

### 8. Replace tab/pill toggle with embedded up/down arrow nav

Remove the existing tab or pill toggle entirely. Replace with this structure inside the callout box:

```
┌─────────────────────────────────────────┬──────┐
│ WHAT YOU TELL THE BORROWER              │  ▲   │
│                                         │      │
│ "You're looking at $2,403.85 per week.  │      │
│  Pay off at payment #2 on Jun 4..."     │  ▼   │
│                                         │      │
│ [track name + counter — hover only]     │      │
└─────────────────────────────────────────┴──────┘
```

**Layout:**
- Callout box is a flex row: `[quote body] [nav column]`
- Nav column: narrow, separated by a hairline left border (`0.5px`), contains only ▲ and ▼ chevron buttons centered vertically
- Chevron buttons: `ti-chevron-up` / `ti-chevron-down` (Tabler outline), subtle gray by default, green on hover
- No label on the nav column itself

**Track name + counter (`Payment summary · 1 / 4`):**
- Rendered at the bottom of the quote body
- **Hidden by default**
- **Visible on hover** of the nav column (or the full callout box — whichever feels cleaner in your implementation)
- Counter format: `N / total` in small gray tabular-nums text

**Wrap-around:** Left/up at `1` → goes to last; right/down at last → goes to `1`

**Keyboard:** `↑` / `↓` cycle the talk track when the callout is focused

### 9. Talk track variants — dynamic set

| # | Name | Condition |
|---|------|-----------|
| 1 | Payment summary | Always available |
| 2 | APR cost | Always available |
| 3 | Per-dollar pitch | Always available |
| 4 | Pre-pay discount | Only when pre-pay checkbox is **checked** |

- When pre-pay is **unchecked**: counter shows `N / 3`, variant 4 is not reachable
- When pre-pay is **checked**: counter shows `N / 4`, variant 4 is available
- If user is on variant 4 and unchecks pre-pay: silently snap back to variant 1

---

## Amortization schedule changes

### 10. Update hint text above the table
- **Current:** `Click any row to set it as the payoff target`
- **New:** `Click any row to quantify the pre-pay discount`

### 11. Selected row — inline savings expansion

When a row is selected **and** pre-pay is enabled, inject a detail row immediately below the selected row:

```
↳ Borrower saves $5,814.18 in interest by paying off here · buyout $114,378.12
```

**Specs:**
- `colspan` spans all table columns
- Same green background as the selected row (`#e8f5ec` or your existing selected-row token)
- Same left border accent as selected row (`box-shadow: inset 2px 0 0 #0a4d2c`)
- Font: italic, 12px, green text
- `$X,XXX.XX` savings and buyout values are dynamic, derived from the selected row
- Only one detail row renders at a time — remove previous when a new row is clicked

**When pre-pay is disabled:**
- No expansion row renders
- Selected row still highlights normally
- Do not show a row that reads "saves $0"

---

## What not to change

- Amortization math and payoff calculation logic
- Payoff target card in the output panel (already shows savings correctly)
- Copy results / Save as PDF button behavior and placement
- Existing color tokens and green brand palette
- The `+ Compare` button

---

## Color reference (existing tokens — do not change)

| Purpose | Value |
|---|---|
| Primary green | `#0a4d2c` |
| Selected row / payoff fill | `#e8f5ec` |
| Selected row left accent | `box-shadow: inset 2px 0 0 #0a4d2c` |
