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
<meta property="og:description" content="[1-line description]. Questions? Email stephengowa@gmail.com" />
<meta property="og:image" content="https://lendpaper.com/public/assets/brand/og-image.png" />
<meta property="og:url" content="https://lendpaper.com/[page-slug]" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://lendpaper.com/public/assets/brand/og-image.png" />
```

The OG image (`/public/assets/brand/og-image.png`) is 1200×630 — use it for every page.

## Waterfall dashboard (`waterfall.html`)
- Lender display names have permanent overrides — never strip or revert them
- See `DISPLAY_NAME_OVERRIDES` in `waterfall.html`

## PDF exports (amortization)
- `html2canvas` config must include `scrollX: 0, scrollY: 0` — dropping these causes left-side content clipping
