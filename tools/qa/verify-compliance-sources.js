#!/usr/bin/env node
/**
 * LendPaper — Compliance Desk source verifier (LEN-163)
 *
 * Fact-checks the Compliance Desk seed data (public/assets/js/legislation-data.js)
 * so nothing ships unverified. For EVERY item (federal + each state bill) it
 * enforces that the claim is backed by BOTH:
 *   1. an OFFICIAL legislation / government source (the statute `url`), and
 *   2. an INDEPENDENT news / trade-press / law-firm source (`newsUrl`).
 *
 * Checks per item:
 *   - statute source present AND on an official/government domain        [FAIL]
 *   - news source present (unless infoOnly) AND independent of govt      [FAIL]
 *   - news source is a DIFFERENT domain than the statute source          [FAIL]
 *   - both URLs actually resolve in a real browser                       [FAIL dead / WARN bot-blocked]
 *   - the statute page echoes the bill's citation/number (link↔claim)    [WARN]
 *
 * Run:   node tools/qa/verify-compliance-sources.js        (from repo root, or
 *        npm run verify:sources                             from tools/qa)
 * Output: console report + tools/qa/compliance-source-report.json
 * Exit:   non-zero if any FAIL — wire into release gating before flipping
 *         Compliance Desk data from Beta seed to relied-upon.
 *
 * This is the "fact-check" companion to scrapers/compliance_scraper.py
 * (which watches the LEGAL.md §15 registry for CHANGES). This one verifies the
 * PUBLIC data file's sources are real, official, independent, and live.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const DATA_PATH = path.resolve(__dirname, '../../public/assets/js/legislation-data.js');
const REPORT_PATH = path.resolve(__dirname, 'compliance-source-report.json');
const data = require(DATA_PATH);

/* ── source classification ─────────────────────────────────────────────── */
// Official legislature/regulator domains that aren't *.gov (allowlist).
const OFFICIAL_NONGOV = new Set(['kslegislature.org']);
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } }
function isOfficial(u) {
  const h = hostOf(u);
  if (!h) return false;
  if (/\.gov$/.test(h) || /\.mil$/.test(h)) return true;
  if (/\.state\.[a-z]{2}\.us$/.test(h)) return true;     // e.g. njleg.state.nj.us
  if (/(^|\.)(legislature|capitol)\./.test(h)) return true;
  return OFFICIAL_NONGOV.has(h);
}

/* Extract strong tokens (bill numbers, section/chapter numbers) for the
   link↔claim cross-check on the statute page. */
function tokensFrom(text) {
  const out = new Set();
  const t = String(text || '');
  // bill numbers: SB 1235, S5470, HB 700, A1414, Act 198, P.A. 23-201
  let m; const billRe = /\b((?:SB|HB|S|A|AB|HF|SF|P\.?A\.?|Act)\s?\.?\s?-?\s?\d{1,4}(?:-\d+)?)\b/gi;
  while ((m = billRe.exec(t))) out.add(m[1].replace(/[^a-z0-9]/gi, '').toUpperCase());
  // section / chapter numbers: §22800, 398, 1071, 559.961, 9:3137.10, 36a-50
  let s; const secRe = /\b(\d{2,4}(?:[.:]\d{1,4})*(?:-\d+)?[a-z]?)\b/gi;
  while ((s = secRe.exec(t))) { if (/\d{3,}/.test(s[1]) || /[.:]/.test(s[1])) out.add(s[1].replace(/[^a-z0-9]/gi, '').toUpperCase()); }
  return [...out].filter(Boolean);
}

/* ── build the work list ───────────────────────────────────────────────── */
const items = [];
(data.LEG_FEDERAL.items || []).forEach((it) => items.push({
  group: 'federal', label: it.name, statuteUrl: it.url || '', newsUrl: it.newsUrl || '',
  infoOnly: !!it.infoOnly, tokens: tokensFrom(it.name),
}));
Object.keys(data.LEG_DATA).forEach((abbr) => {
  const d = data.LEG_DATA[abbr];
  (d.bills || []).forEach((b, i) => items.push({
    group: 'state', label: (d.name || abbr) + ' — ' + (b.name || ('bill ' + i)),
    statuteUrl: b.url || '', newsUrl: b.newsUrl || '', infoOnly: false,
    tokens: tokensFrom((b.name || '') + ' ' + (b.citation || '')),
  }));
});

/* ── network: fetch each distinct URL once in a real browser ───────────── */
async function fetchAll(urls) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' });
  const results = {};
  const queue = [...urls];
  const POOL = 6;
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const page = await ctx.newPage();
      let didDownload = false;
      page.on('download', () => { didDownload = true; });
      try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        const status = resp ? resp.status() : 0;
        let text = '';
        try { text = (await page.title()) + '\n' + (await page.evaluate(() => document.body ? document.body.innerText.slice(0, 30000) : '')); } catch (e) {}
        results[url] = { status, text: text.replace(/[^a-z0-9]/gi, '').toUpperCase() };
      } catch (e) {
        // A statute link that serves a file (e.g. the enrolled-bill PDF) makes
        // goto "fail" with a download event — that's a valid, reachable source.
        if (didDownload || /Download is starting/i.test(String(e.message || e))) results[url] = { status: 'download', text: '' };
        else results[url] = { status: -1, error: String(e.message || e).split('\n')[0], text: '' };
      } finally { await page.close(); }
    }
  }
  await Promise.all(Array.from({ length: POOL }, worker));
  await browser.close();
  return results;
}

function reach(res) {
  if (!res) return { level: 'FAIL', msg: 'no result' };
  if (res.status === 'download') return { level: 'OK', msg: 'serves a file download (e.g. statute PDF)' };
  if (res.status === -1) return { level: 'FAIL', msg: 'unreachable (' + res.error + ')' };
  const s = res.status;
  if (s >= 200 && s < 400) return { level: 'OK', msg: 'HTTP ' + s };
  if ([404, 410, 451, 400].includes(s)) return { level: 'FAIL', msg: 'dead (HTTP ' + s + ')' };
  if ([403, 429, 406, 503].includes(s)) return { level: 'WARN', msg: 'bot-blocked (HTTP ' + s + ') — verify in browser' };
  return { level: 'WARN', msg: 'HTTP ' + s };
}

(async () => {
  const urls = [...new Set(items.flatMap((it) => [it.statuteUrl, it.newsUrl]).filter(Boolean))];
  process.stdout.write(`Verifying ${items.length} items across ${urls.length} unique URLs…\n`);
  const net = await fetchAll(urls);

  const report = [];
  for (const it of items) {
    const checks = [];
    // structural
    if (!it.statuteUrl) checks.push({ level: 'FAIL', msg: 'missing official/statute source' });
    else if (!isOfficial(it.statuteUrl)) checks.push({ level: 'FAIL', msg: 'statute source not on an official/government domain: ' + hostOf(it.statuteUrl) });
    if (!it.infoOnly) {
      if (!it.newsUrl) checks.push({ level: 'FAIL', msg: 'missing independent news source' });
      else if (isOfficial(it.newsUrl)) checks.push({ level: 'FAIL', msg: 'news source must be INDEPENDENT (got government domain: ' + hostOf(it.newsUrl) + ')' });
      else if (it.statuteUrl && hostOf(it.newsUrl) === hostOf(it.statuteUrl)) checks.push({ level: 'FAIL', msg: 'news source shares the statute domain (' + hostOf(it.newsUrl) + ') — needs a different source' });
    }
    // reachability
    if (it.statuteUrl) { const r = reach(net[it.statuteUrl]); checks.push({ level: r.level === 'OK' ? 'OK' : r.level, msg: 'statute ' + r.msg }); }
    if (it.newsUrl) { const r = reach(net[it.newsUrl]); checks.push({ level: r.level === 'OK' ? 'OK' : r.level, msg: 'news ' + r.msg }); }
    // link↔claim token check on statute page
    if (it.statuteUrl && net[it.statuteUrl] && net[it.statuteUrl].text && it.tokens.length) {
      const hit = it.tokens.find((tok) => net[it.statuteUrl].text.includes(tok));
      checks.push(hit
        ? { level: 'OK', msg: 'statute page echoes "' + hit + '"' }
        : { level: 'WARN', msg: 'statute page did not echo any citation token [' + it.tokens.join(', ') + '] — confirm the link points at the right text' });
    }
    const worst = checks.some((c) => c.level === 'FAIL') ? 'FAIL' : checks.some((c) => c.level === 'WARN') ? 'WARN' : 'OK';
    report.push({ group: it.group, label: it.label, statuteUrl: it.statuteUrl, newsUrl: it.newsUrl, worst, checks });
  }

  // console output
  const ICON = { OK: '✓', WARN: '▲', FAIL: '✗' };
  for (const group of ['federal', 'state']) {
    process.stdout.write(`\n${group.toUpperCase()}\n`);
    report.filter((r) => r.group === group).forEach((r) => {
      process.stdout.write(`  ${ICON[r.worst]} ${r.label}\n`);
      r.checks.filter((c) => c.level !== 'OK').forEach((c) => process.stdout.write(`      ${ICON[c.level]} ${c.msg}\n`));
    });
  }
  const counts = report.reduce((a, r) => { a[r.worst]++; return a; }, { OK: 0, WARN: 0, FAIL: 0 });
  process.stdout.write(`\nSummary: ${counts.OK} ok · ${counts.WARN} warn · ${counts.FAIL} fail  (of ${report.length} items)\n`);
  fs.writeFileSync(REPORT_PATH, JSON.stringify({ generated: 'run', counts, report }, null, 2));
  process.stdout.write('Report: ' + path.relative(process.cwd(), REPORT_PATH) + '\n');

  module.exports = { report, counts };
  if (counts.FAIL > 0) { process.stdout.write('\nFAIL: items above are missing a verified official and/or independent source.\n'); process.exit(1); }
})();
