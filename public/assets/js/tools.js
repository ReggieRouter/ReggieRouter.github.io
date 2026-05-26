/**
 * LendPaper Tool Registry
 * Single source of truth for all calculators and tools.
 */

const TOOLS = [
  { 
    id: "amo", 
    name: "Payment Breakdown", 
    desc: "Full payment breakdown by period with multi-scenario prepay logic.",
    status: "live", 
    group: "deal-math", 
    icon: "chart", 
    color: "green",
    slug: "/tools/payment-breakdown",
    presentation: "page",
    path: "calculators/AmoScheduleCalculator.html",
    kw: "amortization schedule prepay payoff buyout mca payment deal desk"
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
    group: "data", 
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
    name: "DSCR calculator",
    desc: "Debt service coverage ratio and payment-to-revenue benchmarking.",
    status: "live",
    group: "risk",
    icon: "refresh",
    color: "green",
    slug: "/tools/dscr",
    presentation: "page",
    path: "calculators/DSCRCalculator.html",
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
    slug: "/waterfall",
    presentation: "page",
    path: "waterfall.html",
    kw: "lender waterfall buy box fico tib revenue product type filter match"
  },
  { 
    id: "fundability", 
    name: "Fundability", 
    desc: "Combined net requirement and stacking risk assessment.",
    status: "live", 
    group: "deal-math", 
    icon: "stack", 
    color: "green",
    slug: "/tools/fundability",
    presentation: "page",
    path: "calculators/FundabilityCalculator.html",
    kw: "net funding wire origination fundability stacking risk positions"
  },
  { 
    id: "sba-rates", 
    name: "SBA rates & fees", 
    desc: "Dynamic SBA 7(a) scenario builder with guarantee fee logic.",
    status: "soon",
    group: "deal-math",
    icon: "flag",
    color: "green",
    slug: "/tools/sba-fees",
    presentation: "page",
    path: "calculators/SBAFeesCalculator.html",
    kw: "sba fees rates scenario builder 7a guarantee packaging search closing"
  },
  { 
    id: "roi", 
    name: "ROI Analysis", 
    desc: "Identify the break even point.",
    status: "soon", 
    group: "deal-math", 
    icon: "lineChart", 
    color: "green",
    href: "#",
    kw: "roi break even profit investment"
  },
  { 
    id: "uw-analysis", 
    name: "UW analysis", 
    desc: "Comprehensive deal health and credit scoring metrics.",
    status: "soon", 
    group: "risk", 
    icon: "grid", 
    color: "amber",
    href: "#",
    kw: "underwriting analysis credit scoring health"
  },
  { 
    id: "compliance", 
    name: "Compliance", 
    desc: "State-specific disclosure and regulation check.",
    status: "soon", 
    group: "risk", 
    icon: "stack", 
    color: "amber",
    href: "#",
    kw: "legal compliance regulation disclosure check"
  },
  { 
    id: "ucc-leads", 
    name: "UCC leads database", 
    desc: "Searchable UCC filings by state, date, and secured party.",
    status: "live", 
    group: "data", 
    icon: "db", 
    color: "green",
    slug: "https://www.registryroute.com/",
    presentation: "external",
    path: "https://www.registryroute.com/",
    target: "_blank",
    kw: "ucc leads filings database lookup secured prospecting"
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
