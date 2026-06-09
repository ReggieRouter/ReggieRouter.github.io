/**
 * LendPaper — Compliance Desk seed data (Beta, LEN-159 / legislation-tracker)
 * Commercial-financing DISCLOSURE law, state + federal.
 *
 * ⚠️ SEED DATA — representative, for demo. Citations / effective dates / scope
 * thresholds / penalty figures are sourced from markdowns/LEGAL.md Part II
 * (§10, §13 matrix, §15 source registry) and primary-source research, but MUST
 * be re-verified against the official statute and current legislative status
 * before relying on them. Not legal advice.
 *
 * status: 'enacted' | 'effective-soon' | 'pending' | 'none'
 *
 * Per-bill fields (LEN-159):
 *   name, citation, scope, desc
 *   effISO        ISO date the law took/takes effect ('YYYY-MM-DD'), or null when pending.
 *                 The UI formats this as "Mon YYYY"; future dates render as "effective soon".
 *   asSoonAs      pending-only: short earliest-effective estimate shown in place of a date.
 *   asSoonAsExplain  pending-only: 1-2 sentences shown on hover / in the modal explaining timing.
 *   penaltyText   human display of penalty/enforcement exposure.
 *   penaltyMax    largest per-violation USD figure as a number (for sorting), or null
 *                 when enforcement is injunctive / no fixed per-violation dollar figure.
 *   url           THE STATUTE — link to the actual legislation / regulator page.
 *   newsUrl/newsTitle  a news / trade-press / law-firm client-alert covering the law.
 */

var LEG_META = { updated: 'Jun 2026' };

var LEG_FEDERAL = {
  items: [
    {
      name: 'CFPB §1071 — Small Business Lending Data Rule',
      statusClass: 'final',
      statusLabel: 'Final rule',
      desc: 'Dodd-Frank §1071. Requires covered lenders to collect & report small-business credit application data. Revised final rule (May 2026): narrowed scope, single compliance date Jan 1, 2028, first filing June 2029, ≥1,000 originations/yr threshold. Applies to covered lenders, not SaaS vendors. Litigation ongoing — re-verify before building features on it.',
      url: 'https://www.consumerfinance.gov/1071-rule/'
    },
    {
      name: 'Small Business Financing Disclosure (federal proposals)',
      statusClass: 'proposed',
      statusLabel: 'Proposed',
      desc: 'Periodic Congressional proposals to extend TILA-style APR / total-cost disclosure to commercial financing. None enacted to date — federal coverage remains a patchwork driven by the states below. 2025 CFPB determination: state disclosure laws are NOT preempted by TILA.',
      url: 'https://www.consumerfinance.gov/about-us/newsroom/state-disclosure-laws-business-lending-consistent-with-truth-in-lending-act/'
    },
    {
      name: 'TILA (Truth in Lending) — scope note',
      statusClass: 'final',
      statusLabel: 'In force',
      desc: 'TILA governs CONSUMER credit and generally does not reach business-purpose financing. This is why state commercial-financing disclosure laws exist — verify whether a deal is consumer- or business-purpose before assuming TILA applies.',
      url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/'
    }
  ]
};

var LEG_DATA = {
  CA: { name: 'California', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 1235) + SB 666 fee limits', citation: 'Cal. Fin. Code §§22800–22805; 10 CCR §§900–956',
    effISO: '2022-12-09', scope: 'Commercial financing ≤ $500,000',
    penaltyText: 'Up to $2,500 / violation (DFPI under the CFL); SB 666 prohibited fees $500–$2,500 statutory damages + attorneys’ fees',
    penaltyMax: 2500,
    desc: 'Standardized disclosures (amount financed, APR incl. for sales-based financing, finance charge, payment amounts, prepayment policies) on covered offers, via DFPI regulations. SB 666 (eff. Jan 1, 2024) additionally bars certain ACH/platform/collateral-monitoring/UCC fees against small businesses.',
    url: 'https://dfpi.ca.gov/regulated-industries/california-financing-law/about-california-financing-law/california-financing-law-commercial-financing-disclosures/',
    newsUrl: 'https://dfpi.ca.gov/press_release/dfpis-commercial-financing-disclosure-regulations-approved-to-become-effective-as-of-december-9-2022/',
    newsTitle: 'DFPI — Commercial Financing Disclosure Regulations Effective Dec 9, 2022' }] },

  NY: { name: 'New York', status: 'enacted', bills: [{
    name: 'Commercial Finance Disclosure Law (CFDL)', citation: 'N.Y. Fin. Serv. Law Art. 8 (S5470-B); 23 NYCRR Part 600',
    effISO: '2023-08-01', scope: 'Commercial financing ≤ $2,500,000',
    penaltyText: 'Up to $2,000 / violation ($10,000 per knowing violation) + restitution (NYDFS)',
    penaltyMax: 10000,
    desc: 'Broad disclosure regime requiring APR (converted from factor rate for sales-based products), finance charge, and total repayment for closed-end, open-end, sales-based/MCA, factoring and lease financing. Brokers are directly regulated: compensation must be disclosed and transmission timestamped. Enforced by NYDFS.',
    url: 'https://www.nysenate.gov/legislation/laws/FIS/A8',
    newsUrl: 'https://www.mayerbrown.com/en/insights/publications/2023/02/the-suspense-is-over-nydfs-adopts-final-commercial-financing-disclosure-rules-announces-effective-date-and-provides-new-exemptions',
    newsTitle: 'Mayer Brown — NYDFS Adopts Final CFDL Rules, Announces Effective Date' }] },

  UT: { name: 'Utah', status: 'enacted', bills: [{
    name: 'Commercial Financing Registration & Disclosure Act', citation: 'Utah Code §7-27 (S.B. 183)',
    effISO: '2023-01-01', scope: 'Most commercial financing; provider registration with DFI',
    penaltyText: '$500 / violation ($1,000 after notice), capped $20,000 per transaction ($50,000 after notice)',
    penaltyMax: 1000,
    desc: 'Providers register with the Dept. of Financial Institutions and deliver specified disclosures. Lighter touch than CA/NY — no APR mandate.',
    url: 'https://dfi.utah.gov/non-depository/commercial-financing/',
    newsUrl: 'https://www.hudsoncook.com/article/utah-enacts-commercial-financing-disclosure-law/',
    newsTitle: 'Hudson Cook — Utah Enacts Commercial Financing Disclosure Law' }] },

  VA: { name: 'Virginia', status: 'enacted', bills: [{
    name: 'Sales-Based Financing Disclosure (SB 1027)', citation: 'Va. Code §6.2-2228 et seq. (Title 6.2 Ch. 22.1)',
    effISO: '2022-07-01', scope: 'Sales-based financing; broker registration (by Nov 1, 2022)',
    penaltyText: 'No fixed per-violation $ — injunctive relief, restitution & damages via the SCC and Attorney General (§6.2-2238)',
    penaltyMax: null,
    desc: 'Disclosure for sales-based (revenue-based) financing plus registration of financing brokers. Applies to contracts entered into on or after the effective date.',
    url: 'https://law.lis.virginia.gov/vacodefull/title6.2/chapter22.1/',
    newsUrl: 'https://www.consumerfinancialserviceslawmonitor.com/2022/03/virginia-legislature-passes-sales-based-financing-disclosure-and-registration-requirements/',
    newsTitle: 'Troutman CFS Law Monitor — Virginia Passes Sales-Based Financing Disclosure' }] },

  GA: { name: 'Georgia', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 90)', citation: 'O.C.G.A. §10-1-393',
    effISO: '2024-01-01', scope: 'Commercial financing ≤ $500,000; no registration',
    penaltyText: '$500 / violation (cap $20,000); $1,000 / repeat violation (cap $50,000) — AG only, no private right of action',
    penaltyMax: 1000,
    desc: 'Disclosure of total cost and payment terms for covered commercial financing transactions. Enforced exclusively by the Georgia Attorney General.',
    url: 'https://www.legis.ga.gov/legislation/64404',
    newsUrl: 'https://www.buchalter.com/insights/georgia-enacts-commercial-financing-disclosure-law-mandatory-compliance-date-january-1-2024/',
    newsTitle: 'Buchalter — Georgia Enacts CF Disclosure Law (Compliance Jan 1, 2024)' }] },

  FL: { name: 'Florida', status: 'enacted', bills: [{
    name: 'Florida Commercial Financing Disclosure Law', citation: 'Fla. Stat. §559.961 et seq.',
    effISO: '2024-01-01', scope: 'Commercial financing ≤ $500,000 (enforcement from Jul 2024)',
    penaltyText: '$500 / violation (cap $20,000); $1,000 / repeat violation (cap $50,000) — AG only; does not void the transaction',
    penaltyMax: 1000,
    desc: 'Standardized disclosure of amount financed, finance charge, and payment schedule for covered commercial financing. Enforced exclusively by the Florida Attorney General.',
    url: 'https://www.flsenate.gov/Laws/Statutes/2023/Chapter559/PART_XV',
    newsUrl: 'https://www.buchalter.com/insights/florida-enacts-commercial-financing-disclosure-law-mandatory-compliance-date-january-1-2024/',
    newsTitle: 'Buchalter — Florida Enacts CF Disclosure Law (Compliance Jan 1, 2024)' }] },

  CT: { name: 'Connecticut', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure (SB 1032 / P.A. 23-201)', citation: 'Conn. Gen. Stat. (P.A. 23-201); penalties §36a-50',
    effISO: '2024-07-01', scope: 'Commercial financing ≤ $250,000; provider registration (by Oct 1, 2024)',
    penaltyText: 'Up to $100,000 / violation (Banking Commissioner, §36a-50) + injunction',
    penaltyMax: 100000,
    desc: 'Disclosure plus provider/broker registration with the Dept. of Banking. Enacted 2023 but effective July 1, 2024 (no-action enforcement grace through 9/30/2024).',
    url: 'https://www.cga.ct.gov/asp/cgabillstatus/cgabillstatus.asp?selBillType=Bill&which_year=2023&bill_num=1032',
    newsUrl: 'https://www.gtlaw.com/en/insights/2024/9/new-commercial-financing-laws-take-effect-in-connecticut-kansas',
    newsTitle: 'Greenberg Traurig — New CF Laws Take Effect in Connecticut & Kansas' }] },

  KS: { name: 'Kansas', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure Act (SB 345)', citation: 'Kan. Stat. (SB 345, 2024)',
    effISO: '2024-07-01', scope: 'Commercial financing; disclosure (no registration)',
    penaltyText: '$500 / violation (cap $20,000); $1,000 / violation after AG written warning (cap $50,000)',
    penaltyMax: 1000,
    desc: 'Disclosure regime enacted Apr 2024, effective July 1, 2024. Enforced by the Kansas Attorney General.',
    url: 'http://www.kslegislature.org/li/b2023_24/measures/sb345/',
    newsUrl: 'https://www.mayerbrown.com/en/insights/publications/2024/06/kansas-enacts-commercial-finance-disclosure-law',
    newsTitle: 'Mayer Brown — Kansas Enacts Commercial Finance Disclosure Law' }] },

  MO: { name: 'Missouri', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure Law (SB 1359)', citation: 'Mo. Rev. Stat. §427',
    effISO: '2025-02-28', scope: 'Commercial financing; provider/broker registration',
    penaltyText: '$500 / violation (cap $20,000), plus additional penalties for violations continued after AG notice',
    penaltyMax: 500,
    desc: 'Requires disclosures and registration of commercial financing brokers. Signed Jul 2024; effective Feb 28, 2025. Enforced by the Missouri Attorney General.',
    url: 'https://www.senate.mo.gov/24info/BTS_Web/Bill.aspx?SessionType=R&BillID=78809126',
    newsUrl: 'https://www.consumerfinancialserviceslawmonitor.com/2024/07/after-multiple-attempts-missouri-becomes-latest-state-to-enact-commercial-financing-disclosure-law/',
    newsTitle: 'Troutman CFS Law Monitor — Missouri Enacts CF Disclosure Law' }] },

  TX: { name: 'Texas', status: 'enacted', bills: [{
    name: 'Sales-Based Financing Disclosure & Registration (HB 700)', citation: 'Tex. Fin. Code Ch. 398',
    effISO: '2025-09-01', scope: 'Sales-based financing offers < $1M; OCCC registration (providers AND brokers) by Dec 31, 2026',
    penaltyText: 'Administrative enforcement by the OCCC (Finance Commission penalty rules pending) — verify',
    penaltyMax: null,
    desc: 'Total-cost disclosure model (no APR) on commercial sales-based financing offers under $1M. Providers and brokers must register with the OCCC by Dec 31, 2026 (registration is not capped at $1M). Finance Commission rules pending.',
    url: 'https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB700',
    newsUrl: 'https://www.mayerbrown.com/en/insights/publications/2025/06/texas-commercial-financing-disclosure-and-registration-law-threatens-sales-based-financing-industry',
    newsTitle: 'Mayer Brown — Texas CF Disclosure & Registration Law' }] },

  LA: { name: 'Louisiana', status: 'enacted', bills: [{
    name: 'Commercial Financing Disclosure + RBF (Act 198 / HB 470)', citation: 'La. R.S. 9:3138.1–.6 (2024); R.S. 9:3137.10 (Act 198, 2025)',
    effISO: '2025-01-01', scope: 'Commercial financing (2024 law) + revenue-based financing with NO dollar threshold (Act 198)',
    penaltyText: 'Civil enforcement by state regulator; no fixed per-violation $ figure — verify',
    penaltyMax: null,
    desc: 'Two layered statutes: the 2024 disclosure law (eff. Jan 1, 2025) plus Act 198 of 2025 / HB 470 (R.S. 9:3137.10, eff. Aug 1, 2025) covering revenue-based financing with no dollar threshold and no entity exemptions. Total-cost model, no APR, no registration.',
    url: 'https://www.legis.la.gov/legis/BillInfo.aspx?i=248484',
    newsUrl: 'https://www.mayerbrown.com/en/insights/publications/2025/08/louisiana-now-requires-disclosures-for-revenue-based-financing-transactions',
    newsTitle: 'Mayer Brown — Louisiana Now Requires Disclosures for RBF' }] },

  /* ── Pending / introduced (no law yet) ─────────────────────────────────── */
  IL: { name: 'Illinois', status: 'pending', bills: [{
    name: 'Small Business Financing Transparency Act (SB 260)', citation: 'IL 104th General Assembly',
    effISO: null,
    asSoonAs: '2027 (if SB 260 passes in 2025–26)',
    asSoonAsExplain: 'SB 260 was introduced Jan 2025 and stays alive through the two-year 104th General Assembly. Even if it passes, it directs the IDFPR to stand up registration and a financing database, which typically adds 6–12 months before enforcement begins.',
    scope: 'Sales-based & closed-end commercial financing; registration + disclosure',
    penaltyText: 'Proposed: up to $10,000 / violation (cap $50,000 per transaction) — not yet law',
    penaltyMax: 10000,
    desc: 'Disclosure + registration bill modeled on NY/CA, currently in Senate committee. Prior version (SB 2234) died sine die Jan 2025. Status varies by session — verify.',
    url: 'https://www.ilga.gov/Legislation/BillStatus?GAID=18&DocNum=260&DocTypeID=SB&SessionID=114',
    newsUrl: 'https://debanked.com/2025/01/maryland-illinois-reintroduce-commercial-finance-bills/',
    newsTitle: 'deBanked — Maryland, Illinois Reintroduce Commercial Finance Bills' }] },

  NJ: { name: 'New Jersey', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (S 1760)', citation: 'NJ Legislature (2026 session)',
    effISO: null,
    asSoonAs: '2027 at the earliest (if S 1760 passes)',
    asSoonAsExplain: 'S 1760 was introduced Jan 2026 — at least the 7th consecutive year NJ has filed a version, repeatedly dying in the Senate Commerce Committee. Passage is uncertain; templated bills like this include a multi-month runway before APR-disclosure duties bind providers.',
    scope: 'Commercial financing disclosure (APR-style)',
    penaltyText: 'Proposed: civil penalties up to $10,000 for willful violations — not yet law',
    penaltyMax: 10000,
    desc: 'Long-running APR-disclosure proposal, re-introduced across sessions. Confirm current bill number and status before relying.',
    url: 'https://www.njleg.state.nj.us/bill-search/2026/S1760',
    newsUrl: 'https://debanked.com/2026/01/new-jersey-reintroduces-apr-disclosure-bill-for-commercial-financing/',
    newsTitle: 'deBanked — New Jersey Reintroduces APR Disclosure Bill' }] },

  MD: { name: 'Maryland', status: 'pending', bills: [{
    name: 'Commercial Financing Disclosure (SB 881) — DIED, watch 2027', citation: 'MD General Assembly (2026 RS)',
    effISO: null,
    asSoonAs: '2027 session (reintroduction likely)',
    asSoonAsExplain: 'SB 881 passed the Maryland Senate 42-0 but died in the House when the session adjourned sine die Apr 13, 2026 (crossfile HB 1007 also died). A unanimous Senate vote makes a 2027 reintroduction highly likely; the scraper monitors the MGA pages.',
    scope: 'Would require APR disclosure + OFR licensing',
    penaltyText: 'Proposed: $2,000 / violation ($10,000 willful) — bill died, not law',
    penaltyMax: 10000,
    desc: 'SB 881 (2026) passed the Senate unanimously but died in the House at sine die. Its predecessor SB 754 (2025) also died. Would have mandated APR disclosure + OFR licensing. WATCH for 2027.',
    url: 'https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/sb0881?ys=2026RS',
    newsUrl: 'https://debanked.com/2025/01/maryland-illinois-reintroduce-commercial-finance-bills/',
    newsTitle: 'deBanked — Maryland, Illinois Reintroduce Commercial Finance Bills' }] }
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
