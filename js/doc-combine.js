/* ============================================================
 * LendPaper White Labeling — doc-combine.js (LEN-308)
 *
 * Combine lender contract PDFs (uploaded — any lender) with the
 * amortization schedule into ONE PDF, entirely client-side.
 * Nothing is uploaded to a server. Mobile-first: output goes to
 * the native share sheet when available.
 *
 * Dependencies (load before this file):
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
 *
 * Markup contract:
 *   <div id="doc-combine"></div>      ← module renders itself here
 *
 * Optional integration hook (wire on the Payment Breakdown page):
 *   window.LP_getAmortizationPdfBytes = async () => Uint8Array
 *   If present, a "Include amortization schedule" item appears
 *   automatically. If absent, the user can upload it like any file.
 *   A reference branded-schedule generator is included below
 *   (buildAmortizationPdf) — Claude Code wires real calc data in.
 * ============================================================ */
(function () {
  'use strict';

  const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB cap
  let items = []; // { id, name, bytes, source: 'upload'|'amortization' }
  let container;

  /* ---------- Amortization PDF (branded via window.LP_TENANT) ----------
   * Reference implementation. Claude Code: replace `rows` and `meta`
   * with the live Payment Breakdown calc state, keep the layout.
   */
  async function buildAmortizationPdf(meta, rows) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const tenant = window.LP_TENANT || null;

    const brandName = tenant ? tenant.company_name : 'LendPaper';
    const contact = tenant
      ? [tenant.contact_name, tenant.contact_email, tenant.contact_phone].filter(Boolean).join('  ·  ')
      : 'lendpaper.com';
    const brandHex = (tenant && tenant.primary_color) || '#1A3C2E';
    const bc = hexToRgb(brandHex);
    const brand = rgb(bc.r / 255, bc.g / 255, bc.b / 255);

    const W = 612, H = 792, M = 48; // Letter, 0.66in margins
    const cols = [M, M + 70, M + 190, M + 300, M + 410]; // #, Payment, Principal, Interest, Balance
    const headers = ['#', 'Payment', 'Principal', 'Interest', 'Balance'];

    let page, y;
    function newPage() {
      page = doc.addPage([W, H]);
      // Header band
      page.drawRectangle({ x: 0, y: H - 64, width: W, height: 64, color: brand });
      page.drawText(brandName, { x: M, y: H - 40, size: 16, font: bold, color: rgb(1, 1, 1) });
      page.drawText('Amortization Schedule', { x: M, y: H - 56, size: 9, font, color: rgb(1, 1, 1) });
      // Footer contact
      page.drawText(contact, { x: M, y: 28, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
      y = H - 92;
      // Column headers
      headers.forEach((h, i) => page.drawText(h, { x: cols[i], y, size: 9, font: bold, color: brand }));
      y -= 16;
    }

    newPage();

    // Loan summary line
    if (meta) {
      page.drawText(meta, { x: M, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 18;
    }

    (rows || []).forEach((r) => {
      if (y < 60) newPage();
      const cells = [String(r.n), r.payment, r.principal, r.interest, r.balance];
      cells.forEach((c, i) => page.drawText(String(c), { x: cols[i], y, size: 8.5, font, color: rgb(0.1, 0.1, 0.1) }));
      y -= 13;
    });

    return doc.save();
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || [];
    return { r: parseInt(m[1] || '1A', 16), g: parseInt(m[2] || '3C', 16), b: parseInt(m[3] || '2E', 16) };
  }

  /* ---------- Merge ---------- */
  async function mergeAll() {
    const { PDFDocument } = window.PDFLib;
    const out = await PDFDocument.create();
    for (const item of items) {
      let src;
      try {
        src = await PDFDocument.load(item.bytes, { ignoreEncryption: false });
      } catch (e) {
        throw new Error('"' + item.name + '" is locked or unreadable. Ask the lender for an unlocked copy.');
      }
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    return out.save();
  }

  /* ---------- Output: share sheet on mobile, download fallback ---------- */
  async function deliver(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // user closed sheet
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------- State helpers ---------- */
  function totalBytes() {
    return items.reduce((s, i) => s + i.bytes.byteLength, 0);
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    let pending = files.length;
    if (!pending) return;
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        items.push({ id: uid(), name: f.name, bytes: new Uint8Array(reader.result), source: 'upload' });
        if (--pending === 0) render();
      };
      reader.readAsArrayBuffer(f);
    });
  }

  function move(id, dir) {
    const i = items.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    render();
  }

  function remove(id) {
    items = items.filter((x) => x.id !== id);
    render();
  }

  function uid() {
    return 'd' + Math.random().toString(36).slice(2, 9);
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function fmtSize(b) {
    return b > 1024 * 1024 ? (b / 1048576).toFixed(1) + ' MB' : Math.ceil(b / 1024) + ' KB';
  }

  /* ---------- UI ---------- */
  function render() {
    if (!container) return;
    const over = totalBytes() > MAX_TOTAL_BYTES;
    const hasHook = typeof window.LP_getAmortizationPdfBytes === 'function';
    const hasAmort = items.some((i) => i.source === 'amortization');

    container.innerHTML =
      '<div class="dc-card">' +
        '<div class="dc-head">' +
          '<h3 class="dc-title">Combine docs</h3>' +
          '<p class="dc-sub">Merge the lender contract and amortization schedule into one PDF. Your documents never leave your device.</p>' +
        '</div>' +
        '<label class="dc-drop">' +
          '<input type="file" accept="application/pdf" multiple hidden id="dc-file-input">' +
          '<span class="dc-drop-label">Add lender contract PDF(s)</span>' +
          '<span class="dc-drop-hint">Works with any lender\u2019s paperwork</span>' +
        '</label>' +
        (hasHook && !hasAmort
          ? '<button type="button" class="dc-add-amort" id="dc-add-amort">+ Include amortization schedule</button>'
          : '') +
        '<ul class="dc-list" id="dc-list">' +
          items.map((it, idx) =>
            '<li class="dc-item" data-id="' + it.id + '">' +
              '<span class="dc-item-idx">' + (idx + 1) + '</span>' +
              '<span class="dc-item-name">' + esc(it.name) + '</span>' +
              '<span class="dc-item-size">' + fmtSize(it.bytes.byteLength) + '</span>' +
              '<span class="dc-item-controls">' +
                '<button type="button" class="dc-btn" data-act="up" aria-label="Move up">\u2191</button>' +
                '<button type="button" class="dc-btn" data-act="down" aria-label="Move down">\u2193</button>' +
                '<button type="button" class="dc-btn dc-btn-x" data-act="remove" aria-label="Remove">\u00d7</button>' +
              '</span>' +
            '</li>'
          ).join('') +
        '</ul>' +
        (over ? '<p class="dc-error">Total size is over 25 MB \u2014 remove a file or use smaller scans.</p>' : '') +
        '<div class="dc-error" id="dc-merge-error" hidden></div>' +
        '<button type="button" class="dc-merge" id="dc-merge" ' + (items.length < 2 || over ? 'disabled' : '') + '>' +
          'Combine \u0026 share (' + items.length + ' doc' + (items.length === 1 ? '' : 's') + ')' +
        '</button>' +
      '</div>';

    container.querySelector('#dc-file-input').addEventListener('change', (e) => addFiles(e.target.files));

    const addAmort = container.querySelector('#dc-add-amort');
    if (addAmort) {
      addAmort.addEventListener('click', async () => {
        addAmort.disabled = true;
        addAmort.textContent = 'Building schedule\u2026';
        try {
          const bytes = await window.LP_getAmortizationPdfBytes();
          items.unshift({ id: uid(), name: 'Amortization Schedule.pdf', bytes: new Uint8Array(bytes), source: 'amortization' });
        } catch (_) {}
        render();
      });
    }

    container.querySelector('#dc-list').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.closest('.dc-item').dataset.id;
      if (btn.dataset.act === 'up') move(id, -1);
      if (btn.dataset.act === 'down') move(id, 1);
      if (btn.dataset.act === 'remove') remove(id);
    });

    container.querySelector('#dc-merge').addEventListener('click', async () => {
      const btn = container.querySelector('#dc-merge');
      const errEl = container.querySelector('#dc-merge-error');
      btn.disabled = true;
      btn.textContent = 'Combining\u2026';
      errEl.hidden = true;
      try {
        const bytes = await mergeAll();
        const brand = (window.LP_TENANT && window.LP_TENANT.company_name) || 'LendPaper';
        const date = new Date().toISOString().slice(0, 10);
        await deliver(bytes, brand + ' Deal Docs ' + date + '.pdf');
      } catch (e) {
        errEl.textContent = e.message || 'Could not combine those PDFs.';
        errEl.hidden = false;
      }
      render();
    });
  }

  function init() {
    container = document.getElementById('doc-combine');
    if (!container) return;
    if (!window.PDFLib) {
      container.innerHTML = '<p class="dc-error">PDF engine failed to load. Refresh and try again.</p>';
      return;
    }
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for Claude Code wiring/tests
  window.LP_DocCombine = { addFiles, buildAmortizationPdf };
})();
