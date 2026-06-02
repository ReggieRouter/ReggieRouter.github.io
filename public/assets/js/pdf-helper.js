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
        let headerHTML = "";
        
        if (tier === 'free') {
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left"></div>
                    <div class="print-header-right" style="text-align: right !important; display: flex !important; flex-direction: column !important; align-items: flex-end !important;">
                        <div style="display: flex !important; align-items: center !important; gap: 6px !important;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
                                <path d="M4 4v16h11l5-5V4H4z"/>
                                <path d="M15 20v-5h5"/>
                                <path d="M9 9v6"/>
                                <path d="M9 15h4"/>
                            </svg>
                            <span style="font-size: 16px !important; font-weight: 800 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">lend<span style="font-weight: 300 !important; color: #6B7280 !important;">paper</span><span style="color: #14532D !important;">.</span></span>
                        </div>
                        <span style="font-size: 9px !important; color: #6B7280 !important; margin-top: 2px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">· Scenario Modeling Engine</span>
                    </div>
                </div>
            `;
        } else if (tier === 'pro' || tier === 'branded') {
            headerHTML = `
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 0 10px 0 !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
                    <div class="print-header-left" style="display: flex !important; align-items: center !important; gap: 8px !important;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14532D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #14532D !important;">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                            <polyline points="2 17 12 22 22 17"/>
                            <polyline points="2 12 12 17 22 12"/>
                        </svg>
                        <span style="font-size: 14px !important; font-weight: 800 !important; color: #111827 !important; letter-spacing: -0.02em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">ACME Funding Partner</span>
                    </div>
                    <div class="print-header-right" style="text-align: right !important; display: flex !important; align-items: center !important; gap: 6px !important; color: #6B7280 !important;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                            <path d="M4 4v16h11l5-5V4H4z"/>
                            <path d="M15 20v-5h5"/>
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
                
                pdf.setTextColor(20, 83, 45); // #14532D
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

    generatePDF: async function(element, title, filename, btn, origText, isMultiScenario = false) {
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

        // STEP 3 — Generate a human-readable Quote ID for this document
        var _quoteId = this.generateQuoteId();

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

        try {
            window.print();
        } catch (e) {
            console.error("Print dialog failed:", e);
            this.showToast("Failed to open print dialog.", true);
        } finally {
            // Restore document title
            document.title = origDocTitle;

            // Remove print-mode classes, injected page style, and fingerprint after dialog clears
            setTimeout(() => {
                document.documentElement.classList.remove('pdf-export-mode');
                document.body.classList.remove('pdf-export-mode');
                document.body.classList.remove('multi-scenario');
                var ps = document.getElementById('lp-quote-page-style');
                if (ps) ps.parentNode.removeChild(ps);
                var fp = document.getElementById('lp-doc-fingerprint');
                if (fp) fp.parentNode.removeChild(fp);
            }, 1500);

            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        }
    },

    showPrintEducationModal: function() {
        return new Promise((resolve) => {
            // If user has previously opted out, skip the modal
            if (localStorage.getItem('lp_print_modal_dismissed') === 'true') {
                resolve(true);
                return;
            }

            // Build modal — white card with a visual mini-mockup of the print dialog
            const overlay = document.createElement('div');
            overlay.id = 'lp-print-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(17,24,39,0.45);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px;';

            // Two visual rows showing what to do:
            // 1) Destination = Save as PDF (the field they want)
            // 2) Headers and footers = unchecked (the field they need to turn OFF)
            // Plus a primary "Got it, continue" button.
            overlay.innerHTML =
                '<div style="background:white;border-radius:14px;max-width:420px;width:100%;padding:28px 28px 22px;box-shadow:0 20px 60px rgba(0,0,0,0.18);">'

                // Header
                + '<div style="text-align:center;margin-bottom:6px;">'
                + '<div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#F0FDF4;margin-bottom:10px;">'
                + '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14532D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h11l5-5V4H4z"/><path d="M15 20v-5h5"/></svg>'
                + '</div>'
                + '<h3 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111827;">One quick step</h3>'
                + '<p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">In the print dialog that opens next:</p>'
                + '</div>'

                // Visual mockup card 1: Destination = Save as PDF
                + '<div style="margin-top:18px;padding:12px 14px;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;display:flex;align-items:center;justify-content:space-between;gap:12px;">'
                + '<div style="font-size:12px;color:#6B7280;font-weight:500;">Destination</div>'
                + '<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;background:white;border:1.5px solid #14532D;border-radius:6px;font-size:13px;font-weight:600;color:#14532D;">'
                + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14532D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                + 'Save as PDF</div>'
                + '</div>'

                // Visual mockup card 2: Uncheck Headers and footers
                + '<div style="margin-top:8px;padding:12px 14px;border:1px solid #E5E7EB;border-radius:8px;background:#FAFAFA;display:flex;align-items:center;justify-content:space-between;gap:12px;">'
                + '<div style="font-size:12px;color:#6B7280;font-weight:500;">Headers and footers</div>'
                + '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#991B1B;">'
                + '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:1.5px solid #991B1B;border-radius:4px;background:white;"></span>'
                + 'Uncheck</div>'
                + '</div>'

                // Then click Save
                + '<p style="margin:14px 0 0;font-size:13px;color:#374151;text-align:center;line-height:1.5;">Then click <strong>Save</strong>.</p>'

                // Footer: don't-show-again + Continue
                + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:18px;margin-top:18px;border-top:1px solid #F3F4F6;">'
                + '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:#6B7280;cursor:pointer;user-select:none;">'
                + '<input type="checkbox" id="lp-print-dont-show-again" style="cursor:pointer;width:14px;height:14px;">Don\'t show again</label>'
                + '<div style="display:flex;gap:8px;">'
                + '<button id="lp-print-cancel" style="padding:8px 14px;border:1px solid #D1D5DB;background:white;color:#374151;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;">Cancel</button>'
                + '<button id="lp-print-continue" style="padding:8px 18px;border:none;background:#14532D;color:white;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Got it, continue</button>'
                + '</div></div>'

                + '</div>';

            document.body.appendChild(overlay);

            const cleanup = (result) => {
                const dontShow = document.getElementById('lp-print-dont-show-again');
                if (dontShow && dontShow.checked && result) {
                    localStorage.setItem('lp_print_modal_dismissed', 'true');
                }
                overlay.remove();
                resolve(result);
            };

            document.getElementById('lp-print-continue').addEventListener('click', () => cleanup(true));
            document.getElementById('lp-print-cancel').addEventListener('click', () => cleanup(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup(false);
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
