# LendPaper — Claude Instructions

## File Index — Read Before Starting Any Task

| File | Read when... |
|---|---|
| `markdowns/CALCULATORS.md` | Building or editing any calculator, tool, or financial UI |
| `markdowns/PDF.md` | Touching any PDF export, print stylesheet, html2canvas config, or watermark |
| `markdowns/BRANDING.md` | Any visual, layout, color, or typography decision |
| `markdowns/LEGAL.md` | Any copy, disclaimer, legal page, or entity reference — **Part II** is the single source of truth for ALL regulatory/compliance content (state matrix, source registry, canonical disclaimer) |

---

## Deployment
- Repo: `github.com:ReggieRouter/lendpaper.git` (Netlify auto-deploys on push to `main`)
- Working directory: `~/Desktop/LendPaper`

## Two-copy sync rule (every edit)
Files exist in BOTH `~/Documents/GitHub/lendpaper/` (the repo) and `~/Desktop/LendPaper/`. After any edit, sync the other copy **by applying the diff — never blind-copy whole files**:
```bash
git diff HEAD~1 HEAD | patch -p1 -d ~/Desktop/LendPaper
```
The copies are NOT byte-identical: Desktop copies may carry extra auth-gate/share-prompt blocks (e.g. `calculators/AmoScheduleCalculator.html`). A blind `cp` destroys those blocks.

## Every new HTML page must include

### Favicon (inline SVG, same on every page)
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32'%3E%3Crect width='24' height='24' rx='5' fill='%2314532D'/%3E%3Cpath d='M4 4v16h11l5-5V4H4z' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M15 20v-5h5' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M9 9v6' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M9 15h4' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'/%3E%3C/svg%3E">
```

### Open Graph / Twitter meta tags (absolute URLs required)
```html
<meta property="og:title" content="[Page Title] — LendPaper" />
<meta property="og:description" content="[1-line description]. Questions? Email hello@lendpaper.com" />
<meta property="og:image" content="https://lendpaper.com/public/assets/brand/og-image.png" />
<meta property="og:url" content="https://lendpaper.com/[page-slug]" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://lendpaper.com/public/assets/brand/og-image.png" />
```

The OG image (`/public/assets/brand/og-image.png`) is 1200×630 — use it for every page.

## SPA routing and OG stubs
The site uses client-side routing (spa-github-pages pattern). `/tools/*` slugs have no real files — unknown paths fall through to `404.html` which redirects to `/?p=<path>`, then `index.html` restores the path and opens the tool.

**iMessage/crawler problem:** crawlers see `404.html` (no OG tags) for `/tools/*` URLs.

**Fix:** Create `tools/{slug}/index.html` stubs with OG tags + a JS redirect:
```html
<script>window.location.replace('/?p=tools/{slug}');</script>
```
This gives crawlers the OG tags they need, and users land in the SPA with the right tool open.
Do this for every new tool added to `tools.js` with `presentation: "page"`.

## Branding Rules

- **Brand green is `#1A3C2E`** (`--color-brand-dark`, with `#2D6A4F` as mid tier — see `BRANDING.md`). **`#14532D` is deprecated** — never use it in new UI/CSS. Known legacy exceptions pending an asset refresh: the inline favicon data-URI below and `/public/assets/brand/og-image.png`. When touching old code that uses `#14532D`, migrate it to `#1A3C2E` (rgba form: `rgba(26,60,46,…)`).
- **Logo naming convention:** Assets ending in `-dark.svg` contain white/light text — place on dark backgrounds only. Assets ending in `-light.svg` contain dark text — place on light backgrounds only. Always verify contrast before finalizing.
- **NEVER use the word "Lendio"** or any Lendio-branded assets in any content, code, or metadata. LendPaper is the exclusive project identity.
- **Never append "Inc.", "LLC.", or any corporate suffix** to LendPaper until incorporation is confirmed. See `LEGAL.md`.

---

## Waterfall dashboard (`waterfall.html`)
- Lender display names have permanent overrides — never strip or revert them
- See `DISPLAY_NAME_OVERRIDES` in `waterfall.html`

## Adding new lenders
Whenever new lenders are added to Supabase (`lender_data`), immediately run `ingest_rest.py` in `~/lendpaper-engine/` to scrape and populate their fields. Do not add lenders without scraping them in the same session.

```bash
cd ~/lendpaper-engine && source venv/bin/activate && PYTHONUNBUFFERED=1 python3 ingest_rest.py
```

To add lenders: update the `NEW_LENDERS` list in `ingest_rest.py` with `{"name": "...", "url": "..."}` entries, then run it. Each lender is scraped with Playwright + Gemini and inserted directly to Supabase with `review_status=approved`.

## Compliance Engine (LEN-88)

- **Source of truth:** `markdowns/LEGAL.md` Part II. Machine-readable mirror:
  `public/assets/js/compliance-rules.js` — update both in the same commit.
- Engine: `public/assets/js/compliance.js` (`window.LPCompliance`). Fires
  silently off borrower-state selection; renders nothing unless a rule applies.
- The "not legal advice" disclaimer is injected via `LPCompliance` only —
  **never hardcode it** (LEGAL.md §14).
- New calculators/surfaces: include `compliance-rules.js` + `compliance.js`
  after `pdf-helper.js` and add `<div data-lp-compliance-host>`.
- Monthly scraper: `scrapers/compliance_scraper.py` via
  `.github/workflows/compliance-watch.yml` — monitors the LEGAL.md §15 source
  registry; bulletin renders in lp-panel → Compliance.
- Admin master toggle (lp-panel → Compliance) is **per-browser** for testing;
  live users always have the layer ON.

### Compliance Desk source rule (LEN-159 / LEN-163) — NON-NEGOTIABLE

The public **Compliance Desk** (`legislation.html`, route `/compliance`,
data in `public/assets/js/legislation-data.js`) is a legal surface. **Every
item — federal and every state bill — must cite BOTH:**
1. an **official legislation / government source** (`url` — the statute, on a
   `.gov`/`.state.*.us`/official-legislature domain), and
2. an **independent news source** (`newsUrl` — law-firm alert / trade press,
   NOT a government domain, and a different domain than the statute).
   (`infoOnly: true` exempts pure scope-notes from the news requirement.)

**Never add or edit a Compliance Desk item without running the verifier**, and
fix every FAIL before merging:
```bash
cd tools/qa && npm run verify:sources   # node verify-compliance-sources.js
```
It loads the data file, classifies each source (official vs independent),
confirms every link resolves in a real browser, and cross-checks that each
statute page echoes its bill citation. **FAIL = dead / missing / misclassified
source (blocks).** WARN = a gov page that bot-blocks the crawler or doesn't
render its text headless (correct link, just needs a human glance — does not
block). Also runs in CI on any change to the data file
(`.github/workflows/compliance-source-verify.yml`). This is the fact-check
companion to `compliance_scraper.py` (which watches the §15 registry for
*changes*); the verifier proves the *public data's* sources are real, official,
independent, and live. Seed data stays Beta until a clean verify + counsel sign-off.

## Deal Log (LEN-123)

Cross-tool log of every estimate. Full spec: `markdowns/CALCULATORS.md §15`.
- **Every calculator must call `saveEstimate()`** on PDF generation AND on "Copy
  Scenario". Shared utility: `js/quote-log.js` (import as
  `<script type="module" src="../js/quote-log.js">`; exposes `window.saveEstimate`
  / `window.LPQuoteLog`).
- Signature: `saveEstimate({ calculator_type, params, pdf_generated, prepared_for })`.
  `params` is **schemaless per calculator** (no migration to add a calculator).
- Persists to Supabase `estimates` (tied to `user_id`) + mirrors to `localStorage`
  (works offline / logged-out / before the table exists).
- **Restore** re-fills via `sessionStorage`, never the URL (no PII in URLs). On
  load: `LPQuoteLog.consumeRestorePayload('<calculator_type>')`.
- Freemium: free = last 10 displayed (all rows retained); Pro = full history.
- Page: `/quote-log` (`quote-log/index.html`). Nav: left sidebar in `index.html`.
- **DB setup:** run `supabase/estimates.sql` once in the Supabase SQL editor
  (table + indexes + RLS). Until then the log runs on the localStorage mirror.
- Display terminology standards (Buyout amount / Finance charge / Funded / etc.):
  `CALCULATORS.md §14`. Canonical product term "Deal Log": `BRANDING.md §1`.

## Adoption & Goals (LEN-57)

Admin **Adoption** tab in `lp-panel.html` (header nav, between Members and
Recruiter). Tracks engagement vs adoption — **distinct lifecycle stages**, each
with its own signal — by person and by company, with admin-set goals.

- **Lifecycle (highest reached wins):** Invited (account only) → Engaged
  (logged in / opened a tool: `last_seen` or any `usage_events`) → Adopted
  (recurring estimates: estimates in 2+ distinct ISO weeks **or** ≥3 in 30d) →
  Power user (Adopted + ≥2 distinct tools + a recent estimate). A recency
  overlay (active ≤7d / at-risk ≤30d / dormant) runs alongside the stage.
  Thresholds are JS constants (`ADO_ACTIVE_DAYS` etc.) at the top of the
  Adoption block — tune there.
- **Data:** computed **client-side** from first-party Supabase — `profiles`
  (incl. `last_seen`, `company`), `usage_events`, `estimates`. One 90-day pull
  of activity; the 7/30/90d window filters in JS (UTC math against
  `timestamptz`). Goals persist in `adoption_goals` (scope person/company/global).
- **DB setup (run once, Supabase SQL editor):** `supabase/adoption_setup.sql` —
  creates `adoption_goals` + RLS, **and adds admin-SELECT policies to
  `usage_events` and `estimates`** (otherwise the admin's RLS returns 0 rows and
  every metric reads 0 — the funnel shows a red banner until it's run).
- **Google Analytics:** link-out only for v1 (GA4 property `G-S3YBZV6RF9`). The
  GA Data API needs a server-side service-account key, which a static
  GitHub-Pages site can't hold and the API won't CORS-allow from a browser —
  so a serverless proxy (Netlify/Supabase Edge Function) is the phase-2 path.
- All UI lives in the `lp-panel.html` inline `<script>` (`renderAdoptionPanel`
  and `ado*` helpers); reuses the Members `.mem-table` / `.dash-card` / `.tabs`
  patterns and the global `sb` client + `esc()`.

## PDF exports
Full PDF spec, html2canvas config, print stylesheet, anti-fraud watermark rules, and known failure modes are in `PDF.md`.

**Critical summary:**
- `html2canvas` config must always include `scrollX: 0, scrollY: 0` — dropping these causes left-side content clipping
- Never call `window.print()` directly — always route through `PDF_HELPER.generatePDF()`
- Never remove or weaken the 3-layer anti-fraud watermark system (see `markdowns/PDF.md §1`)

## Supabase & Infrastructure

- **Supabase URL:** `https://arpquyoucdsdmbetgftj.supabase.co`
- **Tables:** `lender_data`, `state_registries`, `pending_changes`, `scrape_runs`, `estimates` (Deal Log — see below)
- **Admin panel:** `lp-panel.html` — manages pending changes, scrape diffs, lender data
- **Scraper (current):** `~/lendpaper-engine/scrape_blanks_v2.py` — writes diffs to `pending_changes` table. Use this. Do NOT use `fill_blanks.py` (deprecated — writes directly to DB).
- **Publisher:** `~/lendpaper-engine/publish.py` — regenerates `waterfall.html` from Supabase. **Pending fix needed:** must escape source_snippets before writing to waterfall.html:
  ```python
  snippet = (snippet or '').replace('\n', '\\n').replace('\r', '').replace('</script>', '<\\/script>')
  ```
- **Job scraper:** `scrapers/scrape_jobs.py` — pending change: switch lender source from waterfall.html parsing to Postgres query (`SELECT lender_name, source_url FROM underwriting_rules WHERE source_url IS NOT NULL`)

## File Integrity Rule

After every HTML file edit, verify the file ends exactly at `</html>`. Never leave stray characters, duplicated blocks, or garbage text after the logical end of a file. Run `tail -5 filename.html` to confirm.
