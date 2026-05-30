#!/usr/bin/env python3
"""
scrape_jobs.py — Pull job postings from lenders' own websites into Supabase.

Usage:
    python3 scrape_jobs.py [--dry-run] [--lender NAME]

Cron (weekly, Mondays 6:30am):
    30 6 * * 1 cd ~/Desktop/LendPaper && python3 scrape_jobs.py >> logs/jobs.log 2>&1

Requirements:
    pip install anthropic requests psycopg2-binary
    export ANTHROPIC_API_KEY=...
    export GMAIL_APP_PASSWORD=...
"""

import json
import re
import sys
import os
import time
import smtplib
import argparse
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from urllib.parse import urljoin, urlparse

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

try:
    import psycopg2
except ImportError:
    print("ERROR: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

# ── Config ─────────────────────────────────────────────────────────────────────

SUPABASE_URL       = "https://arpquyoucdsdmbetgftj.supabase.co"
SUPABASE_KEY       = "sb_publishable_R18l5zBtRQ1CkSGNBkgZkg_dVVBldlb"
TABLE              = "job_postings"

RECIPIENT_EMAIL    = "stephengowa@gmail.com"
SENDER_EMAIL       = "stephengowa@gmail.com"
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
ANTHROPIC_API_KEY  = os.environ.get("ANTHROPIC_API_KEY", "")

PG_DSN             = "host=localhost dbname=lendpaper_local user=stevegowa"
LOG_DIR            = Path(__file__).parent / "logs"

FETCH_TIMEOUT      = 14
RATE_LIMIT_SEC     = 1.5
MAX_PAGE_CHARS     = 8000

# Common careers URL slugs to try if no link found on homepage
CAREERS_SLUGS = ["/careers", "/jobs", "/about/careers", "/company/careers",
                 "/work-with-us", "/join-us", "/join-our-team", "/careers/jobs"]

# Link text / href patterns that signal a careers page
CAREERS_LINK_RE = re.compile(
    r'href=["\']([^"\']*(?:career|jobs|hiring|work-with-us|join-us|join-our-team)[^"\']*)["\']',
    re.IGNORECASE,
)

EXTRACT_PROMPT = """\
You are reviewing a lender's careers / jobs page to extract open positions.

Company: {name}
Page URL: {url}
Page content (truncated):
---
{content}
---

Return a JSON array of open job postings found on this page. Each element:
{{
  "title":        "exact job title",
  "location":     "city, state or 'Remote' or null",
  "job_type":     "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid",
  "earnings_min": integer annual dollars or null,
  "earnings_max": integer annual dollars or null,
  "earnings_note": "e.g. '+ commission' or 'OTE' or null",
  "source_url":   "direct URL to the posting if visible, otherwise null",
  "summary":      "1-2 sentence description of the role"
}}

Rules:
- Only include jobs explicitly listed. Return [] if no postings found or if the page is just a generic 'we're hiring' message.
- job_type defaults to "Full-time" if not specified.
- Do NOT invent data. Return ONLY the JSON array, no commentary.
"""

# ── Helpers ────────────────────────────────────────────────────────────────────

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LendPaperBot/1.0; research only)"}


def fetch(url: str) -> tuple[str, str]:
    """Fetch URL. Returns (text, final_url). text starts with FETCH_ERROR on failure."""
    if not url or not url.startswith("http"):
        return ("FETCH_ERROR: no URL", url)
    try:
        r = requests.get(url, headers=HEADERS, timeout=FETCH_TIMEOUT, allow_redirects=True)
        r.raise_for_status()
        return (r.text, r.url)
    except Exception as e:
        return (f"FETCH_ERROR: {e}", url)


def strip_html(html: str) -> str:
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>',  '', text,  flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s{3,}', '  ', text).strip()
    return text[:MAX_PAGE_CHARS]


def find_careers_url(homepage_html: str, base_url: str) -> str | None:
    """Scan homepage links for a careers/jobs page."""
    matches = CAREERS_LINK_RE.findall(homepage_html)
    if not matches:
        return None
    href = matches[0]
    if href.startswith("http"):
        return href
    return urljoin(base_url, href)


def probe_careers_url(base_url: str) -> str | None:
    """Try common careers slugs against the base URL."""
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    for slug in CAREERS_SLUGS:
        candidate = origin + slug
        html, _ = fetch(candidate)
        if not html.startswith("FETCH_ERROR"):
            return candidate
        time.sleep(0.3)
    return None


def get_careers_page(source_url: str) -> tuple[str, str]:
    """
    Return (text_content, page_url) for the best careers page found.
    Falls through: homepage link scan → slug probing → homepage itself.
    """
    homepage_html, final_url = fetch(source_url)
    if homepage_html.startswith("FETCH_ERROR"):
        return (homepage_html, source_url)

    # 1. Look for careers link on homepage
    careers_url = find_careers_url(homepage_html, final_url)
    if careers_url and careers_url != final_url:
        html, cu = fetch(careers_url)
        if not html.startswith("FETCH_ERROR"):
            return (strip_html(html), cu)

    # 2. Try common slug patterns
    probed = probe_careers_url(final_url)
    if probed:
        html, pu = fetch(probed)
        if not html.startswith("FETCH_ERROR"):
            return (strip_html(html), pu)

    # 3. Fall back to homepage text
    return (strip_html(homepage_html), final_url)


def extract_jobs_via_claude(client, name: str, url: str, content: str) -> list:
    if not content or content.startswith("FETCH_ERROR"):
        return []
    prompt = EXTRACT_PROMPT.format(name=name, url=url, content=content)
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        m = re.search(r'\[.*\]', raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return []
    except Exception as e:
        print(f"  [Claude error] {name}: {e}", file=sys.stderr)
        return []


# ── Supabase ───────────────────────────────────────────────────────────────────

def sb_fetch(method: str, path: str, body=None):
    headers = {
        "Content-Type":  "application/json",
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    if method in ("POST", "PATCH"):
        headers["Prefer"] = "return=representation"
    opts = {"method": method, "headers": headers}
    if body:
        opts["json"] = body
    r = requests.request(method, f"{SUPABASE_URL}/rest/v1/{path}", **{"headers": headers, "json": body if body else None, "timeout": 10})
    if not r.ok:
        raise RuntimeError(r.text)
    if r.status_code == 204:
        return None
    return r.json()


def load_existing(company: str) -> set:
    """Return set of lowercased titles already in Supabase for this company."""
    try:
        rows = sb_fetch("GET", f"{TABLE}?company=eq.{requests.utils.quote(company)}&select=title")
        return {r["title"].lower() for r in (rows or [])}
    except Exception as e:
        print(f"  [Supabase read error] {company}: {e}", file=sys.stderr)
        return set()


def insert_posting(row: dict) -> bool:
    try:
        sb_fetch("POST", TABLE, row)
        return True
    except Exception as e:
        print(f"  [Supabase insert error] {row.get('title')}: {e}", file=sys.stderr)
        return False


# ── Lender data ────────────────────────────────────────────────────────────────

def load_lenders() -> list:
    """Read lender names and URLs from underwriting_rules in local Postgres."""
    conn = psycopg2.connect(PG_DSN)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT lender_name, source_url
                FROM underwriting_rules
                WHERE source_url IS NOT NULL AND source_url != ''
                ORDER BY lender_name
            """)
            return [{"name": row[0], "source_url": row[1]} for row in cur.fetchall()]
    finally:
        conn.close()


# ── Email ──────────────────────────────────────────────────────────────────────

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


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Fetch pages + run Claude, but don't write to Supabase")
    parser.add_argument("--lender",  help="Scrape only this lender (partial name match)")
    args = parser.parse_args()

    LOG_DIR.mkdir(exist_ok=True)

    from datetime import datetime
    print(f"\n{'='*60}")
    print(f"LendPaper job scraper — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    lenders = load_lenders()
    lenders = [l for l in lenders if l.get("source_url")]

    if args.lender:
        lenders = [l for l in lenders if args.lender.lower() in l["name"].lower()]
        print(f"  Filtered to {len(lenders)} lenders matching '{args.lender}'")
    else:
        print(f"  Loaded {len(lenders)} lenders with URLs")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    total_new    = 0
    total_skip   = 0
    total_errors = 0
    summary_lines = []

    for i, lender in enumerate(lenders):
        name = lender.get("name", "?")
        url  = lender.get("source_url", "")
        print(f"  [{i+1}/{len(lenders)}] {name}")

        # Find and fetch careers page
        content, page_url = get_careers_page(url)
        if content.startswith("FETCH_ERROR"):
            print(f"    → {content}")
            total_errors += 1
            time.sleep(RATE_LIMIT_SEC)
            continue

        print(f"    → careers page: {page_url}")

        # Extract jobs
        jobs = extract_jobs_via_claude(client, name, page_url, content)
        time.sleep(RATE_LIMIT_SEC)

        if not jobs:
            print(f"    → no open positions found")
            total_skip += 1
            continue

        print(f"    → {len(jobs)} position(s) found")

        # Dedup against existing Supabase entries
        existing_titles = load_existing(name) if not args.dry_run else set()

        new_for_lender = 0
        for job in jobs:
            title = (job.get("title") or "").strip()
            if not title:
                continue
            if title.lower() in existing_titles:
                print(f"      skip (exists): {title}")
                continue

            row = {
                "company":         name,
                "title":           title,
                "location":        job.get("location"),
                "job_type":        job.get("job_type") or "Full-time",
                "earnings_min":    job.get("earnings_min"),
                "earnings_max":    job.get("earnings_max"),
                "earnings_note":   job.get("earnings_note"),
                "source_url":      job.get("source_url") or page_url,
                "source_platform": "Direct",
                "status":          "New",
                "summary":         job.get("summary"),
                "posted_date":     str(date.today()),
            }

            if args.dry_run:
                print(f"      [dry-run] would insert: {title}")
                new_for_lender += 1
                existing_titles.add(title.lower())
            else:
                if insert_posting(row):
                    print(f"      inserted: {title}")
                    new_for_lender += 1
                    existing_titles.add(title.lower())

        if new_for_lender:
            summary_lines.append(f"  • {name}: {new_for_lender} new posting(s)")
            total_new += new_for_lender
        else:
            total_skip += 1

    # Email summary
    from datetime import datetime
    body = f"""LendPaper job scraper complete.

Date:              {datetime.now().strftime('%Y-%m-%d %H:%M')}
Mode:              {'DRY RUN' if args.dry_run else 'LIVE'}
Lenders scanned:   {len(lenders)}
New postings added:{total_new}
No openings found: {total_skip}
Fetch errors:      {total_errors}

New postings by lender:
{chr(10).join(summary_lines) or '  (none)'}

View them at: https://lendpaper.com/recruiter
— LendPaper job scraper
"""
    if not args.dry_run or total_new:
        send_email(
            f"LendPaper jobs scraped — {total_new} new posting(s) ({datetime.now().strftime('%b %d')})",
            body,
        )

    print(f"\n  Done. {total_new} new postings added, {total_skip} lenders with no openings, {total_errors} errors.")


if __name__ == "__main__":
    main()
