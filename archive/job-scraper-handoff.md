# Job Scraper Handoff — 2026-05-30

## What exists

### recruiter.html
- Password-gated portal at lendpaper.com/recruiter
- Backed by Supabase (`https://arpquyoucdsdmbetgftj.supabase.co`, table: `job_postings`)
- Password: Master-Craft-359% (SHA-256 hash in PASS_HASH constant)
- Full CRUD — add/edit/delete postings, status workflow, filters, search

### scrape_jobs.py
- Reads lenders from `waterfall.html` (parses `lenderData` JS array) — **this should be changed**
- Discovers each lender's careers page: homepage link scan → common slug fallbacks (/careers, /jobs, etc.)
- Extracts job postings via Claude Haiku
- Deduplicates by company+title before inserting
- Writes to Supabase `job_postings` table
- Emails summary to stephengowa@gmail.com
- Run: `ANTHROPIC_API_KEY=... python3 scrape_jobs.py [--dry-run] [--lender NAME]`

## The one pending change
**Switch the lender source from waterfall.html to local Postgres.**

`underwriting_rules` in `localhost:5432/lendpaper_local` (user: stevegowa) is the authoritative lender DB. It has `lender_name` and `source_url` already structured — no HTML parsing needed.

Change in `scrape_jobs.py`:
- Replace `load_lenders()` (which parses waterfall.html) with a Postgres query:
  ```sql
  SELECT lender_name AS name, source_url FROM underwriting_rules WHERE source_url IS NOT NULL AND source_url != '';
  ```
- Add `psycopg2` (or `psycopg2-binary`) as a dependency
- DB connection: `host=localhost, dbname=lendpaper_local, user=stevegowa` (no password needed locally)
- Keep everything else the same — Supabase is still the write target for job_postings

## Local DB context
- Tool: Beekeeper Studio
- DB: `localhost:5432/lendpaper_local`, owner: stevegowa
- Tables: `state_registries`, `underwriting_rules`, `job_postings` (just created, empty)
- `job_postings` table was created locally too but is NOT the write target — Supabase is. Can drop it locally if confusing.

## Repo
- `github.com:ReggieRouter/lendpaper.git`, branch `main`
- Netlify auto-deploys on push
- Working directory: `~/Desktop/LendPaper`
- Always commit + push after edits
