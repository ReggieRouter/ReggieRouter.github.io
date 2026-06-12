# WATERFALL.md — Lender Waterfall: THE canonical reference

**Read this file before ANY waterfall work** — data edits, publish runs, logo fixes,
identity corrections. It is the single source of truth for how the waterfall ships
(§0), every known blank-table failure mode (§1–§3), logo/identity rules (§4), and the
Supabase↔live reconcile + publish freeze (§5).

---

## §0 — Canonical facts (the one-screen version)

- **Data is HARDCODED.** `waterfall.html` ships its lender data as a JS array
  (`const lenderData = [ ... ]`) inside an inline `<script>`. There is **no runtime
  fetch** — if the script block breaks, the table renders zero lenders and the rest
  of the file dumps as raw text. Hand-fixes to the array are safe until the next
  publish regenerates it.
- **Hosting:** production lendpaper.com is **GitHub Pages built from `origin/main`**
  (netlify.toml is inert). Pushing to main IS the deploy.
- **Publish pipeline:** `~/lendpaper-engine/publish.py` (separate repo) regenerates
  the array from Supabase `lender_data` (**approved rows only**), through a reserved
  worktree `~/lp-worktrees/.publish`, and pushes to origin/main. It escapes
  `</script>`/U+2028, strips `source_snippet`, applies merge/drop/override rules, and
  compile-verifies before writing.
- **Worktree rule:** never edit waterfall.html in a shared/stale checkout. Build
  fixes in `~/lp-worktrees/main` off fresh `origin/main`, push `origin HEAD:main`.
- **`DISPLAY_NAME_OVERRIDES` exists in TWO places** — `waterfall.html` (runtime) and
  `publish.py` (publish time). They must stay in sync; they are permanent (never
  strip/revert — see CLAUDE.md).
- **Reconcile tool:** `~/lendpaper-engine/reverse_sync_len215.py` (LEN-215) simulates
  a publish and diffs it against the live curated file — identity diffs (names,
  logos, row membership) are the publish-safety signal. Run it dry before lifting any
  freeze or trusting a publish.
- **Pre-ship gate for any hand-edit to the array:** the §1 grep must return 0, the
  inline script must compile, and the page must render the expected row count.

---

## Symptom checklist (how to recognize each cause)

| What you see on the page | Cause | Section |
|---|---|---|
| Header row renders, **0 lender rows**, and literal `\t\t\t\t…` or raw text dumped at the bottom | Unescaped `</script>` inside a data string terminates the block early | §1 |
| Completely empty table, **no** raw-text dump, no JS errors about the array | `publish.py` regex ate post-array JS → syntax error kills the whole script | §2 |
| Table renders but is **missing some lenders** | Pending (unapproved) rows — publish emits approved-only | §3 |

---

## §1 — Unescaped `</script>` in a data string  ⚠️ MOST RECENT (6/9, LEN-209)

### Root cause
The HTML parser terminates a `<script>` element at the **first literal `</script>`
substring it sees — regardless of JavaScript string/quote context.** Our lender objects
carry scraped fields (notably `source_snippet`) that can contain raw page HTML, including
`</script>` tags from the scraped site's own markup. One unescaped `</script>` anywhere
in `lenderData` kills the entire script: every lender **after** that point is lost, and
the remainder of the file (closing tags, trailing whitespace) renders as visible text.

**6/9 incident:** `"SOS Capital"` had a 28 KB `source_snippet` of scraped cookie-banner
HTML containing 5 unescaped `</script>` tags. The `\t\t` immediately following them is
exactly the `\t\t\t…` garbage that appeared at the bottom of the page. All lenders after
SOS Capital vanished → table looked empty.

### The rule
**Every `</script>` inside the `lenderData` array MUST be written `<\/script>`.**
The backslash is invisible to JS string parsing (`"<\/script>" === "</script>"`) but
prevents the HTML parser from seeing a closing tag. The file already carries this warning
as a comment directly above `const lenderData`.

### Fix / detect
Scan the data region for unescaped closers — this MUST return `0`:
```bash
# data array currently spans ~line 2658 ("const lenderData = [") to its "];"
awk 'NR>=2658 && NR<=9477' waterfall.html | grep -oE '[^\\]</script' | wc -l
```
To repair, escape every unescaped occurrence inside the array (do **not** touch the real
`</script>` tags that close actual script blocks elsewhere in the file):
```bash
# escape only </script NOT already preceded by a backslash, within the data region
python3 - <<'PY'
import re
p="waterfall.html"; L=open(p).readlines()
START,END=2658,9477  # adjust to the array's real bounds
for i in range(START-1,END):
    L[i]=re.sub(r'(?<!\\)</script', r'<\\/script', L[i])
open(p,"w").writelines(L)
PY
```
Verify after fix: count surviving lenders before the first real `</script>` close —
should equal the total in the array:
```bash
node -e 'const h=require("fs").readFileSync("waterfall.html","utf8");
const a=h.slice(h.indexOf("const lenderData"));
console.log((a.slice(0,a.indexOf("</script>")).match(/"name":/g)||[]).length,"lenders survive")'
```

### Prevent at the source — DONE (LEN-209)
`publish.py` (engine repo) **already** escaped closers (`js.replace('</script>', r'<\/script>')`)
and U+2028, and `verify_waterfall` aborts the publish on any raw `</script>` in the array.
**So a `publish.py` run could never have shipped this.** The 6/9 break came from a **manual
edit** to `waterfall.html` (the LEN-198 dedup, commit `1140020`) that bypassed publish.py's
escaping entirely.

The permanent fix removes the field: `publish.py` no longer emits `source_snippet` at all
(dropped from `COL_MAP` + the Supabase select). It holds raw scraped page HTML — cookie
banners, nav chrome, up to ~28 KB/row, ~182 KB / ~33% of the file — that the UI never
renders and that has been the source of every blank-waterfall landmine (raw `</script>`,
raw U+2028, both in this same field). Kept in Supabase for provenance; never shipped.

⚠️ **The remaining risk vector is MANUAL edits.** Hand-edits to `waterfall.html` do NOT
pass through publish.py's escaper. Whenever you edit the data array by hand (dedup, fixups,
one-off corrections), you MUST run the §1 grep gate yourself before committing. publish.py
protects only its own output.

---

## §2 — `publish.py` regex ate post-array JavaScript (LEN-192, 6/9)

`publish.py` rewrote the data array with a **non-greedy** `\[.*?\];` regex that matched
too little/too much and swallowed JS that follows the array (`LENDER_TYPE_OVERRIDES`, the
sentinel `forEach`), leaving a stray `}`. Syntax error → whole script dies → 0 lenders,
**no raw-text dump** (the array itself parsed, the code after it didn't).

**Hardened:** the regex now anchors on the structural `\n]` boundary, and publish
**compiles the full script** to verify before writing. Never reintroduce a greedy/lazy
`.*` array-replace without a post-write compile check.

---

## §3 — "Missing lenders" is usually pending rows, not a bug

`publish.py` emits **approved rows only**. A lender absent from the table is most often
`status = pending`, not data loss. Check approved vs pending counts in Supabase before
assuming corruption.

---

## §4 — Logos getting stripped, and the live-file ↔ Supabase divergence  ⚠️ (LEN-214)

**Logos.** Each lender row carries `logo_url`. The live file's curated rows point at
`public/assets/lenders/<file>.png`. But `publish.py` regenerates `logo_url` from Supabase
`lender_logo_url`, which scrapers re-clobber to **remote URLs or null** — so a publish
silently **strips local logos**. Curated local logos are now pinned in `publish.py`'s
`LOGO_OVERRIDES` (keyed by `lender_data.id`, always win over Supabase). **To add a local
logo permanently:** drop the file in `public/assets/lenders/`, set the row's `logo_url` in
`waterfall.html`, AND add `{id: 'public/assets/lenders/<file>'}` to `LOGO_OVERRIDES` —
otherwise the next publish wipes it.

**Newtek hard rule.** Newtek is FOUR rows in Supabase (ids 234 `NewtekOne`, 374 `NewTek`,
196/197 `Newtek (SBA/Term)`). Canonical = keep **NewTek** name on id 234's data, drop
374/196/197. Enforced in `publish.py` (`NEWTEK_CANONICAL_*` / `NEWTEK_DROP_IDS`) and in the
live file (single id-234 row). Never let a re-scrape re-split it.

---

## §5 — The publish freeze & Supabase↔live reconcile (LEN-215 / LEN-194)

**History.** The live file accumulated hand-curated fixes (LEN-198 dedup → 132 rows,
LEN-194/257 identity corrections, logo pins) that Supabase never received. Every
`publish.py` run regressed them — that divergence was the root cause of all the
recurring "my logos / fields disappeared" reports. Publishing was FROZEN 6/10:
`publish.py` hard-aborts a real publish unless `--force-unsafe` (or
`LP_PUBLISH_UNFREEZE=1`); `--dry-run` always works.

**Layer 1 — identity reconcile: DONE 6/12.** `reverse_sync_len215.py` (engine repo)
simulates a publish (same merge/dedup/override pipeline) and diffs it against the live
array. As of 6/12 a simulated publish emits **exactly the live 132 companies with
matching names and logos** — the dup rows still physically in Supabase (~160 approved)
are absorbed at publish time by `MERGE_GROUPS`/`DROP_IDS`/`dedup_by_name`, and the last
polluted `display_name` (id 9 "Spartan Capital Group") was patched back to David Allen
Capital. **Do NOT disapprove the dup rows in Supabase**: merge groups UNION
`product_types` across their cluster — disapproving members would shrink the canonical
row's products and re-diverge the publish.

Field-level (non-identity) diffs between Supabase and the live file are EXPECTED and
flow forward on publish — they're review-queue-approved scrape improvements that are
*newer* than the live file. `reverse_sync_len215.py` deliberately never syncs them
backwards.

**Layer 2 — wrong-company data under brand names (LEN-194).** Six rows wear a brand
name over another company's scraped data (id 7 PEAC↔Flex One, 8 CFG↔Lee Bank,
2 Forward Financing↔NewCo, 5 Fora↔Uplyft, 6 Expansion Capital Group↔Same Day,
4 Mulligan↔Onramp). Steve's call: rows keep the BRAND → fix identity columns
(`lender_name`, `source_url`, `application_submission_url`, wrong contacts → NULL)
via `len194_brand_identity_fix.sql`, then re-scrape each under its true identity with
`verify_fields_v1.py --lender-ids 2,4,5,6,7,8` and approve the queued corrections in
lp-panel → Data Health. Until that lands, those rows' underwriting numbers are the
wrong company's — on the live site AND in Supabase equally, so a publish no longer
*regresses* anything; it just doesn't fix them either.

Two masked leftovers (harmless but dirty): id 159 (`SOS Capital` data, display
"altbanq") and id 192 (`Balboa Capital` data, display "Ameris Bank Equipment
Finance") are both deduped away at publish time by name against the real rows
(240 altbanq / 215 Ameris). Restoring their true display names would make them
re-appear as new waterfall rows — that's a membership decision for Steve, not a
cleanup to do in passing.

**Lifting the freeze.** Only after: (1) `reverse_sync_len215.py` dry-run reports zero
identity patches, and (2) `publish.py --dry-run` diff vs origin/main shows only
intended field improvements. Then remove the freeze block in `publish.py` (or run
`--force-unsafe` for a one-off) — and remember a real publish pushes to main, which
needs Steve's approval.

---

## Pre-ship gate for ANY waterfall data change

1. `grep -oE '[^\\]</script' <data-region>` returns **0**  (§1)
2. The inline script **compiles** / page renders ≥ expected lender count  (§2)
3. Open the page and confirm rows render + **no trailing raw-text/`\t` dump**  (§1)

Production is **GitHub Pages from `origin/main`** — verify on a fresh `origin/main`
checkout, build in `~/lp-worktrees/main`, push `origin HEAD:main`.
