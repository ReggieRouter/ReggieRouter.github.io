/**
 * LendPaper Tool Registry
 * Single source of truth for all calculators and tools.
 */

const TOOLS = [
  { 
    id: "amo", 
    name: "Amo schedule", 
    desc: "Full payment breakdown by period with multi-scenario prepay logic.",
    status: "live", 
    group: "deal-math", 
    icon: "chart", 
    color: "green",
    slug: "/tools/amo",
    presentation: "page",
    path: "./calculators/AmoScheduleCalculator.html",
    kw: "amortization schedule prepay payoff buyout mca payment deal desk"
  },
  { 
    id: "registry", 
    name: "Public registry search", 
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
    path: "./calculators/DSCRCalculator.html",
    kw: "coverage dscr ratio revenue bank statement underwriting"
  },
  { 
    id: "apr", 
    name: "APR calculator", 
    desc: "Factor-to-APR and APR-to-factor. Compare offers side by side.",
    status: "live", 
    group: "deal-math", 
    icon: "percent", 
    color: "green",
    slug: "/tools/apr",
    presentation: "modal",
    path: "./calculators/APRCalculator.html",
    kw: "factor rate apr interest convert comparison mca"
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
    path: "./calculators/FundabilityCalculator.html",
    kw: "net funding wire origination fundability stacking risk positions"
  },
  { 
    id: "sba-rates", 
    name: "SBA rates & fees", 
    desc: "Dynamic SBA 7(a) scenario builder with guarantee fee logic.",
    status: "live", 
    group: "deal-math", 
    icon: "refresh", 
    color: "green",
    slug: "/tools/sba-fees",
    presentation: "page",
    path: "./calculators/SBAFeesCalculator.html",
    kw: "sba fees rates scenario builder 7a guarantee packaging search closing"
  },
  { 
    id: "roi", 
    name: "ROI Analysis", 
    desc: "Identify the break even point.",
    status: "soon", 
    group: "deal-math", 
    icon: "chart", 
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
    status: "soon", 
    group: "data", 
    icon: "db", 
    color: "slate",
    href: "#",
    kw: "ucc leads filings database lookup secured prospecting"
  },
  { 
    id: "lender-dir", 
    name: "Lender directory", 
    desc: "Verified database of commercial lenders and buy boxes.",
    status: "soon", 
    group: "data", 
    icon: "search", 
    color: "slate",
    href: "#",
    kw: "lender directory database search buy box"
  }
];

// Exporting for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOOLS;
}
