/* ============================================================
 * LendPaper White Labeling — quote-share.js (LEN-310, PAID)
 *
 * "Share quote" for calculators. Paid tenants (features.share_links)
 * get a hosted, branded, trackable quote link; everyone still has
 * PDF export as the baseline.
 *
 * Load as a module after branding.js. Renders a Share button into:
 *   <div id="quote-share"></div>
 *
 * Calculator page wires the data source:
 *   window.LP_getQuotePayload = () => ({
 *     title: 'Payment Breakdown',
 *     meta:  '$150,000 · 24 mo',
 *     lines: [ { label: 'Total payback', value: '$187,500' }, ... ],
 *     note:  'optional fine print override'
 *   });
 *
 * Brand identity is SNAPSHOTTED into the quote at creation, so the
 * public viewer needs no access to the tenants table.
 * ============================================================ */
import { supabase as sb } from './auth.js';

const VIEWER_PATH = '/q/'; // public viewer page (q/index.html)

function canShare() {
  const t = window.LP_TENANT;
  return !!(t && t.features && t.features.share_links === true);
}

function slug() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode.apply(null, bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createQuoteLink() {
  if (typeof window.LP_getQuotePayload !== 'function') {
    throw new Error('Quote data source not wired on this page.');
  }
  // Admin tenant preview (LEN-330): never create real, tracked quote rows
  // from a preview session.
  if (window.LP_TENANT && window.LP_TENANT._preview) {
    throw new Error('Preview mode — quote links are disabled here.');
  }
  const { data: { session } = {} } = await sb.auth.getSession();
  if (!session) throw new Error('Sign in to share quotes.');

  const t = window.LP_TENANT || {};
  const payload = Object.assign({}, window.LP_getQuotePayload(), {
    brand: {
      company_name: t.company_name || 'LendPaper',
      logo_url: t.logo_url || null,
      primary_color: t.primary_color || '#1A3C2E',
      contact_name: t.contact_name || null,
      contact_email: t.contact_email || null,
      contact_phone: t.contact_phone || null
    },
    created: new Date().toISOString()
  });

  const id = slug();
  const { data: profile } = await sb
    .from('profiles').select('tenant_id').eq('id', session.user.id).maybeSingle();

  const { error } = await sb.from('quotes').insert({
    id: id,
    tenant_id: profile && profile.tenant_id,
    created_by: session.user.id,
    payload: payload
  });
  if (error) throw new Error('Could not create link: ' + error.message);

  return location.origin + VIEWER_PATH + '?id=' + id;
}

async function shareUrl(url, title) {
  if (navigator.share) {
    try {
      await navigator.share({ url: url, title: title });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}

function render() {
  const host = document.getElementById('quote-share');
  if (!host) return;
  if (!canShare()) { host.hidden = true; return; }
  host.hidden = false;

  host.innerHTML =
    '<button type="button" class="qs-btn" id="qs-btn">' +
      'Share quote link' +
    '</button>' +
    '<p class="qs-status" id="qs-status"></p>';

  const btn = document.getElementById('qs-btn');
  const status = document.getElementById('qs-status');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Creating link…';
    status.textContent = '';
    try {
      const url = await createQuoteLink();
      const result = await shareUrl(url, 'Your funding quote');
      status.textContent =
        result === 'copied' ? 'Link copied — valid for 30 days.' :
        result === 'shared' ? 'Link sent — valid for 30 days.' : '';
      status.className = 'qs-status ok';
    } catch (e) {
      status.textContent = e.message;
      status.className = 'qs-status err';
    }
    btn.disabled = false;
    btn.textContent = 'Share quote link';
  });
}

// Wait for branding to resolve (the feature flag lives on LP_TENANT).
// branding.js always dispatches lp:tenant-ready, including the no-tenant case.
if (window.LP_TENANT !== undefined) {
  render();
} else {
  document.addEventListener('lp:tenant-ready', render);
}

window.LP_QuoteShare = { createQuoteLink: createQuoteLink };
