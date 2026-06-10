/**
 * LendPaper Tool Registry
 * Single source of truth for all calculators and tools.
 */

var TOOLS = [
  { 
    id: "amo", 
    name: "Amortization",
    desc: "Full payment schedule with pre-pay & buyout scenarios.",
    status: "live", 
    group: "deal-math", 
    icon: "chart", 
    color: "green",
    slug: "/tools/payment-breakdown",
    presentation: "page",
    path: "/calculators/AmoScheduleCalculator.html",
    kw: "amortization schedule prepay payoff buyout mca payment deal desk"
  },
  {
    id: "deal-read",
    name: "Deal Analysis",
    desc: "Read any deal in seconds — industry, credit, and revenue become a product stack, funding range, and talk track.",
    status: "live",
    group: "deal-math",
    icon: "search",
    color: "green",
    slug: "/tools/deal-read",
    presentation: "page",
    path: "/calculators/deal-read/index.html",
    kw: "deal read fundability naics industry credit fico revenue product stack talk track lender underwriting affordability"
  },
  {
    id: "affordability",
    name: "Payment Fit",
    desc: "See if the borrower can handle the payment — and whether the capital pays for itself.",
    status: "live",
    group: "deal-math",
    icon: "lineChart",
    color: "green",
    slug: "/tools/affordability",
    presentation: "page",
    path: "/calculators/AffordabilityCalculator.html",
    kw: "payment fit affordability roi break even payment load deposits cash cushion qualify borrower upside net"
  },
  /*
  {
    id: "verifier",
    name: "Business Verifier", 
    desc: "Verify business entity details, residential status, and D&B credentials.",
    status: "live", 
    group: "risk", 
    icon: "search", 
    color: "green",
    slug: "/tools/verifier",
    presentation: "page",
    path: "calculators/BusinessVerifier.html",
    kw: "business entity verification address check dnb registry underwriting"
  },
  */
  { 
    id: "registry", 
    name: "Secretary of State Search", 
    desc: "Search public business records and UCC filings.",
    status: "live",
    group: "risk",
    icon: "search",
    color: "green",
    slug: "https://www.registryroute.com/",
    presentation: "external",
    path: "https://www.registryroute.com/",
    target: "_blank",
    kw: "ucc lookup search public records registry route"
  },
  {
    id: "dscr",
    name: "DSCR",
    desc: "Debt service coverage ratio and payment-to-revenue benchmarking.",
    status: "live",
    group: "risk",
    icon: "refresh",
    color: "green",
    slug: "/tools/dscr",
    presentation: "page",
    path: "/calculators/DSCRCalculator.html",
    kw: "coverage dscr ratio revenue bank statement underwriting"
  },
  {
    id: "waterfall",
    name: "Lender Waterfall",
    desc: "Filter by FICO, revenue, time in business, and product type.",
    status: "live",
    group: "data",
    icon: "tiers",
    color: "green",
    slug: "/tools/waterfall",
    presentation: "page",
    path: "/waterfall.html",
    kw: "lender waterfall buy box fico tib revenue product type filter match"
  },
  {
    id: "fundability",
    name: "Position & Net",
    desc: "Combined net requirement and stacking risk assessment.",
    status: "live",
    group: "deal-math",
    icon: "stack",
    color: "green",
    slug: "/tools/fundability",
    presentation: "page",
    path: "/calculators/FundabilityCalculator.html",
    kw: "net funding wire origination fundability stacking risk positions"
  },
  {
    id: "sba-rates",
    name: "SBA Fees",
    desc: "Dynamic SBA 7(a) guarantee-fee & rate scenarios.",
    status: "hidden",
    group: "deal-math",
    icon: "flag",
    color: "green",
    slug: "/tools/sba-fees",
    presentation: "page",
    path: "/calculators/SBAFeesCalculator.html",
    kw: "sba fees rates scenario builder 7a guarantee packaging search closing"
  },
  // NAICS Search retired as a standalone tool — NAICS lookup now lives inside
  // Deal Analysis (search any industry or 6-digit code, with restricted-industry flags).
  {
    id: "legislation",
    name: "Compliance Desk",
    desc: "State + federal commercial financing disclosure law, mapped. Know where disclosure rules bite.",
    status: "live",
    group: "risk",
    icon: "flag",
    color: "green",
    slug: "/compliance",
    presentation: "page",
    path: "/legislation.html",
    kw: "legislation law regulation disclosure commercial financing state federal cfpb 1071 cfdl map tracker compliance bill statute"
  },
  {
    id: "uw-suite",
    name: "Underwriting suite",
    desc: "Tighten underwriting and identity checks before you fund. Tell us what you need.",
    status: "inquire",
    group: "risk",
    icon: "stack",
    color: "green",
    kw: "underwriting uw identity verification authentication fraud risk diligence inquire suite"
  },
  /*
  {
    id: "scripting",
    name: "Scripting", 
    desc: "Automate custom calculations and rules via LendPaper JS APIs.",
    status: "soon", 
    group: "deal-math", 
    icon: "code", 
    color: "amber", 
    href: "#",
    isPaid: true,
    kw: "scripting code api custom automation developer javascript"
  }
  */
];

// Exporting for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOOLS;
}
