# LendPaper — Claude Instructions

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

## Waterfall dashboard (`waterfall.html`)
- Lender display names have permanent overrides — never strip or revert them
- See `DISPLAY_NAME_OVERRIDES` in `waterfall.html`

## Adding new lenders
Whenever new lenders are added to Supabase (`lender_data`), immediately run `ingest_rest.py` in `~/lendpaper-engine/` to scrape and populate their fields. Do not add lenders without scraping them in the same session.

```bash
cd ~/lendpaper-engine && source venv/bin/activate && PYTHONUNBUFFERED=1 python3 ingest_rest.py
```

To add lenders: update the `NEW_LENDERS` list in `ingest_rest.py` with `{"name": "...", "url": "..."}` entries, then run it. Each lender is scraped with Playwright + Gemini and inserted directly to Supabase with `review_status=approved`.

## PDF exports (amortization)
- `html2canvas` config must include `scrollX: 0, scrollY: 0` — dropping these causes left-side content clipping

## PDF anti-fraud watermarks — NEVER remove or weaken these
Every PDF exported via `PDF_HELPER.generatePDF()` must carry three layers of document authentication:

1. **Visible quote ID in header** — `Doc #LP-YYYYMMDD-XXXXXX · [date]` rendered in small gray text below the document title. Injected by `initPrintLayout(title, quoteId)`.
2. **Visible per-page stamp** — `LP-YYYYMMDD-XXXXXX · lendpaper.com` fixed bottom-right of every page, 6pt gray. Injected as `#lp-quote-stamp` div with `position:fixed` so it repeats on all printed pages.
3. **Invisible forensic fingerprint** — white text div (`#lp-doc-fingerprint`) containing the same Quote ID plus timestamp, origin URL, user agent, screen size, and timezone. Invisible on screen; extractable by any PDF text tool or Select All+Copy.

All three use the **same Quote ID** (generated once per export via `generateQuoteId()`), so they cross-reference each other.

**Do not remove, comment out, or override these layers.** They exist to prevent fraud and limit legal exposure from falsified or disputed quotes. If adding a new calculator or PDF export path, always route through `PDF_HELPER.generatePDF()` — never call `window.print()` directly.
