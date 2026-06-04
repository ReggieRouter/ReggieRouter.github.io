─────────────────────────────────────────────────────────────────────
23. AUTHORITATIVE CORE JAVASCRIPT FRAMEWORK
─────────────────────────────────────────────────────────────────────
Use this architecture as the single source of truth for math and formatting:
const WATERMARK_FOOTER = "Powered by LendPaper | info@lendpaper.com | lendpaper.com — Custom branding available";

function cleanNumericInput(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
}

function formatCurrency(num) {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
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

// Universal Copy Handler
function handleLendPaperCopy(calculatorName, dataPairs) {
  const borderLine = "─────────────────────────────";
  let payload = `[${calculatorName}] — LendPaper\n${borderLine}\n`;

  Object.entries(dataPairs).forEach(([label, value]) => {
    payload += `${label.padEnd(25)}: ${value}\n`;
  });

  payload += `${borderLine}\n${WATERMARK_FOOTER}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload).then(showLendPaperToast);
  }
}

─────────────────────────────────────────────────────────────────────
24. CHANGELOG — v1.7 → v1.8
─────────────────────────────────────────────────────────────────────
•	Font Architecture: Transitioned to Google Font Inter as the primary font face.
•	Component Update (Takeaway): Deprecated the hidden "Explanation" trigger text. Introduced the always-visible .takeaway card with the .tk-eyebrow header ("What you tell the borrower").
•	Layout Update (Hero): Permitted the use of .hero-grid to display multiple side-by-side hero statistics.
•	Layout Update (Tabs): Permitted multi-tab architectures where related calculators (e.g., Net Requirement and Position Risk) share a single route/modal shell.
•	Component Update (Buttons): Updated Copy button to solid green (var(--lp-green)) with white text. Updated Save PDF to transparent background with green text/border. Added requirement for inline SVGs in export buttons.

Save this text document as: **`lendpaper-core-v1.8.md`**

***

### Step 3: Swap the files inside your Gem
1. Go back to your Gem's edit screen and locate the **Knowledge** section (where your files are uploaded).
2. Delete the old `lendpaper-core-v1.7.md` file (or `v1.6`, depending on what is currently in there).
3. Click "Upload" and select your freshly saved **`lendpaper-core-v1.8.md`** file.

### Step 4: Save
Click **Update** or **Save** on your Gem. 

Your Gem is now permanently synced with the design rules, logic, colors, and layout of that perfect Fundability calculator!
