/**
 * LendPaper PDF & Print Helper
 * Single source of truth for tiered headers, page-specific footers, and render gates.
 */

window.PDF_HELPER = {
    getTier: function() {
        return new URLSearchParams(window.location.search).get('tier') || localStorage.getItem('lp_tier') || 'free';
    },

    generateQuoteId: function() {
        const now = new Date();
        const ymd = now.getFullYear().toString()
            + String(now.getMonth() + 1).padStart(2, '0')
            + String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
        return 'LP-' + ymd + '-' + rand;
    },

    formatQuoteDate: function() {
        return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    },
    
    showToast: function(message, isError = false) {
        let toast = document.getElementById('toast');
        if (!toast) {
            // Create fallback toast in DOM if not present
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#111827;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;opacity:0;transition:opacity 300ms;pointer-events:none;z-index:9999;';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        if (isError) {
            toast.style.backgroundColor = '#EF4444'; // Red for error
        } else {
            toast.style.backgroundColor = '#111827'; // Dark gray/black
        }
        
        toast.classList.remove('opacity-0');
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.style.opacity = '0';
        }, 3000);
    },
    
    initPrintLayout: function(title, quoteId) {
        // Remember args so the white-label layer can re-render this header once
        // the tenant resolves (branding.js is async; see listener at file end).
        this._lastPrintArgs = [title, quoteId];

        // Set dynamic favicon for artifact mode
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.type = 'image/svg+xml';
        link.href = '../public/assets/brand/favicon-artifact.svg';

        // Find header
        const headerEl = document.querySelector('.print-header-content');
        if (!headerEl) return;

        const tier = this.getTier();
        const tenant = window.LP_TENANT || null;
        let headerHTML = "";

        if (tenant) {
            // White-label tenant (LEN-306): tenant logo + name on the left,
            // "Powered by LendPaper" attribution on the right (BRANDING.md §5).
            const escT = (s) => String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left" style="display: flex !important; align-items: center !important; gap: 8px !important;">
                        ${tenant.logo_url ? `<img src="${escT(tenant.logo_url)}" alt="" style="max-height: 28px !important; max-width: 150px !important;">` : ''}
                        <span style="font-size: 15px !important; font-weight: 800 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">${escT(tenant.company_name)}</span>
                    </div>
                    <div class="print-header-right" style="text-align: right !important; color: #9CA3AF !important;">
                        <span style="font-size: 7.5px !important; font-weight: 700 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">Powered by LendPaper</span>
                    </div>
                </div>
            `;
        } else if (tier === 'free') {
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left"></div>
                    <div class="print-header-right" style="text-align: right !important; display: flex !important; flex-direction: column !important; align-items: flex-end !important;">
                        <div style="display: flex !important; align-items: center !important; gap: 6px !important;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
                                <path d="M4 4v16h11l5-5V4H4z"/>
                                <path d="M15 20v-5h5" stroke-linecap="butt"/>
                                <path d="M9 9v6"/>
                                <path d="M9 15h4"/>
                            </svg>
                            <span style="font-size: 16px !important; font-weight: 800 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">lend<span style="font-weight: 300 !important; color: #6B7280 !important;">paper</span><span style="color: #1A3C2E !important;">.</span></span>
                        </div>
                        <span style="font-size: 9px !important; color: #6B7280 !important; margin-top: 2px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">· Scenario Modeling Engine</span>
                    </div>
                </div>
            `;
        } else if (tier === 'pro' || tier === 'branded') {
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left" style="display: flex !important; align-items: center !important; gap: 8px !important;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A3C2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #1A3C2E !important;">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                        </svg>
                        <span style="font-size: 14px !important; font-weight: 800 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">ACME Funding Partner</span>
                    </div>
                    <div class="print-header-right" style="text-align: right !important; display: flex !important; align-items: center !important; gap: 6px !important; color: #6B7280 !important;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                            <path d="M4 4v16h11l5-5V4H4z"/>
                            <path d="M15 20v-5h5" stroke-linecap="butt"/>
                            <path d="M9 9v6"/>
                            <path d="M9 15h4"/>
                        </svg>
                        <span style="font-size: 9.5px !important; font-weight: 500 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">· Scenario Modeling Engine</span>
                    </div>
                </div>
            `;
        } else if (tier === 'whitelabel' || tier === 'enterprise') {
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left" style="display: flex !important; align-items: center !important; gap: 8px !important;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #111827 !important;">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                        </svg>
                        <span style="font-size: 15px !important; font-weight: 900 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">ACME Funding Partner</span>
                    </div>
                    <div class="print-header-right" style="text-align: right !important; color: #9CA3AF !important;">
                        ${tier === 'whitelabel' ? '<span style="font-size: 7.5px !important; font-weight: 700 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important;">Powered by LendPaper</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        const quoteStampHtml = quoteId
            ? `<div style="font-size: 8px !important; color: #9CA3AF !important; margin-top: 4px !important; letter-spacing: 0.03em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">Doc #${quoteId} &nbsp;·&nbsp; ${this.formatQuoteDate()}</div>`
            : '';

        headerHTML += `
            <div style="text-align: center !important; margin-top: 4px !important; margin-bottom: 8px !important;">
                <h1 class="pdf-document-title" style="display: block !important; font-size: 20px !important; font-weight: 800 !important; color: #111827 !important; margin: 0 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">${title}</h1>
                ${quoteStampHtml}
            </div>
        `;
        
        headerEl.innerHTML = headerHTML;
    },

    // Calm "Estimate only" notice (LEN-141) inserted at the top of the captured body so
    // every calculator's PDF opens with the same amber banner. Styled by pdf-calm.css.
    // Skipped for calculators that render their own calm-native notice (Payment Breakdown,
    // which owns #pdf-document). Removed after the print dialog closes.
    mountEstimateNotice: function(element) {
        if (!element || document.getElementById('pdf-document')) return null;
        if (element.querySelector('.lp-pdf-notice')) return null;
        var note = document.createElement('div');
        note.className = 'lp-pdf-notice';
        note.id = 'lp-estimate-notice';
        note.innerHTML = '<strong>Estimate only.</strong> For planning and discussion. Final approval, pricing, fees, and payoff quotes come from the lender and may differ. lendpaper.com/legal/estimates';
        var hdr = element.querySelector('.print-header-content');
        if (hdr) hdr.insertAdjacentElement('afterend', note);
        else element.insertAdjacentElement('afterbegin', note);
        return note;
    },

    resetScroll: async function(delayMs) {
        // 1. Reset local window scroll offsets
        window.scrollTo(0, 0);
        if (document.documentElement) {
            document.documentElement.scrollLeft = 0;
            document.documentElement.scrollTop = 0;
        }
        if (document.body) {
            document.body.scrollLeft = 0;
            document.body.scrollTop = 0;
        }

        // 2. Nuclear Reset: Clear horizontal and vertical scroll offsets on EVERY single element in the DOM
        try {
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.scrollLeft > 0) {
                    el.scrollLeft = 0;
                }
                // Do not reset scrollTop on the documentElement or body to prevent throwing off the primary window position
                if (el.scrollTop > 0 && el !== document.documentElement && el !== document.body) {
                    el.scrollTop = 0;
                }
            });
        } catch (e) {
            console.warn("PDF Helper: Failed to reset internal element scrolls:", e);
        }

        // 3. Reset horizontal scroll values on main captured elements (redundancy safeguard)
        const mainEl = document.querySelector('.lp-main') || document.querySelector('main');
        if (mainEl) {
            mainEl.scrollLeft = 0;
        }
        const containerEl = document.querySelector('.lp-container') || document.querySelector('.modal-shell') || document.querySelector('.lp-card');
        if (containerEl) {
            containerEl.scrollLeft = 0;
        }

        // 4. Reset parent window scroll if running within an embedded iframe
        try {
            if (window.parent && window.parent !== window) {
                window.parent.scrollTo(0, 0);
                if (window.parent.document.documentElement) {
                    window.parent.document.documentElement.scrollLeft = 0;
                    window.parent.document.documentElement.scrollTop = 0;
                }
                if (window.parent.document.body) {
                    window.parent.document.body.scrollLeft = 0;
                    window.parent.document.body.scrollTop = 0;
                }
            }
        } catch (e) {
            // Suppress cross-origin security warnings if parent is on a different domain
            console.warn("PDF Helper: Could not scroll parent window due to cross-origin policies:", e);
        }

        // 5. Wait for the browser layout to settle down after scroll offsets are cleared
        await new Promise(r => setTimeout(r, delayMs));
    },


    addPdfFooters: function(pdf) {
        if (pdf.footersAdded) return;
        pdf.footersAdded = true;

        const tier = this.getTier();
        const totalPages = pdf.getNumberOfPages();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Explicitly reset font to normal Helvetica before drawing anything in footer
            pdf.setFont("helvetica", "normal");
            
            // Draw a subtle line separator at bottom
            pdf.setDrawColor(229, 231, 235); // #E5E7EB
            pdf.setLineWidth(0.2);
            pdf.line(10, pageHeight - 24, pageWidth - 10, pageHeight - 24);
            
            // 1. Draw Tier-Specific Footer
            pdf.setFontSize(7.5);
            pdf.setTextColor(107, 114, 128); // #6B7280
            
            if (tier === 'free') {
                let startX = 10;
                let y1 = pageHeight - 19;

                let seg1 = "Generated via LendPaper  |  ";
                pdf.text(seg1, startX, y1);

                let seg1Width = pdf.getTextWidth(seg1);
                startX += seg1Width;

                pdf.setTextColor(20, 83, 45); // Green for the link
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("lendpaper.com", startX, y1, { url: "https://lendpaper.com" });
                } catch(e) {
                    pdf.text("lendpaper.com", startX, y1);
                }

                // Row 2:
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(107, 114, 128); // #6B7280

                let y2 = pageHeight - 15;
                startX = 10;

                let subSeg1 = "White-label and custom branding available  -  ";
                pdf.text(subSeg1, startX, y2);

                let subSeg1Width = pdf.getTextWidth(subSeg1);
                startX += subSeg1Width;

                pdf.setTextColor(20, 83, 45); // Green for the link
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("hello@lendpaper.com", startX, y2, { url: "mailto:hello@lendpaper.com" });
                } catch(e) {
                    pdf.text("hello@lendpaper.com", startX, y2);
                }
            } else if (tier === 'pro' || tier === 'branded') {
                let startX = 10;
                let y1 = pageHeight - 19;
                
                let seg1 = "Generated via LendPaper  ·  ";
                pdf.text(seg1, startX, y1);
                
                let seg1Width = pdf.getTextWidth(seg1);
                startX += seg1Width;
                
                pdf.setTextColor(20, 83, 45); // #1A3C2E
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("lendpaper.com", startX, y1, { url: "https://lendpaper.com" });
                } catch(e) {
                    pdf.text("lendpaper.com", startX, y1);
                }
                
                // Row 2
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(107, 114, 128); // #6B7280
                
                let y2 = pageHeight - 15;
                startX = 10;
                
                let subSeg1 = "Remove this footer and add your logo - ask about ";
                pdf.text(subSeg1, startX, y2);
                
                let subSeg1Width = pdf.getTextWidth(subSeg1);
                startX += subSeg1Width;
                
                pdf.setTextColor(20, 83, 45);
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("white-label plans", startX, y2, { url: "mailto:hello@lendpaper.com?subject=Interested%20in%20White-Label%20Plans" });
                } catch(e) {
                    pdf.text("white-label plans", startX, y2);
                }
            } else if (tier === 'whitelabel' || tier === 'enterprise') {
                let startX = 10;
                let y1 = pageHeight - 17;
                
                let seg1 = "Powered by LendPaper  |  ";
                pdf.text(seg1, startX, y1);
                
                let seg1Width = pdf.getTextWidth(seg1);
                startX += seg1Width;
                
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("hello@lendpaper.com", startX, y1, { url: "mailto:hello@lendpaper.com" });
                } catch(e) {
                    pdf.text("hello@lendpaper.com", startX, y1);
                }
                
                let seg2Width = pdf.getTextWidth("hello@lendpaper.com");
                startX += seg2Width;
                
                pdf.setFont("helvetica", "normal");
                let seg3 = "  |  ";
                pdf.text(seg3, startX, y1);
                
                let seg3Width = pdf.getTextWidth(seg3);
                startX += seg3Width;
                
                pdf.setFont("helvetica", "bold");
                try {
                    pdf.textWithLink("lendpaper.com", startX, y1, { url: "https://lendpaper.com" });
                } catch(e) {
                    pdf.text("lendpaper.com", startX, y1);
                }
            }
            
            // Page Number in bottom right corner (aligned with tierText row)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(156, 163, 175);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 26, pageHeight - 17);
            
            // 2. Draw Legal Micro-Copy (Always Present, Lower Left)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(5.5);
            pdf.setTextColor(156, 163, 175); // #9CA3AF
            
            const disclaimerText = "ESTIMATES ONLY — NOT FINANCIAL ADVICE. These figures are preliminary estimates generated by the user (lender, broker, or ISO) using LendPaper software. LendPaper is a software provider only — not a lender, broker, financial advisor, or institution. LendPaper does not verify inputs, guarantee calculations, or determine final loan terms. Actual terms are subject to lender underwriting and final approval.";
            const splitDisclaimer = pdf.splitTextToSize(disclaimerText, pageWidth - 20); // Margins: left 10, right 10
            
            let currentY = pageHeight - 10.5;
            splitDisclaimer.forEach((line) => {
                pdf.text(line, 10, currentY);
                currentY += 2.4; // Clean, elegant vertical spacing for 5.5pt font
            });
            
            // Print the terms link row separately, perfectly aligned and colored!
            let startX = 10;
            pdf.text("Full terms: ", startX, currentY);
            
            let ftWidth = pdf.getTextWidth("Full terms: ");
            startX += ftWidth;
            
            pdf.setTextColor(20, 83, 45); // Signature primary brand green
            pdf.setFont("helvetica", "bold");
            try {
                pdf.textWithLink("lendpaper.com/legal/estimates", startX, currentY, { url: "https://lendpaper.com/legal/estimates" });
            } catch(e) {
                pdf.text("lendpaper.com/legal/estimates", startX, currentY);
            }
        }
    },

    generatePDF: async function(element, title, filename, btn, origText, isMultiScenario = false, quoteId = null) {
        const self = this;

        // STEP 1 — Show one-time educational modal (returns false if user cancels)
        const proceed = await this.showPrintEducationModal();
        if (!proceed) {
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
            return;
        }

        // STEP 2 — Apply print-mode classes so pdf-export-mode + @media print CSS takes effect
        document.documentElement.classList.add('pdf-export-mode');
        document.body.classList.add('pdf-export-mode');
        if (isMultiScenario) {
            document.body.classList.add('multi-scenario');
        }

        // STEP 3 — Quote ID for this document. Callers may pass a pre-generated ID so the
        // same forensic ID can also be printed inside the document body (e.g. the redesigned
        // borrower PDF's prepared-for block + footer). Falls back to a fresh ID when omitted.
        var _quoteId = quoteId || this.generateQuoteId();

        // STEP 4 — Build the print header dynamically per tier (includes Doc # + date)
        this.initPrintLayout(title, _quoteId);

        // STEP 5 — Set document title; browsers use this as the suggested PDF filename
        const origDocTitle = document.title;
        document.title = filename.replace(/\.pdf$/i, '');

        // Let the browser apply the print-mode reflow before opening the dialog
        await new Promise(r => setTimeout(r, 250));

        // STEP 6 — Inject quote ID into @page @bottom-right via a style tag.
        // This renders in the page MARGIN on every page — never overlaps content.
        // Overrides any existing @bottom-right rule via cascade (injected last).
        var _pageStyle = document.createElement('style');
        _pageStyle.id = 'lp-quote-page-style';
        _pageStyle.textContent = [
            // Quote ID + ESTIMATE ONLY in every page's bottom-right margin box
            '@page { @bottom-right { content: "'
                + _quoteId + '  \B7  ESTIMATE ONLY  \B7  Page " counter(page) " of " counter(pages);'
                + 'font-size: 6pt; color: #B0B8C4;'
                + 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
                + 'vertical-align: top; padding-top: 6pt; border-top: 0.5pt solid #E5E7EB; } }',
            // Diagonal page watermark — centered on every page, behind content
            'body.pdf-export-mode::before {'
                + 'content: "ESTIMATE ONLY";'
                + 'position: fixed;'
                + 'top: 50%; left: 50%;'
                + 'transform: translate(-50%, -50%) rotate(-42deg);'
                + 'font-size: 18pt;'
                + 'font-weight: 900;'
                + 'color: rgba(0, 0, 0, 0.055);'
                + 'letter-spacing: 0.08em;'
                + 'white-space: nowrap;'
                + 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
                + 'pointer-events: none;'
                + 'z-index: 0;'
                + '-webkit-print-color-adjust: exact;'
                + 'print-color-adjust: exact; }'
        ].join('\n');
        document.head.appendChild(_pageStyle);

        // STEP 7 — Inject hidden forensic fingerprint (white text, invisible visually but
        // extractable via PDF text tools or Select All+Copy — links back to same quoteId).
        var _fpPayload = [
            'LENDPAPER-DOC-ID:' + _quoteId,
            'TS:' + new Date().toISOString(),
            'ORIGIN:' + window.location.href,
            'REF:' + (document.referrer || 'direct'),
            'TZ:' + ((typeof Intl !== 'undefined' && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown'),
            'LANG:' + navigator.language,
            'SCR:' + (screen.width + 'x' + screen.height),
            'UA:' + navigator.userAgent
        ].join(' | ');
        var _fpDiv = document.createElement('div');
        _fpDiv.id = 'lp-doc-fingerprint';
        _fpDiv.setAttribute('aria-hidden', 'true');
        _fpDiv.textContent = _fpPayload;
        document.body.appendChild(_fpDiv);

        // STEP 7.5 — State-triggered compliance disclosures (LEN-88).
        // Fires automatically off the borrower state; renders nothing when no
        // state is selected or the state has no PDF rules. Canonical rules:
        // markdowns/LEGAL.md Part II via compliance.js (optional dependency).
        if (window.LPCompliance) {
            var _compBlock = window.LPCompliance.buildPdfBlock();
            if (_compBlock) {
                (element || document.body).appendChild(_compBlock);
            }
        }

        // STEP 7.6 — Calm "Estimate only" notice at the top of the captured body (LEN-141).
        // No-op for Payment Breakdown, which renders its own calm-native notice.
        this.mountEstimateNotice(element);

        // Remove print-mode classes, injected page style, and fingerprint once the
        // dialog clears. Runs from `afterprint` (fires the moment the dialog closes)
        // so the 800px pdf-export-mode layout never lingers on screen; the 1500ms
        // timer below is only a fallback for browsers that don't fire afterprint.
        var _cleanedUp = false;
        var _cleanupPrintMode = function() {
            if (_cleanedUp) return;
            _cleanedUp = true;
            document.documentElement.classList.remove('pdf-export-mode');
            document.body.classList.remove('pdf-export-mode');
            document.body.classList.remove('multi-scenario');
            var ps = document.getElementById('lp-quote-page-style');
            if (ps) ps.parentNode.removeChild(ps);
            var fp = document.getElementById('lp-doc-fingerprint');
            if (fp) fp.parentNode.removeChild(fp);
            var cb = document.getElementById('lp-compliance-print-block');
            if (cb) cb.parentNode.removeChild(cb);
            var en = document.getElementById('lp-estimate-notice');
            if (en) en.parentNode.removeChild(en);
        };

        window.addEventListener('afterprint', () => {
            self._handlePdfSaveSuccess();
            _cleanupPrintMode();
        }, { once: true });

        try {
            window.print();
        } catch (e) {
            console.error("Print dialog failed:", e);
            this.showToast("Failed to open print dialog.", true);
        } finally {
            // Restore document title
            document.title = origDocTitle;

            setTimeout(_cleanupPrintMode, 1500);

            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        }
    },

    _handlePdfSaveSuccess: function() {
        const n = parseInt(localStorage.getItem('lp_pdf_save_count') || '0', 10) + 1;
        localStorage.setItem('lp_pdf_save_count', n);
    },

    showPrintEducationModal: function() {
        return new Promise((resolve) => {
            const LOOP_MS          = 5400;
            const UNLOCK_MS        = 5000;  // first-timers: countdown before "Open print menu" unlocks
            const RESET_AFTER_DAYS = 30;
            const DSA_AFTER_SAVES  = 2;
            const KEY_SAVE_COUNT   = 'lp_pdf_save_count';
            const KEY_LAST_ACTIVE  = 'lp_pdf_last_active';
            const KEY_DSA          = 'lp_pdf_dsa';

            // 30-day inactivity reset
            const last = localStorage.getItem(KEY_LAST_ACTIVE);
            if (last) {
                const daysSince = (Date.now() - new Date(last).getTime()) / 86400000;
                if (daysSince >= RESET_AFTER_DAYS) {
                    localStorage.removeItem(KEY_SAVE_COUNT);
                    localStorage.removeItem(KEY_DSA);
                }
            }
            localStorage.setItem(KEY_LAST_ACTIVE, new Date().toISOString());

            // Only DSA permanently suppresses; modal shows every time otherwise
            if (localStorage.getItem(KEY_DSA) === '1') {
                resolve(true);
                return;
            }

            // Scoped CSS — removed when modal is dismissed
            const style = document.createElement('style');
            style.id = 'lpm-style';
            style.textContent = [
                '#lp-print-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.52);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;}',
                '#lp-print-modal-overlay .lpm-modal{background:#fff;border-radius:16px;width:520px;box-shadow:0 32px 80px rgba(0,0,0,0.36);overflow:hidden;animation:lpmPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;}',
                '@keyframes lpmPopIn{from{opacity:0;transform:scale(0.91);}to{opacity:1;transform:scale(1);}}',
                '#lp-print-modal-overlay .lpm-hed{padding:26px 36px 18px;text-align:center;}',
                '#lp-print-modal-overlay .lpm-hed h1{font-size:26px;font-weight:700;color:#111;letter-spacing:-0.025em;margin:0;}',
                '#lp-print-modal-overlay .lpm-stage{position:relative;height:360px;background:#eaeceb;border-top:1px solid #e0e0e0;border-bottom:1px solid #e0e0e0;overflow:hidden;}',
                '#lp-print-modal-overlay .lpm-step-ind{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:11.5px;font-weight:600;letter-spacing:0.045em;color:#777;text-transform:uppercase;transition:opacity 0.25s;z-index:50;pointer-events:none;}',
                '#lp-print-modal-overlay .lpm-sprog{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(0,0,0,0.08);z-index:60;}',
                '#lp-print-modal-overlay .lpm-sprog-fill{height:100%;background:#2d6a2d;width:0%;}',
                '#lp-print-modal-overlay .lpm-dialog{position:absolute;background:#fff;border-radius:9px;box-shadow:0 6px 28px rgba(0,0,0,0.17);width:348px;top:30px;left:50%;transform:translateX(-50%);overflow:visible;}',
                '#lp-print-modal-overlay .lpm-d-title{font-size:15px;font-weight:500;color:#202124;padding:14px 18px 11px;border-bottom:1px solid #eee;}',
                '#lp-print-modal-overlay .lpm-d-field{display:flex;align-items:center;padding:11px 18px;border-bottom:1px solid #f0f0f0;position:relative;transition:background 0.35s;}',
                '#lp-print-modal-overlay .lpm-d-field.lpm-glow-green{background:#e8f5e9;}',
                '#lp-print-modal-overlay .lpm-d-label{font-size:12px;color:#5f6368;width:100px;flex-shrink:0;}',
                '#lp-print-modal-overlay .lpm-d-sel{flex:1;display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #dadce0;border-radius:4px;padding:6px 10px;font-size:12px;color:#202124;transition:border-color 0.2s,box-shadow 0.2s;}',
                '#lp-print-modal-overlay .lpm-d-sel.lpm-focused{border-color:#1a73e8;box-shadow:0 0 0 2.5px rgba(26,115,232,0.2);}',
                '#lp-print-modal-overlay .lpm-d-chev{transition:transform 0.18s;width:14px;height:14px;}',
                '#lp-print-modal-overlay .lpm-d-chev.lpm-open{transform:rotate(180deg);}',
                '#lp-print-modal-overlay .lpm-d-dd{position:absolute;top:calc(100% + 2px);left:100px;right:0;background:#fff;border-radius:5px;box-shadow:0 4px 16px rgba(0,0,0,0.18);overflow:hidden;z-index:80;opacity:0;transform:scaleY(0.82);transform-origin:top;transition:opacity 0.14s,transform 0.14s;pointer-events:none;}',
                '#lp-print-modal-overlay .lpm-d-dd.lpm-open{opacity:1;transform:scaleY(1);}',
                '#lp-print-modal-overlay .lpm-dd-row{padding:10px 12px;font-size:12px;color:#202124;display:flex;align-items:center;gap:8px;}',
                '#lp-print-modal-overlay .lpm-dd-row.lpm-hi{background:#f1f3f4;}',
                '#lp-print-modal-overlay .lpm-dd-row.lpm-sel{background:#e8f0fe;color:#1a73e8;}',
                '#lp-print-modal-overlay .lpm-ck{width:13px;height:13px;flex-shrink:0;visibility:hidden;}',
                '#lp-print-modal-overlay .lpm-dd-row.lpm-sel .lpm-ck{visibility:visible;}',
                '#lp-print-modal-overlay .lpm-d-check{display:flex;align-items:center;gap:10px;padding:11px 18px;border-bottom:1px solid #f0f0f0;transition:background 0.35s;}',
                '#lp-print-modal-overlay .lpm-d-check.lpm-glow-amber{background:#fff8e1;}',
                '#lp-print-modal-overlay .lpm-cbox{width:15px;height:15px;border-radius:2px;border:1.5px solid #5f6368;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.2s,border-color 0.2s;}',
                '#lp-print-modal-overlay .lpm-cbox.lpm-on{background:#1a73e8;border-color:#1a73e8;}',
                '#lp-print-modal-overlay .lpm-cbox.lpm-on::after{content:"";display:block;width:8px;height:5px;border-left:1.5px solid #fff;border-bottom:1.5px solid #fff;transform:rotate(-45deg) translateY(-1px);}',
                '#lp-print-modal-overlay .lpm-cbox-lbl{font-size:12px;color:#202124;transition:color 0.25s;}',
                '#lp-print-modal-overlay .lpm-cbox-lbl.lpm-dim{color:#c0c0c0;text-decoration:line-through;}',
                '#lp-print-modal-overlay .lpm-d-actions{display:flex;justify-content:flex-end;gap:7px;padding:11px 18px 14px;}',
                '#lp-print-modal-overlay .lpm-d-cancel{font-size:12px;color:#1a73e8;background:transparent;border:none;padding:6px 12px;border-radius:20px;font-family:inherit;opacity:0.14;}',
                '#lp-print-modal-overlay .lpm-d-save{font-size:12px;font-weight:500;color:#fff;padding:7px 20px;border-radius:20px;border:none;font-family:inherit;background:#1a73e8;transition:background 0.3s,transform 0.1s;}',
                '#lp-print-modal-overlay .lpm-d-save.lpm-press{background:#1558b0;transform:scale(0.93);}',
                '#lp-print-modal-overlay #lpm-cur{position:absolute;width:22px;height:22px;pointer-events:none;z-index:200;transition:none;}',
                '#lp-print-modal-overlay #lpm-cur svg{filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.4));}',
                '#lp-print-modal-overlay #lpm-cring{position:absolute;width:44px;height:44px;border-radius:50%;border:3px solid rgba(26,115,232,0.9);pointer-events:none;z-index:199;opacity:0;transform:scale(0.2);}',
                '#lp-print-modal-overlay #lpm-cring.lpm-pop{animation:lpmRingPop 0.46s ease-out forwards;}',
                '@keyframes lpmRingPop{0%{opacity:1;transform:scale(0.25);}100%{opacity:0;transform:scale(2);}}',
                '#lp-print-modal-overlay .lpm-foot{display:flex;align-items:center;padding:15px 22px 20px;gap:10px;}',
                '#lp-print-modal-overlay .lpm-dsa-wrap{display:flex;align-items:center;gap:7px;opacity:0;pointer-events:none;transition:opacity 0.4s;flex:1;}',
                '#lp-print-modal-overlay .lpm-dsa-wrap.lpm-visible{opacity:1;pointer-events:auto;}',
                '#lp-print-modal-overlay .lpm-dsa-wrap input{width:13px;height:13px;cursor:pointer;accent-color:#2d6a2d;}',
                '#lp-print-modal-overlay .lpm-dsa-wrap label{font-size:11px;color:#888;text-transform:uppercase;font-weight:600;letter-spacing:0.04em;line-height:1.3;cursor:pointer;}',
                '#lp-print-modal-overlay .lpm-btn-cancel{font-size:12.5px;color:#aaa;background:transparent;border:0.5px solid #e0e0e0;padding:9px 18px;border-radius:7px;cursor:pointer;font-family:inherit;}',
                '#lp-print-modal-overlay .lpm-btn-proceed{font-size:13px;font-weight:700;padding:11px 22px;border-radius:8px;border:none;font-family:inherit;cursor:pointer;color:#fff;background:#2d6a2d;white-space:nowrap;transition:background 0.2s;}',
                '#lp-print-modal-overlay .lpm-btn-proceed{font-variant-numeric:tabular-nums;}',
                '#lp-print-modal-overlay .lpm-btn-proceed.lpm-locked{background:#e3e5e3;color:#9a9d9a;cursor:not-allowed;}',
                '#lp-print-modal-overlay .lpm-btn-proceed.lpm-unlocking{animation:lpmBtnPulse 0.55s ease-out;}',
                '@keyframes lpmBtnPulse{0%{transform:scale(1);}40%{transform:scale(1.08);background:#3c8c3c;}100%{transform:scale(1);}}',
                '#lp-print-modal-overlay .lpm-btn-proceed:not(.lpm-locked):not(.lpm-unlocking):hover{background:#245524;}'
            ].join('');
            document.head.appendChild(style);

            const overlay = document.createElement('div');
            overlay.id = 'lp-print-modal-overlay';
            overlay.innerHTML =
                '<div class="lpm-modal">'
                + '<div class="lpm-hed"><h1>Don\'t print, save.</h1></div>'
                + '<div class="lpm-stage" id="lpm-stage">'
                +   '<div id="lpm-cur"><svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M4 2L4 16L7.5 12.5L10.5 18L12.5 17L9.5 11L14 11L4 2Z" fill="white" stroke="#1a1a1a" stroke-width="0.9"/></svg></div>'
                +   '<div id="lpm-cring"></div>'
                +   '<div class="lpm-dialog">'
                +     '<div class="lpm-d-title">Print</div>'
                +     '<div class="lpm-d-field" id="lpm-dest-row">'
                +       '<span class="lpm-d-label">Destination</span>'
                +       '<div style="position:relative;flex:1;">'
                +         '<div class="lpm-d-sel" id="lpm-dsel">'
                +           '<span id="lpm-dsel-val">Your Printer</span>'
                +           '<svg class="lpm-d-chev" id="lpm-dchev" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
                +         '</div>'
                +         '<div class="lpm-d-dd" id="lpm-ddd">'
                +           '<div class="lpm-dd-row lpm-sel" id="lpm-ddo-p"><svg class="lpm-ck" viewBox="0 0 13 13" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round"><polyline points="1.5,6.5 4.5,9.5 11,3"/></svg>Your Printer</div>'
                +           '<div class="lpm-dd-row" id="lpm-ddo-pdf"><svg class="lpm-ck" viewBox="0 0 13 13" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round"><polyline points="1.5,6.5 4.5,9.5 11,3"/></svg>Save as PDF</div>'
                +         '</div>'
                +       '</div>'
                +     '</div>'
                +     '<div class="lpm-d-check" id="lpm-hf-row">'
                +       '<div class="lpm-cbox lpm-on" id="lpm-hfcb"></div>'
                +       '<span class="lpm-cbox-lbl" id="lpm-hflbl">Headers and footers</span>'
                +     '</div>'
                +     '<div class="lpm-d-actions"><button class="lpm-d-cancel">Cancel</button><button class="lpm-d-save" id="lpm-dsave">Print</button></div>'
                +   '</div>'
                +   '<div class="lpm-step-ind" id="lpm-step-ind">Step 1 of 2 — change Destination</div>'
                +   '<div class="lpm-sprog"><div class="lpm-sprog-fill" id="lpm-spfill"></div></div>'
                + '</div>'
                + '<div class="lpm-foot">'
                +   '<div class="lpm-dsa-wrap" id="lpm-dsa-wrap"><input type="checkbox" id="lpm-dsa-cb"/><label for="lpm-dsa-cb">Never show this again</label></div>'
                +   '<button class="lpm-btn-cancel" id="lpm-cancel-btn">Cancel</button>'
                +   '<button class="lpm-btn-proceed lpm-locked" id="lpm-proceed-btn">Open print menu →</button>'
                + '</div>'
                + '</div>';
            document.body.appendChild(overlay);

            // Returning users who've already seen it get the opt-out immediately on open;
            // first-time users get it the moment they finish watching once (see unlock block below).
            const saveCount = parseInt(localStorage.getItem(KEY_SAVE_COUNT) || '0', 10);
            if (saveCount >= DSA_AFTER_SAVES) {
                document.getElementById('lpm-dsa-wrap').classList.add('lpm-visible');
            }

            function dismiss(result) {
                // Honor "Never show this again" whether they proceed OR cancel out of the modal.
                const dsaCb = document.getElementById('lpm-dsa-cb');
                if (dsaCb && dsaCb.checked) {
                    localStorage.setItem(KEY_DSA, '1');
                }
                animRunning = false;
                overlay.remove();
                const st = document.getElementById('lpm-style');
                if (st) st.remove();
                resolve(result);
            }

            // Animation helpers
            const stage = document.getElementById('lpm-stage');
            const cur   = document.getElementById('lpm-cur');
            const cring = document.getElementById('lpm-cring');

            function sc(el) {
                const sr = stage.getBoundingClientRect(), er = el.getBoundingClientRect();
                return { x: er.left - sr.left + er.width / 2, y: er.top - sr.top + er.height / 2 };
            }
            function moveTo(el, dur) {
                return new Promise(r => {
                    const { x, y } = sc(el);
                    cur.style.transition = 'left ' + dur + 'ms cubic-bezier(0.42,0,0.18,1),top ' + dur + 'ms cubic-bezier(0.42,0,0.18,1)';
                    cur.style.left = (x - 3) + 'px';
                    cur.style.top  = (y - 3) + 'px';
                    setTimeout(r, dur);
                });
            }
            function doClick(el, color) {
                return new Promise(r => {
                    const { x, y } = sc(el);
                    cring.style.left = (x - 12) + 'px';
                    cring.style.top  = (y - 12) + 'px';
                    cring.style.borderColor = color || 'rgba(26,115,232,0.9)';
                    cring.className = '';
                    void cring.offsetWidth;
                    cring.className = 'lpm-pop';
                    setTimeout(r, 320);
                });
            }
            function flash(el, cls, dur) { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), dur || 650); }
            function setStep(txt) {
                const el = document.getElementById('lpm-step-ind');
                el.style.opacity = '0';
                setTimeout(() => { el.textContent = txt; el.style.opacity = '1'; }, 210);
            }
            function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

            let ptimer = null, elapsed = 0;
            function startProg() {
                const f = document.getElementById('lpm-spfill');
                f.style.transition = 'none'; f.style.width = '0%';
                elapsed = 0; clearInterval(ptimer); void f.offsetWidth;
                f.style.transition = 'width 0.08s linear';
                ptimer = setInterval(() => {
                    elapsed += 80;
                    f.style.width = Math.min(100, (elapsed / LOOP_MS) * 100) + '%';
                    if (elapsed >= LOOP_MS) clearInterval(ptimer);
                }, 80);
            }

            function resetDialog() {
                document.getElementById('lpm-dsel-val').textContent = 'Your Printer';
                document.getElementById('lpm-dsel').classList.remove('lpm-focused');
                document.getElementById('lpm-dchev').classList.remove('lpm-open');
                document.getElementById('lpm-ddd').classList.remove('lpm-open');
                document.getElementById('lpm-ddo-p').className = 'lpm-dd-row lpm-sel';
                document.getElementById('lpm-ddo-pdf').className = 'lpm-dd-row';
                document.getElementById('lpm-dest-row').classList.remove('lpm-glow-green');
                document.getElementById('lpm-hf-row').classList.remove('lpm-glow-amber');
                document.getElementById('lpm-hfcb').className = 'lpm-cbox lpm-on';
                document.getElementById('lpm-hflbl').className = 'lpm-cbox-lbl';
                const s = document.getElementById('lpm-dsave');
                s.className = 'lpm-d-save'; s.textContent = 'Print';
                cur.style.transition = 'none'; cur.style.left = '24px'; cur.style.top = '90px';
                setStep('Step 1 of 2 — change Destination');
            }

            let unlocked = false;
            let animRunning = true;

            async function animate() {
                if (!animRunning) return;
                try {
                    resetDialog(); startProg();
                    await wait(380); if (!animRunning) return;

                    // Step 1 — change Destination
                    await moveTo(document.getElementById('lpm-dsel'), 580);
                    await wait(180); if (!animRunning) return;
                    document.getElementById('lpm-dsel').classList.add('lpm-focused');
                    await doClick(document.getElementById('lpm-dsel'));
                    await wait(60); if (!animRunning) return;
                    document.getElementById('lpm-dchev').classList.add('lpm-open');
                    document.getElementById('lpm-ddd').classList.add('lpm-open');
                    await wait(420); if (!animRunning) return;
                    const pdfOpt = document.getElementById('lpm-ddo-pdf');
                    await moveTo(pdfOpt, 330);
                    pdfOpt.classList.add('lpm-hi');
                    await wait(240); if (!animRunning) return;
                    await doClick(pdfOpt, 'rgba(26,115,232,0.9)');
                    pdfOpt.classList.remove('lpm-hi'); pdfOpt.classList.add('lpm-sel');
                    document.getElementById('lpm-ddo-p').classList.remove('lpm-sel');
                    await wait(90); if (!animRunning) return;
                    document.getElementById('lpm-ddd').classList.remove('lpm-open');
                    document.getElementById('lpm-dchev').classList.remove('lpm-open');
                    document.getElementById('lpm-dsel').classList.remove('lpm-focused');
                    document.getElementById('lpm-dsel-val').textContent = 'Save as PDF';
                    flash(document.getElementById('lpm-dest-row'), 'lpm-glow-green', 720);
                    await wait(110); if (!animRunning) return;
                    document.getElementById('lpm-dsave').textContent = 'Save';
                    await wait(430); if (!animRunning) return;

                    // Step 2 — uncheck Headers and footers
                    setStep('Step 2 of 2 — uncheck Headers and footers');
                    await moveTo(document.getElementById('lpm-hf-row'), 490);
                    await wait(220); if (!animRunning) return;
                    await doClick(document.getElementById('lpm-hf-row'), 'rgba(175,115,0,0.88)');
                    document.getElementById('lpm-hfcb').className = 'lpm-cbox';
                    document.getElementById('lpm-hflbl').className = 'lpm-cbox-lbl lpm-dim';
                    flash(document.getElementById('lpm-hf-row'), 'lpm-glow-amber', 700);
                    await wait(500); if (!animRunning) return;

                    // Step 3 — click Save
                    setStep('Click Save');
                    const sv = document.getElementById('lpm-dsave');
                    await moveTo(sv, 440);
                    await wait(210); if (!animRunning) return;
                    await doClick(sv, 'rgba(26,115,232,0.9)');
                    sv.className = 'lpm-d-save lpm-press';
                    await wait(160); if (!animRunning) return;
                    sv.className = 'lpm-d-save';
                    await wait(720); if (!animRunning) return;

                    // Belt-and-suspenders: the countdown timer normally unlocks first; if the
                    // animation finishes its loop before then, unlock here too (idempotent).
                    if (!unlocked) unlock();
                } catch (e) { return; }
                animate();
            }

            // Shared unlock: enables "Open print menu", surfaces the opt-out, ends the countdown.
            const PROCEED_LABEL = 'Open print menu →';
            let countdownTimer = null;
            function unlock() {
                if (unlocked) return;
                unlocked = true;
                if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
                const btn = document.getElementById('lpm-proceed-btn');
                btn.classList.remove('lpm-locked');
                btn.classList.add('lpm-unlocking');
                btn.textContent = PROCEED_LABEL;
                setTimeout(() => btn.classList.remove('lpm-unlocking'), 560);
                document.getElementById('lpm-dsa-wrap').classList.add('lpm-visible');
            }

            // Returning users (already saved a PDF before) skip the watch-once gate — the button
            // is live immediately. First-timers get a visible countdown so the locked state reads
            // as "wait a moment", not "broken", then it unlocks on its own.
            const proceedBtn = document.getElementById('lpm-proceed-btn');
            if (saveCount >= 1) {
                unlock();
            } else {
                let remain = Math.ceil(UNLOCK_MS / 1000);
                proceedBtn.textContent = PROCEED_LABEL + '  (' + remain + 's)';
                countdownTimer = setInterval(() => {
                    remain -= 1;
                    if (remain <= 0) { unlock(); return; }
                    if (!unlocked) proceedBtn.textContent = PROCEED_LABEL + '  (' + remain + 's)';
                }, 1000);
            }

            resetDialog();
            setTimeout(animate, 300);

            proceedBtn.addEventListener('click', function() {
                if (this.classList.contains('lpm-locked')) return;
                dismiss(true);
            });
            document.getElementById('lpm-cancel-btn').addEventListener('click', () => dismiss(false));
        });
    },

    /**
     * Auto-wire dismissible banners.
     * Any element with data-lp-dismiss="<key>" gets an injected × button.
     * State persists to localStorage['lp_dismiss_<key>']; hidden on reload if set.
     */
    initDismissibles: function() {
        var self = this;
        document.querySelectorAll('[data-lp-dismiss]').forEach(function(el) {
            var key = 'lp_dismiss_' + el.getAttribute('data-lp-dismiss');
            if (localStorage.getItem(key) === '1') {
                el.style.display = 'none';
                // Surface any lp-intro-toggle-btn in the same card on load
                var card = el.closest('.lp-container, .lp-card, .sc, .card');
                if (card) {
                    var toggle = card.querySelector('.lp-intro-toggle-btn');
                    if (toggle) toggle.style.display = '';
                }
                return;
            }
            // Guard against double-injection when initDismissibles is called again (e.g. after restore)
            if (el.querySelector('[data-lp-dismiss-btn]')) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Dismiss');
            btn.setAttribute('data-lp-dismiss-btn', '1');
            // LEN-160 — real 30x30 hit target (not a tiny glyph). Hosts must reserve
            // right padding (≥34px) so guidance text never runs underneath it.
            btn.style.cssText = 'position:absolute;top:6px;right:6px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.75);border:none;cursor:pointer;font-size:20px;font-weight:800;line-height:1;color:#64748b;padding:0;border-radius:8px;';
            btn.textContent = '×';
            btn.addEventListener('mouseenter', function() { btn.style.color = '#1A3C2E'; });
            btn.addEventListener('mouseleave', function() { btn.style.color = '#94a3b8'; });
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                el.style.display = 'none';
                localStorage.setItem(key, '1');
                // Surface any lp-intro-toggle-btn in the same card
                var card = el.closest('.lp-container, .lp-card, .sc, .card');
                if (card) {
                    var toggle = card.querySelector('.lp-intro-toggle-btn');
                    if (toggle) toggle.style.display = '';
                }
            });
            // Ensure element is relatively positioned so button sits top-right
            var pos = window.getComputedStyle(el).position;
            if (pos === 'static') el.style.position = 'relative';
            el.appendChild(btn);
        });
    },

    /**
     * Two-way bind a list of input IDs to localStorage under a scoped key.
     * Restores values on load; writes on every input event.
     * @param {string} scopeKey  - e.g. 'dscr', 'sba'
     * @param {string[]} ids     - array of element IDs to persist
     */
    persistFields: function(scopeKey, ids) {
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            var lsKey = 'lp_field_' + scopeKey + '_' + id;
            var saved = localStorage.getItem(lsKey);
            if (saved !== null && saved !== undefined) {
                el.value = saved;
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            el.addEventListener('change', function() {
                localStorage.setItem(lsKey, el.value);
            });
            el.addEventListener('input', function() {
                localStorage.setItem(lsKey, el.value);
            });
        });
    }
};

// Start the dynamic flowy printer favicon loop for all calculator pages
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  let link = document.querySelector("link[rel~='icon']");
  if (link) {
    link.type = 'image/png';
  } else {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  
  let frame = 0;
  function drawFavicon() {
    ctx.clearRect(0, 0, 32, 32);
    
    // Create rounded square clipping path
    ctx.save();
    ctx.beginPath();
    const r = 10;
    ctx.moveTo(r, 0);
    ctx.lineTo(32 - r, 0);
    ctx.quadraticCurveTo(32, 0, 32, r);
    ctx.lineTo(32, 32 - r);
    ctx.quadraticCurveTo(32, 32, 32 - r, 32);
    ctx.lineTo(r, 32);
    ctx.quadraticCurveTo(0, 32, 0, 32 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    
    // Base gradient matching deep emerald/forest theme
    const grad = ctx.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, '#01170e');
    grad.addColorStop(1, '#043220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    
    const time = frame * 0.025; // Soothing, slow wave speed
    
    // Wave 1: Flowing Deep Emerald
    ctx.fillStyle = 'rgba(8, 48, 32, 0.95)';
    ctx.beginPath();
    ctx.moveTo(0, 32);
    for (let x = 0; x <= 32; x++) {
      const y = 15.5 + Math.sin(x * 0.12 + time) * 4.8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(32, 32);
    ctx.fill();
    
    // Wave 2: Flowing Medium Teal-Green
    ctx.fillStyle = 'rgba(16, 80, 56, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 32);
    for (let x = 0; x <= 32; x++) {
      const y = 17.5 + Math.cos(x * 0.15 - time * 0.85) * 4.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(32, 32);
    ctx.fill();
    
    // Wave 3: Flowing Vibrant Mint/Neon Emerald Foam Accent
    ctx.fillStyle = 'rgba(52, 168, 120, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 32);
    for (let x = 0; x <= 32; x++) {
      const y = 13.5 + Math.sin(x * 0.18 + time * 1.35) * 3.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(32, 32);
    ctx.fill();
    
    ctx.restore(); // End rounded square clipping
    
    // Draw Crisp White Geometric Logo (Printer Icon) floating on top of waves
    ctx.save();
    
    // Floating micro-animation
    const bob = Math.sin(frame * 0.08) * 0.8;
    ctx.translate(0, bob);
    
    // Scale 24x24 coordinates to 32x32 canvas beautifully
    ctx.scale(32 / 24, 32 / 24);
    
    // Drop shadow for optimal readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0.4;
    ctx.shadowOffsetY = 0.8;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)'; // Monoline white
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 1. Printer Main Body
    ctx.beginPath();
    ctx.moveTo(4, 11);
    ctx.lineTo(20, 11);
    ctx.lineTo(20, 17);
    ctx.lineTo(4, 17);
    ctx.closePath();
    ctx.stroke();
    
    // 2. Printer Top Paper/Tray
    ctx.beginPath();
    ctx.moveTo(7, 11);
    ctx.lineTo(7, 5);
    ctx.lineTo(17, 5);
    ctx.lineTo(17, 11);
    ctx.stroke();
    
    // 3. Printer Bottom Paper/Tray (Output Paper)
    ctx.beginPath();
    ctx.moveTo(6, 17);
    ctx.lineTo(6, 20);
    ctx.lineTo(18, 20);
    ctx.lineTo(18, 17);
    ctx.stroke();
    
    // 4. Feed slot / detail lines
    ctx.beginPath();
    ctx.moveTo(9, 14);
    ctx.lineTo(12, 14);
    ctx.stroke();
    
    ctx.restore();
    
    link.href = canvas.toDataURL('image/png');
    frame++;
  }
  
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setInterval(drawFavicon, 50);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setInterval(drawFavicon, 50);
      });
    }
  }
})();

// White-label (LEN-306): the print header is rendered before branding.js
// resolves the tenant, so re-render it once the tenant is known. branding.js
// always dispatches lp:tenant-ready (with null detail for non-tenants — the
// re-render is then a no-op refresh of the default tier header).
document.addEventListener('lp:tenant-ready', function () {
    if (window.PDF_HELPER && PDF_HELPER._lastPrintArgs) {
        PDF_HELPER.initPrintLayout.apply(PDF_HELPER, PDF_HELPER._lastPrintArgs);
    }
});
