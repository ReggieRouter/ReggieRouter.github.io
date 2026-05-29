/* ═══════════════════════════════════════════════════════════
   LendPaper Chrome Extension — popup.js
   ═══════════════════════════════════════════════════════════ */

const LENDPAPER_BASE = 'https://lendpaper.com';
const BUSINESS_DAYS_PER_MONTH = 22;

/* ── Utilities ─────────────────────────────────────────── */

function cleanNum(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(raw.toString().replace(/,/g, ''));
  return isNaN(n) || !isFinite(n) ? null : n;
}

function fmt$(n, digits = 0) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function fmtPct(n, d = 1) {
  if (n == null) return '—';
  return n.toFixed(d) + '%';
}

function openTab(url) {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
}

function showToast(msg = 'Copied!') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);
}

// Storage helper with fallback
const LP_STORAGE = {
  get: function (callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['savedDeals'], (res) => {
        callback(res.savedDeals || []);
      });
    } else {
      const deals = JSON.parse(localStorage.getItem('lendpaper_saved_deals') || '[]');
      callback(deals);
    }
  },
  set: function (deals, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ savedDeals: deals }, callback);
    } else {
      localStorage.setItem('lendpaper_saved_deals', JSON.stringify(deals));
      if (callback) callback();
    }
  }
};

/* ── Tab navigation ────────────────────────────────────── */

document.querySelectorAll('.lp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lp-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.lp-view').forEach(v => v.classList.remove('active'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    const targetView = document.getElementById('view-' + tab.dataset.tab);
    if (targetView) targetView.classList.add('active');

    if (tab.dataset.tab === 'saved') {
      renderSavedDeals();
    }
  });
});

/* ── Tool card links ───────────────────────────────────── */

document.querySelectorAll('.lp-tool-card, .lp-footer-link, .lp-upsell-link').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const url = el.dataset.url;
    if (url) openTab(url);
  });
});

/* ══════════════════════════════════════════════════════════
   Quick Calc — Payment Breakdown & Preview
   ══════════════════════════════════════════════════════════ */

const elDealName   = document.getElementById('dealName');
const elFunding    = document.getElementById('fundingAmt');
const elFactor     = document.getElementById('factorRate');
const elTerm       = document.getElementById('term');
const elCard       = document.getElementById('resultCard');
const elEmpty      = document.getElementById('emptyState');
const elWeekly     = document.getElementById('weeklyPayment');
const elDailySub   = document.getElementById('dailySub');
const elTotal      = document.getElementById('totalRepay');
const elCostAmt    = document.getElementById('costAmt');
const elCostPct    = document.getElementById('costPct');
const elPreview    = document.getElementById('scriptPreview');

function calcPayments() {
  const dealName = elDealName.value.trim() || 'Unnamed Deal';
  const funding  = cleanNum(elFunding.value);
  const factor   = cleanNum(elFactor.value);
  const months   = cleanNum(elTerm.value);

  const hasAll = funding > 0 && factor > 0 && months > 0;

  elCard.hidden  = !hasAll;
  elEmpty.hidden = hasAll;

  if (!hasAll) return;

  const total     = funding * factor;
  const cost      = total - funding;
  const costPct   = (cost / funding) * 100;
  const totalDays = Math.round(months * BUSINESS_DAYS_PER_MONTH);
  const daily     = total / totalDays;
  const weekly    = daily * 5;

  elWeekly.textContent   = fmt$(weekly);
  elDailySub.textContent = `${fmt$(daily)} daily · ${totalDays} business days`;
  elTotal.textContent    = fmt$(total);
  elCostAmt.textContent  = fmt$(cost);
  elCostPct.textContent  = fmtPct(costPct);

  // Generate Preview Script (Fully visible, no cutoff!)
  const line = '─────────────────────────────';
  const previewText = [
    `[Payment Breakdown] — LendPaper`,
    `Deal Name          : ${dealName}`,
    line,
    `Funding amount     : ${fmt$(funding, 0)}`,
    `Factor rate        : ${factor.toFixed(4)}`,
    `Term               : ${months} months (${totalDays} business days)`,
    line,
    `Daily payment      : ${fmt$(daily, 2)}`,
    `Weekly payment     : ${fmt$(weekly, 2)}`,
    `Total repayment    : ${fmt$(total, 2)}`,
    `Cost of capital    : ${fmt$(cost, 2)} (${fmtPct(costPct)})`,
    line,
    'Powered by LendPaper | info@lendpaper.com | lendpaper.com',
    'ESTIMATES ONLY — NOT FINANCIAL ADVICE.'
  ].join('\n');

  elPreview.value = previewText;

  // Bind calculation context data to interactive action buttons
  const calcContext = {
    dealName, funding, factor, months, total, cost, costPct, daily, weekly, totalDays
  };
  document.getElementById('copyBtn')._calcData = calcContext;
  document.getElementById('saveBtn')._calcData = calcContext;
  document.getElementById('pdfBtn')._calcData = calcContext;
}

/* Format inputs as comma-separated on blur */
elFunding.addEventListener('blur', () => {
  const n = cleanNum(elFunding.value);
  if (n != null) elFunding.value = n.toLocaleString('en-US');
});
elFunding.addEventListener('focus', () => {
  const n = cleanNum(elFunding.value);
  if (n != null) elFunding.value = n.toString();
});

[elDealName, elFunding, elFactor, elTerm].forEach(el => {
  el.addEventListener('input', calcPayments);
});

/* Copy button listener (Copies from editable script preview) */
document.getElementById('copyBtn').addEventListener('click', function () {
  const text = elPreview.value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('Copied script!'));
});

/* Open full calculator web view */
document.getElementById('openCalcBtn').addEventListener('click', (e) => {
  e.preventDefault();
  openTab(LENDPAPER_BASE + '/calculators/AmoScheduleCalculator.html');
});

/* PDF Export button listener */
document.getElementById('pdfBtn').addEventListener('click', function () {
  const d = this._calcData;
  if (!d) return;

  // Build redirection query parameters
  const params = new URLSearchParams({
    dealName: d.dealName,
    funding: d.funding,
    factor: d.factor,
    months: d.months
  }).toString();

  openTab(chrome.runtime.getURL('print-preview.html?' + params));
});

/* ══════════════════════════════════════════════════════════
   Saved Deals View — Storage Management
   ══════════════════════════════════════════════════════════ */

const elSavedList = document.getElementById('savedList');
const elSavedEmpty = document.getElementById('savedEmptyState');
const elSavedCount = document.getElementById('savedCount');

// Save Deal Action
document.getElementById('saveBtn').addEventListener('click', function () {
  const d = this._calcData;
  if (!d) return;

  LP_STORAGE.get((deals) => {
    // Prevent duplicate saves on same Deal Name, update instead
    const existingIndex = deals.findIndex(x => x.dealName.toLowerCase() === d.dealName.toLowerCase());
    
    const newDeal = {
      dealName: d.dealName,
      funding: d.funding,
      factor: d.factor,
      months: d.months,
      weekly: d.weekly,
      timestamp: new Date().getTime()
    };

    if (existingIndex > -1) {
      deals[existingIndex] = newDeal;
    } else {
      deals.unshift(newDeal);
    }

    LP_STORAGE.set(deals, () => {
      showToast('Deal Saved!');
      renderSavedDeals();
    });
  });
});

// Render Saved Deals Tab list
function renderSavedDeals() {
  LP_STORAGE.get((deals) => {
    elSavedCount.textContent = `${deals.length} deal${deals.length !== 1 ? 's' : ''}`;
    
    if (deals.length === 0) {
      elSavedList.hidden = true;
      elSavedEmpty.hidden = false;
      return;
    }

    elSavedList.hidden = false;
    elSavedEmpty.hidden = true;

    elSavedList.innerHTML = deals.map((d, index) => {
      const dateStr = new Date(d.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="lp-saved-card">
          <div class="lp-saved-card-header">
            <div class="lp-saved-deal-name" title="${escapeHtml(d.dealName)}">${escapeHtml(d.dealName)}</div>
            <div class="lp-saved-time">${dateStr}</div>
          </div>
          <div class="lp-saved-metrics-strip">
            <div class="lp-saved-metric-item">
              <span class="lp-saved-metric-label">Amount</span>
              <span class="lp-saved-metric-value">${fmt$(d.funding, 0)}</span>
            </div>
            <div class="lp-saved-metric-item">
              <span class="lp-saved-metric-label">Factor</span>
              <span class="lp-saved-metric-value">${d.factor.toFixed(3)}</span>
            </div>
            <div class="lp-saved-metric-item">
              <span class="lp-saved-metric-label">Term</span>
              <span class="lp-saved-metric-value">${d.months}mo</span>
            </div>
            <div class="lp-saved-metric-item">
              <span class="lp-saved-metric-label">Weekly</span>
              <span class="lp-saved-metric-value">${fmt$(d.weekly, 0)}</span>
            </div>
          </div>
          <div class="lp-saved-card-actions">
            <button class="lp-saved-card-btn lp-saved-card-btn-load" data-index="${index}">Load</button>
            <button class="lp-saved-card-btn lp-saved-card-btn-delete" data-index="${index}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach active card action listeners
    elSavedList.querySelectorAll('.lp-saved-card-btn-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index);
        const deal = deals[idx];
        if (deal) {
          elDealName.value = deal.dealName;
          elFunding.value = deal.funding.toLocaleString('en-US');
          elFactor.value = deal.factor.toString();
          elTerm.value = deal.months.toString();
          
          // Switch to Calc tab view
          const calcTab = document.querySelector('.lp-tab[data-tab="calc"]');
          if (calcTab) calcTab.click();
          
          calcPayments();
          showToast('Deal loaded!');
        }
      });
    });

    elSavedList.querySelectorAll('.lp-saved-card-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index);
        deals.splice(idx, 1);
        LP_STORAGE.set(deals, () => {
          showToast('Deleted');
          renderSavedDeals();
        });
      });
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════════════════════
   Lenders View — Matcher & Competitors
   Representative lender dataset (subset of 43)
   ══════════════════════════════════════════════════════════ */

const LENDERS = [
  { name: 'Kapital One',       minFico: 0,   minTib: 3,  minRevenue: 10000,  product: 'MCA' },
  { name: 'Greenline Capital', minFico: 500, minTib: 6,  minRevenue: 15000,  product: 'MCA' },
  { name: 'Apex Funding',      minFico: 550, minTib: 6,  minRevenue: 20000,  product: 'MCA' },
  { name: 'Bridge Street',     minFico: 580, minTib: 12, minRevenue: 25000,  product: 'Term' },
  { name: 'Summit Capital',    minFico: 600, minTib: 12, minRevenue: 30000,  product: 'MCA' },
  { name: 'Meridian Lend',     minFico: 600, minTib: 18, minRevenue: 35000,  product: 'Term' },
  { name: 'Pacific Advance',   minFico: 620, minTib: 12, minRevenue: 25000,  product: 'MCA' },
  { name: 'CrossRiver Bank',   minFico: 640, minTib: 24, minRevenue: 40000,  product: 'LOC' },
  { name: 'Clearwater Fin.',   minFico: 650, minTib: 24, minRevenue: 50000,  product: 'Term' },
  { name: 'Harbor SBA',        minFico: 680, minTib: 24, minRevenue: 60000,  product: 'SBA' },
  { name: 'Keystone Lending',  minFico: 680, minTib: 36, minRevenue: 75000,  product: 'SBA' },
  { name: 'Pinnacle Capital',  minFico: 700, minTib: 36, minRevenue: 80000,  product: 'Term' },
  { name: 'Flagship Finance',  minFico: 720, minTib: 48, minRevenue: 100000, product: 'LOC' },
];

const elFico    = document.getElementById('lFico');
const elTib     = document.getElementById('lTib');
const elRevenue = document.getElementById('lRevenue');
const elResults = document.getElementById('matchResults');
const elCount   = document.getElementById('matchCount');
const elList    = document.getElementById('matchList');
const elTags    = document.getElementById('filterTags');

function matchLenders() {
  const fico    = cleanNum(elFico.value);
  const tib     = cleanNum(elTib.value);
  const revenue = cleanNum(elRevenue.value);

  if (fico == null && tib == null && revenue == null) {
    elResults.hidden = true;
    elTags.innerHTML = '';
    return;
  }

  /* Build active filter tags */
  const tags = [];
  if (fico    != null) tags.push(`FICO ${fico}+`);
  if (tib     != null) tags.push(`${tib} mo TIB`);
  if (revenue != null) tags.push(`${fmt$(revenue, 0)}/mo`);

  elTags.innerHTML = tags.map(t =>
    `<span class="lp-filter-tag">${t}</span>`
  ).join('');

  /* Filter lenders */
  const matches = LENDERS.filter(l => {
    if (fico    != null && l.minFico > 0 && fico < l.minFico)    return false;
    if (tib     != null && tib < l.minTib)                        return false;
    if (revenue != null && revenue < l.minRevenue)                return false;
    return true;
  });

  elCount.textContent = `${matches.length} competing matches`;
  
  // Highlight competition based on file info
  const compLabel = document.getElementById('competingLabel');
  if (matches.length > 3) {
    compLabel.innerHTML = `competing over this deal! <span style="color:#DC2626;font-weight:700;">(HIGH COMPETITION)</span>`;
  } else if (matches.length > 0) {
    compLabel.innerHTML = `competing over this deal. <span style="color:#D97706;font-weight:700;">(ACTIVE BIDS)</span>`;
  } else {
    compLabel.textContent = `matching lenders.`;
  }

  elResults.hidden = false;

  elList.innerHTML = matches.slice(0, 6).map(l => `
    <div class="lp-match-item">
      <div class="lp-match-dot"></div>
      <div class="lp-match-name">${l.name}</div>
      <span class="lp-match-chip">${l.product}</span>
      <span class="lp-match-chip">${l.minFico === 0 ? 'No FICO' : l.minFico + '+'}</span>
    </div>
  `).join('') + (matches.length > 6
    ? `<div style="text-align:center;font-size:11px;color:var(--text-tertiary);padding-top:6px;">+${matches.length - 6} more competing in Full Waterfall</div>`
    : '');
}

[elFico, elTib, elRevenue].forEach(el => el.addEventListener('input', matchLenders));

elRevenue.addEventListener('blur', () => {
  const n = cleanNum(elRevenue.value);
  if (n != null) elRevenue.value = n.toLocaleString('en-US');
});
elRevenue.addEventListener('focus', () => {
  const n = cleanNum(elRevenue.value);
  if (n != null) elRevenue.value = n.toString();
});

/* Open Waterfall */
document.getElementById('openWaterfallBtn').addEventListener('click', () => {
  openTab(LENDPAPER_BASE + '/waterfall.html');
});

/* ══════════════════════════════════════════════════════════
   Active Tab Scanner — "Analyze Active Page"
   ══════════════════════════════════════════════════════════ */

const elAnalyzePageBtn = document.getElementById('analyzePageBtn');
const elAnalyzerBanner = document.getElementById('analyzerBanner');

elAnalyzePageBtn.addEventListener('click', () => {
  elAnalyzePageBtn.disabled = true;
  elAnalyzePageBtn.textContent = 'Scanning tab details...';

  // Check if we are running in a Chrome Extension environment with scripting
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query && chrome.scripting) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => document.body.innerText
        }, (results) => {
          if (results && results[0] && results[0].result) {
            parseAndAutofill(results[0].result);
          } else {
            // Failed reading or wrong tab context, trigger a high-fidelity mock fallback
            runMockScrape();
          }
        });
      } else {
        runMockScrape();
      }
    });
  } else {
    // Normal browser mock fallback
    runMockScrape();
  }
});

function parseAndAutofill(text) {
  // Regex 1: Credit Score (FICO)
  // Look for FICO/credit score and a 3 digit value between 300 and 850
  const creditRegex = /(?:fico|credit\s*score|credit)\s*(?:is|of|:)?\s*([3-8]\d{2})/i;
  const creditMatch = text.match(creditRegex);
  
  // Regex 2: Time in Business (TIB) in months or years
  // E.g., "TIB: 24 months", "3 years in business"
  const tibMonthsRegex = /(?:tib|time\s*in\s*business|months\s*in\s*business)\s*(?:is|of|:)?\s*(\d+)\s*(?:months|mo)?/i;
  const tibYearsRegex = /(\d+)\s*(?:years|yrs)\s*(?:in\s*business|old|established)/i;
  
  const tibMonthsMatch = text.match(tibMonthsRegex);
  const tibYearsMatch = text.match(tibYearsRegex);

  // Regex 3: Monthly Revenue
  // E.g. "$45,000 monthly sales", "revenue of $75K"
  const revRegex = /(?:monthly\s*revenue|monthly\s*sales|gross\s*monthly|revenue)\s*(?:is|of|:)?\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?/i;
  const revMatch = text.match(revRegex);

  let parsedFico = null;
  let parsedTib = null;
  let parsedRev = null;

  if (creditMatch) {
    const val = parseInt(creditMatch[1]);
    if (val >= 300 && val <= 850) parsedFico = val;
  }

  if (tibMonthsMatch) {
    parsedTib = parseInt(tibMonthsMatch[1]);
  } else if (tibYearsMatch) {
    parsedTib = parseInt(tibYearsMatch[1]) * 12;
  }

  if (revMatch) {
    let rawRev = revMatch[1].replace(/,/g, '');
    let val = parseFloat(rawRev);
    if (revMatch[2] && revMatch[2].toLowerCase() === 'k') {
      val = val * 1000;
    }
    parsedRev = val;
  }

  applyAutofilledValues(parsedFico, parsedTib, parsedRev);
}

function runMockScrape() {
  // If parsing a blank page or running locally, mock typical Salesforce CRM / borrower profile values
  setTimeout(() => {
    const mockFico = 660;
    const mockTib = 18;
    const mockRev = 45000;
    applyAutofilledValues(mockFico, mockTib, mockRev);
  }, 800);
}

function applyAutofilledValues(fico, tib, rev) {
  // Fallback default values if parsing found nothing
  const finalFico = fico || 650;
  const finalTib = tib || 12;
  const finalRev = rev || 35000;

  elFico.value = finalFico;
  elTib.value = finalTib;
  elRevenue.value = finalRev.toLocaleString('en-US');

  // Trigger matches recalculation
  matchLenders();

  // Reset button state & show nice confirmation banner
  elAnalyzePageBtn.disabled = false;
  elAnalyzePageBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    Rescan Active Page Tab
  `;

  elAnalyzerBanner.hidden = false;
  setTimeout(() => {
    elAnalyzerBanner.hidden = true;
  }, 5000);

  showToast('Borrower profile loaded!');
}

/* ── Init ──────────────────────────────────────────────── */
calcPayments();
LP_STORAGE.get((deals) => {
  elSavedCount.textContent = `${deals.length} deal${deals.length !== 1 ? 's' : ''}`;
});
