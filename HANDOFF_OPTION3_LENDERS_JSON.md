# Handoff: Move lender data to external lenders.json (Option 3)

## Why this matters

Right now, all lender data lives inline inside a `<script>` block in `waterfall.html`.
This is the root cause of the recurring `</script>` injection bug: scraped `source_snippet`
values from lender websites contain HTML (including `<script>...</script>` tags), and any
literal `</script>` inside a JS string terminates the HTML parser's script block early,
dumping all remaining lender JSON as raw visible text on the page.

We have auto-escape guards in place (pre-commit hook + GitHub Actions), but the underlying
architecture is fragile. Moving the data out of the HTML file eliminates the problem class
entirely and makes data updates much cleaner.

## What to do

### 1. Extract lenderData to lenders.json

Take everything inside `const lenderData = [ ... ];` in `waterfall.html` and save it as
`/public/data/lenders.json` (a plain JSON array).

### 2. Replace the inline data block with a fetch call

Remove the `const lenderData = [ ... ];` block from `waterfall.html` and replace with:

```javascript
fetch('/public/data/lenders.json')
  .then(r => r.json())
  .then(lenderData => {
    // paste all existing code that uses lenderData here, or call initWaterfall(lenderData)
  });
```

Wrap the rest of the page logic in a function (e.g. `initWaterfall(lenderData)`) so it
can be called once the fetch resolves.

### 3. Update the data pipeline

Wherever lender data is exported from Beekeeper Studio, write it to `lenders.json` instead
of pasting into the HTML. The `</script>` injection problem cannot happen in a JSON file
because it's not inside an HTML script block.

### 4. Remove the escape guards (optional, once stable)

Once lender data lives in `lenders.json`, the pre-commit hook and GitHub Actions workflow
in `.github/workflows/sanitize-waterfall.yml` can be simplified or removed — they were
only needed to protect the inline script block.

## AGY-specific note

If AGY pushes lender data updates directly to the repo, it should write to `lenders.json`,
not `waterfall.html`. This keeps the data file and the UI file separate and means a bad
data push can never break the page's HTML structure — at worst it shows wrong data, not
a completely broken page.

## Effort estimate

~30–60 minutes. The JS logic doesn't change at all — only where `lenderData` comes from.
The trickiest part is making sure the page doesn't render before the fetch resolves
(show a loading state or skeleton rows while data loads).

## Files to touch

- `waterfall.html` — remove inline data, add fetch, wrap logic in init function
- `public/data/lenders.json` — new file, contains the lender array
- `.github/workflows/sanitize-waterfall.yml` — can be simplified or removed
