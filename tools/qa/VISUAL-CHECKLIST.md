# Visual QA checklist (the human-eye pass)

The harness (`npm test`) covers math, firing, and recurring bugs. It can't tell you
something *looks* off — overruns, whitespace, broken wrapping. This is that pass.

**Fast path:** `npm run test:visual` captures every calculator at desktop / tablet /
phone widths into `screenshots/` (12 PNGs). Scan those against the list below instead
of resizing a browser by hand. Do this before any pre-rollout sign-off.

```bash
cd tools/qa && npm run test:visual && open screenshots   # macOS
```

## Per screenshot — look for

**Text & overflow**
- [ ] No text clipped, truncated, or running past its container/card edge
- [ ] No label/value collisions (numbers overlapping labels, tooltips on top of text)
- [ ] Long numbers (e.g. `$1,500,000`, `$776,385`) don't overflow result tiles
- [ ] Help/tooltip text wraps cleanly; the circle-i icon sits on the baseline (never a 📎)
- [ ] Headings render in the intended face, not a fallback (Figtree 700 for headings)

**Spacing & layout**
- [ ] No accidental large whitespace gaps or empty bands between sections
- [ ] Cards/inputs aligned; consistent gutters; nothing visibly off-grid
- [ ] Sticky table header doesn't overlap the first row or bleed through on scroll
- [ ] Result tiles and the amortization table are aligned, not ragged

**Mobile (375) specifically**
- [ ] Inputs and selects are full-width and tappable, not squished side-by-side
- [ ] The results/hero block stacks above or below the table cleanly (no horizontal scroll)
- [ ] CTA / Save-PDF buttons aren't cut off or pushed off-screen
- [ ] Multi-column scenario cards collapse to a single column

**Brand (quick gut check — see BRANDING.md)**
- [ ] Brand green is `#1A3C2E` (no stray deprecated `#14532D` in new UI)
- [ ] No pill badges with status dots ("looks AI generated" — banned)
- [ ] No 📎 paperclip anywhere (regression suite enforces this, but eyeball it)

## Per-calculator hotspots

- **AmoSchedule** — the amortization table is the danger zone: sticky header overlap,
  the payoff/Interest-Saved columns appearing only with pre-pay on, the selected
  payoff row + parking. Check a long term (24+ mo, daily freq) for row crowding.
- **DSCR** — entity cards 4-up wrap on mobile; EBIDA/owner/debt rows; the BDSCR/GDSCR
  pass/fail color band; "Both" mode showing two ratios without overflow.
- **Fundability** — the risk verdict color band and the position-risk takeaway copy
  (long sentences) at narrow widths; the exposure row toggle.
- **SBA** — the fee tiers and the takeaway sentence; long total-payback figures.

## PDF (manual — not screenshot-able here)

Native print, so eyeball an actual export of each calculator:
- [ ] No left-edge clipping; footer/quote-id present; watermark present
- [ ] Table doesn't get cut mid-row across pages; no controls/tooltips bleed into the PDF
