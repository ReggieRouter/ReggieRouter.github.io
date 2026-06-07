/**
 * LendPaper Compliance Rules — machine-readable state regulatory matrix.
 *
 * SINGLE SOURCE OF TRUTH for regulatory CONTENT is markdowns/LEGAL.md Part II.
 * This file is its machine-readable counterpart, consumed by compliance.js.
 * When LEGAL.md Part II changes, update this file in the same commit.
 *
 * Statuses: "law" | "pending" | "none" | "verify"
 * All regulatory text here is pending attorney review (LEGAL.md §6).
 */

window.LP_COMPLIANCE_RULES = {
  version: "2026-06-07",

  // Canonical "not legal advice" disclaimer — LEGAL.md §14. NEVER hardcode
  // this string anywhere else; always render via LPCompliance.disclaimer*().
  disclaimer: "This information is provided for general reference only and does not constitute legal advice. Consult qualified legal counsel for guidance specific to your situation.",

  // Primary authoritative sources — mirrors LEGAL.md §15 Source Registry.
  sources: {
    "fcc-tcpa":       { name: "FCC — TCPA rules",                              url: "https://www.fcc.gov/tcpa" },
    "ftc-tsr":        { name: "FTC — Telemarketing Sales Rule",                url: "https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule" },
    "ftc-canspam":    { name: "FTC — CAN-SPAM compliance guide",               url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
    "ftc-safeguards": { name: "FTC — GLBA Safeguards Rule",                    url: "https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know" },
    "ftc-udap":       { name: "FTC Act §5 (UDAP)",                             url: "https://www.ftc.gov/legal-library/browse/statutes/federal-trade-commission-act" },
    "cfpb-1071":      { name: "CFPB — §1071 small business lending rule",      url: "https://www.consumerfinance.gov/1071-rule/" },
    "ecfr-regb":      { name: "Regulation B (12 CFR 1002) — ECOA",             url: "https://www.ecfr.gov/current/title-12/chapter-X/part-1002" },
    "ny-cfdl":        { name: "NY Financial Services Law Art. 8 (CFDL)",       url: "https://www.nysenate.gov/legislation/laws/FIS/A8" },
    "ny-dfs-600":     { name: "NYDFS — 23 NYCRR Part 600",                     url: "https://www.dfs.ny.gov/industry_guidance/regulations/final_financial_services/rf_finservices_23nycrr600_text" },
    "ny-banking-9":   { name: "NY Banking Law Art. 9 (licensing)",             url: "https://www.nysenate.gov/legislation/laws/BNK/A9" },
    "ca-dfpi":        { name: "CA DFPI — SB 1235 commercial disclosures",      url: "https://dfpi.ca.gov/regulated-industries/california-financing-law/about-california-financing-law/california-financing-law-commercial-financing-disclosures/" },
    "ca-sb666":       { name: "CA SB 666 — prohibited fees",                   url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB666" },
    "ca-ccpa":        { name: "CA AG — CCPA/CPRA",                             url: "https://oag.ca.gov/privacy/ccpa" },
    "md-sb881":       { name: "MD SB 881 (2026) — disclosure bill",            url: "https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/sb0881?ys=2026RS" },
    "md-ofr":         { name: "MD Office of Financial Regulation",             url: "https://www.labor.maryland.gov/finance/" },
    "de-usury":       { name: "DE Code Title 6 Ch. 23 (usury)",                url: "https://delcode.delaware.gov/title6/c023/index.html" },
    "ut-dfi":         { name: "UT DFI — commercial financing registration",    url: "https://dfi.utah.gov/non-depository/commercial-financing/" },
    "va-sbf":         { name: "VA Code 6.2-22.1 — sales-based financing",      url: "https://law.lis.virginia.gov/vacodefull/title6.2/chapter22.1/" }
  },

  // Federal baseline — applies in every state. LEGAL.md §8–§9, §12.
  federal: {
    outreach: [
      { id: "tcpa-consent",  channel: "sms_call", text: "Marketing calls/texts require prior express written consent (TCPA). The 2023 one-to-one consent rule was vacated (11th Cir., 2025) — bundled consent is permissible, but PEWC still applies.", source: "fcc-tcpa" },
      { id: "tcpa-optout",   channel: "sms_call", text: "Honor STOP/QUIT/REVOKE/OPT OUT/CANCEL/UNSUBSCRIBE/END within 10 business days (FCC revocation rule, in effect Apr 2025).", source: "fcc-tcpa" },
      { id: "canspam",       channel: "email",    text: "CAN-SPAM applies to B2B email: truthful headers/subject, physical postal address, working opt-out honored within 10 business days.", source: "ftc-canspam" },
      { id: "tsr-b2b",       channel: "call",     text: "TSR misrepresentation prohibitions extend to B2B telemarketing (2024 amendments). Keep call, consent, and DNC records.", source: "ftc-tsr" }
    ],
    conduct: [
      { id: "no-absolutes",  text: "Never guarantee approvals, rates, timelines, or outcomes. All terms are subject to lender underwriting and final approval.", source: "ftc-udap" },
      { id: "no-misrep",     text: "Represent product type, interest rate, factor rate, term, payment frequency, and funding timing accurately. A factor rate is not an interest rate.", source: "ftc-udap" }
    ],
    privacy: [
      { id: "glba",          text: "GLBA Safeguards Rule reaches loan brokers/finders handling customer financial data: written infosec program, encryption, MFA, FTC breach notice within 30 days (≥500 consumers).", source: "ftc-safeguards" },
      { id: "ecoa",          text: "ECOA/Reg B adverse-action notices apply to business credit (written notice with reasons for applicants ≤$1M gross revenue).", source: "ecfr-regb" }
    ]
  },

  // Language linter rules — extends LEGAL.md Part I §5 + §9.1 "No Absolutes".
  prohibitedPhrases: [
    { pattern: /guarantee(d)?\s+(approval|rate|fund|outcome)/i, suggestion: "Use: “subject to lender underwriting and approval”" },
    { pattern: /you\s+(will|are going to)\s+be\s+approved/i,    suggestion: "Use: “subject to lender approval”" },
    { pattern: /you\s+qualify\s+for/i,                          suggestion: "Remove — qualification is never implied." },
    { pattern: /guaranteed/i,                                   suggestion: "Never use “guaranteed” in any financial context." },
    { pattern: /risk[-\s]?free/i,                               suggestion: "Never use “risk-free” in any financial context." },
    { pattern: /lowest\s+rate/i,                                suggestion: "Drop superlatives or cite a verifiable comparison." },
    { pattern: /locked\s+(in\s+)?rate/i,                        suggestion: "Use: “estimated rate, subject to final review”" },
    { pattern: /\bquote\b/i,                                    suggestion: "Use “estimate” or “scenario” (LEGAL.md §5)." },
    { pattern: /\boffer\b/i,                                    suggestion: "Use “modeled terms” or “estimated terms” (LEGAL.md §5)." },
    { pattern: /lendpaper\s+(inc|llc|corp)/i,                   suggestion: "“LendPaper” only — no corporate suffix until incorporation is confirmed." }
  ],

  // State matrix — LEGAL.md §13. Keys are USPS codes; anything absent
  // falls back to { status: "none" } = federal baseline only.
  states: {
    NY: {
      name: "New York",
      disclosureLaw: { status: "law", id: "CFDL", aprRequired: true, threshold: 2500000,
        summary: "NY Commercial Finance Disclosure Law: standardized disclosures (incl. APR converted from factor rate) required on commercial financing offers of $2.5M or less. Brokers must disclose compensation and keep timestamped transmission evidence." },
      disclosures: {
        calculator: "New York requires APR disclosure on commercial financing offers of $2.5M or less (NY CFDL) — a factor rate or simple interest rate alone is not sufficient on a specific offer.",
        pdf: "NEW YORK NOTICE: This estimate is not a CFDL disclosure. New York law (Fin. Serv. Law Art. 8; 23 NYCRR 600) requires standardized disclosures, including APR, at the time a specific commercial financing offer of $2,500,000 or less is extended.",
        talktrack: "For NY borrowers: never state cost as factor rate alone on an offer — CFDL requires APR. Broker compensation must be disclosed in writing.",
        sms: null, email: null
      },
      underwritingDocs: ["CFDL standardized disclosure form (offer stage)", "Broker compensation disclosure", "Disclosure transmission evidence (timestamped)"],
      licensing: "Banking Law Art. 9: license required for business loans ≤$50k at rates above 16%. CFDL duties attach to brokers.",
      usury: "Civil 16% (unavailable to corporate borrowers) / criminal 25%. Loans over $2.5M exempt.",
      products: { mca: { available: true, note: "COJ against out-of-state small businesses is banned in NY; CFDL disclosure applies." } },
      emerging: "Broker-licensing bills recur in Albany — monitored monthly.",
      sourceIds: ["ny-cfdl", "ny-dfs-600", "ny-banking-9"]
    },
    CA: {
      name: "California",
      disclosureLaw: { status: "law", id: "SB 1235", aprRequired: true, threshold: 500000,
        summary: "CA SB 1235 (DFPI regs): consumer-style disclosures incl. APR — even for sales-based financing — on commercial financing offers of $500k or less. SB 666 bans certain provider/broker fees charged to small businesses." },
      disclosures: {
        calculator: "California requires APR disclosure on commercial financing offers of $500,000 or less (SB 1235 / DFPI) — including sales-based financing.",
        pdf: "CALIFORNIA NOTICE: This estimate is not an SB 1235 disclosure. California law (Fin. Code §§22800–22805; DFPI regs) requires standardized disclosures, including APR, when a specific commercial financing offer of $500,000 or less is extended. SB 666 prohibits certain fees charged to small businesses.",
        talktrack: "For CA borrowers: APR disclosure is mandatory on covered offers; never charge or quote fees prohibited by SB 666 (junk platform fees, ACH fees, UCC fees >150% of cost).",
        sms: null, email: null
      },
      underwritingDocs: ["SB 1235 / DFPI disclosure forms (offer stage)", "SB 666 fee-prohibition check"],
      licensing: "California Financing Law license (DFPI) for lenders and certain broker activity.",
      usury: "Const. Art. XV ~10% cap with broad exemptions for licensed lenders.",
      products: { mca: { available: true, note: "Sales-based financing is squarely covered by SB 1235 APR disclosure." } },
      emerging: "Active CCPA/CPRA enforcement — B2B contact data fully in scope since 2023.",
      sourceIds: ["ca-dfpi", "ca-sb666", "ca-ccpa"]
    },
    MD: {
      name: "Maryland",
      disclosureLaw: { status: "pending", id: "SB 881 (2026)", aprRequired: false, threshold: 2500000,
        summary: "No disclosure law in effect. SB 754 (2025) died; SB 881 (2026 session) is pending with proposed effective date Oct 1, 2026 — modeled on NY CFDL (APR disclosure, ≤$2.5M, OFR enforcement)." },
      disclosures: {
        calculator: null,
        pdf: null,
        talktrack: "Maryland: no disclosure law in effect yet, but SB 881 (NY-style APR disclosure) is pending — monitored monthly. Build deals as if disclosure is coming.",
        sms: null, email: null,
        internal: "MD WATCH: SB 881 (2026) pending — proposed NY-style APR disclosure effective 10/1/2026 if enacted."
      },
      underwritingDocs: [],
      licensing: "MD OFR lender licensing regime applies to certain credit activity today.",
      usury: "General caps with commercial exemptions.",
      products: { mca: { available: true, note: null } },
      emerging: "SB 881 (2026) pending — scraper watches the bill page.",
      sourceIds: ["md-sb881", "md-ofr"]
    },
    DE: {
      name: "Delaware",
      disclosureLaw: { status: "none", id: null, aprRequired: false, threshold: null,
        summary: "No commercial financing disclosure law and none pending identified. Division of Banking has begun registering MCA firms (2025 enforcement actions) — monitored." },
      disclosures: {
        calculator: null,
        pdf: null,
        talktrack: "Delaware: no disclosure statute; no usury cap on business loans over $100k and no corporate usury defense. Watch the new MCA registration/enforcement trend.",
        sms: null, email: null,
        internal: "DE WATCH: Division of Banking MCA registration + 2025 enforcement actions — monitored."
      },
      underwritingDocs: [],
      licensing: "Title 5 lender licensing; MCA registration trend emerging (2025).",
      usury: "No cap for business loans over $100k (6 Del. C. §2301); corporations cannot raise usury defense (§2306).",
      products: { mca: { available: true, note: null } },
      emerging: "Registration/enforcement activity — scraper watches DE sources.",
      sourceIds: ["de-usury"]
    },

    // Disclosure-law states beyond the four priority states — light entries.
    UT: { name: "Utah",        disclosureLaw: { status: "law", id: "CFRDA", aprRequired: false, threshold: 1000000, summary: "Commercial Financing Registration & Disclosure Act: DFI registration + disclosures (since Jan 2023)." }, disclosures: { calculator: "Utah requires registration and commercial financing disclosures (Commercial Financing Registration & Disclosure Act).", pdf: "UTAH NOTICE: Utah's Commercial Financing Registration & Disclosure Act requires registered providers to deliver disclosures on covered commercial financing." }, sourceIds: ["ut-dfi"] },
    VA: { name: "Virginia",    disclosureLaw: { status: "law", id: "SBF Act", aprRequired: false, threshold: 500000, summary: "Sales-based financing providers/brokers must register with the SCC and provide disclosures (since 2022)." }, disclosures: { calculator: "Virginia requires SCC registration and disclosures for sales-based financing (Code of Va. 6.2, Ch. 22.1).", pdf: "VIRGINIA NOTICE: Sales-based financing in Virginia requires provider/broker registration and statutory disclosures (Code of Va. Title 6.2, Ch. 22.1)." }, sourceIds: ["va-sbf"] },
    GA: { name: "Georgia",     disclosureLaw: { status: "law", id: "GA CFD", aprRequired: false, threshold: 500000, summary: "Commercial financing disclosures ≤$500k; no registration (mandatory Jan 2024)." }, disclosures: { calculator: "Georgia requires commercial financing disclosures on covered transactions of $500,000 or less.", pdf: "GEORGIA NOTICE: Georgia's commercial financing disclosure law requires statutory disclosures on covered transactions of $500,000 or less." }, sourceIds: [] },
    FL: { name: "Florida",     disclosureLaw: { status: "law", id: "FL CFDL", aprRequired: false, threshold: 500000, summary: "Commercial Financing Disclosure Law ≤$500k (transactions on/after Jan 1, 2024)." }, disclosures: { calculator: "Florida requires commercial financing disclosures on covered transactions of $500,000 or less (FL CFDL).", pdf: "FLORIDA NOTICE: Florida's Commercial Financing Disclosure Law requires statutory disclosures on covered transactions of $500,000 or less." }, sourceIds: [] },
    CT: { name: "Connecticut", disclosureLaw: { status: "law", id: "CT SBF", aprRequired: true, threshold: 250000, summary: "Disclosures for sales-based financing ≤$250k + registration (since July 2023)." }, disclosures: { calculator: "Connecticut requires registration and disclosures (incl. financing cost metrics) for sales-based financing of $250,000 or less.", pdf: "CONNECTICUT NOTICE: Sales-based financing of $250,000 or less in Connecticut requires statutory disclosures and provider registration." }, sourceIds: [] },
    KS: { name: "Kansas",      disclosureLaw: { status: "law", id: "KS CFDA", aprRequired: false, threshold: 500000, summary: "Commercial Financing Disclosure Act (2024): disclosures prior to consummation." }, disclosures: { calculator: "Kansas requires commercial financing disclosures prior to consummation (Commercial Financing Disclosure Act).", pdf: "KANSAS NOTICE: Kansas' Commercial Financing Disclosure Act requires statutory disclosures before consummation of covered commercial financing." }, sourceIds: [] },
    MO: { name: "Missouri",    disclosureLaw: { status: "law", id: "MO CFDL", aprRequired: false, threshold: 500000, summary: "Commercial Financing Disclosure Law: disclosures + provider registration (effective Feb 28, 2025)." }, disclosures: { calculator: "Missouri requires provider registration and commercial financing disclosures (effective Feb 2025).", pdf: "MISSOURI NOTICE: Missouri's Commercial Financing Disclosure Law requires registration and statutory disclosures on covered commercial financing." }, sourceIds: [] },
    TX: { name: "Texas",       disclosureLaw: { status: "verify", id: "HB 700 (2025)", aprRequired: false, threshold: null, summary: "Disclosure regime enacted 2025 (HB 700) — VERIFY effective date and scope before relying." }, disclosures: { calculator: null, pdf: null, internal: "TX VERIFY: HB 700 (2025) commercial financing disclosures — confirm effective date/scope before surfacing to users." }, sourceIds: [] },
    LA: { name: "Louisiana",   disclosureLaw: { status: "verify", id: "2025 law", aprRequired: false, threshold: null, summary: "Disclosure regime enacted 2025 — VERIFY effective date and scope before relying." }, disclosures: { calculator: null, pdf: null, internal: "LA VERIFY: 2025 commercial financing disclosure law — confirm effective date/scope before surfacing to users." }, sourceIds: [] }
  }
};
