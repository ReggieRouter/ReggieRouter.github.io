# LendPaper Core Engineering and QA Reference (v1.6)

─────────────────────────────────────────────────────────────────────
19. PRODUCTION REGRESSION & QA COMPLIANCE CHECKLIST
─────────────────────────────────────────────────────────────────────
Run every item on this checklist before deployment confirmation:

LAYOUT CONTAINMENT
[ ] Modal dynamically shrinks to fit content. No trailing gray void below short forms.
[ ] Output containers balance whitespace. No cavernous white voids beneath real-time data rows.
[ ] Net Requirement layout follows Left-Panel Input / Right-Panel Output blueprint.

EXPLANATION COMPONENT
[ ] Component is labeled "Explanation" (the term "Talk Track" is fully retired).
[ ] Trigger text is the explicit unadorned sentence question, anchored under the main hero value.
[ ] Card content presents as one clean paragraph of 40–60 words max.
[ ] Contains exactly 1 high-utility static sentence readable by a 12-year-old but respected by a CEO.
[ ] Contains exactly 1 dynamic sentence embedding numeric values as a matter-of-fact, non-judgmental milestone.

EXPORT INFRASTRUCTURE
[ ] Copy button is labeled "Copy" only (not "Copy Results").
[ ] Copy button triggers a 2-second UI confirmation toast.
[ ] Save PDF button is labeled "Save PDF" only (not "Save as PDF").
[ ] Save PDF is explicitly present (Never skipped).
[ ] Save PDF presents as a dark green outlined button (#14532D) with a transparent background fill.
[ ] Save PDF is positioned directly below the Copy button.
[ ] Printed outputs map the company logo, full legal disclaimer, and custom branding watermark.

COLOR & SEMANTIC INTEGRITY
[ ] No computed output value renders in #EF4444. Red is restricted to invalid input borders only.
[ ] Positive values use #14532D; neutral values use #111827.
[ ] No purple, indigo, or blue appears anywhere in the rendered UI.

ACCESSIBILITY & SPEED
[ ] Tab sequence targets row elements first. No vertical trapping.
[ ] Interactive inputs show a 2px solid #14532D focus ring with a 2px offset.

─────────────────────────────────────────────────────────────────────
20. COPY REVIEW CHECKLIST
─────────────────────────────────────────────────────────────────────
Run this on every calculator before deployment. Any failure is a P0 blocker.

INTRO SENTENCE
[ ] Calculator intro starts with See, Find, Compare, or Calculate.
[ ] Intro is one sentence, under 18 words.
[ ] No technical definitions in the body — they live only in tooltips.
[ ] No sentence begins with "The [Term Name] is…"

LABELS & BUTTONS
[ ] Every result label above a hero number is sentence case (e.g., "Min. to borrower," not "MIN. TO BORROWER").
[ ] Every button label is two words or fewer (three permitted only when load-bearing).
[ ] Button labels use the shortest accurate verb. No "Copy Results," no "Save as PDF."

FIELD NAMING
[ ] "Factor Rate" is used as the canonical field label. "Cents on the dollar" appears only in the tooltip.
[ ] No field label contains a parenthetical alternate term.

CASING DISCIPLINE
[ ] ALL CAPS appears only in: 11px field labels, 12px column headers, 10px system badges, 10px legal footer.
[ ] Everything else is sentence case — section headers, result labels, tooltips, explanation cards.

DELTA & COMPARISON
[ ] Scenario cards show a delta line beneath the monthly payment when 2+ scenarios are active.
[ ] Delta updates reactively as inputs change.

─────────────────────────────────────────────────────────────────────
21. AUTHORITATIVE CORE JAVASCRIPT FRAMEWORK
─────────────────────────────────────────────────────────────────────
Use the following JavaScript architecture as the single source of truth for all calculations, copying, printing, and explanation components:

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

function renderExplanationComponent(containerId, staticText, dynamicText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const paragraph = document.createElement('p');
  paragraph.className = 'lp-explanation-text';
  paragraph.style.cssText = 'margin:0;font-size:13px;line-height:1.5;color:#111827;text-transform:none;';
  paragraph.innerHTML = `${staticText} ${dynamicText}`;

  container.appendChild(paragraph);
}

function renderScenarioDelta(elementId, scenarioAValue, scenarioBValue, unitLabel = '/mo') {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (shouldShortCircuit(scenarioAValue, scenarioBValue)) {
    el.textContent = '';
    return;
  }
  const diff = scenarioBValue - scenarioAValue;
  const absDiff = Math.abs(diff);
  const direction = diff >= 0 ? 'more' : 'less';
  el.style.cssText = 'font-size:12px;color:#6B7280;margin-top:4px;';
  el.textContent = `Scenario B costs ${formatCurrency(absDiff)} ${direction}${unitLabel}`;
}

function handleLendPaperCopy(calculatorName, dataPairs) {
  const borderLine = "─────────────────────────────";
  let payload = `[${calculatorName}] — LendPaper\n${borderLine}\n`;

  Object.entries(dataPairs).forEach(([label, value]) => {
    payload += `${label.padEnd(20)}: ${value}\n`;
  });

  payload += `${borderLine}\n${WATERMARK_FOOTER}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(() => {
      if (typeof showLendPaperToast === 'function') showLendPaperToast();
    });
  }
}

function showLendPaperToast() {
  let toast = document.getElementById('lp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lp-toast';
    toast.textContent = 'Copied!';
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%',
      'transform:translateX(-50%)', 'background:#14532D', 'color:#fff',
      'padding:8px 20px', 'border-radius:6px', 'font-size:13px',
      'font-weight:600', 'opacity:0', 'transition:opacity 150ms',
      'pointer-events:none', 'z-index:9999'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function handleLendPaperPrint() {
  window.print();
}
```

─────────────────────────────────────────────────────────────────────
22. CHANGELOG — v1.5 → v1.6
─────────────────────────────────────────────────────────────────────
- Added Section 17 verb-first intro copy rule with approved intro sentences for all three current calculators.
- Renamed "Copy Results" to "Copy" and "Save as PDF" to "Save PDF" globally. This is a breaking label change — existing calculators must be updated.
- Standardized "Factor Rate" as canonical field label (removed parenthetical "Cents on the Dollar" from labels; moved to tooltip copy).
- Added explicit hero result hierarchy with fixed 4-step order in Section 8.
- Added scenario delta requirement to Section 11 (SBA Builder cards must show delta line, not just isolated monthly payments).
- Tightened ALL CAPS rule in Section 17 with exhaustive 4-item allowlist. Result labels and section headers are now explicitly sentence case.
- Added Section 20 (Copy Review Checklist) to QA process.
- Added `renderScenarioDelta()` helper to core JS framework.
- Added color integrity QA items: no red on output values, no off-palette colors anywhere.