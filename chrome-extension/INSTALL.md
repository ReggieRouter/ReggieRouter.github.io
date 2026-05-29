# LendPaper Chrome Extension

## Install (Developer Mode)

1. Export `icons/icon.svg` as PNG at 16×16, 32×32, 48×48, and 128×128 px. Save as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` inside the `icons/` folder. (Use Figma, Sketch, or `rsvg-convert`.)
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select this `chrome-extension/` folder
6. LendPaper appears in your toolbar. Pin it for quick access.

## Files

```
chrome-extension/
├── manifest.json       — Extension config (Manifest V3)
├── popup.html          — Main popup UI
├── popup.css           — Styles (LendPaper brand tokens)
├── popup.js            — Calculator logic + tab routing
└── icons/
    ├── icon.svg        — Source SVG (export to PNG for Chrome)
    ├── icon16.png      — Required for Chrome
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Tabs

| Tab | What it does |
|-----|-------------|
| Quick Calc | Payment breakdown: enter funding amount, factor rate, and term → instant daily/weekly/total output with one-click Copy |
| Tools | Direct links to all LendPaper calculators + SOS registry |
| Lenders | Filter the 43-lender waterfall by FICO, TIB, and monthly revenue → see matches inline, open full waterfall |
