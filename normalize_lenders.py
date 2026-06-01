#!/usr/bin/env python3
"""
normalize_lenders.py
====================
Post-processing pipeline for Beekeeper Studio SQL exports of the lenderData table.

Usage:
    python3 normalize_lenders.py input.json output.json

Or pipe directly:
    beekeeper-export | python3 normalize_lenders.py - output.json

What it does:
  1. Applies name normalization rules (capitalization, suffix stripping, renames)
  2. Applies logo assignment rules (local-file priority over external URLs)
  3. Flags lenders with missing critical fields and logs them for review
  4. Enforces exceptions (names that must not be stripped, etc.)

Output: cleaned JSON array, ready to paste into waterfall.html as `lenderData`.
"""

import json
import sys
import os
import re
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────────

LOGO_DIR = Path(__file__).parent / "public" / "assets" / "lenders"

# Words stripped from the END of a lender's display name in the waterfall table.
# This list mirrors the JS `displayName()` function — keep in sync.
STRIP_SUFFIXES = ["Capital", "Funding", "Advance", "Solutions", "Finance", "Financial"]

# Names that must NEVER have their suffix stripped, even if it matches STRIP_SUFFIXES.
# Add new exceptions here — this is the canonical list.
DISPLAY_NAME_EXCEPTIONS = [
    "In Advance Capital",   # stripped name "In Advance" loses meaning
]

# Hard renames: applied BEFORE suffix stripping. Old name → canonical name.
# These fix casing, rebrands, or known data-entry errors from Beekeeper Studio.
LENDER_RENAMES = {
    "FUNDINGO":                "Fundingo",
    "American Express":        "AmEx Kabbage",
    "Quickbridge Funding, LLC":"QuickBridge",      # deduplicate with existing QuickBridge row
    "Fenix Capital Funding":   "Fenix",
    "Expansion Capital":       "ECG",
    "Cobalt Funding Solutions":"Cobalt",
    "CFGMS":                   "CFG",
    "Capfront":                "CapFront",
    "Biz Capital Miami":       "BusinessCapital",
    "Accord Business Funding": "Accord",
    "Square Loans":            "Square Financing",
    "Fox Business Funding":    "Fox",
}

# Lenders to exclude entirely (removed from product/market).
EXCLUDED_LENDERS = [
    "Headway Capital Partners",
    "Lendzi",
]

# Logo assignment priority rules.
# Format: { "lender name (canonical)": "filename in public/assets/lenders/" }
# These override whatever logo_url is in the database export.
# Case-sensitive on the right-hand side (must match actual filename on disk).
LOGO_OVERRIDES = {
    "SuperG Capital":         "Super G.png",
    "Redline Capital Inc":    "Redline.png",
    "Lendistry":              "lendistry.png",
    "Spartan Capital":        "Spartan.png",
    "United Capital Source":  "United Capital Source.png",
    "Reliant Funding":        "Reliant Funding.png",
    "Everest Business Funding": "Everest Funding.png",
    "Mantis Funding":         "Mantis Funding.png",
    "Giggle Finance":         "Giggle.png",
    "FundThrough":            "Fundthrough.png",
    "Cobalt":                  "Cobalt Funding.png",
    "ECG":                     "Expansion Capital Group.png",
    "Forward Financing":       "Forward Financing.png",
    "Greenbox Capital":        "Greenbox Capital.png",
    "National Business Capital":"National Business Capital.png",
    "PEAC Solutions":          "PEAC.png",
    "QuickBridge":             "Quickbridge.png",
    "Small Business Funding":  "Small business funding.png",
    "Grasshopper Bank":        "grasshopper bank.png",
    "Highland Hill Capital":   "Highland Hill.png",
    # New uploads (2026-05-28)
    "Square Financing":        "Square Financing.png",
    "PayPal Working Capital":  "Paypal.png",
    "Fundbox":                 "Fundbox.png",
    "AmEx Kabbage":            "AmEx Kabbage.png",
    "BusinessCapital":         "business_capital_llc_logo.png",
    "1st Alliance Group":      "1st alliance funding.png",
    "Splash Advance":          "Splash Advance.png",
    "Shopify Capital":         "Shopify Lending.png",
    "ROK Financial":           "rok financial.png",
}

# Products overrides — set canonical product list for specific lenders.
PRODUCTS_OVERRIDES = {
    "CapFront":           ["Term Loan", "Equipment"],
    "Grasshopper Bank":   ["SBA"],
    "1st Alliance Group": ["MCA"],
    "Accord":             ["MCA"],
}

# product_criteria — per-product breakdown data.
# Format: list of {product, loc_type, max_amount, max_term_months, notes}
# These are overlaid ONTO any existing product_criteria in the DB export.
PRODUCT_CRITERIA_OVERRIDES = {
    "Backd": [
        {"product": "LOC", "loc_type": "revolving", "max_amount": 1000000, "max_term_months": None, "notes": "Draw anytime · flexible terms · soft pull"},
        {"product": "Term", "loc_type": None, "max_amount": 250000, "max_term_months": 24, "notes": "Daily or weekly payments"},
    ],
    "Bluevine": [
        {"product": "LOC", "loc_type": "revolving", "max_amount": 250000, "max_term_months": None, "notes": "Up to $250K revolving"},
        {"product": "Term", "loc_type": None, "max_amount": 500000, "max_term_months": None, "notes": "Through lending partners"},
    ],
    "Accord": [
        {"product": "MCA", "loc_type": None, "max_amount": 150000, "max_term_months": None, "notes": "$5K min · soft pull only"},
    ],
}

# Field overrides — force specific field values regardless of what the DB export contains.
# Use for manually-verified data the scraper doesn't reliably capture.
# Format: { "canonical lender name": { "field": value, ... } }
FIELD_OVERRIDES = {
    "Accord": {
        "soft_pull":          True,
        "max_funding_amount": 150000,
    },
}

# Fields whose source_snippet content is known to contain raw HTML or <script> tags.
# When encountered, the source_snippet is sanitized — all HTML tags are stripped,
# leaving only plain text.  This prevents the </script> injection bug.
SANITIZE_SOURCE_SNIPPET = True  # Always on — prevents broken waterfall renders

# Critical fields — logged as warnings if empty after normalization.
CRITICAL_FIELDS = ["submission_url", "fico", "tib", "rev", "products"]

# ── Helpers ────────────────────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    """Remove all HTML tags from a string, leaving plain text."""
    return re.sub(r'<[^>]+>', '', text)

def local_logo_path(filename: str) -> str:
    return f"public/assets/lenders/{filename}"

def resolve_logo(lender: dict) -> str:
    """Return the best logo URL for a lender, preferring local files."""
    name = lender.get("name", "")

    # 1. Check explicit override table first
    if name in LOGO_OVERRIDES:
        fname = LOGO_OVERRIDES[name]
        full = LOGO_DIR / fname
        if full.exists():
            return local_logo_path(fname)
        else:
            print(f"  [WARN] Logo override for '{name}' points to missing file: {fname}", file=sys.stderr)

    # 2. Keep existing local path if the file exists on disk
    existing = lender.get("logo_url", "")
    if existing.startswith("public/assets/lenders/"):
        fname = existing[len("public/assets/lenders/"):]
        if (LOGO_DIR / fname).exists():
            return existing

    # 3. Fall back to whatever the DB had (external URL) — better than nothing
    return existing

def normalize_name(name: str) -> str:
    """Apply renames."""
    return LENDER_RENAMES.get(name, name)

def sanitize_snippet(text: str) -> str:
    """Strip HTML tags that would break the <script> block in waterfall.html."""
    if not text:
        return text
    # Remove full <script>...</script> blocks (any type)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove all remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    # Collapse whitespace
    text = re.sub(r'\s{3,}', '  ', text).strip()
    return text

# ── Main pipeline ──────────────────────────────────────────────────────────────

def normalize(lenders: list) -> list:
    out = []
    warnings = []

    for lender in lenders:
        name = lender.get("name", "")

        # 1. Exclude removed lenders
        if name in EXCLUDED_LENDERS:
            print(f"  [SKIP] Excluded lender: {name}", file=sys.stderr)
            continue

        # 2. Apply renames
        lender["name"] = normalize_name(name)
        name = lender["name"]

        # 3. Sanitize source_snippet (prevent </script> injection)
        if SANITIZE_SOURCE_SNIPPET and lender.get("source_snippet"):
            lender["source_snippet"] = sanitize_snippet(lender["source_snippet"])

        # 4. Resolve logo
        lender["logo_url"] = resolve_logo(lender)

        # 4b. Apply products override if defined
        if name in PRODUCTS_OVERRIDES:
            lender["products"] = PRODUCTS_OVERRIDES[name]

        # 4c. Apply product_criteria override if defined; otherwise preserve existing
        if name in PRODUCT_CRITERIA_OVERRIDES:
            lender["product_criteria"] = PRODUCT_CRITERIA_OVERRIDES[name]
        elif "product_criteria" not in lender:
            lender["product_criteria"] = []

        # 4d. Apply field overrides (manually-verified data the scraper misses)
        if name in FIELD_OVERRIDES:
            for field, val in FIELD_OVERRIDES[name].items():
                lender[field] = val

        # 5. Check critical fields
        missing = []
        for field in CRITICAL_FIELDS:
            val = lender.get(field)
            if val is None or val == "" or val == [] or val == 0:
                missing.append(field)
        if missing:
            warnings.append((name, missing))

        out.append(lender)

    # Print warnings summary
    if warnings:
        print("\n  ── Missing critical fields (re-query Beekeeper Studio) ──", file=sys.stderr)
        for lname, fields in warnings:
            print(f"  [MISSING] {lname}: {', '.join(fields)}", file=sys.stderr)
        print(f"\n  {len(warnings)} lenders need review.\n", file=sys.stderr)

    return out


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 normalize_lenders.py <input.json> <output.json>", file=sys.stderr)
        print("       Use '-' as input to read from stdin.", file=sys.stderr)
        sys.exit(1)

    in_path = sys.argv[1]
    out_path = sys.argv[2]

    # Read
    if in_path == "-":
        raw = json.load(sys.stdin)
    else:
        with open(in_path, "r", encoding="utf-8") as f:
            raw = json.load(f)

    if not isinstance(raw, list):
        # Handle {data: [...]} wrapper some exporters produce
        raw = raw.get("data", raw.get("rows", []))

    print(f"  Input: {len(raw)} lenders", file=sys.stderr)

    # Normalize
    clean = normalize(raw)

    print(f"  Output: {len(clean)} lenders after exclusions", file=sys.stderr)

    # Write
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(clean, f, indent=2, ensure_ascii=False)

    print(f"  Written to {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
