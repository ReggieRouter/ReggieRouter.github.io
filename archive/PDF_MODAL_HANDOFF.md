# PDF Save Tutorial Modal — Claude Code Handoff

## What this is

A modal that intercepts the user's first PDF save attempt and walks them through two required changes in Chrome's print dialog:

1. Change **Destination** from "Your Printer" → **Save as PDF**
2. Uncheck **Headers and footers**

The modal contains a looping cursor-driven animation of exactly those two steps, then a **Save** click. It is self-contained HTML/CSS/JS.

---

## Files

| File | Purpose |
|------|---------|
| `print_modal_final.html` | The complete modal (drop in or convert to component) |
| `pdf_modal_handoff.md` | This document |

---

## Business Logic Rules

### When to show
Show the modal **every time the user clicks "Save PDF"** — unless one of the suppression conditions below is true.

### Suppression conditions (check in this order)
1. `lp_pdf_dsa === '1'` → user checked "Don't show again" → **skip modal**
2. `lp_pdf_watched === '1'` → user has watched it this cycle → **skip modal**
3. Neither → **show modal**

### Inactivity reset
On every login/app load, compare today against `lp_pdf_last_active`.
If the gap is **≥ 30 days**, clear all keys and start fresh:
```js
localStorage.removeItem('lp_pdf_save_count');
localStorage.removeItem('lp_pdf_dsa');
localStorage.removeItem('lp_pdf_watched');
```
Then update `lp_pdf_last_active` to today.

**Rationale:** 30 days = monthly business tool cadence. Infrequent users get a refresher without being surprised.

### Watch requirement
- The modal forces **1 full animation loop (~5.4s)** before "Open print menu →" unlocks.
- No countdown shown to the user. The green progress bar at the bottom of the animation communicates progress passively.
- After 1 loop, the CTA pulses once and unlocks. User proceeds.

**Rationale:** 1× is enough. Forcing it twice is condescending.

### "Don't show again" availability
The checkbox is **hidden** until the user has **2 confirmed successful PDF saves**.
After their 2nd save, it appears in the modal footer.

**Rationale:** First save they might luck through. Second save proves the behavior is learned. Earned control, not given.

---

## localStorage Schema

| Key | Type | Value |
|-----|------|-------|
| `lp_pdf_save_count` | int (as string) | Number of confirmed PDF saves this cycle |
| `lp_pdf_last_active` | ISO date string | Last login/session start |
| `lp_pdf_dsa` | `'1'` or absent | User has permanently suppressed |
| `lp_pdf_watched` | `'1'` or absent | User has watched the tutorial this cycle |

> **Note:** If Lendpaper has server-side user sessions, mirror `lp_pdf_save_count` to the database. localStorage can be cleared by the browser, which would reset earned "Don't show again" access. A server value is the source of truth; localStorage is the fast-path cache.

---

## Configuration Constants

All tuneable values are at the top of the `<script>` block:

```js
const LOOP_MS          = 5400;  // animation loop duration in ms
const RESET_AFTER_DAYS = 30;    // inactivity days before full reset
const DSA_AFTER_SAVES  = 2;     // saves before "don't show again" appears
```

To adjust timing, change `LOOP_MS`. To make "Don't show again" available sooner (e.g. after 1 save), change `DSA_AFTER_SAVES = 1`.

---

## Integration Checklist

### 1. Trigger the modal
Wire to your existing "Save PDF" / print button:

```js
// Before calling window.print(), check:
if (shouldShowPdfModal()) {
  showPdfModal(); // renders the modal overlay
} else {
  window.print(); // go straight to Chrome print dialog
}
```

### 2. Confirm a successful PDF save
Chrome doesn't expose a "user completed save" event natively.
**Best approach:** Listen for the `afterprint` event, which fires after the user either saves or cancels:

```js
window.addEventListener('afterprint', () => {
  // You can't distinguish save vs cancel here natively.
  // Options:
  // A) Trust it and increment (simplest, slight over-count)
  // B) Ask the user: "Did you save it?" with a quick confirm prompt
  // C) Use a server-side webhook if your PDF export goes through your backend
  window.onPdfSaveSuccess?.();
});
```

If your PDF generation goes through Lendpaper's backend (recommended), fire `onPdfSaveSuccess()` from the server response instead — that's the reliable signal.

### 3. Call `window.onPdfSaveSuccess()` after confirmed save

```js
// Already defined in the modal script:
window.onPdfSaveSuccess = function() {
  const n = parseInt(localStorage.getItem('lp_pdf_save_count') || '0', 10) + 1;
  localStorage.setItem('lp_pdf_save_count', n);
  if (n >= DSA_AFTER_SAVES) {
    document.getElementById('dsa-wrap').classList.add('visible');
  }
};
```

### 4. Wire "Open print menu →" to `window.print()`
In the modal script, find the comment and replace:

```js
function handleProceed() {
  // ...existing localStorage logic...
  dismiss();
  window.print(); // ← uncomment / replace with your trigger
}
```

### 5. Run `checkReset()` on every login
The function is already defined in the modal script. If the modal isn't always loaded on login, extract `checkReset()` into your global session init:

```js
// In your app's session/auth init:
import { checkPdfModalReset } from './pdfModal';
checkPdfModalReset(); // checks last_active, clears keys if 30d gap
```

---

## State Machine

```
User clicks "Save PDF"
        │
        ▼
  [checkReset()]  ──── 30+ day gap? ──── YES ──► clear all keys
        │
        ▼
  shouldShow()?
   │         │
  NO         YES
   │          │
   ▼          ▼
window.print()  Show modal (forced watch)
                     │
                     ▼
              User watches 1 loop (~5.4s)
                     │
                     ▼
              CTA unlocks → user clicks "Open print menu →"
                     │
                     ├── DSA checked? → set lp_pdf_dsa = '1'
                     │
                     ▼
              set lp_pdf_watched = '1'
                     │
                     ▼
              window.print() fires
                     │
                     ▼
              [afterprint / server confirm]
                     │
                     ▼
              onPdfSaveSuccess() → increment lp_pdf_save_count
                     │
                     ▼
              save_count >= 2? → show "Don't show again" on next modal view
```

---

## Notes for AGY

- The modal is a single `<div class="overlay">` injected into the DOM. It does not use a framework — vanilla JS only. Convert to a React component if needed; state maps 1:1 to the localStorage keys above.
- The animation uses `position: absolute` inside `.stage`. If the modal is placed inside a scrolling container, ensure `.overlay` is `position: fixed` relative to the viewport, not the scroll parent.
- The animation loop runs indefinitely until the user proceeds. There is no memory leak risk — it uses `setTimeout` chains, not `setInterval`, for the sequence. The progress bar uses one `setInterval` that self-clears.
- Test the 30-day reset by manually setting `lp_pdf_last_active` to a date 31 days ago in DevTools and reloading.
- The `lp_pdf_watched` key resets on the 30-day inactivity cycle. It does **not** reset between sessions within that 30-day window — once watched, they won't see it again until their 30-day reset triggers.
