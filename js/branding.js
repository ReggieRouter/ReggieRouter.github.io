/* ============================================================
 * LendPaper White Labeling — branding.js (LEN-306)
 *
 * Load on every tenant-visible page AFTER js/config.js:
 *   <script type="module" src="/js/branding.js"></script>   (root pages)
 *   <script type="module" src="../js/branding.js"></script> (calculators)
 *
 * Behavior:
 *  - No session or no tenant_id → does nothing (default LendPaper brand).
 *  - Tenant found → applies --tenant-primary, swaps/unhides tenant logos,
 *    hides [data-tenant-hide] LendPaper marks, fills data-tenant slots,
 *    and exposes window.LP_TENANT for PDF/doc-combine/quote-share.
 *  - Caches the tenant row in sessionStorage (one fetch per tab session);
 *    the cache is cleared by auth.js signOut() and by company-profile save.
 *
 * Markup contract:
 *   <img data-tenant-logo hidden>                  (unhidden + src set when branded)
 *   <span data-tenant-name>LendPaper</span>        (text swapped to company name)
 *   <el data-tenant-hide>…</el>                    (hidden when a tenant is active)
 *   <a data-tenant-profile-link hidden>…</a>       (unhidden when a tenant is active)
 *   <div data-tenant-contact hidden></div>         (homepage hero contact card)
 *   <div data-tenant-doc-footer hidden></div>      (print/PDF footer line)
 * ============================================================ */
import { supabase } from './auth.js';

const CACHE_KEY = 'lp_tenant_v1';
const PENDING_CLASS = 'branding-pending';

// Admin tenant preview (LEN-330): lp-panel opens "/#lp-tenant-preview=<b64 row>".
// Seed the session cache from the fragment (marked _preview) and clean the URL —
// the whole tab (incl. calculator iframes, which share tab sessionStorage) then
// renders as that tenant without touching any profile. Cosmetic only: RLS still
// governs every actual data access.
try {
  const m = /[#&]lp-tenant-preview=([^&]+)/.exec(location.hash || '');
  if (m && window.self === window.top) {
    const t = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
    if (t && t.company_name) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.assign({}, t, { _preview: true })));
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
} catch (_) {}

// Avoid flash-of-LendPaper for tenant users who branded last session.
// Anonymous and non-tenant users never have the cache, so they never
// see the pending state (zero-regression requirement, LEN-306).
try {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached && cached !== 'null') {
    document.documentElement.classList.add(PENDING_CLASS);
  }
} catch (_) {}

async function fetchTenant() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached); // may be null (cached "no tenant")
  } catch (_) {}

  const { data: { session } = {} } = await supabase.auth.getSession();
  if (!session) return cacheAndReturn(null);

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', session.user.id)
    .maybeSingle();
  if (pErr || !profile || !profile.tenant_id) return cacheAndReturn(null);

  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('slug, company_name, logo_url, primary_color, contact_name, contact_email, contact_phone, active, features')
    .eq('id', profile.tenant_id)
    .maybeSingle();
  if (tErr || !tenant || !tenant.active) return cacheAndReturn(null);

  return cacheAndReturn(tenant);
}

function cacheAndReturn(tenant) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(tenant)); } catch (_) {}
  return tenant;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function apply(tenant) {
  const root = document.documentElement;

  if (!tenant) {
    root.classList.remove(PENDING_CLASS);
    window.LP_TENANT = null;
    document.dispatchEvent(new CustomEvent('lp:tenant-ready', { detail: null }));
    return;
  }

  // 1. CSS variables
  if (tenant.primary_color) {
    root.style.setProperty('--tenant-primary', tenant.primary_color);
  }

  // 2. Logo swap — tenant imgs unhide, LendPaper marks hide
  if (tenant.logo_url) {
    document.querySelectorAll('[data-tenant-logo]').forEach((img) => {
      img.src = tenant.logo_url;
      img.alt = tenant.company_name;
      img.hidden = false;
    });
    document.querySelectorAll('[data-tenant-hide]').forEach((el) => {
      el.style.display = 'none';
    });
  }

  // 3. Company name slots + title
  document.querySelectorAll('[data-tenant-name]').forEach((el) => {
    el.textContent = tenant.company_name;
  });
  if (!document.title.startsWith(tenant.company_name)) {
    document.title = tenant.company_name + ' · ' + document.title;
  }

  // 4. Company profile link (tenant users only)
  document.querySelectorAll('[data-tenant-profile-link]').forEach((el) => {
    el.hidden = false;
  });

  // 5. Homepage contact card
  document.querySelectorAll('[data-tenant-contact]').forEach((el) => {
    el.hidden = false;
    el.innerHTML =
      '<div class="tenant-contact-card">' +
        '<div class="tenant-contact-name">' + esc(tenant.contact_name) + '</div>' +
        (tenant.contact_email
          ? '<a class="tenant-contact-line" href="mailto:' + esc(tenant.contact_email) + '">' + esc(tenant.contact_email) + '</a>'
          : '') +
        (tenant.contact_phone
          ? '<a class="tenant-contact-line" href="tel:' + esc(tenant.contact_phone).replace(/[^\d+]/g, '') + '">' + esc(tenant.contact_phone) + '</a>'
          : '') +
      '</div>';
  });

  // 6. Print/PDF footer block (picked up by @media print CSS)
  document.querySelectorAll('[data-tenant-doc-footer]').forEach((el) => {
    el.hidden = false;
    el.textContent = [
      tenant.company_name,
      tenant.contact_name,
      tenant.contact_email,
      tenant.contact_phone
    ].filter(Boolean).join('  ·  ');
  });

  // 7. Expose for pdf-lib generation (doc-combine.js) and quote-share.js
  window.LP_TENANT = tenant;
  document.dispatchEvent(new CustomEvent('lp:tenant-ready', { detail: tenant }));

  // 8. Admin preview pill (LEN-330) — top window only, never inside the tool iframe
  if (tenant._preview && window.self === window.top) renderPreviewPill(tenant);

  root.classList.remove(PENDING_CLASS);
}

function renderPreviewPill(tenant) {
  if (document.getElementById('lp-tenant-preview-pill')) return;
  const pill = document.createElement('div');
  pill.id = 'lp-tenant-preview-pill';
  pill.className = 'tenant-preview-pill';
  const label = document.createElement('span');
  label.textContent = 'Previewing ' + tenant.company_name + ' — admin only';
  const exit = document.createElement('button');
  exit.type = 'button';
  exit.textContent = 'Exit preview';
  exit.addEventListener('click', () => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
    location.reload();
  });
  pill.append(label, exit);
  document.body.appendChild(pill);
}

function init() {
  fetchTenant().then(apply).catch(() => {
    document.documentElement.classList.remove(PENDING_CLASS);
    window.LP_TENANT = null;
    document.dispatchEvent(new CustomEvent('lp:tenant-ready', { detail: null }));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
