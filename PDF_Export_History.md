# LendPaper PDF Export Alignment, Clipping, & Sandbox History

This document serves as a permanent architectural record of all failed attempts, diagnosed root causes, and technical iterations to resolve the PDF horizontal text clipping, left-alignment shifting, and unstyled layout bugs across all LendPaper calculators inside embedded CRM iframe sandbox portals.

---

## The Root Cause of Portal Shifting & Clipping
In alternate finance CRM iframe systems, portal dashboards scale down embedded viewports using CSS transforms (e.g., `transform: scale(0.8)` or translates) to fit previews. 

Because `html2canvas` measures element dimensions using `.getBoundingClientRect()`, it inherits these ancestor scaling factors. Coordinates are mathematically warped (e.g., `left: 100px` measured as `75px` under `scale(0.75)`), causing the capture canvas to shift content heavily to the left (cutting off symbols like `$` and `2` on the first column of the tables) and leaving a massive empty space on the right.

---

## Complete History of Failed Attempts & Layout Bugs

### Failed Attempt 1: Default Overflow & Scroll Anchoring (Original State)
* **What was tried:** Standard screen capture on live DOM without container-level overrides.
* **Why it failed:** 
  1. **Overflow Clipping:** Every card container (`.modal-shell`, `.lp-container`, `.lp-card`) had `overflow: hidden` in standard CSS. In print mode, this was never overridden, hard-clipping any content that extended even slightly beyond the left boundary before `html2canvas` could paint it.
  2. **Live Scroll Offset Shifts:** Using hardcoded `scrollX: 0` / `scrollY: 0` conflicted with Chrome's scroll-anchoring engine, which silently adjusted scroll coordinates during layout reflows, throwing off coordinate calculations.

### Failed Attempt 2: Isolated `onclone` Class Injection (Without Live DOM Classes)
* **What was tried:** Moving the `.pdf-export-mode` class injection from the live DOM into the `html2canvas.onclone` callback, and hardcoding `scrollX: 0` / `scrollY: 0`.
* **Why it failed:** 
  * **Canvas Size Mismatch:** `html2canvas` calculates the target canvas size based on the live DOM's width (e.g., `1280px` on desktop) before cloning. 
  * Inside `onclone`, when we suddenly shrank the cloned elements to `windowWidth: 800`, `html2canvas` drew a `2560px` canvas (1280 × scale:2) but only filled `1600px` (800 × 2) of it, leaving the PDF content compressed to ~62% of the page width with massive whitespace on the right and left-edge pixel clipping.

### Failed Attempt 3: Off-Screen Clone Container (In Live DOM Body)
* **What was tried:** Cloning the active `main` element and appending it to a temporary, unscaled `lp-pdf-print-container` (`position: absolute; width: 800px;`) at the top of the live document body.
* **Why it failed:**
  * **Dynamic Collapsed Heights (Blank PDFs):** Since the live `document.body` was **not** put into `.pdf-export-mode` before cloning, the browser's live layout engine never pre-computed the print-mode layout reflows (like hiding the input panel `.lp-form-panel` and restructuring flex columns to blocks). 
  * Because `html2canvas` was called immediately after appending, the browser had not performed a layout pass on the new element, causing its dimensions to collapse to `0x0` pixels inside the clone, rendering **completely blank pages** (except for running footers).

### Failed Attempt 4: Dynamic IFrame Isolation (`about:blank` Viewport)
* **What was tried:** Creating a dynamic same-origin `<iframe>` off-screen, copying all `style` and `<link>` elements from the parent `<head>` into it, cloning the element inside it, and capturing the PDF from inside the iframe context.
* **Why it failed:**
  * **Asset Resolution Failures (Unstyled Plain Printed Site):** Dynamic blank iframes lack a matching host URL context. All relative stylesheet links (like `../public/assets/css/calculator-shell.css` or relative logo `/brand/...` paths) **failed to resolve**. 
  * The iframe loaded with **zero CSS rules applied**, rendering a raw, unstyled screen printout with all interactive buttons and forms fully visible and squashed.

### Failed Attempt 5: IFrame Isolation + `<base>` Mapping (No `onclone` coupling)
* **What was tried:** Injecting a `<base href="window.location.href">` inside the iframe head to resolve relative paths, copying stylesheets, but removing the `onclone` callback inside `html2canvas`'s parameters.
* **Why it failed:**
  * **Sandbox Reversion (Unstyled Page):** Even though the iframe document was perfectly styled, `html2canvas` internally clones the target element **again** into its own internal virtual sandboxed document context.
  * Because the `onclone` callback was missing, this final sandboxed document's `body` did **not** get the `.pdf-export-mode` class, so the browser ignored critical print styles during the rasterization pass, reverting the capture to an unstyled printed website.

---

## The Permanent Prevention Checklist (PDF Export Rules)

To prevent these horizontal clipping, scaling, and unstyled layout bugs from ever recurring, all present and future calculators must adhere to the following hardened architectural rules:

### Rule 1: The Overflow Escape Hatch
Any element with `overflow: hidden` in standard viewports must have it overridden to `visible` during PDF export to prevent boundary hard-clipping.
```css
body.pdf-export-mode .modal-shell,
body.pdf-export-mode .lp-container,
body.pdf-export-mode .lp-card,
body.pdf-export-mode .sc {
  overflow: visible !important;
}
```

### Rule 2: Synchronous Layout Calculations (Live Reflow)
Always apply `.pdf-export-mode` to the live `document.body` before triggering capture so the browser's live layout engine pre-calculates the printable boundary geometry:
```javascript
// Correct Sequence:
document.body.classList.add('pdf-export-mode');
element.offsetHeight; // Forces synchronous layout reflow
await new Promise(r => setTimeout(r, 150)); // Stabilizes layout
```

### Rule 3: The Live DOM Transform Shield (CRM Sandbox Scale Neutralizer)
To bypass CRM sandbox iframe CSS scales (e.g. `transform: scale(0.8)`), temporarily traverse up the parent DOM chain and disable any active transforms during capture, restoring them in the `finally` block:
```javascript
const transformedAncestors = [];
let curr = element;
while (curr && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    if (style.transform && style.transform !== 'none') {
        transformedAncestors.push({
            element: curr,
            originalTransform: curr.style.transform
        });
        curr.style.setProperty('transform', 'none', 'important');
    }
    curr = curr.parentElement;
}

// ... Perform html2pdf capture ...

// In finally block:
transformedAncestors.forEach(item => {
    item.element.style.transform = item.originalTransform;
});
```

### Rule 4: The Live Scroll Pattern (Never Hardcode scrollX: 0)
Keep `scrollX: 0, scrollY: 0` inside `html2canvas` options **only when the document body scroll offsets are programmatically reset to (0, 0) first**. Do not let dynamic scrollbar positions bleed into coordinates.

### Rule 5: Standardize windowWidth to 800
Always set `windowWidth: 800` inside the `html2canvas` configuration. Do not modify this value, as all print layout overrides and media breakpoints are built on an 800px printable gutter.
