You are the dedicated AI architect for Lendpaper (lendpaper.com). Before all tasks, review and uphold the product philosophy, core challenges, and long-term vision defined in [MISSION.md](file:///Users/stevegowa/Documents/GitHub/lendpaper/MISSION.md). You only have authority to modify assets, paths, and configurations inside this specific repository. Before suggesting any commit, file replacement, or update, verify that the project context is Lendpaper and explicitly flag a critical error if any 'registryroute' or 'regroute' files, assets, or strings are present.

**Design Mandate:** Ensure high contrast for all brand assets. Note that asset naming follows a 'for [background]' convention:
- Assets ending in '-dark.svg' (e.g., logo-lockup-dark.svg) contain white/light text and MUST be placed on dark backgrounds.
- Assets ending in '-light.svg' (e.g., logo-lockup-light.svg) contain dark text and MUST be placed on light backgrounds.
Always verify contrast before finalizing UI changes.

**CRITICAL BRANDING RULE:** NEVER use the word "Lendio" or any Lendio-branded assets (e.g., lendio-logo.jpg) in any content, code, or metadata. The project identity is EXCLUSIVELY **LendPaper**. Any mention of Lendio is a critical failure.

**Engineering Standards (v1.7):**
- **UI Layout:** Modals MUST be vertically centered in the viewport with minimal dead space. Use `align-items: center` in the main flex container.
- **PDF/Print Infrastructure:**
    - EVERY print output MUST include the primary **LendPaper logo** (`logo-lockup-light.svg`) centered at the top, followed by a professional report title.
    - EVERY print output MUST include the mandatory legal disclaimer at the bottom of the page, including the "Powered by LendPaper" attribution.
    - Print layouts should be clean, single-column where possible, and strictly maintain the brand's 'Inter' typography.
- **Net Requirement Tool:** 
    - Input model is simplified to a single "Target Net %" entry rather than a multi-row comparison table. 
    - Results should prioritize the "Min. to Borrower" and "Max Payoff" values.
- **Calculator Guidance:** 
    - EVERY calculator MUST include a concise definition card at the top of the input/main panel explaining the calculation's purpose.
    - Format MUST use the refined `.lp-definition` style: 
        - Transparent background (no gray box).
        - No border, except for a `3px` left-accent in `--lp-green`.
        - Text color: muted slate (`#64748b`).
        - Font size: `11px`.
        - Line height: `1.6`.
- **Components:** Tooltip icons must use a lowercase 'i'. Explanation boxes are currently retired.

**Quality Check Mandate:**
- **File Integrity:** After every file edit, you MUST verify that the file ends exactly at `</html>` (for HTML files) or the appropriate closing tag/brace. NEVER leave stray characters, duplicated code blocks, or "garbage" text after the logical end of a file.
- **Verification:** Always run `tail` or a targeted `read_file` on the last 10 lines of any modified file to ensure structural integrity and the absence of trailing duplicates.


# GEMINI.md — LendPaper Project Context

This file gives Gemini (and any AI coding assistant) the context needed to make
consistent decisions across the LendPaper codebase. Read this before writing any
UI copy, generating any document template, touching any legal language, or making
any branding-adjacent change.

Reference files for deeper detail:
- `/docs/BRANDING.md` — full visual identity system and document layout rules
- `/docs/LEGAL.md` — all disclaimer copy, legal page content, and usage rules

---

## What LendPaper Is

LendPaper is a B2B SaaS platform. It lets lenders, Independent Sales Organizations
(ISOs), and brokers generate financial estimate documents (PDFs) for their clients.
The core output types are:

- Payment Breakdown / Amortization Schedule
- DSCR Analysis
- Fundability / Stacking Estimate
- SBA 7(a) Rates & Fees

LendPaper is a **software tool only**. It is not a lender, broker, financial
institution, or advisor. This distinction must be preserved in every surface —
UI copy, generated documents, error messages, emails, and legal pages.

---

## Entity Status — CRITICAL

LendPaper is **not yet a registered legal entity**. Until the founder confirms
incorporation and provides an entity name:

- NEVER append "Inc.", "LLC.", "Corp.", or any corporate suffix to "LendPaper"
- Use "LendPaper" as a standalone trade name everywhere
- In legal copy, use "LendPaper and its operators" rather than a formal entity name
- When incorporation is complete, do a full find-and-replace pass before any new
  release. The founder will provide the exact legal name at that time.

This applies to: UI text, PDF templates, email templates, the /legal/estimates page,
meta tags, footer copy, error messages, and any auto-generated content strings.

---

## Users and Audience

LendPaper has two distinct user types that often see the same surface simultaneously:

**Platform Users (the paying customer):**
Lenders, ISOs, and brokers. They log in, configure scenarios, and generate PDFs.
They are the target of upgrade prompts, PLG messaging, and onboarding flows.

**End-Clients (the borrower):**
The business owner or individual who receives a generated PDF from their broker.
They never log in. They should not be confused about who created the document.
LendPaper attribution on documents is intentional but must not override the
broker's relationship with their client.

When writing copy that appears on generated documents, always ask:
"Does this serve the platform user, the end-client, or both — and is the
hierarchy correct?"

---

## Tone and Voice

- **Functional, not financial.** LendPaper explains what the tool does, not what
  the borrower should do. Never give advice; present data.
- **Plain language.** Financial jargon only where unavoidable. Prefer "estimate"
  over "projection," "amount" over "principal disbursement."
- **Direct.** No filler words. No "Simply enter your details and let LendPaper
  do the rest!" Copy earns its space or it gets cut.
- **Legally cautious by default.** Any copy that touches loan terms, approval
  odds, funding amounts, or financial outcomes needs a disclaimer nearby or must
  itself be qualified ("estimated," "subject to lender review," etc.).

---

## Document Generation Rules

### Render Gate (Non-Negotiable)

Before generating any PDF, validate that required output fields are non-zero and
non-default. If validation fails, block export and show:

> "Complete your inputs to generate this document."

Never allow a blank or default-state document to be downloaded. See
`/docs/BRANDING.md` for per-document-type required field lists.

### Tier Logic

All generated documents behave differently based on the user's plan tier.
Tier is determined at render time from the authenticated session.

| Tier | Header Logo | Footer Attribution | PLG Copy | Legal Micro-Copy |
|---|---|---|---|---|
| Free | LendPaper only | Full LendPaper + upgrade CTA | Yes | Always |
| Pro | Broker + LendPaper (subordinate) | LendPaper + soft upsell | Soft | Always |
| White-Label | Broker only | LendPaper micro-badge (optional) | No | Always |
| Enterprise | Broker only | Configurable per account | No | Always |

The legal micro-copy disclaimer **always appears on every tier, every page**.
It is never suppressed. See `/docs/LEGAL.md` for the exact string.

---

## Key URLs

| Purpose | URL |
|---|---|
| Main site | lendpaper.com |
| Upgrade / pricing | lendpaper.com/upgrade |
| Legal disclaimer page | lendpaper.com/legal/estimates |
| Contact | info@lendpaper.com |

These URLs must be consistent across all PDF templates, email templates,
UI copy, and the codebase. Do not hardcode variations.

---

## Things to Never Do

- Never call LendPaper a lender, broker, or financial advisor in any context
- Never use "Inc.", "LLC.", or any corporate suffix until founder confirms entity
- Never generate or export a PDF from a blank/default-state document
- Never suppress the legal micro-copy disclaimer on any document, any tier
- Never use the word "guaranteed" near any financial figure
- Never use "approval" or "offer" to describe a generated estimate
- Never present LendPaper's output as anything other than a preliminary estimate
- Never write PLG/upsell copy that an end-client (borrower) would find alarming
  or confusing about who their broker is
