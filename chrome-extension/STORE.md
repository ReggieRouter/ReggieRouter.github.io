# LendPaper — Chrome Web Store Listing Spec

This document details the copy, key selling points, installation guidelines, and graphical asset requirements for the **LendPaper** Chrome Extension store listing.

---

## 1. Store Metadata

*   **Extension Title:** LendPaper — Scenario Modeling Engine
*   **Short Title:** LendPaper
*   **Single-Sentence Summary (Max 160 chars):** Instant MCA & term payment calculators, FICO/revenue lender matchers, and 1-click CRM scripts — built for alt-finance sales reps and brokers.
*   **Categories:** Productivity / Developer Tools
*   **Support Email:** info@lendpaper.com

---

## 2. Marketing & Store Description

### The Hook (For High-Velocity Funding Desks)
Stop wasting time toggling between spreadsheets, PDF files, and messy scratchpads while you have a borrower on hold. **LendPaper** puts professional-grade SMB deal math, underwriting checks, and lender matching directly into your browser toolbar. 

Whether you are working in Salesforce, HubSpot, Gmail, or reviewing a bank statement PDF, LendPaper lets you structure alternative finance deals, evaluate funding scenarios, and copy pristine deal scripts in under 10 seconds.

---

### Key Features

#### ⚡ Quick Calc Payment Breakdown
*   Enter a funding amount, factor rate, and term to instantly generate daily and weekly payment equivalents.
*   **Live Script Preview:** See the full formatted breakdown script live in the popup before copying (no more truncated text or hidden formatting errors).
*   **1-Click Copy:** Copies a clean, professional, plain-text summary designed specifically to paste directly into Slack to your manager, an email to your borrower, or a CRM notepad.
*   **Strict Product Compliance:** Formatted terms strictly separate Merchant Cash Advances (factor costs, total payback) from Term Loans (rates, interest) to protect your desk from legal compliance audits.

#### 📁 Local Deal Storage ("Saved" Tab)
*   Name your calculations (e.g., "ACME Corp expansion") and save them to the extension's secure local memory.
*   Maintain a history of historical deals to easily run side-by-side scenario comparisons, modify active figures, or reload calculation structures in 1 click.

#### 🔎 Active Tab Scanner ("Analyze Page")
*   Click **"Analyze Active CRM / PDF Tab"** to automatically parse the page you are viewing.
*   LendPaper extracts FICO credit scores, Months in Business (TIB), and Monthly Gross Revenue from raw page text, automatically autofilling the calculator. Great for scraping Salesforce leads, broker submissions, or online bank statements.

#### 🌊 Lender Quick Match & Competing Offers
*   Instantly run FICO, TIB, and revenue criteria against LendPaper’s representative 43-lender waterfall list.
*   See which lenders are actively competing to buy the paper on your borrower's profile.
*   **1-Click Full Waterfall Access:** Open the complete LendPaper matrix with a single click.

#### 📄 Professional White-Label PDFs
*   Generate client-ready payment estimates as gorgeous print sheets or PDF downloads following strict, high-end design guidelines (`PDF_Export_Spec.md`).
*   **Lender Name Left Blank:** Keeps estimates strictly white-labeled so you can represent your own product line or maintain absolute control over the placement relationship.

---

### 👑 Upgrade to LendPaper Pro
Need customized branding? LendPaper Pro unlocks premium capabilities for institutional brokerages:
*   **Custom White-Labeling:** Replace LendPaper logos and colors with your own company branding inside the extension popup and on all exported PDF files.
*   **Automated CRM Integrations:** Sync saved calculations and borrower profiles directly into Salesforce, HubSpot, or Lendio with one click.
*   **Referral Routing & API Access:** Instantly submit matched borrower profiles straight to participating lenders' portals using your custom broker referral tracking URLs.
*   *Interested in Pro? Contact us at info@lendpaper.com.*

---

## 3. Graphical Asset Specifications

To list the extension on the Chrome Web Store, prepare the following visual assets:

### 1. Extension Icon
*   **Dimensions:** 128 × 128 px (PNG format)
*   **Design:** The LendPaper primary brand mark (dark green background `#1A3C2E` with the white document-fold icon).

### 2. Store Screenshots (Minimum 4)
*   **Dimensions:** 1280 × 800 px or 640 × 400 px (PNG or JPEG)
*   **Screenshots Breakdown:**
    *   **Screenshot 1 (Quick Calc):** Showing the Payment Breakdown view with a $150K MCA calculation, showing the live formatted scrollable text script.
    *   **Screenshot 2 (Saved Deals):** Showing a clean list of named client deals saved inside the popup.
    *   **Screenshot 3 (Lender Matching):** Showing active competing lenders matching a profile of 680 FICO and $50K revenue.
    *   **Screenshot 4 (PDF Export):** Showing the clean, white-labeled, print-ready document preview page.

### 3. Promotional Tiles (For store discovery)
*   **Small Tile:** 440 × 280 px (PNG format)
*   **Large Tile:** 920 × 680 px (PNG format)
*   **Marquee Tile:** 1400 × 560 px (PNG format)
*   **Design Rule:** Keep logo-mark centered, highly legible, and leverage the premium LendPaper green background gradient (`linear-gradient(135deg, #1A3C2E 0%, #2D6A4F 100%)`).

---

## 4. How to Install (Developer Unpacked Mode)

1.  Download or clone this repository repository folder.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** using the toggle switch in the top-right corner.
4.  Click the **"Load unpacked"** button in the top-left corner.
5.  Select the `chrome-extension/` directory.
6.  The LendPaper icon will appear in your Chrome toolbar. Pin it for instant access!
