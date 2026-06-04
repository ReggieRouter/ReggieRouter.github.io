#!/usr/bin/env python3
"""
scrape_lenders.py — Weekly lender page scraper for LendPaper
=============================================================
Reads lender data from waterfall_preview.html (or a JSON export),
fetches each lender's source_url, extracts product criteria via Claude API,
writes a patch file, and emails a summary to stephengowa@gmail.com.

Usage:
    python3 scrape_lenders.py [--html scratch/waterfall_preview.html] [--dry-run]

Designed to run weekly via cron:
    0 6 * * 1 cd ~/Desktop/LendPaper && python3 scrape_lenders.py >> logs/scrape.log 2>&1

Requirements:
    pip install anthropic requests
    export ANTHROPIC_API_KEY=...
    export GMAIL_APP_PASSWORD=...   # Gmail App Password (not account password)
"""

import json
import re
import sys
import os
import time
import smtplib
import argparse
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: pip install anthropic", file=sys.stderr)
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: pip install requests", file=sys.stderr)
    sys.exit(1)

# ── Config ─────────────────────────────────────────────────────────────────────

RECIPIENT_EMAIL   = "stephengowa@gmail.com"
SENDER_EMAIL      = "stephengowa@gmail.com"
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
ANTHROPIC_API_KEY  = os.environ.get("ANTHROPIC_API_KEY", "")
OUTPUT_DIR         = Path(__file__).parent / "scratch"
PATCH_FILE         = OUTPUT_DIR / "product_criteria_patches.json"
LOG_DIR            = Path(__file__).parent / "logs"

FETCH_TIMEOUT  = 12   # seconds per lender page
RATE_LIMIT_SEC = 1.5  # pause between fetches
MAX_SNIPPET_CHARS = 6000  # Claude context per lender

EXTRACT_PROMPT = """You are analyzing a lender's website to extract product-specific lending criteria for alt-business lending.

Lender: {name}
URL: {url}
Page content (truncated):
---
{content}
---

Extract ONLY factual data visible on this page. For each product the lender offers, return a JSON array:
[
  {{
    "product": "LOC" | "Term" | "MCA" | "SBA" | "Finance" | "Factor" | "CRE",
    "loc_type": "revolving" | "traditional" | null,
    "fico_min": integer or null,
    "tib_min_months": integer or null,
    "rev_min_monthly": integer or null,
    "max_amount": integer or null,
    "max_term_months": integer or null,
    "notes": "brief plain-text note or empty string"
  }}
]

Rules:
- Only include products explicitly mentioned on the page.
- loc_type: "revolving" if the LOC resets/draws down like a credit card. "traditional" if it's a one-time draw with a fixed repayment.
- Return [] if no useful product data found.
- Return ONLY the JSON array, no commentary.
"""

# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_lender_data_from_html(html_path: Path) -> list:
    """Parse lenderData array from the waterfall HTML file."""
    text = html_path.read_text(encoding="utf-8")
    marker = "const lenderData = "
    start = text.find(marker)
    if start == -1:
        raise ValueError(f"Could not find lenderData in {html_path}")
    start += len(marker)
    depth = 0; in_str = False; escape = False; i = start
    while i < len(text):
        c = text[i]
        if escape:
            escape = False
        elif c == '\\' and in_str:
            escape = True
        elif c == '"' and not escape:
            in_str = not in_str
        elif not in_str:
            if c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    break
        i += 1
    return json.loads(text[start:i+1])


def fetch_page(url: str) -> str:
    """Fetch a URL and return truncated plain text."""
    if not url or not url.startswith("http"):
        return ""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LendPaperBot/1.0; research only)"}
    try:
        r = requests.get(url, headers=headers, timeout=FETCH_TIMEOUT)
        r.raise_for_status()
        text = r.text
        # Strip tags
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s{3,}', '  ', text).strip()
        return text[:MAX_SNIPPET_CHARS]
    except Exception as e:
        return f"FETCH_ERROR: {e}"


def extract_criteria_via_claude(client, name: str, url: str, content: str) -> list:
    """Call Claude to extract product criteria from page content."""
    if not content or content.startswith("FETCH_ERROR"):
        return []
    prompt = EXTRACT_PROMPT.format(name=name, url=url, content=content)
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        # Extract JSON array
        m = re.search(r'\[.*\]', raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return []
    except Exception as e:
        print(f"  [Claude error] {name}: {e}", file=sys.stderr)
        return []


def send_email(subject: str, body: str):
    """Send summary email via Gmail SMTP."""
    if not GMAIL_APP_PASSWORD:
        print("  [SKIP email] GMAIL_APP_PASSWORD not set", file=sys.stderr)
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = SENDER_EMAIL
    msg["To"]      = RECIPIENT_EMAIL
    msg.attach(MIMEText(body, "plain"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(SENDER_EMAIL, GMAIL_APP_PASSWORD)
            s.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, msg.as_string())
        print(f"  Email sent to {RECIPIENT_EMAIL}", file=sys.stderr)
    except Exception as e:
        print(f"  [Email error] {e}", file=sys.stderr)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", default="scratch/waterfall_preview.html")
    parser.add_argument("--dry-run", action="store_true", help="Fetch pages but skip Claude + email")
    parser.add_argument("--lender", help="Scrape only this lender name (for testing)")
    args = parser.parse_args()

    LOG_DIR.mkdir(exist_ok=True)
    html_path = Path(__file__).parent / args.html

    print(f"\n{'='*60}")
    print(f"LendPaper scraper — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Source: {html_path}")
    print(f"{'='*60}\n")

    lenders = extract_lender_data_from_html(html_path)
    print(f"  Loaded {len(lenders)} lenders")

    if args.lender:
        lenders = [l for l in lenders if args.lender.lower() in l["name"].lower()]
        print(f"  Filtered to {len(lenders)} lenders matching '{args.lender}'")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if not args.dry_run else None

    patches = []
    updated = 0
    skipped = 0
    errors  = 0

    for i, lender in enumerate(lenders):
        name = lender.get("name", "?")
        url  = lender.get("source_url") or lender.get("submission_url") or ""

        print(f"  [{i+1}/{len(lenders)}] {name} — {url or 'no URL'}")

        if not url:
            skipped += 1
            continue

        content = fetch_page(url)
        if content.startswith("FETCH_ERROR"):
            print(f"    → {content}")
            errors += 1
            time.sleep(RATE_LIMIT_SEC)
            continue

        if args.dry_run:
            print(f"    → dry-run, skipping Claude")
            time.sleep(0.2)
            continue

        criteria = extract_criteria_via_claude(client, name, url, content)
        time.sleep(RATE_LIMIT_SEC)

        if criteria:
            patches.append({
                "name": name,
                "product_criteria": criteria,
                "scraped_at": datetime.now().isoformat(),
                "source_url": url,
            })
            print(f"    → {len(criteria)} product(s) extracted")
            updated += 1
        else:
            print(f"    → no extractable criteria")
            skipped += 1

    # Write patch file
    PATCH_FILE.write_text(json.dumps(patches, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  Patch file written: {PATCH_FILE} ({len(patches)} lenders with data)")

    # Email summary
    summary = f"""LendPaper weekly lender scrape complete.

Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Lenders scanned: {len(lenders)}
Updated with criteria: {updated}
No URL / skipped: {skipped}
Fetch errors: {errors}

Patch file: {PATCH_FILE}

Lenders with new product criteria:
{chr(10).join(f'  • {p["name"]}: {len(p["product_criteria"])} product(s)' for p in patches) or '  (none)'}

Next step: review {PATCH_FILE} and run:
  python3 normalize_lenders.py <db_export.json> output.json
to merge into the waterfall.

— LendPaper scraper
"""
    send_email(f"LendPaper scrape complete — {updated} lenders updated ({datetime.now().strftime('%b %d')})", summary)
    print("\nDone.")


if __name__ == "__main__":
    main()
