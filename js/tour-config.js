// js/tour-config.js
// Single source of truth for all tour copy, step metadata, and video config.
//
// MAINTENANCE RULE (see CLAUDE.md):
//   If you modify an element with a data-tour attribute, review the matching
//   step below and update body if the feature behavior has changed.

export const TOUR_VERSION = 'lp_tour_v1';
// Bump to 'lp_tour_v2' when flow changes enough to re-trigger for existing users.

export const SAMPLE_DEAL = {
  businessName:  'Ridgeline Landscaping',
  amount:        250000,
  term:          60,
  rate:          8.5,
  monthly:       4862,
  prepayMonth:   24,
  prepayPayoff:  184100,
  prepaySavings: 18240,
};

export const buildSMS = (deal, brokerName = '') =>
  `Hi \u2014 just sent the breakdown for the $${deal.amount.toLocaleString()}. ` +
  `Monthly is $${deal.monthly.toLocaleString()}. ` +
  `If you pay it off by month ${deal.prepayMonth} you save $${deal.prepaySavings.toLocaleString()}. ` +
  `Worth a quick call?${brokerName ? ' \u2014' + brokerName : ''}`;

// ── Print-moment coaching card ──────────────────────────────────────────────
// Shown once, when the user hits Save to PDF for the first time.
// No audio, no video — a brief, glanceable card so they don't miss the tip,
// then the print proceeds. Edit the copy here; the engine never holds copy.
export const PRINT_MOMENT = {
  storageKey:  'lp_print_video_v1_seen',  // keep key: existing "seen" flags carry over
  duration:    8,   // seconds before it auto-prints (gentle fallback; button is primary)
  title:       'Before you send it',
  subtitle:    'Don\u2019t just email the PDF \u2014 this is where the deal gets made.',
  script:      '\u201cI ran your numbers. Your monthly\u2019s locked in \u2014 but if you can pay it off early, you save real interest. Want to walk through it?\u201d',
  footnote:    'Send the PDF, then make that call.',
  ctaLabel:    'Got it \u2014 print \u2192',
};

// ── Page-scoped micro-tours ────────────────────────────────────────────────
// Each page has its own steps. Tour fires once per page on first visit.
// storageKey must be unique per page.

export const PAGE_TOURS = {

  // ── Payment Breakdown ────────────────────────────────────────────────────
  'calculators/AmoScheduleCalculator.html': {
    storageKey: 'lp_tour_v1_pb',
    steps: [
      {
        id:       'pb-save-pdf',
        title:    'Send the PDF',
        body:     'The move: run the numbers, hit save, send a clean breakdown. You look like you did the math.',
        position: 'left',
        last:     true,
      },
    ],
  },

  // ── Lender Waterfall ─────────────────────────────────────────────────────
  'waterfall.html': {
    storageKey: 'lp_tour_v1_wf',
    steps: [
      {
        id:       'wf-filter-bar',
        title:    'Filter before you pitch',
        body:     '43 verified lenders sorted by deal type and risk appetite. Know your lender before you call them.',
        position: 'below',
        last:     true,
      },
    ],
  },

  // ── DSCR Calculator ──────────────────────────────────────────────────────
  'calculators/DSCRCalculator.html': {
    storageKey: 'lp_tour_v1_dscr',
    steps: [
      {
        id:       'dscr-result',
        title:    'Qualify first',
        body:     'DSCR tells you if the deal is worth pitching before you build the breakdown. Run this first.',
        position: 'right',
        last:     true,
      },
    ],
  },

  // ── RegistryRoute ────────────────────────────────────────────────────────
  // NOTE (LEN-82): RegistryRoute ("Secretary of State Search") is an external
  // third-party site (registryroute.com), opened as an external link from the
  // dashboard — it is not a page in this codebase, so there is no in-app
  // state-grid element to spotlight and no micro-tour to fire there.

  // ── index.html / Dashboard ───────────────────────────────────────────────
  'index.html': {
    storageKey: 'lp_tour_v1_dash',
    steps: [
      {
        id:       'dash-pb-card',
        title:    'Start here',
        body:     'Payment Breakdown is your first move on any deal. Run the numbers, send the PDF.',
        position: 'right',
        last:     true,
      },
    ],
  },

  // ── Deal Analysis (calculators/deal-read/) ───────────────────────────────
  // LEN-191 rollout: wire data-tour="deal-verdict" / "deal-talk" anchors.
  'calculators/deal-read/index.html': {
    storageKey: 'lp_tour_v1_deal',
    steps: [
      {
        id:       'deal-verdict',
        title:    'Read the deal',
        body:     'One look tells you what they qualify for — and where it bends.',
        position: 'left',
        last:     true,
      },
    ],
  },

  // ── Payment Fit (calculators/AffordabilityCalculator.html) ───────────────
  'calculators/AffordabilityCalculator.html': {
    storageKey: 'lp_tour_v1_fit',
    steps: [
      {
        id:       'fit-result',
        title:    'Does it fit?',
        body:     'Pressure-test the payment against their deposits before you pitch.',
        position: 'right',
        last:     true,
      },
    ],
  },

  // ── Position & Net (calculators/FundabilityCalculator.html) ──────────────
  'calculators/FundabilityCalculator.html': {
    storageKey: 'lp_tour_v1_pos',
    steps: [
      {
        id:       'pos-result',
        title:    'Where they stand',
        body:     'See the existing stack and position the new money cleanly.',
        position: 'right',
        last:     true,
      },
    ],
  },

  // ── SBA Fees (calculators/SBACalculator.html) ────────────────────────────
  'calculators/SBACalculator.html': {
    storageKey: 'lp_tour_v1_sba',
    steps: [
      {
        id:       'sba-result',
        title:    'Real SBA cost',
        body:     'Fees and net proceeds, broken out so nothing surprises the borrower.',
        position: 'right',
        last:     true,
      },
    ],
  },

  // ── Compliance Desk (legislation.html, route /compliance) ────────────────
  'legislation.html': {
    storageKey: 'lp_tour_v1_compliance',
    steps: [
      {
        id:       'compliance-table',
        title:    'Filter the rules',
        body:     'Sort by state, status, and penalty — know the exposure before you quote.',
        position: 'below',
        last:     true,
      },
    ],
  },

  // ── Deal Log (quote-log/index.html) ──────────────────────────────────────
  // Unifies the standalone LEN-190 deal-log-tour.js into the shared engine.
  // Rollout: retire js/deal-log-tour.js once anchors below are wired.
  'quote-log/index.html': {
    storageKey: 'lp_tour_v1_deallog',
    steps: [
      {
        id:       'deallog-table',
        title:    'Every deal lands here',
        body:     'Saved estimates queue up so nothing slips between calls.',
        position: 'below',
      },
      {
        id:       'deallog-restore',
        title:    'Resurface a deal',
        body:     'Restore reopens it right where you left off.',
        position: 'left',
        last:     true,
      },
    ],
  },

};
