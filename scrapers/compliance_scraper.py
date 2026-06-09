#!/usr/bin/env python3
"""
LendPaper Compliance Scraper (LEN-93)

Monthly automated monitor of regulatory sources. Fully automated — runs from
.github/workflows/compliance-watch.yml on a cron; no manual trigger required.

What it does:
  1. Parses the Source Registry table in markdowns/LEGAL.md §15
     (between <!-- SOURCE-REGISTRY:BEGIN --> and <!-- SOURCE-REGISTRY:END -->).
     That table is the SINGLE canonical monitor list — add a row there and
     this scraper picks it up on the next run.
  2. Fetches each source, extracts visible text, and hashes it.
  3. Compares against scrapers/compliance_state.json (committed hash store).
     - First sighting of a source = silent baseline (no bulletin spam).
     - Changed hash = bulletin item, with regulatory-keyword hits surfaced.
  4. Writes public/assets/data/compliance-bulletin.json (newest first), which
     the lp-panel Compliance dashboard renders; unseen items light up the
     red-dot notification on the Compliance nav button.
  5. Stamps the "Monitoring log" line in LEGAL.md §15.

Detected changes are NEVER auto-merged into LEGAL.md's legal text — a human
(Steve + counsel) promotes bulletin items into the reference sections.

Stdlib only — no pip installs needed in CI.
"""

import hashlib
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEGAL_MD = ROOT / "markdowns" / "LEGAL.md"
STATE_FILE = ROOT / "scrapers" / "compliance_state.json"
BULLETIN_FILE = ROOT / "public" / "assets" / "data" / "compliance-bulletin.json"

UA = "Mozilla/5.0 (compatible; LendPaperComplianceBot/1.0; +https://lendpaper.com)"
TIMEOUT = 30
MAX_BULLETIN_ITEMS = 100

# Keyword hits worth calling out in a bulletin summary.
SIGNAL_KEYWORDS = [
    "commercial financing", "commercial finance disclosure", "merchant cash advance",
    "sales-based financing", "annual percentage rate", "factor rate", "disclosure",
    "usury", "telemarketing", "do not call", "consent", "opt-out", "opt out",
    "safeguards", "data breach", "privacy", "enforcement action", "final rule",
    "effective date", "signed into law", "enacted",
]


def parse_registry(md_text):
    """Parse `| id | name | jurisdiction | url |` rows from the §15 registry block."""
    m = re.search(r"<!-- SOURCE-REGISTRY:BEGIN -->(.*?)<!-- SOURCE-REGISTRY:END -->", md_text, re.S)
    if not m:
        print("ERROR: SOURCE-REGISTRY markers not found in LEGAL.md", file=sys.stderr)
        return []
    sources = []
    for line in m.group(1).splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 4 or cells[0] in ("id", ":---", "---") or cells[0].startswith("-"):
            continue
        if not cells[3].startswith("http"):
            continue
        sources.append({"id": cells[0], "name": cells[1], "jurisdiction": cells[2], "url": cells[3]})
    return sources


def fetch_text(url):
    """Fetch a URL and reduce it to normalized visible text."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        raw = resp.read(2_000_000).decode("utf-8", errors="replace")
    # Strip scripts/styles/tags, collapse whitespace.
    raw = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<!--.*?-->", " ", raw, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    # Drop volatile noise (dates rendered "today", session tokens, etc.) is
    # impractical generically; rely on hashing the trimmed body text.
    return re.sub(r"\s+", " ", text).strip()


def keyword_hits(text):
    low = text.lower()
    return [k for k in SIGNAL_KEYWORDS if k in low]


def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    md_text = LEGAL_MD.read_text(encoding="utf-8")
    sources = parse_registry(md_text)
    if not sources:
        sys.exit(1)
    print(f"Monitoring {len(sources)} sources from LEGAL.md §15")

    state = json.loads(STATE_FILE.read_text(encoding="utf-8")) if STATE_FILE.exists() else {}
    bulletin = (
        json.loads(BULLETIN_FILE.read_text(encoding="utf-8"))
        if BULLETIN_FILE.exists()
        else {"generated": None, "items": []}
    )

    new_items, errors = [], []
    for src in sources:
        sid = src["id"]
        try:
            text = fetch_text(src["url"])
            digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        except Exception as e:  # noqa: BLE001 — keep the run alive per-source
            errors.append(f"{sid}: {e}")
            print(f"  WARN {sid}: fetch failed ({e})")
            continue

        prev = state.get(sid)
        if prev is None:
            # Baseline snapshot — silent, no bulletin item.
            state[sid] = {"hash": digest, "lastChecked": today, "lastChanged": None}
            print(f"  BASELINE {sid}")
        elif prev.get("hash") != digest:
            hits = keyword_hits(text)
            summary = "Source content changed since last check."
            if hits:
                summary += " Signals on page: " + ", ".join(sorted(set(hits))[:6]) + "."
            summary += " Review and promote relevant updates into LEGAL.md."
            new_items.append({
                "id": sid,
                "date": today,
                "name": src["name"],
                "jurisdiction": src["jurisdiction"],
                "url": src["url"],
                "summary": summary,
            })
            state[sid] = {"hash": digest, "lastChecked": today, "lastChanged": today}
            print(f"  CHANGED {sid} ({len(hits)} keyword hits)")
        else:
            state[sid]["lastChecked"] = today
            print(f"  ok {sid}")

    # Persist state + bulletin (newest first, capped).
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    bulletin["generated"] = today
    bulletin["items"] = (new_items + bulletin.get("items", []))[:MAX_BULLETIN_ITEMS]
    BULLETIN_FILE.parent.mkdir(parents=True, exist_ok=True)
    BULLETIN_FILE.write_text(json.dumps(bulletin, indent=2) + "\n", encoding="utf-8")

    # Stamp the monitoring log line in LEGAL.md §15.
    stamp = f"last automated check {today}; {len(new_items)} change(s) detected; {len(errors)} fetch error(s)"
    md_new = re.sub(
        r"<!-- SCRAPER-LAST-RUN -->.*?<!-- /SCRAPER-LAST-RUN -->",
        f"<!-- SCRAPER-LAST-RUN -->{stamp}<!-- /SCRAPER-LAST-RUN -->",
        md_text,
        flags=re.S,
    )
    if md_new != md_text:
        LEGAL_MD.write_text(md_new, encoding="utf-8")

    print(f"Done: {len(new_items)} change(s), {len(errors)} error(s). Bulletin: {BULLETIN_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
