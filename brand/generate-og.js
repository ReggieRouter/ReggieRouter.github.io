const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// New wavy/fluid brand mark (replaces the old flat #14532D square).
const logoPath = path.resolve('/Users/stevegowa/lp-worktrees/main/public/assets/brand/lendpaper-linkedin-logo-300.png');
const logoDataUri = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .icon {
    width: 200px;
    height: 200px;
    border-radius: 44px;
    display: block;
  }
  .wordmark {
    font-size: 72px;
    letter-spacing: -1.5px;
    line-height: 1;
  }
  .wordmark .lend { font-weight: 800; color: #111827; }
  .wordmark .paper { font-weight: 300; color: #6B7280; }
  .wordmark .dot { font-weight: 800; color: #14532D; }
  .tagline {
    font-size: 28px;
    font-weight: 400;
    color: #9CA3AF;
    letter-spacing: 0;
  }
</style>
</head>
<body>
<div class="center">
  <img class="icon" src="${logoDataUri}" alt="LendPaper">

  <div class="wordmark">
    <span class="lend">lend</span><span class="paper">paper</span><span class="dot">.</span>
  </div>
  <div class="tagline">Deal math done fast</div>
</div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html, { waitUntil: 'networkidle' });

  const out1 = path.resolve('/Users/stevegowa/lp-worktrees/main/public/assets/brand/og-image.png');
  const out2 = path.resolve('/Users/stevegowa/lp-worktrees/main/brand/og-image.png');

  await page.screenshot({ path: out1, type: 'png' });
  await page.screenshot({ path: out2, type: 'png' });

  await browser.close();
  console.log('Generated:', out1);
  console.log('Generated:', out2);
})();
