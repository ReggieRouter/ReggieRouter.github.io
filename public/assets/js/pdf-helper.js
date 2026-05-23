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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding-bottom: 12px !important; margin-bottom: 16px !important;">
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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding-bottom: 12px !important; margin-bottom: 16px !important;">
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
                <div class="print-header-cols" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; border-bottom: 0.5pt solid #E5E7EB !important; padding-bottom: 12px !important; margin-bottom: 16px !important;">
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
    
    addPdfFooters: function(pdf) {
        const tier = this.getTier();
        const totalPages = pdf.internal.getNumberOfPages();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Draw a subtle line separator at bottom
            pdf.setDrawColor(229, 231, 235); // #E5E7EB
            pdf.setLineWidth(0.2);
            pdf.line(10, pageHeight - 21, pageWidth - 10, pageHeight - 21);
            
            // 1. Draw Tier-Specific Footer
            pdf.setFontSize(7.5);
            pdf.setTextColor(107, 114, 128); // #6B7280
            pdf.setFont("helvetica", "normal");
            
            let tierText = "";
            let tierSubText = "";
            
            if (tier === 'free') {
                tierText = "Built with LendPaper Free  ·  lendpaper.com";
                tierSubText = "Brokers: Remove branding, add your logo, and unlock custom calculators → lendpaper.com/upgrade";
                
                pdf.text("⚙ " + tierText, 10, pageHeight - 16);
                
                try {
                    // Place live links
                    pdf.textWithLink("lendpaper.com", 38, pageHeight - 16, { url: "https://lendpaper.com" });
                    
                    pdf.text("Brokers: Remove branding, add your logo, and unlock custom calculators → ", 10, pageHeight - 12);
                    pdf.setTextColor(20, 83, 45); // Green for the link
                    pdf.textWithLink("lendpaper.com/upgrade", 112, pageHeight - 12, { url: "https://lendpaper.com/upgrade" });
                } catch(e) {
                    pdf.text(tierSubText, 10, pageHeight - 12);
                }
            } else if (tier === 'pro' || tier === 'branded') {
                tierText = "Generated via LendPaper  ·  lendpaper.com";
                tierSubText = "Remove this footer and add your logo — ask about white-label plans.";
                
                pdf.text(tierText, 10, pageHeight - 16);
                
                try {
                    pdf.textWithLink("lendpaper.com", 42, pageHeight - 16, { url: "https://lendpaper.com" });
                    
                    pdf.text("Remove this footer and add your logo — ask about ", 10, pageHeight - 12);
                    pdf.setTextColor(20, 83, 45);
                    pdf.textWithLink("white-label plans", 76, pageHeight - 12, { url: "mailto:info@lendpaper.com?subject=Interested%20in%20White-Label%20Plans" });
                } catch(e) {
                    pdf.text(tierSubText, 10, pageHeight - 12);
                }
            } else if (tier === 'whitelabel' || tier === 'enterprise') {
                tierText = "Powered by LendPaper  |  info@lendpaper.com  |  lendpaper.com";
                pdf.text(tierText, 10, pageHeight - 14);
                
                try {
                    pdf.textWithLink("info@lendpaper.com", 37, pageHeight - 14, { url: "mailto:info@lendpaper.com" });
                    pdf.textWithLink("lendpaper.com", 67, pageHeight - 14, { url: "https://lendpaper.com" });
                } catch(e) {}
            }
            
            // 2. Draw Legal Micro-Copy (Always Present, Lower Left)
            pdf.setFontSize(6);
            pdf.setTextColor(156, 163, 175); // #9CA3AF
            
            const disclaimer = "ESTIMATES ONLY — NOT FINANCIAL ADVICE. These figures are preliminary estimates generated by the user (lender, broker, or ISO) using LendPaper software. LendPaper is a software provider only — not a lender, broker, financial advisor, or institution. LendPaper does not verify inputs, guarantee calculations, or determine final loan terms. Actual terms are subject to lender underwriting and final approval. Full terms: lendpaper.com/legal/estimates";
            const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - 32); // margin left 10, right 22
            
            pdf.text(splitDisclaimer, 10, pageHeight - 8);
            
            try {
                // Add live link overlay for disclaimer terms
                pdf.textWithLink("lendpaper.com/legal/estimates", pageWidth - 42, pageHeight - 8, { url: "https://lendpaper.com/legal/estimates" });
            } catch(e) {}
            
            // Page Number in bottom right corner
            pdf.setFontSize(7);
            pdf.setTextColor(156, 163, 175);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 14);
        }
    }
};
