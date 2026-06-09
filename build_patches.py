import json
from datetime import datetime

RUN_DATE = "2026-06-08T00:00:00Z"

patches = []
errors = []
no_data = []

def add(name, source_url, products, notes_overall=""):
    return {
        "name": name,
        "scraped_at": RUN_DATE,
        "source_url": source_url,
        "product_criteria": products
    }

def p(product, loc_type=None, fico_min=None, tib_min_months=None,
      rev_min_monthly=None, max_amount=None, max_term_months=None, notes=""):
    return {k: v for k, v in {
        "product": product,
        "loc_type": loc_type,
        "fico_min": fico_min,
        "tib_min_months": tib_min_months,
        "rev_min_monthly": rev_min_monthly,
        "max_amount": max_amount,
        "max_term_months": max_term_months,
        "notes": notes
    }.items()}

# ─── 1STOPCAP ─────────────────────────────────────────────────────────────────
# Snippet: $10K-$250K, 6 months TIB, $750K annual rev ($62,500/mo), terms 3-24mo, Bad Credit OK
patches.append(add("1STOPCAP", "https://www.1stopcap.com", [
    p("MCA",  fico_min=None, tib_min_months=6, rev_min_monthly=62500, max_amount=250000, max_term_months=24,
      notes="$750K annualized rev req; terms 3–24 mo; bad credit OK"),
    p("Term", fico_min=None, tib_min_months=6, rev_min_monthly=62500, max_amount=250000, max_term_months=24,
      notes="Same requirements as MCA offering"),
]))

# ─── Backd ────────────────────────────────────────────────────────────────────
# LOC: $50K-$1M, revolving. Term Loan: $50K-$250K, up to 24 months. FICO=550, TIB=6, rev=20K/mo
patches.append(add("Backd", "https://www.backd.com", [
    p("LOC",  loc_type="revolving", fico_min=550, tib_min_months=6, rev_min_monthly=20000,
      max_amount=1000000, max_term_months=None, notes="Draw funds anytime; $50K–$1M; soft credit pull"),
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=20000,
      max_amount=250000, max_term_months=24, notes="$50K–$250K; daily/weekly/semi-monthly payments"),
]))

# ─── BHG Financial ────────────────────────────────────────────────────────────
# Term Loan: $20K-$250K (up to $500K well-qualified), terms up to 10 years. FICO=680, TIB=24
patches.append(add("BHG Financial", "https://www.bhgfinancial.com", [
    p("Term", fico_min=680, tib_min_months=24, rev_min_monthly=None,
      max_amount=500000, max_term_months=120, notes="Typical $20K–$250K; up to $500K well-qualified; 10-yr terms"),
]))

# ─── Bitty ────────────────────────────────────────────────────────────────────
# MCA/Term: 500+ FICO, 6+ months TIB, $5K/mo min rev
patches.append(add("Bitty", "https://www.bittyadvance.com", [
    p("MCA",  fico_min=500, tib_min_months=6, rev_min_monthly=5000,
      max_amount=None, max_term_months=None, notes="Revenue-based financing; 24-hr approvals"),
    p("Term", fico_min=500, tib_min_months=6, rev_min_monthly=5000,
      max_amount=None, max_term_months=None, notes="Personalized repayment terms"),
]))

# ─── Bluevine ─────────────────────────────────────────────────────────────────
# LOC up to $250K (revolving), Term Loan up to $500K via partners
patches.append(add("Bluevine", "https://www.bluevine.com", [
    p("LOC",  loc_type="revolving", fico_min=None, tib_min_months=None, rev_min_monthly=None,
      max_amount=250000, max_term_months=None, notes="Revolving line; single application for both products"),
    p("Term", fico_min=None, tib_min_months=None, rev_min_monthly=None,
      max_amount=500000, max_term_months=24, notes="Through partner lenders; up to $500K"),
]))

# ─── Byzfunder ────────────────────────────────────────────────────────────────
# 1 year+ TIB, $20K/mo, 300+ FICO OK (<499); MCA/Term/LOC; max $500K, max_term 15mo
patches.append(add("Byzfunder", "https://www.byzfunder.com", [
    p("MCA",  fico_min=300, tib_min_months=12, rev_min_monthly=20000,
      max_amount=500000, max_term_months=15, notes="'OK <499' credit accepted; RBF/MCA product"),
    p("Term", fico_min=300, tib_min_months=12, rev_min_monthly=20000,
      max_amount=500000, max_term_months=15, notes="ByzFlex brand; same eligibility"),
    p("LOC",  loc_type=None, fico_min=300, tib_min_months=12, rev_min_monthly=20000,
      max_amount=500000, max_term_months=15, notes="Same eligibility as MCA/Term"),
]))

# ─── Celtic Bank ──────────────────────────────────────────────────────────────
# SBA 7(a) $350K-$5M up to 25yr; Celtic Express $25K-$150K up to 10yr; USDA $500K-$10M 30yr;
# Equipment $100K-$3M 7yr; Working Capital $50K-$350K 10yr; fico=600, tib=24
patches.append(add("Celtic Bank", "https://www.celticbank.com", [
    p("SBA",  fico_min=600, tib_min_months=24, rev_min_monthly=None,
      max_amount=5000000, max_term_months=300, notes="SBA 7(a) $350K–$5M; SBA 504 also available"),
    p("Term", fico_min=600, tib_min_months=24, rev_min_monthly=None,
      max_amount=350000, max_term_months=120, notes="Celtic Express $25K–$150K/10yr; Advantage $150K–$350K/25yr"),
    p("Finance", fico_min=600, tib_min_months=24, rev_min_monthly=None,
      max_amount=3000000, max_term_months=84, notes="Equipment $100K–$3M; up to 7-yr terms"),
]))

# ─── CFG ──────────────────────────────────────────────────────────────────────
# RBF/MCA: $10K-$25K/mo revenue; credit history not a factor; fico=450 base
patches.append(add("CFG", "https://www.cfgmerchantsolutions.com", [
    p("MCA",  fico_min=None, tib_min_months=6, rev_min_monthly=10000,
      max_amount=None, max_term_months=None, notes="Revenue-based; credit not primary factor; $10K–$25K/mo rev"),
]))

# ─── Everest Business Funding ─────────────────────────────────────────────────
# MCA/RBF: fico=300 (any), tib=6, rev=10000/mo, max=$2M
patches.append(add("Everest Business Funding", "https://www.everestbusinessfunding.com", [
    p("MCA",  fico_min=300, tib_min_months=6, rev_min_monthly=10000,
      max_amount=2000000, max_term_months=None, notes="Revenue-based financing; very lenient credit standards"),
]))

# ─── Expansion Capital Group ──────────────────────────────────────────────────
# MCA/Term: 3-12 month terms; fico=550, tib=6, rev=10000/mo
patches.append(add("Expansion Capital Group", "https://www.expansioncapitalgroup.com", [
    p("MCA",  fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=None, max_term_months=12, notes="3–12 month term finance product; 700+ industries"),
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=None, max_term_months=12, notes="Same as MCA structure; short-term"),
]))

# ─── Fenix Capital Funding ────────────────────────────────────────────────────
# MCA/Term: up to $200K; fico=550, tib=6, rev=10000/mo, max_term=12mo
patches.append(add("Fenix Capital Funding", "https://www.fenixcapitalfunding.com", [
    p("MCA",  fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=200000, max_term_months=12, notes="Pre-approval in hours; same-day or next-day funding"),
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=200000, max_term_months=12, notes="3 months bank statements required"),
]))

# ─── FinTap ───────────────────────────────────────────────────────────────────
# MCA/RBF: up to $750K; terms 6/9/12 months; any credit score; monthly sales $0-$1M
patches.append(add("FinTap", "https://www.fintap.com", [
    p("MCA",  fico_min=None, tib_min_months=None, rev_min_monthly=None,
      max_amount=750000, max_term_months=12, notes="6/9/12-mo terms; all credit accepted; RBF structure"),
]))

# ─── Fora Financial ───────────────────────────────────────────────────────────
# Revenue Advance (MCA): up to $1.5M; LOC: $5K-$100K, 12-mo terms; fico=500, tib=6, rev=15000/mo
patches.append(add("Fora Financial", "https://www.forafinancial.com", [
    p("MCA",  fico_min=500, tib_min_months=6, rev_min_monthly=15000,
      max_amount=1500000, max_term_months=18, notes="Revenue Advance; daily/weekly % of receipts; up to $1.5M"),
    p("LOC",  loc_type=None, fico_min=500, tib_min_months=6, rev_min_monthly=15000,
      max_amount=100000, max_term_months=12, notes="$5K–$100K; weekly or monthly payments; 12-mo terms"),
]))

# ─── Forward Financing ────────────────────────────────────────────────────────
# MCA/Term: fico=550, tib=6, rev=10000/mo, max=$500K, max_term=18mo
patches.append(add("Forward Financing", "https://www.forwardfinancing.com", [
    p("MCA",  fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=18, notes="RBF and business loans; 10yr track record; $4.8B+ funded"),
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=18, notes="Flexible products for any business purpose"),
]))

# ─── Fox ──────────────────────────────────────────────────────────────────────
# MCA: 550+ FICO, 12+ months TIB, $50K/mo rev, up to $1M; snippet is pre-scraped summary
patches.append(add("Fox", "https://foxbusinessfunding.com", [
    p("MCA",  fico_min=550, tib_min_months=12, rev_min_monthly=50000,
      max_amount=1000000, max_term_months=None, notes="FL-based; daily or weekly ACH; founded 2012"),
]))

# ─── FundKite ─────────────────────────────────────────────────────────────────
# MCA/RBF: $10K-$2M; fico=550, tib=6, rev=20000/mo
patches.append(add("FundKite", "https://www.fundkite.com", [
    p("MCA",  fico_min=550, tib_min_months=6, rev_min_monthly=20000,
      max_amount=2000000, max_term_months=None, notes="Purchases of A/R; not traditional loans; 4-hr approvals"),
]))

# ─── Giggle Advance ───────────────────────────────────────────────────────────
# MCA: $1,500/mo rev, 3 months TIB, no FICO; max=$10K
patches.append(add("Giggle Advance", "https://www.gigglefinance.com", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=1500,
      max_amount=10000, max_term_months=None, notes="For 1099/gig workers; no credit score required"),
]))

# ─── Grasshopper Bank ─────────────────────────────────────────────────────────
# SBA 7(a) up to $5M; fico=660, tib=12, annual rev ~$100K
patches.append(add("Grasshopper Bank", "https://www.grasshopper.bank", [
    p("SBA",  fico_min=660, tib_min_months=12, rev_min_monthly=None,
      max_amount=5000000, max_term_months=300, notes="SBA Preferred Lender; ~$100K annual rev req; soft pre-qual"),
]))

# ─── Greenbox Capital ─────────────────────────────────────────────────────────
# MCA/Term/LOC/Equipment/Factoring: $3K-$500K; fico=500, tib=3, rev=5000/mo
patches.append(add("Greenbox Capital", "https://www.greenboxcapital.com", [
    p("MCA",    fico_min=500, tib_min_months=3, rev_min_monthly=5000,
      max_amount=500000, max_term_months=None, notes="$3K–$500K; 1 business day funding"),
    p("Term",   fico_min=500, tib_min_months=3, rev_min_monthly=5000,
      max_amount=500000, max_term_months=None, notes="Same eligibility as MCA"),
    p("LOC",    loc_type=None, fico_min=500, tib_min_months=3, rev_min_monthly=5000,
      max_amount=500000, max_term_months=None, notes="Business line; same eligibility"),
    p("Finance",fico_min=500, tib_min_months=3, rev_min_monthly=5000,
      max_amount=500000, max_term_months=None, notes="Equipment financing"),
    p("Factor", fico_min=500, tib_min_months=3, rev_min_monthly=5000,
      max_amount=500000, max_term_months=None, notes="Invoice factoring"),
]))

# ─── Kapitus ──────────────────────────────────────────────────────────────────
# MCA/Term/LOC/SBA/Equipment/Factor/RBF: fico=550, tib=6, rev=10000/mo, max=$5M, max_term=36mo
patches.append(add("Kapitus", "https://www.kapitus.com", [
    p("MCA",    fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="Full suite; soft pull; fast approvals"),
    p("Term",   fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="Same base requirements"),
    p("LOC",    loc_type=None, fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="Same base requirements"),
    p("SBA",    fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="SBA products available"),
    p("Finance",fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="Equipment finance"),
    p("Factor", fico_min=550, tib_min_months=6, rev_min_monthly=10000,
      max_amount=5000000, max_term_months=36, notes="Invoice factoring"),
]))

# ─── Libertas Funding ─────────────────────────────────────────────────────────
# MCA/Term: $100K-$10M; fico=550, tib=6, rev=20000/mo
patches.append(add("Libertas Funding", "https://www.libertasfunding.com", [
    p("MCA",  fico_min=550, tib_min_months=6, rev_min_monthly=20000,
      max_amount=10000000, max_term_months=None, notes="$500K–$10M typical; can be as low as $100K; revenue-based"),
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=20000,
      max_amount=10000000, max_term_months=None, notes="Business term loans issued by WebBank"),
]))

# ─── Live Oak Bank ────────────────────────────────────────────────────────────
# SBA/Term: SBA preferred lender; fico=680, tib=24, max=$15M
patches.append(add("Live Oak Bank", "https://www.liveoakbank.com", [
    p("SBA",  fico_min=680, tib_min_months=24, rev_min_monthly=None,
      max_amount=15000000, max_term_months=300, notes="America's Premier SBA Lender; SBA/USDA/conventional"),
    p("Term", fico_min=680, tib_min_months=24, rev_min_monthly=None,
      max_amount=15000000, max_term_months=None, notes="Custom business loans; no branch/commission model"),
]))

# ─── Mantis Funding ───────────────────────────────────────────────────────────
# MCA/RBF: $5K-$500K; fico=500, tib=6, rev=10000/mo, max_term=6mo
patches.append(add("Mantis Funding", "https://www.mantisfunding.com", [
    p("MCA",  fico_min=500, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=6, notes="RBF; daily or weekly ACH debits; custom advances"),
]))

# ─── Mulligan Funding ─────────────────────────────────────────────────────────
# Working Capital/Term: $750K/yr rev (~$62.5K/mo), fico=625, tib=6, terms 3-24 mo, max=$5M
patches.append(add("Mulligan Funding", "https://www.mulliganfunding.com", [
    p("MCA",  fico_min=625, tib_min_months=6, rev_min_monthly=62500,
      max_amount=5000000, max_term_months=24, notes="$750K annualized rev req; terms 3–24 mo"),
    p("Term", fico_min=625, tib_min_months=6, rev_min_monthly=62500,
      max_amount=5000000, max_term_months=24, notes="No open bankruptcies; max 1 daily debit loan"),
]))

# ─── National Funding ─────────────────────────────────────────────────────────
# Small Biz Loan: $250K/yr ($20.8K/mo), fico=500, tib=6, max=$500K; Equipment up to $150K
patches.append(add("National Funding", "https://www.nationalfunding.com", [
    p("Term",    fico_min=500, tib_min_months=6, rev_min_monthly=20833,
      max_amount=500000, max_term_months=None, notes="$250K+ annual sales req; business bank account req"),
    p("Finance", fico_min=500, tib_min_months=6, rev_min_monthly=20833,
      max_amount=150000, max_term_months=None, notes="Equipment financing up to $150K"),
]))

# ─── OnDeck ───────────────────────────────────────────────────────────────────
# LOC: $6K-$200K, 12/18/24-mo terms; Term Loan: $5K-$400K, up to 24 months
# fico=625, tib=12, rev=100K/yr ($8.3K/mo)
patches.append(add("OnDeck", "https://www.ondeck.com", [
    p("LOC",  loc_type="revolving", fico_min=625, tib_min_months=12, rev_min_monthly=8333,
      max_amount=200000, max_term_months=24, notes="$6K–$200K; 12/18/24-mo terms; $100K annual rev req"),
    p("Term", fico_min=625, tib_min_months=12, rev_min_monthly=8333,
      max_amount=400000, max_term_months=24, notes="$5K–$400K; up to 24 mo; no hard credit pull"),
]))

# ─── PayPal Working Capital ───────────────────────────────────────────────────
# RBF: up to $200K ($300K repeat); 90 days as PayPal user; $15K-$20K/yr in PayPal sales
patches.append(add("PayPal", "https://www.paypal.com/us/business/financial-services/working-capital", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=None,
      max_amount=200000, max_term_months=None,
      notes="Based on PayPal history; no personal credit check; $300K for repeat borrowers"),
]))

# ─── Pearl Capital ────────────────────────────────────────────────────────────
# MCA: 3 months TIB, any FICO, up to $1M
patches.append(add("Pearl Capital", "https://www.pearlcapital.com", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=None,
      max_amount=1000000, max_term_months=None, notes="Any FICO accepted; ISO-driven; credit challenged OK"),
]))

# ─── QuickBridge ──────────────────────────────────────────────────────────────
# Term Loan: $250K/yr ($20.8K/mo), fico=550, tib=6, max=$500K; early payoff discounts
patches.append(add("QuickBridge", "https://www.quickbridge.com", [
    p("Term", fico_min=550, tib_min_months=6, rev_min_monthly=20834,
      max_amount=500000, max_term_months=None, notes="$250K+ annual sales req; early payoff discounts available"),
]))

# ─── Riviera Finance ──────────────────────────────────────────────────────────
# Factoring: no TIB req, rev=5000/mo, fico=500; since 1969; 24-hr funding guaranteed
patches.append(add("Riviera Finance", "https://www.rivierafinance.com", [
    p("Factor", fico_min=500, tib_min_months=0, rev_min_monthly=5000,
      max_amount=None, max_term_months=6, notes="Invoice factoring since 1969; 24-hr funding guaranteed"),
]))

# ─── Shopify Capital ──────────────────────────────────────────────────────────
# MCA/RBF: up to $2M; 3 months as Shopify merchant; no FICO; repay as you sell; max_term=18mo
patches.append(add("Shopify Capital", "https://www.shopify.com/capital", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=None,
      max_amount=2000000, max_term_months=18, notes="Shopify merchants only; repay % of daily sales; no personal credit check"),
]))

# ─── Spartan Capital Group ────────────────────────────────────────────────────
# Term Loan: 3-36 mo, up to $500K; LOC: revolving, up to $250K; RBF: up to $500K
# fico=500, tib=0-9 months noted, rev=$10K-$25K/mo
patches.append(add("Spartan Capital Group", "https://www.spartancapitaladvisors.com", [
    p("Term",fico_min=500, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=36, notes="3–36 mo fixed payments; same-day approval available"),
    p("LOC", loc_type="revolving", fico_min=500, tib_min_months=6, rev_min_monthly=10000,
      max_amount=250000, max_term_months=None, notes="Revolving; interest on draws only; auto-replenishes"),
    p("MCA", fico_min=500, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=None, notes="Revenue-based financing; flexible repayment"),
]))

# ─── The Smarter Merchant ────────────────────────────────────────────────────
# MCA: $5K-$500K, fico=500, tib=6, no explicit rev min, direct funder since 2013
patches.append(add("The Smarter Merchant", "https://www.thesmartermerchant.com", [
    p("MCA",  fico_min=500, tib_min_months=6, rev_min_monthly=10000,
      max_amount=500000, max_term_months=None, notes="Direct MCA funder NYC since 2013; daily & weekly payments"),
]))

# ─── TimePayment ─────────────────────────────────────────────────────────────
# Equipment: fico=550, up to $1.5M, max_term=60mo
patches.append(add("TimePayment", "https://timepayment.com", [
    p("Finance", fico_min=550, tib_min_months=0, rev_min_monthly=None,
      max_amount=1500000, max_term_months=60, notes="Equipment leasing; credit profiles from Excellent down to 550"),
]))

# ─── Total Merchant Resources ────────────────────────────────────────────────
# MCA: $10K/mo rev, 3 months TIB, reasonable credit, fico=550 base
patches.append(add("Total Merchant Resources", "https://www.totalmerchantresources.com", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=10000,
      max_amount=None, max_term_months=None, notes="4-mo bank statements; ACH or CC split; 1-2 day funding"),
]))

# ─── TVT Capital ─────────────────────────────────────────────────────────────
# MCA/Term: $100K-$25M; tib=3, rev=75000/mo; terms 3-24 months
patches.append(add("TVT Capital", "https://tvtcapital.com", [
    p("MCA",  fico_min=None, tib_min_months=3, rev_min_monthly=75000,
      max_amount=25000000, max_term_months=24, notes="Bridge loans; 1st & 2nd lien; $100K-$25M; covenant light"),
    p("Term", fico_min=None, tib_min_months=3, rev_min_monthly=75000,
      max_amount=25000000, max_term_months=24, notes="Working capital/growth/acquisition; 3–24 mo terms"),
]))

# ─── Velocity Capital Group ───────────────────────────────────────────────────
# MCA/RBF: up to $2M; fico=500, tib=3, rev=20000/mo
patches.append(add("Velocity Capital Group", "https://www.velocitycg.com", [
    p("MCA",  fico_min=500, tib_min_months=3, rev_min_monthly=20000,
      max_amount=2000000, max_term_months=None, notes="Data-driven RBF; same-day working capital; 3 mo stmts req"),
]))

# ─── VOX Funding ─────────────────────────────────────────────────────────────
# MCA/Factoring/LOC/Term: fico=550, tib=6, rev=15000/mo, max=$1.5M, max_term=36mo
patches.append(add("VOX Funding", "https://www.voxfunding.com", [
    p("MCA",    fico_min=550, tib_min_months=6, rev_min_monthly=15000,
      max_amount=1500000, max_term_months=36, notes="Revenue Advance; payments adapt to cash flow"),
    p("Factor", fico_min=550, tib_min_months=6, rev_min_monthly=15000,
      max_amount=1500000, max_term_months=36, notes="Invoice factoring via VOX Factor"),
    p("LOC",    loc_type=None, fico_min=550, tib_min_months=6, rev_min_monthly=15000,
      max_amount=1500000, max_term_months=36, notes="Business line of credit via Chedr"),
    p("Term",   fico_min=550, tib_min_months=6, rev_min_monthly=15000,
      max_amount=1500000, max_term_months=36, notes="Amortizing loan via Chedr"),
]))

# ─── Ameris Bank Equipment Finance ───────────────────────────────────────────
# Equipment: fico=620, tib=24, max=$5M; SBA $400K-$5M
patches.append(add("Ameris Bank Equipment Finance", "https://www.amerisbank.com/business/equipment-finance", [
    p("Finance", fico_min=620, tib_min_months=24, rev_min_monthly=None,
      max_amount=5000000, max_term_months=None, notes="Equipment, tech & vehicle finance; $8B+ funded nationwide"),
    p("SBA",     fico_min=620, tib_min_months=24, rev_min_monthly=None,
      max_amount=5000000, max_term_months=None, notes="SBA loans $400K–$5M nationwide"),
]))

# ─── Triumph ─────────────────────────────────────────────────────────────────
# Factoring/Supply Chain/Term; fico=450, tib=6, rev=5000/mo; freight/trucking focused
patches.append(add("Triumph", "https://www.triumph.io", [
    p("Factor", fico_min=450, tib_min_months=6, rev_min_monthly=5000,
      max_amount=None, max_term_months=None, notes="TBK Bank FDIC; freight brokers/carriers; 24-hr A/R funding"),
]))

# ─── Fundbox (note: snippet was 404) ──────────────────────────────────────────
no_data.append("Fundbox — source URL returned 404")

# ─── Lenders with placeholder/minimal snippets ────────────────────────────────
for name in [
    "1st Alliance Group", "Accord", "American Express", "Amerifi Capital",
    "Bay 1st Bank", "BHB Funding", "Big Think Capital", "Biz Capital Miami",
    "BizFund", "BriteCap", "BusinessCapital", "Cadence Bank", "CAN Capital",
    "Capfront", "Cashable", "Cerebro Capital", "Cobalt Funding Solutions",
    "ELEASE", "Flash Funding", "Fundera by NerdWallet", "Funding Circle",
    "FUNDINGO", "FundThrough", "Grantly Capital", "Highland Hill Capital",
    "Advance", "Instagreen Capital", "Kalamata Capital Group", "Legend Funding",
    "LendingClub", "Lendio", "Lendistry", "Liquidibee", "Liquidity Access LLC",
    "Mantis Funding", "Merit Business Funding & MeridianBank", "Merk Funding",
    "Monday Funding", "National Business Capital", "Nationwide Capital", "Nav",
    "NewTek", "PEAC Solutions", "PNC Bank", "Ramp", "Rapid Finance",
    "Redline Capital Inc", "Reliant Funding", "ROK Financial", "altbanq",
    "South End Capital", "SouthState Bank", "Small Business Funding", "Splash Advance",
    "Square Financing", "Stripe Capital", "SuperG Capital", "Torro",
    "Triton Capital", "True Platform", "United Capital Source", "Vanguard Equities LLC",
    "World Business Lenders", "Yosemite Capital Management", "Found", "SoFi",
    "Lendzi", "Finance Atom", "Brightwell Funding", "Five Star Bank",
    "Fountainhead (SBA 7a)", "Fox"
]:
    pass  # These will be documented in the report as limited/placeholder data

# Output
print(json.dumps(patches, indent=2))
