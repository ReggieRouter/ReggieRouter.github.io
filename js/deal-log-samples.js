// LendPaper — Deal Log sample deals (LEN-190)
//
// First-run demo rows, shown ONLY when a user has zero real estimates, so the
// Deal Log never opens to an empty table. Display-only by design:
//   • never written to the Supabase `estimates` table
//   • never mirrored to the lp_quote_log localStorage key
//   • never mixed into a user's real stats
// They vanish the instant the user saves their first real estimate.
//
// Each entry is a fully-valid estimate record, so Restore/PDF on a sample still
// works as a low-stakes "try it" path into the real calculator.
//
// Names are intentionally broker-flavored — lending inside jokes (stips,
// MCA stacking, soft pulls, fund-by-Friday, DSCR) — but kept professional.
// Every row carries `_sample: true` and renders a "Sample" badge.

const DAY = 86400000;
// Plausible recent dates without hardcoding a calendar (newest first).
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

const SAMPLE_DEALS = [
  {
    _sample: true,
    doc_id: 'LP-SAMPLE-TRPDIP',
    calculator_type: 'payment_breakdown',
    created_at: daysAgo(1),
    pdf_generated: true,
    prepared_for: 'Triple-Dip Logistics',
    params: {
      deal_name: 'Triple-Dip Logistics',
      amount: 80000, rate: 1.32, term: 11, term_unit: 'mos',
      borrower_state: 'NJ',
    },
  },
  {
    _sample: true,
    doc_id: 'LP-SAMPLE-DYNSTY',
    calculator_type: 'dscr',
    created_at: daysAgo(3),
    pdf_generated: true,
    prepared_for: 'DSCR Dynasty Realty',
    params: {
      deal_name: 'DSCR Dynasty Realty',
      amount: 615000, dscr: 1.28, rate: 7.25, term: 360, term_unit: 'mos',
      borrower_state: 'TX',
    },
  },
  {
    _sample: true,
    doc_id: 'LP-SAMPLE-STIPCT',
    calculator_type: 'sba_fees',
    created_at: daysAgo(6),
    pdf_generated: false,
    prepared_for: 'Stip City Diner',
    params: {
      deal_name: 'Stip City Diner',
      loan_amount: 425000, term: 120, term_unit: 'mos',
      borrower_state: 'FL',
    },
  },
  {
    _sample: true,
    doc_id: 'LP-SAMPLE-SOFTPL',
    calculator_type: 'fundability',
    created_at: daysAgo(9),
    pdf_generated: true,
    prepared_for: 'Soft-Pull Salon & Spa',
    params: {
      deal_name: 'Soft-Pull Salon & Spa',
      amount: 60000, term: 18, term_unit: 'mos',
      borrower_state: 'CA',
    },
  },
  {
    _sample: true,
    doc_id: 'LP-SAMPLE-FRIDAY',
    calculator_type: 'deal_read',
    created_at: daysAgo(12),
    pdf_generated: false,
    prepared_for: 'Funded-by-Friday Auto Group',
    params: {
      deal_name: 'Funded-by-Friday Auto Group',
      amount: 150000, term: 24, term_unit: 'mos',
      borrower_state: 'IL',
    },
  },
];

export { SAMPLE_DEALS };
export default SAMPLE_DEALS;
