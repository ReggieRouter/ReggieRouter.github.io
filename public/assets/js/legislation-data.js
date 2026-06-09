/**
 * LendPaper — Legislation Tracker seed data (Beta, LEN/legislation-tracker)
 * Commercial-financing DISCLOSURE law, state + federal.
 *
 * ⚠️ SEED DATA — representative, for demo. Citations / effective dates / scope
 * thresholds are approximate and MUST be verified against the official statute
 * and current legislative status before relying on them. Wire to the source
 * registry in markdowns/LEGAL.md Part II before launch. Not legal advice.
 *
 * status: 'enacted' | 'effective-soon' | 'pending' | 'none'
 */

var LEG_META = { updated: 'Jun 2026' };

var LEG_FEDERAL = {
  items: [
    {
      name: 'CFPB §1071 — Small Business Lending Data Rule',
      statusClass: 'final',
      statusLabel: 'Final rule',
      desc: 'Dodd-Frank §1071. Requires covered lenders to collect & report small-business credit application data. Final rule issued 2023; compliance dates phased by lender volume (subject to ongoing litigation). Not an APR-disclosure mandate, but reshapes data obligations for commercial lenders.'
    },
    {
      name: 'Small Business Financing Disclosure (federal proposals)',
      statusClass: 'proposed',
      statusLabel: 'Proposed',
      desc: 'Periodic Congressional proposals to extend TILA-style APR / total-cost disclosure to commercial financing. None enacted to date — federal coverage remains a patchwork driven by the states below.'
    },
    {
      name: 'TILA (Truth in Lending) — scope note',
      statusClass: 'final',
      statusLabel: 'In force',
      desc: 'TILA governs CONSUMER credit and generally does not reach business-purpose financing. This is why state commercial-financing disclosure laws exist — verify whether a deal is consumer- or business-purpose before assuming TILA applies.'
    }
  ]
};

var LEG_DATA = {
  CA: { name: 'California', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 1235)', citation: 'Cal. Fin. Code §22800 et seq.',
    effective: 'Disclosures req. Dec 9, 2022', scope: 'Commercial financing ≤ $500,000',
    desc: 'Requires standardized disclosures (amount financed, finance charge, estimated APR, payment amounts) for most commercial financing offers. Implemented via DFPI regulations.',
    url: 'https://dfpi.ca.gov/' }] },

  NY: { name: 'New York', status: 'enacted', bills: [{
    name: 'Commercial Finance Disclosure Law (CFDL)', citation: 'N.Y. Fin. Serv. Law Art. 8 (S5470-B)',
    effective: 'Aug 1, 2023', scope: 'Commercial financing ≤ $2,500,000',
    desc: 'Broad disclosure regime requiring APR, finance charge, and total repayment for sales-based and closed-end commercial financing. Enforced by NYDFS.',
    url: 'https://www.dfs.ny.gov/' }] },

  UT: { name: 'Utah', status: 'enacted', bills: [{
    name: 'Commercial Financing Registration & Disclosure Act', citation: 'Utah Code §7-27',
    effective: 'Jan 1, 2023', scope: 'Most commercial financing; provider registration',
    desc: 'Requires providers to register with the Dept. of Financial Institutions and deliver specified disclosures. Lighter touch than CA/NY — no APR mandate.',
    url: 'https://dfi.utah.gov/' }] },

  VA: { name: 'Virginia', status: 'enacted', bills: [{
    name: 'Sales-Based Financing Disclosure (SB 1027)', citation: 'Va. Code §6.2-2228 et seq.',
    effective: 'Jul 1, 2022', scope: 'Sales-based financing; broker registration',
    desc: 'Disclosure for sales-based (revenue-based) financing plus registration of financing brokers.',
    url: 'https://scc.virginia.gov/' }] },

  GA: { name: 'Georgia', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 90)', citation: 'O.C.G.A. §10-1-393',
    effective: 'Jan 1, 2024', scope: 'Commercial financing ≤ $500,000',
    desc: 'Requires disclosure of total cost and payment terms for covered commercial financing transactions.',
    url: 'https://www.legis.ga.gov/' }] },

  FL: { name: 'Florida', status: 'enacted', bills: [{
    name: 'Florida Commercial Financing Disclosure Law', citation: 'Fla. Stat. §559.961 et seq.',
    effective: 'Jan 1, 2024 (enforce. Jul 2024)', scope: 'Commercial financing ≤ $500,000',
    desc: 'Standardized disclosure of amount financed, finance charge, and payment schedule for covered commercial financing.',
    url: 'https://www.flsenate.gov/' }] },

  CT: { name: 'Connecticut', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 1032)', citation: 'Conn. Gen. Stat. (P.A. 23-201)',
    effective: 'Jul 1, 2024', scope: 'Commercial financing ≤ $250,000; provider registration',
    desc: 'Disclosure plus provider/broker registration with the Dept. of Banking.',
    url: 'https://www.cga.ct.gov/' }] },

  MO: { name: 'Missouri', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure Law', citation: 'Mo. Rev. Stat. §427',
    effective: '2024', scope: 'Commercial financing; broker registration',
    desc: 'Requires disclosures and registration of commercial financing brokers.',
    url: 'https://www.senate.mo.gov/' }] },

  KS: { name: 'Kansas', status: 'effective-soon', bills: [{
    name: 'Commercial Financing Disclosure Act', citation: 'Kan. Stat. (2024 session)',
    effective: 'Phasing in', scope: 'Commercial financing; disclosure + registration',
    desc: 'Disclosure regime with staggered enforcement. Confirm current effective/enforcement dates before relying.',
    url: 'http://www.kslegislature.org/' }] },

  IL: { name: 'Illinois', status: 'pending', bills: [{
    name: 'Small Business Financing Disclosure (introduced)', citation: 'IL General Assembly',
    effective: 'Not yet effective', scope: 'Sales-based & closed-end commercial financing',
    desc: 'Disclosure bill modeled on NY/CA introduced in recent sessions; status varies by session — verify.',
    url: 'https://www.ilga.gov/' }] },

  NJ: { name: 'New Jersey', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (A1414 / S companion)', citation: 'NJ Legislature',
    effective: 'Not yet effective', scope: 'Commercial financing disclosure',
    desc: 'Long-running disclosure proposal; re-introduced across sessions. Confirm current bill number and status.',
    url: 'https://www.njleg.state.nj.us/' }] },

  NC: { name: 'North Carolina', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (introduced)', citation: 'NC General Assembly',
    effective: 'Not yet effective', scope: 'Commercial financing disclosure',
    desc: 'Disclosure bill introduced; not enacted. Verify session status.',
    url: 'https://www.ncleg.gov/' }] },

  MD: { name: 'Maryland', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (introduced)', citation: 'MD General Assembly',
    effective: 'Not yet effective', scope: 'Commercial financing disclosure',
    desc: 'Disclosure proposal introduced in recent sessions; not enacted. Verify.',
    url: 'https://mgaleg.maryland.gov/' }] },

  MI: { name: 'Michigan', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (introduced)', citation: 'MI Legislature',
    effective: 'Not yet effective', scope: 'Commercial financing disclosure',
    desc: 'Disclosure bill introduced; status varies. Verify before relying.',
    url: 'https://www.legislature.mi.gov/' }] },

  PA: { name: 'Pennsylvania', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (introduced)', citation: 'PA General Assembly',
    effective: 'Not yet effective', scope: 'Commercial financing disclosure',
    desc: 'Disclosure proposal introduced; not enacted. Verify session status.',
    url: 'https://www.legis.state.pa.us/' }] }
};

/* Full names for every jurisdiction (detail panel fallback for states w/o data) */
var STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
  IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

if (typeof module !== 'undefined' && module.exports) { module.exports = { LEG_DATA: LEG_DATA, LEG_FEDERAL: LEG_FEDERAL, LEG_META: LEG_META, STATE_NAMES: STATE_NAMES }; }
