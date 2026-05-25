/**
 * LendPaper PDF & Print Helper
 * Single source of truth for tiered headers, page-specific footers, and render gates.
 */

window.PDF_HELPER = {
    getTier: function() {
        return new URLSearchParams(window.location.search).get('tier') || localStorage.getItem('lp_tier') || 'free';
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
    
    initPrintLayout: function(title) {
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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 12px 12px 12px !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 12px 12px 12px !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding: 0 12px 12px 12px !important; margin-bottom: 16px !important; box-sizing: border-box !important;">
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
        
        headerHTML += `
            <div style="text-align: center !important; margin-top: 16px !important; margin-bottom: 24px !important;">
                <h1 class="pdf-document-title" style="display: block !important; font-size: 20px !important; font-weight: 800 !important; color: #111827 !important; margin: 0 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">${title}</h1>
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
                    pdf.textWithLink("info@lendpaper.com", startX, y2, { url: "mailto:info@lendpaper.com" });
                } catch(e) {
                    pdf.text("info@lendpaper.com", startX, y2);
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
                    pdf.textWithLink("white-label plans", startX, y2, { url: "mailto:info@lendpaper.com?subject=Interested%20in%20White-Label%20Plans" });
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
                    pdf.textWithLink("info@lendpaper.com", startX, y1, { url: "mailto:info@lendpaper.com" });
                } catch(e) {
                    pdf.text("info@lendpaper.com", startX, y1);
                }
                
                let seg2Width = pdf.getTextWidth("info@lendpaper.com");
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

        // 1. Temporarily apply export-mode classes to live html AND body so the browser computes
        //    layout reflow at the correct 800px viewport. Without this, <html> stays at full
        //    viewport width (e.g. 1440px) while <body> is constrained to 800px — creating a
        //    coordinate mismatch between live DOM measurements and the cloned render document,
        //    which causes left-side clipping and right-side blank space in the output PDF.
        document.documentElement.classList.add('pdf-export-mode');
        document.body.classList.add('pdf-export-mode');
        if (isMultiScenario) {
            document.body.classList.add('multi-scenario');
        }

        // Save original inline style values for exact restoration afterwards
        const origHtmlWidth = document.documentElement.style.width;
        const origHtmlMinWidth = document.documentElement.style.minWidth;
        const origHtmlMaxWidth = document.documentElement.style.maxWidth;
        const origHtmlOverflow = document.documentElement.style.overflow;
        const origHtmlMargin = document.documentElement.style.margin;
        const origHtmlPadding = document.documentElement.style.padding;

        const origBodyWidth = document.body.style.width;
        const origBodyMinWidth = document.body.style.minWidth;
        const origBodyMaxWidth = document.body.style.maxWidth;
        const origBodyOverflow = document.body.style.overflow;
        const origBodyMargin = document.body.style.margin;
        const origBodyPadding = document.body.style.padding;

        // Nuclear strict 800px constraint on live DOM to force identical coordinate spaces!
        // Aligning elements to the top-left (margin: 0, padding: 0) is CRITICAL to ensure that
        // bounding client rect left coordinate is exactly 0px, avoiding left-shifting or right-clipping on the canvas.
        document.documentElement.style.setProperty('width', '800px', 'important');
        document.documentElement.style.setProperty('min-width', '800px', 'important');
        document.documentElement.style.setProperty('max-width', '800px', 'important');
        document.documentElement.style.setProperty('overflow', 'visible', 'important');
        document.documentElement.style.setProperty('margin', '0', 'important');
        document.documentElement.style.setProperty('padding', '0', 'important');

        document.body.style.setProperty('width', '800px', 'important');
        document.body.style.setProperty('min-width', '800px', 'important');
        document.body.style.setProperty('max-width', '800px', 'important');
        document.body.style.setProperty('overflow', 'visible', 'important');
        document.body.style.setProperty('margin', '0', 'important');
        document.body.style.setProperty('padding', '0', 'important');

        // Setup custom print header band dynamically per plan tier in the live DOM
        this.initPrintLayout(title);

        // Perform scroll resets on live DOM to ensure parameters are cleanly populated
        await this.resetScroll(50);

        // 2. TRANSFORM SHIELD:
        // Traverse up the DOM tree and temporarily disable any CSS transforms (scale, translate)
        // on parent/ancestor elements so html2canvas computes coordinate bounds at exactly 1:1 scale.
        const transformedAncestors = [];
        try {
            let curr = element;
            while (curr && curr !== document.documentElement) {
                const style = window.getComputedStyle(curr);
                if (style.transform && style.transform !== 'none') {
                    transformedAncestors.push({
                        element: curr,
                        originalTransform: curr.style.transform
                    });
                    curr.style.setProperty('transform', 'none', 'important');
                }
                curr = curr.parentElement;
            }
        } catch (err) {
            console.warn("PDF Helper: Failed to shield ancestor transforms:", err);
        }

        // Force synchronous layout calculations on the live element
        element.offsetHeight;

        // Let layout settle in browser painting frame.
        // 350ms (up from 150ms) gives the amortization table time to fully reflow after
        // .table-scroll-container expands from max-height:480px to unconstrained height.
        await new Promise(r => setTimeout(r, 350));

        const opt = {
            margin: [10, 10, 25, 10], // Set bottom margin to 25mm to clear running footers
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                logging: false, 
                useCORS: true, 
                windowWidth: 800, 
                scrollX: 0, 
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // Force the html2canvas internal clone body and documentElement to have pdf-export-mode
                    clonedDoc.documentElement.classList.add('pdf-export-mode');
                    clonedDoc.body.classList.add('pdf-export-mode');
                    if (isMultiScenario) {
                        clonedDoc.body.classList.add('multi-scenario');
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        };

        try {
            // Render directly from the live DOM element (completely shielded from transforms!)
            await html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
                self.addPdfFooters(pdf);
            }).save();
        } catch (e) {
            console.error("PDF generation exception:", e);
            this.showToast("Failed to generate PDF.", true);
        } finally {
            // Restore original inline style values
            document.documentElement.style.width = origHtmlWidth;
            document.documentElement.style.minWidth = origHtmlMinWidth;
            document.documentElement.style.maxWidth = origHtmlMaxWidth;
            document.documentElement.style.overflow = origHtmlOverflow;
            document.documentElement.style.margin = origHtmlMargin;
            document.documentElement.style.padding = origHtmlPadding;

            document.body.style.width = origBodyWidth;
            document.body.style.minWidth = origBodyMinWidth;
            document.body.style.maxWidth = origBodyMaxWidth;
            document.body.style.overflow = origBodyOverflow;
            document.body.style.margin = origBodyMargin;
            document.body.style.padding = origBodyPadding;

            // Restore original CSS transforms on ancestor elements
            transformedAncestors.forEach(item => {
                try {
                    item.element.style.transform = item.originalTransform;
                } catch (e) {}
            });

            // Restore live DOM class state
            document.documentElement.classList.remove('pdf-export-mode');
            document.body.classList.remove('pdf-export-mode');
            document.body.classList.remove('multi-scenario');
            if (btn) {
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        }
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
