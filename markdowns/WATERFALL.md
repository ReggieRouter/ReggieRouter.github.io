# WATERFALL.md — Lender Waterfall: blank-table failure modes & prevention

The Lender Waterfall (`waterfall.html`) ships its lender data **hardcoded** as a JS
array (`const lenderData = [ ... ]`) inside an inline `<script>` block. There is **no
runtime fetch** — if the script block breaks, the table renders **zero lenders** and
the rest of the file dumps onto the page as raw text. This has happened repeatedly.
This doc lists every known cause and the guardrails. **Read before editing waterfall
data or the publish pipeline.**

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

## Pre-ship gate for ANY waterfall data change

1. `grep -oE '[^\\]</script' <data-region>` returns **0**  (§1)
2. The inline script **compiles** / page renders ≥ expected lender count  (§2)
3. Open the page and confirm rows render + **no trailing raw-text/`\t` dump**  (§1)

Production is **GitHub Pages from `origin/main`** — verify on a fresh `origin/main`
checkout, build in `~/lp-worktrees/main`, push `origin HEAD:main`.
