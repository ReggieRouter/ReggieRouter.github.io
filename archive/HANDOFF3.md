# LendPaper Handoff 3 — 2026-06-02

## Session summary
Big session. Admin panel, scraper, waterfall bug. Read carefully before continuing.

---

## 1. lp-panel.html — ALL CHANGES LIVE (deployed to Netlify)

### What was built this session
- **Pending Changes queue** on dashboard homepage — all scrape diffs show as a table with old→new, source link, Keep/Revert per row, Approve All bulk button
- **Suspicious zero/blank detection** — changes that wipe out a real value are flagged ⚠ ZERO/BLANK, sorted to bottom, require confirm to approve
- **Lock on reject** — every Revert offers a "Lock field?" toast action; locked fields skip future scrapes
- **CAPTCHA flag** (🤖) — toggle in Edit Fields → Identity; shows in sidebar + detail header. **Needs Supabase SQL first:**
  ```sql
  ALTER TABLE public.lender_data ADD COLUMN IF NOT EXISTS has_captcha boolean DEFAULT false;
  ```
- **Report tab** — per-lender breakdown by category (Underwriting, Products, Restrictions, Contact, etc.) with fill scores and locked/pending/empty tags
- **Overrides button** in header — modal showing all locked fields across all lenders, unlock from there
- **Dashboard completeness stats** — Total Lenders / Main Fields Complete / 90%+ complete; empty fields tile shows main table vs. other fields breakdown
- **Publish rules enforced:**
  - Hard block if >5 pending changes unresolved
  - Required fields gate (min_fico, min_tib, revenue, products)
  - Stale lender warning at >20%
  - Skip Check button removed from spot check (mandatory now)
  - Source URL confirmation before approving data with no URL to verify against
- **FAQ** — "Active Publish Rules" section documents all 7 rules

Both copies updated: `Desktop/LendPaper/lp-panel.html` and `Documents/GitHub/lendpaper/lp-panel.html`

---

## 2. Waterfall (lendpaper.com) — MAY STILL BE BROKEN

### What happened
The waterfall went blank. Root cause: `publish.py` ran at some point and wrote `source_snippet` values with:
1. **Literal newlines** embedded in JSON strings (invalid JSON)
2. **`</script>` tags** inside source_snippets (the HTML parser terminated the `<script>` block early, silently dropping all subsequent lender data)

### What was done
Three commits attempting to fix:
- `9044ad5` — Tried json.dumps re-serialization (may have subtly changed values)
- `03d9392` — Escaped `</script>` tags
- `decc722` — **Restored from last known-good commit `49522b7`** and applied only targeted string fixes (no re-serialization). JSON validates. 108 lenders confirmed present.

### Current status
Commit `decc722` is live on GitHub. Netlify should deploy within 60 seconds of push.

**If it's still blank after Netlify deploys:**
1. Open browser dev tools → Console tab
2. Look for any red JS errors
3. Try hard refresh: Cmd+Shift+R
4. If still blank, run: `git revert decc722` and restore from `49522b7` directly:
   ```bash
   cd ~/Documents/GitHub/lendpaper
   git checkout 49522b7 -- waterfall.html
   # then apply ONLY this:
   python3 << 'PYEOF'
   import re
   with open('waterfall.html', 'r') as f: c = f.read()
   # Only fix </script> — don't touch anything else
   start = c.find('const lenderData = [')
   end_bracket = c.find('\n]', start) + 2
   block = c[start:end_bracket]
   fixed = re.sub(r'</script>', r'<\\/script>', block, flags=re.IGNORECASE)
   print('Replaced:', block.count('</script>'))
   with open('waterfall.html', 'w') as f:
       f.write(c[:start] + fixed + c[end_bracket:])
   PYEOF
   git add waterfall.html && git commit -m "waterfall: only escape </script> in source_snippets" && git push
   ```

### Root cause fix needed in publish.py
`publish.py` must escape source_snippets before writing to waterfall.html:
```python
# In publish.py, before writing source_snippet to the lenderData block:
snippet = (snippet or '').replace('\n', '\\n').replace('\r', '').replace('</script>', '<\\/script>')
```
This prevents recurrence every time publish.py runs.

---

## 3. Scraper — `lendpaper-engine/scrape_blanks_v2.py`

### New file created this session
`~/lendpaper-engine/scrape_blanks_v2.py` — writes diffs to `pending_changes` instead of overwriting `lender_data`. Use this going forward, NOT `fill_blanks.py`.

### What we learned from the first two test runs
**Problematic lenders (skip for now):**
- CloudMyBiz, Principis Capital, Cloudfund, AltLINE, Fundry, BTC Commercial, South End Capital, Newity, Sky Bridge Business Funding, RTS Financial — dead URLs, thin JS-rendered sites, or no crawlable data

**Known bad data in Supabase (already fixed this session):**
- Fundingo — it's a LOS software vendor, not a lender. Set to `review_status='rejected'`
- Amex Blueprint × 2 — both entries had wrong source URLs pointing to corporate portal. Fixed to point to actual product pages

**What worked:**
- Nav.com scraped 14 fields successfully
- Balboa Capital got max_funding_amount
- networkidle (not domcontentloaded) is the right wait strategy

**Next scraper run:**
The skip list in `scrape_blanks_v2.py` already excludes the bad lenders. Just run:
```bash
cd ~/lendpaper-engine && source venv/bin/activate && python3 scrape_blanks_v2.py
```

**Nav min_fico = 155 in pending_changes — FLAG FOR REVIEW.** FICO minimum is 300, so 155 is below the floor. Nav is a marketplace — they may aggregate products with non-FICO credit scores. Do not approve this change blindly.

### Supabase `pending_changes` table
Has 17 queued changes from the test runs. Go to lp-panel.html → Dashboard to review them.

---

## 4. Next steps

1. **Verify waterfall is working** — if not, see troubleshooting above
2. **Run Supabase SQL** for has_captcha column
3. **Review 17 pending changes** in lp-panel dashboard (especially the suspicious Nav FICO)
4. **Resume scraper** — run `scrape_blanks_v2.py` for more lenders
5. **Fix publish.py** to escape source_snippets before writing to waterfall.html

---

## Key files
| File | Purpose |
|---|---|
| `~/Documents/GitHub/lendpaper/lp-panel.html` | Admin panel (all new features live) |
| `~/Documents/GitHub/lendpaper/waterfall.html` | Lender waterfall (108 lenders) |
| `~/lendpaper-engine/scrape_blanks_v2.py` | New scraper → pending_changes queue |
| `~/lendpaper-engine/fill_blanks.py` | OLD scraper — writes directly to DB, do not use |
| `~/lendpaper-engine/publish.py` | Regenerates waterfall.html from Supabase |
| `~/lendpaper-engine/.env` | Supabase URL + service key (working) |

## Supabase
- URL: `https://arpquyoucdsdmbetgftj.supabase.co`
- 162 lenders in `lender_data`
- 17 changes in `pending_changes` (status=pending)
- Tables: `lender_data`, `state_registries`, `pending_changes`, `scrape_runs`
