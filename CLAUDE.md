# LendPaper — Claude Instructions

## File Index — Read Before Starting Any Task

| File | Read when... |
|---|---|
| `docs/CALCULATORS.md` | Building or editing any calculator, tool, or financial UI |
| `docs/PDF.md` | Touching any PDF export, print stylesheet, html2canvas config, or watermark |
| `docs/BRANDING.md` | Any visual, layout, color, or typography decision |
| `docs/LEGAL.md` | Any copy, disclaimer, legal page, or entity reference |

---

## Deployment
- Repo: `github.com:ReggieRouter/lendpaper.git` (Netlify auto-deploys on push to `main`)
- Working directory: `~/Desktop/LendPaper`

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

## PDF exports
Full PDF spec, html2canvas config, print stylesheet, anti-fraud watermark rules, and known failure modes are in `PDF.md`.

**Critical summary:**
- `html2canvas` config must always include `scrollX: 0, scrollY: 0` — dropping these causes left-side content clipping
- Never call `window.print()` directly — always route through `PDF_HELPER.generatePDF()`
- Never remove or weaken the 3-layer anti-fraud watermark system (see `docs/PDF.md §1`)

## Supabase & Infrastructure

- **Supabase URL:** `https://arpquyoucdsdmbetgftj.supabase.co`
- **Tables:** `lender_data`, `state_registries`, `pending_changes`, `scrape_runs`
- **Admin panel:** `lp-panel.html` — manages pending changes, scrape diffs, lender data
- **Scraper (current):** `~/lendpaper-engine/scrape_blanks_v2.py` — writes diffs to `pending_changes` table. Use this. Do NOT use `fill_blanks.py` (deprecated — writes directly to DB).
- **Publisher:** `~/lendpaper-engine/publish.py` — regenerates `waterfall.html` from Supabase. **Pending fix needed:** must escape source_snippets before writing to waterfall.html:
  ```python
  snippet = (snippet or '').replace('\n', '\\n').replace('\r', '').replace('</script>', '<\\/script>')
  ```
- **Job scraper:** `scripts/scrape_jobs.py` — pending change: switch lender source from waterfall.html parsing to Postgres query (`SELECT lender_name, source_url FROM underwriting_rules WHERE source_url IS NOT NULL`)

## File Integrity Rule

After every HTML file edit, verify the file ends exactly at `</html>`. Never leave stray characters, duplicated blocks, or garbage text after the logical end of a file. Run `tail -5 filename.html` to confirm.
