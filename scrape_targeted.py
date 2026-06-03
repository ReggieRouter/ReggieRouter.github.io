#!/usr/bin/env python3
"""
scrape_targeted.py — Overnight targeted scraper for LendPaper waterfall
========================================================================
Targets two groups of lenders in waterfall.html:
  1. Lenders with NO products (not showing in the table at all)
  2. Lenders missing max_funding_amount (showing but with blank Amount column)

For each: fetches source_url, asks Claude to extract criteria, applies
patches back to waterfall.html (both GitHub and Desktop copies), verifies
with node, commits + pushes, then emails a summary.

Usage:
    python3 scrape_targeted.py [--dry-run] [--no-push] [--lender NAME]

Requirements:
    export ANTHROPIC_API_KEY=...
    export GMAIL_APP_PASSWORD=...
"""

import json
import re
import sys
import os
import time
import subprocess
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

GITHUB_COPY   = Path(__file__).parent / "waterfall.html"
DESKTOP_COPY  = Path.home() / "Desktop/LendPaper/waterfall.html"
SCRATCH_DIR   = Path(__file__).parent / "scratch"
LOG_DIR       = Path(__file__).parent / "logs"
PATCH_FILE    = SCRATCH_DIR / "targeted_patches.json"

RECIPIENT_EMAIL    = "stephengowa@gmail.com"
SENDER_EMAIL       = "stephengowa@gmail.com"
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
ANTHROPIC_API_KEY  = os.environ.get("ANTHROPIC_API_KEY", "")

FETCH_TIMEOUT     = 15
RATE_LIMIT_SEC    = 2.0
MAX_SNIPPET_CHARS = 8000

VALID_PRODUCTS = {"MCA", "Term Loan", "Line of Credit", "SBA", "Equipment",
                  "Commercial Real Estate", "Factoring", "Business Credit Card"}

EXTRACT_PROMPT = """You are analyzing a business lender's website to extract key lending criteria for a broker tool.

Lender: {name}
URL: {url}
Page content (truncated):
---
{content}
---

Extract ONLY factual data visible on this page. Return a JSON object with these fields:

{{
  "products": ["MCA" | "Term Loan" | "Line of Credit" | "SBA" | "Equipment" | "Commercial Real Estate" | "Factoring" | "Business Credit Card"],
  "fico_min": integer or null,
  "tib_min_months": integer or null,
  "rev_min_monthly": integer or null,
  "max_funding_amount": integer or null,
  "max_term_months": integer or null,
  "notes": "brief note or empty string"
}}

Rules:
- products: only include types the lender explicitly offers. Use exact strings from the list above.
- fico_min: minimum FICO/credit score required. null if not stated.
- tib_min_months: minimum time in business in months. 12 months = 12, 1 year = 12, 6 months = 6. null if not stated.
- rev_min_monthly: minimum MONTHLY revenue in dollars. If annual revenue given, divide by 12. null if not stated.
- max_funding_amount: maximum loan/advance amount in dollars. null if not stated.
- max_term_months: maximum loan term in months. null if not stated.
- Return null for any field not explicitly stated on the page.
- Return ONLY the JSON object, no commentary.
"""

# ── Parse waterfall.html ────────────────────────────────────────────────────────

def parse_lender_data(html_path: Path) -> list:
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


SCRAPE_COOLDOWN_DAYS = 90


def is_stale(lender: dict, force: bool = False) -> bool:
    """True if lender should be scraped (no recent scrape, or force=True)."""
    if force:
        return True
    scraped_at = lender.get("scraped_at")
    if not scraped_at:
        return True
    # Skip inactive lenders unless forced
    if lender.get("scrape_status") == "inactive":
        return False
    try:
        last = datetime.fromisoformat(scraped_at)
        return (datetime.now() - last).days >= SCRAPE_COOLDOWN_DAYS
    except ValueError:
        return True


def find_targets(data: list, force: bool = False) -> tuple[list, list]:
    """Return (no_products, missing_amount) lender lists, respecting 90-day cooldown."""
    no_products = []
    missing_amount = []
    skipped_fresh = 0
    for l in data:
        products = l.get("products") or []
        url = l.get("source_url") or l.get("submission_url") or ""
        needs_work = (not products) or (l.get("max_funding_amount") is None)
        if not needs_work:
            continue
        if not url:
            print(f"  [SKIP] {l['name']} — no URL", file=sys.stderr)
            continue
        if not is_stale(l, force):
            skipped_fresh += 1
            print(f"  [FRESH] {l['name']} — scraped {l.get('scraped_at')}, skip (use --force to override)", file=sys.stderr)
            continue
        if not products:
            no_products.append(l)
        else:
            missing_amount.append(l)
    if skipped_fresh:
        print(f"  Skipped {skipped_fresh} lenders scraped within {SCRAPE_COOLDOWN_DAYS} days", file=sys.stderr)
    return no_products, missing_amount


# ── Fetch + extract ─────────────────────────────────────────────────────────────

def _parse_text(raw_html: str) -> str:
    text = re.sub(r'<script[^>]*>.*?</script>', '', raw_html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s{3,}', '  ', text).strip()
    return text[:MAX_SNIPPET_CHARS]


def fetch_page(url: str) -> str:
    if not url or not url.startswith("http"):
        return ""
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
    attempt_urls = [url]
    # If URL is a specific sub-path that might 404, also try the base domain as fallback
    from urllib.parse import urlparse
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    if base != url.rstrip("/"):
        attempt_urls.append(base)

    last_error = ""
    for attempt_url in attempt_urls:
        for verify in (True, False):  # try with SSL verify first, then without
            try:
                r = requests.get(attempt_url, headers=headers, timeout=FETCH_TIMEOUT,
                                 verify=verify, allow_redirects=True)
                r.raise_for_status()
                text = _parse_text(r.text)
                if len(text) > 100:
                    return text
                # if very short, try next
                last_error = f"only {len(text)} chars"
                break  # don't retry with verify=False if the content is just short
            except requests.exceptions.SSLError:
                if verify:
                    continue  # retry without SSL verify
                last_error = "SSL error"
            except requests.exceptions.HTTPError as e:
                last_error = str(e)
                break  # don't retry verify=False for HTTP errors
            except Exception as e:
                last_error = str(e)
                break
    return f"FETCH_ERROR: {last_error}"


def extract_via_claude(client, name: str, url: str, content: str) -> dict | None:
    if not content or content.startswith("FETCH_ERROR"):
        return None
    prompt = EXTRACT_PROMPT.format(name=name, url=url, content=content)
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return None
    except Exception as e:
        print(f"  [Claude error] {name}: {e}", file=sys.stderr)
        return None


# ── Apply patches ───────────────────────────────────────────────────────────────

def safe_serialize(data: list) -> str:
    """Serialize lenderData as JSON, safely escaped for embedding in <script>."""
    raw = json.dumps(data, indent=2, ensure_ascii=False)
    # Escape </script> to prevent HTML parser from breaking the script block
    raw = raw.replace("</script>", "<\\/script>")
    # json.dumps already escapes literal newlines in strings, so no extra step needed
    return raw


def apply_patches(data: list, patches: list) -> int:
    """Apply patches list to data in-place. Returns count of lenders updated."""
    patched = 0
    patch_by_name = {p["name"]: p for p in patches}
    for l in data:
        if l["name"] not in patch_by_name:
            continue
        p = patch_by_name[l["name"]]
        changed = False

        if p.get("products") and not l.get("products"):
            # Filter to valid product strings
            valid = [x for x in p["products"] if x in VALID_PRODUCTS]
            if valid:
                l["products"] = valid
                changed = True

        for field in ("fico_min", "tib_min_months", "rev_min_monthly", "max_funding_amount", "max_term_months"):
            waterfall_field = {
                "fico_min": "fico",
                "tib_min_months": "tib",
                "rev_min_monthly": "rev",
                "max_funding_amount": "max_funding_amount",
                "max_term_months": "max_term_months",
            }[field]
            if p.get(field) is not None and l.get(waterfall_field) is None:
                l[waterfall_field] = p[field]
                changed = True

        # Always stamp scrape metadata regardless of data change
        l["scraped_at"] = p.get("scraped_at", datetime.now().strftime("%Y-%m-%d"))
        l["scrape_status"] = p.get("scrape_status", "success")

        if changed:
            l["updated_at"] = datetime.now().strftime("%Y-%m-%d")
            patched += 1

    return patched


def write_waterfall(html_path: Path, data: list) -> bool:
    """Write updated lenderData back into waterfall.html. Returns True on success."""
    text = html_path.read_text(encoding="utf-8")
    marker = "const lenderData = "
    start = text.find(marker)
    if start == -1:
        return False
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
    new_json = safe_serialize(data)
    new_text = text[:start] + new_json + text[i+1:]
    html_path.write_text(new_text, encoding="utf-8")
    return True


def verify_waterfall(html_path: Path) -> bool:
    """Verify the JS in waterfall.html parses without errors."""
    result = subprocess.run(
        ["node", "-e", f"""
const h = require('fs').readFileSync('{html_path}','utf8');
const s = h.indexOf('const lenderData = [');
const e = h.indexOf('</script>', s);
new Function(h.slice(h.lastIndexOf('<script',s)+8, e));
console.log('JS OK');
"""],
        capture_output=True, text=True, timeout=15
    )
    return result.stdout.strip() == "JS OK"


# ── Email ───────────────────────────────────────────────────────────────────────

def send_email(subject: str, body: str):
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


# ── Main ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",  action="store_true", help="Fetch + Claude, but don't write files")
    parser.add_argument("--no-push",  action="store_true", help="Don't git commit/push")
    parser.add_argument("--force",    action="store_true", help="Ignore 90-day cooldown and scrape all targets")
    parser.add_argument("--lender",   help="Only process lenders matching this name")
    args = parser.parse_args()

    LOG_DIR.mkdir(exist_ok=True)
    SCRATCH_DIR.mkdir(exist_ok=True)

    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"\n{'='*60}")
    print(f"LendPaper targeted scraper — {stamp}")
    print(f"{'='*60}\n")

    data = parse_lender_data(GITHUB_COPY)
    print(f"  Loaded {len(data)} lenders from {GITHUB_COPY.name}")

    no_products, missing_amount = find_targets(data, force=args.force)
    targets = no_products + missing_amount
    print(f"  Targets: {len(no_products)} with no products + {len(missing_amount)} missing max_amount = {len(targets)} total")

    if args.lender:
        targets = [l for l in targets if args.lender.lower() in l["name"].lower()]
        print(f"  Filtered to {len(targets)} matching '{args.lender}'")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    patches = []
    success  = 0
    no_data  = 0
    errors   = 0

    for idx, lender in enumerate(targets):
        name = lender.get("name", "?")
        url  = lender.get("source_url") or lender.get("submission_url") or ""
        group = "no-products" if not lender.get("products") else "missing-amount"
        print(f"\n  [{idx+1}/{len(targets)}] {name} ({group})")
        print(f"    URL: {url}")

        content = fetch_page(url)
        if content.startswith("FETCH_ERROR"):
            print(f"    → {content}")
            errors += 1
            time.sleep(RATE_LIMIT_SEC)
            continue
        print(f"    → fetched {len(content)} chars")

        if args.dry_run:
            print(f"    → dry-run, skipping Claude")
            time.sleep(0.3)
            continue

        result = extract_via_claude(client, name, url, content)
        time.sleep(RATE_LIMIT_SEC)

        if not result:
            print(f"    → no extractable data")
            no_data += 1
            continue

        # Determine what's useful
        useful = {}
        if result.get("products"):
            valid_prods = [p for p in result["products"] if p in VALID_PRODUCTS]
            if valid_prods and not lender.get("products"):
                useful["products"] = valid_prods

        for field, wfield in [("fico_min","fico"),("tib_min_months","tib"),
                               ("rev_min_monthly","rev"),("max_funding_amount","max_funding_amount"),
                               ("max_term_months","max_term_months")]:
            if result.get(field) is not None and lender.get(wfield) is None:
                useful[field] = result[field]

        if useful:
            patch = {"name": name, "scraped_at": stamp, "source_url": url, **useful}
            if result.get("notes"):
                patch["notes"] = result["notes"]
            patches.append(patch)
            print(f"    → extracted: {list(useful.keys())}")
            success += 1
        else:
            print(f"    → scraped but no new fields (all already populated or not found)")
            no_data += 1

    # Save patch file
    PATCH_FILE.write_text(json.dumps(patches, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  Patches file: {PATCH_FILE} ({len(patches)} lenders)")

    if args.dry_run:
        print("  [dry-run] Skipping write + push")
        send_email(
            f"LendPaper dry-run scrape — {success} lenders with data ({datetime.now().strftime('%b %d')})",
            f"DRY RUN complete. {success} lenders would receive updates.\nPatch file: {PATCH_FILE}"
        )
        return

    if not patches:
        print("  No patches to apply.")
        send_email(
            f"LendPaper scrape — no new data found ({datetime.now().strftime('%b %d')})",
            f"Scrape ran but no new criteria were extracted.\nErrors: {errors}, no-data: {no_data}"
        )
        return

    # Apply patches to in-memory data
    n_patched = apply_patches(data, patches)
    print(f"  Applied {n_patched} updates to lenderData")

    # Write back to GitHub copy
    print(f"  Writing {GITHUB_COPY}...")
    if not write_waterfall(GITHUB_COPY, data):
        print("  ERROR: Could not write GitHub copy", file=sys.stderr)
        sys.exit(1)

    # Verify
    print(f"  Verifying JS...")
    if not verify_waterfall(GITHUB_COPY):
        print("  ERROR: JS verification failed — aborting before copy or push", file=sys.stderr)
        send_email(
            "LendPaper scrape ERROR — JS verify failed",
            f"Scraper ran but waterfall.html failed JS verification. Manual review needed.\nPatch file: {PATCH_FILE}"
        )
        sys.exit(1)
    print("  JS OK")

    # Copy to Desktop
    if DESKTOP_COPY.exists():
        import shutil
        shutil.copy2(GITHUB_COPY, DESKTOP_COPY)
        print(f"  Synced → {DESKTOP_COPY}")

    # Git commit + push
    if not args.no_push:
        names_updated = [p["name"] for p in patches]
        short_list = ", ".join(names_updated[:5])
        if len(names_updated) > 5:
            short_list += f" +{len(names_updated)-5} more"
        commit_msg = f"scrape: fill missing fields for {n_patched} lenders ({short_list})"
        try:
            git_dir = GITHUB_COPY.parent
            subprocess.run(["git", "add", "waterfall.html"], cwd=git_dir, check=True)
            subprocess.run(
                ["git", "commit", "-m", commit_msg],
                cwd=git_dir, check=True
            )
            subprocess.run(["git", "push"], cwd=git_dir, check=True)
            print(f"  Pushed to GitHub")
        except subprocess.CalledProcessError as e:
            print(f"  [Git error] {e}", file=sys.stderr)

    # Email summary
    patch_lines = []
    for p in patches:
        fields = [k for k in p if k not in ("name","scraped_at","source_url","notes")]
        patch_lines.append(f"  • {p['name']}: {', '.join(fields)}")

    body = f"""LendPaper targeted scrape complete.

Date: {stamp}
Targets scanned: {len(targets)}
Updated with data: {success}
No extractable data: {no_data}
Fetch errors: {errors}
Lenders patched in waterfall: {n_patched}

Updated lenders:
{chr(10).join(patch_lines) or '  (none)'}

Patch file: {PATCH_FILE}

— LendPaper scraper
"""
    send_email(
        f"LendPaper scrape done — {n_patched} lenders updated ({datetime.now().strftime('%b %d')})",
        body
    )
    print("\nDone.")


if __name__ == "__main__":
    main()
