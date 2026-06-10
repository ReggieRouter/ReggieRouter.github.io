// js/nudge-config.js
// Single source of truth for cross-tool nudge copy + rules (LEN-191).
//
// A nudge is a quiet, occasional, contextual suggestion to open ANOTHER tool
// that's relevant to what the user is doing right now. It is NOT a tour — it
// never spotlights, never blocks, and the user can dismiss it for good.
//
// Tone model: the in-deal "Next steps" suggestions from Deal Analysis
// (calculators/deal-read/read.js → buildNextSteps). Calm, one line, earned.
//
// MAINTENANCE RULE: keep copy ≤ ~12 words. One benefit, one verb. No badges.

export const NUDGE_VERSION = 'lp_nudge_v1';

// ── Global frequency policy (enforced by the engine, not per-rule) ───────────
//   • At most ONE nudge per page load.
//   • Global cooldown between any two nudges (feels earned, never naggy).
//   • A dismissed or clicked nudge never returns.
//   • A nudge shown MAX_SHOWS times without action retires itself.
//   • Never fires on a page whose first-run tour hasn't been seen yet — the
//     tour owns the first impression.
export const POLICY = {
  cooldownHours: 20,   // min hours between any two nudges, across the whole app
  maxShows:      2,    // show the same nudge at most this many times if ignored
  minToolsOpened: 2,   // only nudge users engaged enough to benefit (default gate)
  autoDismissSec: 14,  // gently fade the card after this long (0 = persist)
};

// ── Rules ────────────────────────────────────────────────────────────────────
// Each rule is page-scoped (pages: [...routes] or '*') with an optional extra
// `when(ctx)` predicate. ctx = { page, usage, persona, openedCount, hasOpened }.
// First eligible rule (in array order) that passes policy + when() wins.
export const NUDGE_RULES = [

  // ── Homepage: nudge toward a high-value tool the user hasn't opened yet ────
  // LEN-191 nudge engine + LEN-211 first slice — reads the live lp_tool_usage signal.
  {
    id:     'home-deal-analysis',
    pages:  ['index.html'],
    kicker: 'Worth a look',
    text:   'You haven’t run Deal Analysis yet — read any deal in seconds.',
    href:   '/tools/deal-read',
    cta:    'Open Deal Analysis',
    when:   (ctx) => !ctx.hasOpened('deal-read'),
  },
  {
    id:     'home-payment-fit',
    pages:  ['index.html'],
    kicker: 'Worth a look',
    text:   'Pressure-test a payment against real cash flow with Payment Fit.',
    href:   '/tools/affordability',
    cta:    'Open Payment Fit',
    when:   (ctx) => !ctx.hasOpened('affordability'),
  },
  {
    id:     'home-waterfall',
    pages:  ['index.html'],
    kicker: 'Worth a look',
    text:   'See which lenders actually fund a deal in the Waterfall.',
    href:   '/tools/waterfall',
    cta:    'Open Waterfall',
    when:   (ctx) => !ctx.hasOpened('waterfall'),
  },

  // From a payment breakdown → go find who funds it.
  {
    id:     'amo-to-waterfall',
    pages:  ['calculators/AmoScheduleCalculator.html'],
    kicker: 'Next move',
    text:   'Got the payment. See which lenders actually fund this deal.',
    href:   '/waterfall.html',
    cta:    'Open Waterfall',
    when:   (ctx) => !ctx.hasOpened('waterfall'),
  },

  // From Deal Analysis → pressure-test the monthly against their deposits.
  {
    id:     'deal-to-paymentfit',
    pages:  ['calculators/deal-read/index.html', 'calculators/deal-read/'],
    kicker: 'Worth a look',
    text:   'Pressure-test this monthly against their real cash flow.',
    href:   '/calculators/AffordabilityCalculator.html',
    cta:    'Open Payment Fit',
    when:   (ctx) => !ctx.hasOpened('affordability'),
  },

  // From Payment Fit → check the stack before committing.
  {
    id:     'paymentfit-to-netposition',
    pages:  ['calculators/AffordabilityCalculator.html'],
    kicker: 'Before you commit',
    text:   'Check what they already owe — position the new money cleanly.',
    href:   '/calculators/FundabilityCalculator.html',
    cta:    'Open Position & Net',
    when:   (ctx) => !ctx.hasOpened('fundability'),
  },

  // From the Waterfall → run the numbers before the call.
  {
    id:     'waterfall-to-amo',
    pages:  ['waterfall.html'],
    kicker: 'Next move',
    text:   'Found the lender. Build the borrower-ready breakdown.',
    href:   '/calculators/AmoScheduleCalculator.html',
    cta:    'Open Amortization',
    when:   (ctx) => !ctx.hasOpened('amo'),
  },

  // From DSCR → qualified, now build the breakdown.
  {
    id:     'dscr-to-amo',
    pages:  ['calculators/DSCRCalculator.html'],
    kicker: 'Next move',
    text:   'Deal qualifies. Turn it into a breakdown you can send.',
    href:   '/calculators/AmoScheduleCalculator.html',
    cta:    'Open Amortization',
    when:   (ctx) => !ctx.hasOpened('amo'),
  },

  // From SBA Fees → check serviceability.
  {
    id:     'sba-to-dscr',
    pages:  ['calculators/SBACalculator.html'],
    kicker: 'Worth a look',
    text:   'SBA-bound? Confirm the business services the debt first.',
    href:   '/calculators/DSCRCalculator.html',
    cta:    'Open DSCR',
    when:   (ctx) => !ctx.hasOpened('dscr'),
  },

  // From the Deal Log → reopen something and keep it moving.
  {
    id:     'deallog-to-amo',
    pages:  ['quote-log/index.html', 'quote-log/'],
    kicker: 'Keep it moving',
    text:   'Reopen a deal and refresh the numbers before you follow up.',
    href:   '/calculators/AmoScheduleCalculator.html',
    cta:    'Open Amortization',
    when:   (ctx) => true,
  },

];
