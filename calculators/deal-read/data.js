// ─────────────────────────────────────────────
// LendPaper Industry Intelligence — DATA ENGINE
// Extracted verbatim from source. Data + pure helpers only.
// (UW filter state & rendering live in the HTML.)
// ─────────────────────────────────────────────

const NAICS_DB = [
  {c:'236115',d:'New Single-Family Housing Construction'},{c:'236116',d:'New Multifamily Housing Construction'},{c:'236118',d:'Residential Remodelers'},{c:'236220',d:'Commercial and Institutional Building Construction'},
  {c:'238110',d:'Poured Concrete Foundation Contractors'},{c:'238130',d:'Framing Contractors'},{c:'238140',d:'Masonry Contractors'},{c:'238160',d:'Roofing Contractors'},{c:'238210',d:'Electrical Contractors'},{c:'238220',d:'Plumbing, Heating, and Air-Conditioning Contractors'},{c:'238310',d:'Drywall and Insulation Contractors'},{c:'238320',d:'Painting and Wall Covering Contractors'},{c:'238330',d:'Flooring Contractors'},{c:'238910',d:'Site Preparation Contractors'},{c:'238990',d:'All Other Specialty Trade Contractors'},
  {c:'311811',d:'Retail Bakeries'},{c:'311812',d:'Commercial Bakeries'},
  {c:'441110',d:'New Car Dealers'},{c:'441120',d:'Used Car Dealers'},{c:'441310',d:'Automotive Parts and Accessories Stores'},{c:'441320',d:'Tire Dealers'},
  {c:'442110',d:'Furniture Stores'},{c:'442210',d:'Floor Covering Stores'},{c:'443142',d:'Electronics Stores'},
  {c:'444110',d:'Home Centers'},{c:'444130',d:'Hardware Stores'},{c:'444190',d:'Other Building Material Dealers'},{c:'444220',d:'Nursery, Garden Center, and Farm Supply Stores'},
  {c:'445110',d:'Supermarkets and Other Grocery Retailers'},{c:'445240',d:'Meat Markets'},{c:'445299',d:'All Other Specialty Food Retailers'},{c:'445310',d:'Beer, Wine, and Liquor Stores'},
  {c:'446110',d:'Pharmacies and Drug Stores'},{c:'446120',d:'Cosmetics, Beauty Supplies, and Perfume Stores'},
  {c:'447110',d:'Gasoline Stations with Convenience Stores'},{c:'447190',d:'Other Gasoline Stations'},
  {c:'448110',d:"Men's Clothing Stores"},{c:'448120',d:"Women's Clothing Stores"},{c:'448140',d:'Family Clothing Stores'},{c:'448210',d:'Shoe Stores'},{c:'448310',d:'Jewelry Stores'},
  {c:'451110',d:'Sporting Goods Stores'},{c:'451120',d:'Hobby, Toy, and Game Stores'},{c:'451211',d:'Book Stores'},
  {c:'453110',d:'Florists'},{c:'453210',d:'Office Supplies and Stationery Stores'},{c:'453220',d:'Gift, Novelty, and Souvenir Stores'},{c:'453310',d:'Used Merchandise Stores'},{c:'453910',d:'Pet and Pet Supplies Stores'},{c:'453998',d:'All Other Miscellaneous Store Retailers'},{c:'454390',d:'Other Direct Selling Establishments'},
  {c:'484110',d:'General Freight Trucking, Local'},{c:'484121',d:'General Freight Trucking, Long-Distance TL'},{c:'484210',d:'Used Household and Office Goods Moving'},
  {c:'485310',d:'Taxi Service'},{c:'485320',d:'Limousine Service'},{c:'485410',d:'School and Employee Bus Transportation'},{c:'488410',d:'Motor Vehicle Towing'},
  {c:'492110',d:'Couriers and Express Delivery Services'},{c:'493110',d:'General Warehousing and Storage'},
  {c:'511210',d:'Software Publishers'},{c:'512110',d:'Motion Picture and Video Production'},{c:'517311',d:'Wired Telecommunications Carriers'},{c:'517312',d:'Wireless Telecommunications Carriers'},{c:'518210',d:'Computing Infrastructure Providers'},{c:'519130',d:'Internet Publishing and Broadcasting'},
  {c:'531110',d:'Lessors of Residential Buildings and Dwellings'},{c:'531120',d:'Lessors of Nonresidential Buildings'},{c:'531130',d:'Lessors of Miniwarehouses and Self-Storage Units'},{c:'531210',d:'Offices of Real Estate Agents and Brokers'},{c:'531311',d:'Residential Property Managers'},{c:'531312',d:'Nonresidential Property Managers'},
  {c:'532111',d:'Passenger Car Rental'},{c:'532120',d:'Truck, Utility Trailer, and RV Rental'},{c:'532412',d:'Construction, Mining, and Forestry Machinery Rental'},
  {c:'541110',d:'Offices of Lawyers'},{c:'541211',d:'Offices of Certified Public Accountants'},{c:'541213',d:'Tax Preparation Services'},{c:'541214',d:'Payroll Services'},{c:'541219',d:'Other Accounting Services'},{c:'541310',d:'Architectural Services'},{c:'541320',d:'Landscape Architectural Services'},{c:'541330',d:'Engineering Services'},{c:'541350',d:'Building Inspection Services'},{c:'541511',d:'Custom Computer Programming Services'},{c:'541512',d:'Computer Systems Design Services'},{c:'541519',d:'Other Computer Related Services'},{c:'541611',d:'Administrative Management Consulting'},{c:'541613',d:'Marketing Consulting Services'},{c:'541618',d:'Other Management Consulting Services'},{c:'541810',d:'Advertising Agencies'},{c:'541820',d:'Public Relations Agencies'},{c:'541910',d:'Marketing Research and Public Opinion Polling'},{c:'541921',d:'Photography Studios, Portrait'},{c:'541940',d:'Veterinary Services'},{c:'541990',d:'All Other Professional, Scientific, and Technical Services'},
  {c:'561110',d:'Office Administrative Services'},{c:'561311',d:'Employment Placement Agencies'},{c:'561320',d:'Temporary Help Services'},{c:'561440',d:'Collection Agencies'},{c:'561499',d:'All Other Business Support Services'},{c:'561510',d:'Travel Agencies'},{c:'561611',d:'Investigation Services'},{c:'561612',d:'Security Guards and Patrol Services'},{c:'561621',d:'Security Systems Services'},{c:'561622',d:'Locksmiths'},{c:'561710',d:'Exterminating and Pest Control Services'},{c:'561720',d:'Janitorial Services'},{c:'561730',d:'Landscaping Services'},{c:'561740',d:'Carpet and Upholstery Cleaning Services'},{c:'561790',d:'Other Services to Buildings and Dwellings'},{c:'561990',d:'All Other Support Services'},
  {c:'611110',d:'Elementary and Secondary Schools'},{c:'611310',d:'Colleges, Universities, and Professional Schools'},{c:'611420',d:'Computer Training'},{c:'611430',d:'Professional and Management Development Training'},{c:'611511',d:'Cosmetology and Barber Schools'},{c:'611519',d:'Other Technical and Trade Schools'},{c:'611620',d:'Sports and Recreation Instruction'},{c:'611630',d:'Language Schools'},{c:'611691',d:'Exam Preparation and Tutoring'},{c:'611699',d:'All Other Miscellaneous Schools and Instruction'},
  {c:'621111',d:'Offices of Physicians'},{c:'621112',d:'Offices of Physicians, Mental Health Specialists'},{c:'621210',d:'Offices of Dentists'},{c:'621310',d:'Offices of Chiropractors'},{c:'621320',d:'Offices of Optometrists'},{c:'621330',d:'Offices of Mental Health Practitioners'},{c:'621340',d:'Offices of Physical, Occupational and Speech Therapists'},{c:'621399',d:'Offices of All Other Misc. Health Practitioners'},{c:'621493',d:'Freestanding Ambulatory Surgical and Emergency Centers'},{c:'621511',d:'Medical Laboratories'},{c:'621512',d:'Diagnostic Imaging Centers'},{c:'621610',d:'Home Health Care Services'},{c:'621910',d:'Ambulance Services'},{c:'621999',d:'All Other Misc. Ambulatory Health Care Services'},
  {c:'623110',d:'Nursing Care Facilities'},{c:'623311',d:'Continuing Care Retirement Communities'},{c:'623312',d:'Assisted Living Facilities for the Elderly'},
  {c:'624410',d:'Child Day Care Services'},
  {c:'711110',d:'Theater Companies and Dinner Theaters'},{c:'711130',d:'Musical Groups and Artists'},{c:'711211',d:'Sports Teams and Clubs'},{c:'711510',d:'Independent Artists, Writers, and Performers'},{c:'712110',d:'Museums'},{c:'713110',d:'Amusement and Theme Parks'},{c:'713940',d:'Fitness and Recreational Sports Centers'},{c:'713990',d:'All Other Amusement and Recreation Industries'},
  {c:'721110',d:'Hotels and Motels'},{c:'721191',d:'Bed-and-Breakfast Inns'},{c:'721211',d:'RV Parks and Campgrounds'},
  {c:'722310',d:'Food Service Contractors'},{c:'722320',d:'Caterers'},{c:'722330',d:'Mobile Food Services (Food Trucks)'},{c:'722410',d:'Drinking Places (Alcoholic Beverages)'},{c:'722511',d:'Full-Service Restaurants'},{c:'722513',d:'Limited-Service Restaurants'},{c:'722514',d:'Cafeterias, Grill Buffets, and Buffets'},{c:'722515',d:'Snack and Nonalcoholic Beverage Bars'},
  {c:'811111',d:'General Automotive Repair'},{c:'811113',d:'Automotive Transmission Repair'},{c:'811121',d:'Automotive Body, Paint, and Interior Repair'},{c:'811191',d:'Automotive Oil Change and Lubrication Shops'},{c:'811192',d:'Car Washes'},{c:'811198',d:'All Other Automotive Repair and Maintenance'},{c:'811210',d:'Electronic and Precision Equipment Repair'},{c:'811310',d:'Commercial and Industrial Machinery Repair'},{c:'811412',d:'Appliance Repair and Maintenance'},{c:'811420',d:'Reupholstery and Furniture Repair'},
  {c:'812111',d:'Barber Shops'},{c:'812112',d:'Beauty Salons'},{c:'812113',d:'Nail Salons'},{c:'812199',d:'Other Personal Care Services'},{c:'812210',d:'Funeral Homes and Funeral Services'},{c:'812310',d:'Coin-Operated Laundries and Drycleaners'},{c:'812320',d:'Drycleaning and Laundry Services'},{c:'812910',d:'Pet Care Services'},{c:'812930',d:'Parking Lots and Garages'},
  {c:'813910',d:'Business Associations'},{c:'813920',d:'Professional Organizations'},
  // Restricted
  {c:'522110',d:'Commercial Banking'},{c:'522120',d:'Savings Institutions'},{c:'522210',d:'Credit Card Issuing'},{c:'523110',d:'Investment Banking and Securities Dealing'},{c:'524113',d:'Direct Life Insurance Carriers'},{c:'524114',d:'Direct Health and Medical Insurance Carriers'},{c:'713210',d:'Casinos (except Casino Hotels)'},{c:'713290',d:'Other Gambling Industries'},{c:'721120',d:'Casino Hotels'},{c:'813110',d:'Religious Organizations'}
];

// Risk tier: g=Tier1 w=Tier2 r=Tier3 n=Tier4
const TIER = {
  '236115':'g','236116':'g','236118':'g','236220':'g','238110':'g','238130':'g','238140':'g','238160':'g','238210':'g','238220':'g','238310':'g','238320':'g','238330':'g','238910':'g','238990':'g',
  '311811':'g','311812':'g',
  '441310':'g','441320':'g','442110':'g','442210':'g','443142':'g','444110':'g','444130':'g','444190':'g','444220':'g',
  '445110':'g','445240':'g','445299':'g','445310':'g','446110':'g','446120':'g','447190':'g',
  '448110':'g','448120':'g','448140':'g','448210':'g','448310':'g',
  '451110':'g','451120':'g','451211':'g','453110':'g','453210':'g','453220':'g','453310':'g','453910':'g','453998':'g','454390':'g',
  '484110':'g','484121':'g','484210':'g','485310':'g','485320':'g','485410':'g','488410':'g','492110':'g','493110':'g',
  '511210':'g','512110':'g','517311':'g','517312':'g','518210':'g',
  '531210':'g','532120':'g','532412':'g',
  '541110':'g','541211':'g','541213':'g','541214':'g','541219':'g','541310':'g','541320':'g','541330':'g','541350':'g','541511':'g','541512':'g','541519':'g','541611':'g','541613':'g','541618':'g','541810':'g','541820':'g','541910':'g','541921':'g','541940':'g','541990':'g',
  '561110':'g','561311':'g','561440':'g','561499':'g','561510':'g','561611':'g','561612':'g','561621':'g','561622':'g','561710':'g','561720':'g','561730':'g','561740':'g','561790':'g','561990':'g',
  '611110':'g','611310':'g','611420':'g','611430':'g','611511':'g','611519':'g','611620':'g','611630':'g','611691':'g','611699':'g',
  '621111':'g','621112':'g','621210':'g','621310':'g','621320':'g','621330':'g','621340':'g','621399':'g','621493':'g','621511':'g','621512':'g','621610':'g','621910':'g','621999':'g',
  '623110':'g','623311':'g','623312':'g','624410':'g',
  '711110':'g','711130':'g','711211':'g','711510':'g','712110':'g','713110':'g','713940':'g','713990':'g',
  '721191':'g','721211':'g','722310':'g','722320':'g','722330':'g','722514':'g','722515':'g',
  '811111':'g','811113':'g','811121':'g','811191':'g','811192':'g','811198':'g','811210':'g','811310':'g','811412':'g','811420':'g',
  '812111':'g','812112':'g','812113':'g','812199':'g','812210':'g','812310':'g','812320':'g','812910':'g','812930':'g',
  '813910':'g','813920':'g',
  // Tier 2
  '441120':'w','447110':'w','519130':'w','531311':'w','531312':'w','532111':'w','561320':'w','722410':'w','722511':'w','722513':'w','721110':'w',
  // Tier 3
  '441110':'r','531110':'r','531120':'r',
  // Tier 4
  '522110':'n','522120':'n','522210':'n','523110':'n','524113':'n','524114':'n','713210':'n','713290':'n','721120':'n','813110':'n'
};

const TIER_LABEL = {g:'Tier 1 · Prime — Full Product Stack',w:'Tier 2 · Alt-Lending Focus',r:'Tier 3 · High Scrutiny',n:'Tier 4 · Restricted — Most Lenders Decline'};
const TIER_CLASS = {g:'tb-1',w:'tb-2',r:'tb-3',n:'tb-4'};

// Products per NAICS (ordered best-fit-first)
const PRODS = {
  '722511':[['SBA 7(a)','pc-sba'],['MCA','pc-mca'],['Term Loan','pc-term'],['Equipment','pc-equip'],['LOC','pc-loc']],
  '722513':[['MCA','pc-mca'],['SBA 7(a)','pc-sba'],['Term Loan','pc-term'],['Equipment','pc-equip'],['LOC','pc-loc']],
  '722410':[['MCA','pc-mca'],['LOC','pc-loc'],['Term Loan','pc-term']],
  '722514':[['SBA 7(a)','pc-sba'],['Equipment','pc-equip'],['MCA','pc-mca'],['Term Loan','pc-term']],
  '722515':[['MCA','pc-mca'],['Equipment','pc-equip'],['LOC','pc-loc']],
  '722330':[['Equipment','pc-equip'],['MCA','pc-mca'],['SBA 7(a)','pc-sba']],
  '721110':[['SBA 7(a)','pc-sba'],['CRE','pc-cre'],['Bridge','pc-bridge'],['MCA','pc-mca']],
  '561320':[['Factoring','pc-factor'],['LOC','pc-loc'],['MCA','pc-mca'],['Term Loan','pc-term']],
  '561311':[['Factoring','pc-factor'],['SBA 7(a)','pc-sba'],['LOC','pc-loc']],
  '484110':[['Equipment','pc-equip'],['Factoring','pc-factor'],['SBA 7(a)','pc-sba'],['MCA','pc-mca'],['LOC','pc-loc']],
  '484121':[['Equipment','pc-equip'],['Factoring','pc-factor'],['SBA 7(a)','pc-sba'],['MCA','pc-mca']],
  '492110':[['Equipment','pc-equip'],['Factoring','pc-factor'],['LOC','pc-loc']],
  '531110':[['CRE','pc-cre'],['Bridge','pc-bridge']],
  '531120':[['CRE','pc-cre'],['Bridge','pc-bridge'],['Term Loan','pc-term']],
  '531311':[['LOC','pc-loc'],['Factoring','pc-factor'],['MCA','pc-mca']],
  '531312':[['LOC','pc-loc'],['Factoring','pc-factor'],['SBA 7(a)','pc-sba']],
  '531130':[['CRE','pc-cre'],['SBA 504','pc-sba'],['Term Loan','pc-term']],
  '623110':[['Factoring','pc-factor'],['SBA 7(a)','pc-sba'],['CRE','pc-cre'],['Term Loan','pc-term']],
  '621610':[['Factoring','pc-factor'],['LOC','pc-loc'],['SBA 7(a)','pc-sba']],
  '441110':[['MCA','pc-mca'],['Term Loan','pc-term'],['LOC','pc-loc']],
  '441120':[['MCA','pc-mca'],['LOC','pc-loc'],['Term Loan','pc-term']],
  '447110':[['MCA','pc-mca'],['SBA 7(a)','pc-sba'],['Term Loan','pc-term']],
  '532412':[['Equipment','pc-equip'],['SBA 7(a)','pc-sba'],['Term Loan','pc-term']],
  '519130':[['MCA','pc-mca'],['LOC','pc-loc'],['Term Loan','pc-term']],
  '541110':[['LOC','pc-loc'],['MCA','pc-mca'],['SBA 7(a)','pc-sba'],['Term Loan','pc-term']],
  // defaults by tier
  '_g':[['SBA 7(a)','pc-sba'],['Term Loan','pc-term'],['LOC','pc-loc'],['Equipment','pc-equip']],
  '_w':[['MCA','pc-mca'],['Term Loan','pc-term'],['Equipment','pc-equip'],['Factoring','pc-factor'],['LOC','pc-loc']],
  '_r':[['MCA','pc-mca'],['Term Loan','pc-term'],['Equipment','pc-equip']],
  '_n':[]
};

function getProds(code, tier) { return PRODS[code] || PRODS['_'+(tier||'g')] || []; }

// UW Factors by sector prefix (2-3 digits)
const UW_FACTORS = {
  '72':  {dscr:'≥1.25 for SBA; alt lenders less strict',tib_bank:24,tib_alt:6,docs:['3 months bank statements','2 years tax returns','YTD P&L','Menu + lease','Debt schedule'],flags:['Seasonal revenue swings','Single-location risk','High lease-to-revenue ratio','DSCR below 1.25']},
  '721': {dscr:'≥1.25; RevPAR and ADR data required',tib_bank:24,tib_alt:6,docs:['3 months bank statements','STR report or RevPAR data','Operating P&L','Debt schedule'],flags:['Low occupancy rate (<65%)','Seasonality','High fixed costs','Franchise restrictions on collateral']},
  '48':  {dscr:'≥1.20 bank; equipment lenders focus on asset value',tib_bank:24,tib_alt:6,docs:['Bank statements','Equipment list with VINs','Authority/MC number','Insurance certificates','Load agreements (if applicable)'],flags:['Single-customer concentration','Aging fleet (15+ yr)','Owner-operator with 1 unit','Fuel cost exposure']},
  '49':  {dscr:'≥1.20; factoring often bypasses DSCR requirement',tib_bank:24,tib_alt:6,docs:['Bank statements','Client A/R aging','Contract list','Insurance certs'],flags:['Single-customer concentration','Slow-paying clients','No established contracts']},
  '62':  {dscr:'≥1.15 — strong A/R backs up weaker DSCR',tib_bank:24,tib_alt:6,docs:['Bank statements','A/R aging report','Insurance credentialing docs','License copies','EIN/NPI numbers'],flags:['Medicare/Medicaid >50% of revenue','High denial/adjustment rate','Single-provider practice','Billing compliance risk']},
  '623': {dscr:'≥1.20; Medicare/Medicaid receivables are prime factoring collateral',tib_bank:24,tib_alt:6,docs:['Bank statements','A/R aging report','State license','CMS enrollment letters'],flags:['Reimbursement rate changes','CMS/state audit risk','High staffing costs','Single-payer concentration']},
  '624': {dscr:'≥1.20; enrollment utilization is the key underwriting metric',tib_bank:24,tib_alt:12,docs:['Bank statements','Enrollment data','License/accreditation','Lease agreement'],flags:['Enrollment below 70%','Seasonal enrollment gaps','State licensing issues','Single-location dependency']},
  '23':  {dscr:'≥1.25; WIP/backlog schedule is critical — banks want to see it',tib_bank:24,tib_alt:6,docs:['Bank statements','WIP schedule','Contract backlog','Equipment list','License & bonding docs'],flags:['Slow/disputed receivables','GC/owner concentration','Seasonal slowdowns','Over-leveraged equipment','No bonding or license']},
  '44':  {dscr:'≥1.25; inventory turnover and same-store sales matter',tib_bank:24,tib_alt:6,docs:['Bank statements','Inventory report/schedule','Lease agreement','POS revenue data','Tax returns'],flags:['E-commerce competition eroding margins','Declining same-store sales','High COGS ratio','Single-location risk']},
  '441': {dscr:'≥1.25; floor plan debt compresses available DSCR',tib_bank:24,tib_alt:6,docs:['Bank statements','Floor plan payable schedule','Dealer franchise agreement','Tax returns'],flags:['Floor plan debt eats DSCR','Franchise agreement may restrict UCC-1','Single-brand dependency','Inventory concentration']},
  '447': {dscr:'Environmental study required for SBA — adds weeks/cost',tib_bank:24,tib_alt:6,docs:['Bank statements','Phase 1 Environmental (SBA)','Fuel supply agreement','Tax returns'],flags:['Phase 1 environmental required for SBA','Underground storage tank liability','Low inside-store margins','Franchise terms']},
  '45':  {dscr:'≥1.25; inventory and online competition scrutiny',tib_bank:24,tib_alt:6,docs:['Bank statements','Tax returns','Inventory records','Lease'],flags:['E-commerce pressure','Discretionary spending sensitivity','Thin margins']},
  '53':  {dscr:'≥1.20–1.25 on NOI; SBA requires active operating company',tib_bank:24,tib_alt:12,docs:['Rent roll','Property-level financials','Appraisal','Environmental (if applicable)','Entity structure docs'],flags:['Passive income = SBA ineligible','Single-tenant risk','Vacancy >15%','Environmental liability']},
  '54':  {dscr:'≥1.15–1.20; client concentration is the key risk',tib_bank:24,tib_alt:6,docs:['Bank statements','Client contracts/retainers','Tax returns','A/R aging'],flags:['Client concentration >30%','Key-person dependency','Irregular billing cycles','No recurring revenue']},
  '56':  {dscr:'N/A for factoring; ≥1.20 for term/SBA',tib_bank:24,tib_alt:6,docs:['Bank statements','A/R aging/invoice copies','Payroll records','Client contracts'],flags:['Thin margins fail SBA DSCR','Slow-paying clients','Worker classification risk (1099 vs W-2)']},
  '61':  {dscr:'≥1.20; enrollment stability is the key metric',tib_bank:24,tib_alt:6,docs:['Bank statements','Enrollment data','License/accreditation','Lease','Tax returns'],flags:['Below-capacity enrollment','Accreditation risk','Seasonal enrollment gaps','Title IV dependency (for schools)']},
  '71':  {dscr:'≥1.25; high seasonality requires multi-year avg',tib_bank:24,tib_alt:6,docs:['Bank statements','Seasonal revenue breakdown','Membership/booking data','Lease'],flags:['Seasonality','Discretionary spending sensitivity','High fixed cost base','COVID-sensitivity']},
  '81':  {dscr:'≥1.20; cash-heavy businesses need extra documentation',tib_bank:24,tib_alt:6,docs:['Bank statements','Tax returns','Equipment list (if applicable)','Lease'],flags:['Cash revenue hard to verify','Key-person dependency','Competition from national chains','Equipment age/condition']},
  '51':  {dscr:'≥1.20; recurring revenue required — ad revenue alone is weak',tib_bank:24,tib_alt:6,docs:['Bank statements','Tax returns','Revenue contracts','Tech stack documentation'],flags:['Ad-revenue concentration','Customer churn risk','No physical collateral','Key-developer dependency']},
};

function getUW(code) {
  const tries = [code.slice(0,3), code.slice(0,2)];
  for (const k of tries) { if (UW_FACTORS[k]) return UW_FACTORS[k]; }
  return null;
}

// Deal intelligence tips
const TIPS = {
  '722511':'SBA 7(a) is viable with 2+ years TIB and DSCR ≥1.25. For younger operators, lead with Equipment Financing for kitchen build-outs, then MCA for working capital. Always ask about catering or event revenue — it can change the income story.',
  '722513':'QSR concepts need same-store sales consistency. If TIB is under 2 years, skip the SBA intake and open with MCA. Multi-unit operators are often better candidates for portfolio term loans than individual SBA deals.',
  '722410':'Cash-heavy operations are bank-skeptical. Primary pitch is MCA tied to daily deposit volume. If ownership has real estate equity, a LOC secured against it closes much faster than bank underwriting.',
  '531110':'SBA 7(a) requires an active operating company — passive rental income is ineligible. Route these to CRE bridge loans, DSCR investor loans, or hard money. Confirm entity structure first.',
  '531120':'Pure investment properties: SBA is off the table. Open with CRE bridge or conventional commercial mortgage. If it\'s a value-add play, a private bridge lender is usually fastest.',
  '531311':'Active property managers with staff and operational expenses can qualify for SBA. If passive, route to LOC or factoring on management fee receivables instead.',
  '541110':'Law firms have excellent credit profiles but irregular retainer income spooks bank underwriters. LOC is the primary pitch — it smooths cash flow. MCA works well if they have consistent daily deposits.',
  '561320':'Staffing agencies are the single best invoice factoring candidate. Thin margins will fail SBA DSCR every time. Lead with factoring and never fight it — the product is genuinely better for them. Triumph Business Capital and Riviera Finance are specialty fits.',
  '484121':'Truckers and owner-operators: Equipment Financing per truck is the primary play. Invoice Factoring is a natural add-on for brokers with large shipper accounts. Triumph and Riviera specialize here.',
  '447110':'Gas stations require Phase 1 environmental reports for SBA — adds 4–6 weeks and $2–5K cost. If the borrower needs fast capital, lead with MCA on inside-store sales. Save SBA for expansion or acquisition deals.',
  '441110':'Franchise dealer agreements sometimes prohibit pledging assets as SBA collateral. Confirm agreement terms before packaging. If restricted, unsecured MCA or specialty dealer floor plan lines are the fallback.',
  '441120':'Floor plan debt compresses SBA DSCR significantly. Inventory LOCs or specialized floor plan facilities work better than forcing SBA. MCA is viable if daily deposits are strong.',
  '623110':'Medicare/Medicaid receivables factor extremely well — this is one of the highest-volume medical factoring verticals. Lead with factoring before SBA. SBA is viable for facility acquisition or expansion.',
  '721110':'SBA focuses on RevPAR and occupancy. If ADR is strong but the P&L looks thin, help the borrower rebuild the operating statement before submitting. CRE refinance is often a cleaner path for stabilized properties.',
  '624410':'SBA wants ≥70% enrollment utilization. Below that, pitch a short-term LOC for payroll gaps during off-season. Equipment Financing for playground/vans/HVAC is a reliable add-on product.',
  '519130':'Online media businesses must demonstrate active operations with W-2 employees for SBA. Ad-revenue-driven companies are better served by MCA or LOC tied to Stripe/bank account volume.',
  '561440':'Collection agencies face compliance overhead that spooks many bank underwriters. MCA and LOC are the primary products. Always confirm state licensure — unlicensed collection businesses are declined outright.',
  '623312':'Assisted living facilities have strong collateral but heavy regulatory overhead. SBA 7(a)/504 work for acquisition; CRE products work for real estate. Medicare/Medicaid receivables factor well for operating capital.',
  '541940':'Veterinary practices are prime SBA borrowers — strong DSCR, stable recurring revenue. BriteCap specifically targets this. Equipment Financing for diagnostic equipment is a consistent add-on.',
  '621210':'Dental practices are ideal SBA candidates: high DSCR, strong recurring revenue, significant equipment collateral. BHG Financial and BriteCap specifically target dental. Equipment Financing for chairs/imaging is a natural companion.',
  '713940':'Fitness centers have high fixed costs (equipment + rent) and seasonal membership swings. SBA 7(a) works for established centers. Equipment Financing for buildout. MCA for seasonal working capital.',
  '812112':'Beauty salons are strong MCA candidates — cash or card daily, consistent deposits. SBA works for salon suites or buildouts with real estate. Expansion Capital specifically targets cosmetology.',
};

// Examples
const EX = {
  '236118':'e.g. kitchen remodels, bathroom renovations, home additions',
  '238990':'e.g. waterproofing, scaffolding, demolition contractors',
  '447110':'e.g. BP, Shell, Wawa — gas plus convenience store',
  '484121':'e.g. OTR trucking companies, fleet operators',
  '492110':'e.g. last-mile delivery fleets, regional couriers',
  '519130':'e.g. digital media, ad-revenue blogs, online news',
  '531130':'e.g. Public Storage, Extra Space, U-Haul self-storage',
  '532412':'e.g. crane rental, dozer rental, equipment for contractors',
  '541213':'e.g. H&R Block, Jackson Hewitt, independent tax prep',
  '541519':'e.g. IT support firms, managed service providers',
  '561320':'e.g. temp agencies, light industrial staffing',
  '611519':'e.g. CDL schools, welding programs, HVAC trade schools',
  '621340':'e.g. PT clinics, occupational therapy, speech therapy',
  '621493':'e.g. urgent care centers, outpatient surgery centers',
  '713110':'e.g. Six Flags, local theme parks, family entertainment centers',
  '713990':'e.g. escape rooms, axe throwing, mini golf, bowling alleys',
  '721191':'e.g. small owner-operated B&Bs, historic inn properties',
  '722330':'e.g. food trucks, hot dog carts, catering vans',
  '811191':'e.g. Jiffy Lube, Valvoline, quick lube shops',
  '811192':'e.g. tunnel car washes, hand-wash detailing',
  '812310':'e.g. laundromats, self-service dry cleaning',
  '812910':'e.g. doggy daycare, dog grooming, pet boarding',
};

// Franchise-eligible codes
const FC = new Set(['446110','722511','561720','722515','451110','811191','812113','812112','722514','722513','441110','441120','721110','811121','713940','811192','624410','541213','447110','811111']);

// ─────────────────────────────────────────────
// LENDER DATA (condensed from waterfall)
// ─────────────────────────────────────────────
const LENDERS = [{"id":297,"name":"1 Stop Cap","fico":500,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":250000,"submission_url":"https://www.1stopcap.com/contact","source_url":"https://www.1stopcap.com"},{"id":365,"name":"5 Star Bank","fico":680,"tib":24,"products":["Term Loan","Line of Credit","Commercial Real Estate","SBA"],"preferred_industries":["Faith Community","Food, Agribusiness & Diversified Industries","Government","Healthcare","Manufactured Housing, RV & Self Storage","Manufacturing & Distribution","Non-Profit","Practice","Professional Services","Venture Banking, Technology & Startup"],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.fivestarbank.com"},{"id":213,"name":"American Express","fico":0,"tib":0,"products":["Line of Credit"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.americanexpress.com/en-us/business/blueprint"},{"id":305,"name":"Amerifi Capital","fico":500,"tib":6,"products":["Merchant Cash Advance","Equipment Funding"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.amerificapital.com"},{"id":306,"name":"Backd","fico":550,"tib":6,"products":["Line of Credit","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":2000000,"submission_url":"","source_url":"https://www.backd.com"},{"id":366,"name":"Bay 1st Bank","fico":680,"tib":24,"products":["Term Loan","Line of Credit","SBA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.bay1st.com"},{"id":307,"name":"BHB Funding","fico":500,"tib":6,"products":["MCA","Term Loan","Line of Credit"],"preferred_industries":[],"restrictions":["Adult Entertainment","Cannabis","Gambling","Firearms","Pawn Shops","Check Cashing","Tobacco/Vape","Non-Profits"],"max_funding_amount":0,"submission_url":"","source_url":"https://www.bhbfunding.com"},{"id":267,"name":"BHG Financial","fico":680,"tib":24,"products":["Term Loan"],"preferred_industries":["Medical"],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.bhgfinancial.com/apply-now","source_url":"https://www.bhgfinancial.com"},{"id":309,"name":"Big Think Capital","fico":600,"tib":6,"products":["SBA","Term Loan","Line of Credit","Working Capital","Commercial Real Estate","Equipment","Factoring","Ecommerce Funding","Gig & 1099 Funding","Home Equity Line of Credit"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.bigthinkcapital.com"},{"id":1,"name":"Bitty Advance","fico":500,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":["Construction","Trucking","Hospitality"],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.bittyadvance.com","source_url":"https://www.bittyadvance.com"},{"id":201,"name":"Bluevine","fico":0,"tib":0,"products":["Line of Credit","Term Loan"],"preferred_industries":["Ecommerce","Food & Beverage","Travel","Trucking business","Technology"],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.bluevine.com","source_url":"https://www.bluevine.com"},{"id":314,"name":"BriteCap","fico":600,"tib":6,"products":["Working Capital Loans","Term Loan","Line of Credit","Equipment Financing","SBA Loans"],"preferred_industries":["Healthcare","Dental Practices","Veterinary Clinics","Physician Practices","Allied Health","Outpatient Care Centers","Medical & Diagnostic Labs","Specialty Hospitals","Nursing & Skilled Care"],"restrictions":[],"max_funding_amount":1000000,"submission_url":"https://apply.britecap.com/","source_url":"https://www.britecap.com"},{"id":84,"name":"Byzfunder","fico":300,"tib":12,"products":["MCA","Term Loan","Line of Credit","Revenue-based Financing"],"preferred_industries":["Retail","Restaurants","Construction","Manufacturing","Others"],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.byzfunder.com","source_url":"https://www.byzfunder.com"},{"id":364,"name":"Cadence Bank","fico":680,"tib":24,"products":["Term Loan","Line of Credit","SBA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.cadencebank.com"},{"id":8,"name":"CFGMS","fico":450,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.cfgmerchantsolutions.com/apply-now","source_url":"https://www.cfgmerchantsolutions.com"},{"id":320,"name":"Elease","fico":550,"tib":0,"products":["Equipment Leasing","Equipment Financing"],"preferred_industries":["Business Startup & General","Industrial & Manufacturing","Office & Technology","Construction & Heavy Equipment","Service Businesses","Food & Hospitality"],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.elease.com/apply-now/","source_url":"https://www.elease.com"},{"id":6,"name":"Expansion Capital","fico":550,"tib":6,"products":["Factoring","Term Loan","Equipment","MCA","SBA"],"preferred_industries":["Auto Repair","Business Services","Cosmetology","Education & Training","Health & Fitness","Manufacturing","Medical","Nursery & Landscaping","Restaurants","Retail","Subcontractors"],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.ecg.com/apply-for-funding","source_url":"https://www.expansioncapitalgroup.com"},{"id":141,"name":"Fenix Capital Funding","fico":550,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":200000,"submission_url":"https://www.fenixcapitalfunding.com/apply-now/","source_url":"https://www.fenixcapitalfunding.com"},{"id":5,"name":"Fora Financial","fico":500,"tib":6,"products":["MCA","Line of Credit","SBA","Term Loan","Equipment"],"preferred_industries":[],"restrictions":[],"max_funding_amount":1500000,"submission_url":"https://www.forafinancial.com/get-started","source_url":"https://www.forafinancial.com"},{"id":2,"name":"Forward Financing","fico":550,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.forwardfinancing.com"},{"id":206,"name":"Fundbox","fico":0,"tib":0,"products":["Line of Credit"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://fundbox.com/","source_url":"https://fundbox.com/"},{"id":224,"name":"Funding Circle","fico":600,"tib":12,"products":["Term Loan","Line of Credit","Equipment"],"preferred_industries":[],"restrictions":[],"max_funding_amount":5000000,"submission_url":"https://www.fundingcircle.com/apply-now","source_url":"https://www.fundingcircle.com"},{"id":89,"name":"FundKite","fico":550,"tib":6,"products":["MCA","Revenue-Based Financing"],"preferred_industries":["restaurants","retail stores","construction companies","e-commerce brands","professional service organizations"],"restrictions":[],"max_funding_amount":2000000,"submission_url":"https://app.fundkite.com/apply","source_url":"https://www.fundkite.com"},{"id":88,"name":"Highland Hill Capital","fico":550,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://powerforms.docusign.net/51d40385-8f14-4e16-adb4-7029194de4d0?env=na1&acct=7984d9e7-9d90-4977-9a5d-0567a06edb05&accountId=7984d9e7-9d90-4977-9a5d-0567a06edb05","source_url":"https://www.highlandhillcapital.com"},{"id":333,"name":"Instagreen Capital","fico":550,"tib":6,"products":["MCA","Term Loan","Line of Credit"],"preferred_industries":[],"restrictions":["Adult Entertainment","Gambling","Firearms","Cannabis","Illegal Activities"],"max_funding_amount":0,"submission_url":"","source_url":"https://www.instagreencapital.com"},{"id":124,"name":"Kalamata Capital Group","fico":550,"tib":6,"products":["MCA"],"preferred_industries":["Retail","Wholesale & Ecommerce","Medical","Dental & Pharmaceutical","Trucking","Construction & Logistics","Restaurant","Hotel & Franchises"],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.kalamatacapitalgroup.com"},{"id":87,"name":"Legend Funding","fico":0,"tib":6,"products":["MCA","Line of Credit"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.legendfunding.com","source_url":"https://www.legendfunding.com"},{"id":96,"name":"Libertas Funding","fico":550,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":10000000,"submission_url":"https://libertasfunding.com/partner-with-us#partner-form","source_url":"https://www.libertasfunding.com"},{"id":148,"name":"Liquidibee","fico":500,"tib":6,"products":["MCA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.liquidibee.com"},{"id":342,"name":"Monday Funding","fico":500,"tib":6,"products":["Working Capital"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.mondayfunding.com","source_url":"https://www.mondayfunding.com"},{"id":4,"name":"Mulligan Funding","fico":500,"tib":6,"products":["Working Capital Loan","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":5000000,"submission_url":"","source_url":"https://www.mulliganfunding.com"},{"id":232,"name":"National Funding","fico":500,"tib":6,"products":["Small Business Loan","Equipment Financing"],"preferred_industries":["Trucking Companies","Agriculture","Construction","Restaurant","Gym and Fitness Center","Beauty & Wellness","Medical Practice","Landscaping","Senior Care"],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.nationalfunding.com","source_url":"https://www.nationalfunding.com"},{"id":205,"name":"OnDeck","fico":625,"tib":12,"products":["Line of Credit","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":400000,"submission_url":"","source_url":"https://www.ondeck.com"},{"id":111,"name":"QuickBridge","fico":550,"tib":6,"products":["Term Loan"],"preferred_industries":["Architecture Firm","Transportation Business","Healthcare Business","Poultry Farm","Gas Station"],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.quickbridge.com/apply","source_url":"https://www.quickbridge.com"},{"id":83,"name":"Rapid Finance","fico":580,"tib":6,"products":["Line of Credit","Term Loan","MCA","SBA","Factoring","Equipment"],"preferred_industries":[],"restrictions":[],"max_funding_amount":10000000,"submission_url":"https://www.rapidfinance.com/apply/","source_url":"https://www.rapidfinance.com"},{"id":93,"name":"Redline Capital Inc","fico":500,"tib":1,"products":["Line of Credit","Revenue-Based Financing","SBA","Term Loan","Equipment","MCA"],"preferred_industries":["Automotive - Sales","Automotive - Repair","Automotive - Other","Care Providers - Adult Care","Care Providers - Child Care","Care Providers - Home Health","Construction - Electrician","Construction - General Contractor (Commercial)","Construction - HVAC/Plumbing","Construction - Other","Entertainment - Bar/Nightclub","Entertainment - Other","Hospitality - Hotel/Motel","Manufacturing","Medical/Health","Restaurant - Franchise","Restaurant - Non-Franchise","Restaurant - Specialty/Food Service","Retail Stores","Services (Professional) - Accounting","Services (Professional) - Consulting","Services (Professional) - Legal Services","Services (Professional) - Marketing/Research","Services (Professional) - Staffing","Services (Professional) - Tax Preparation","Specialized Freight (except Used Goods) Trucking, Long-Distance","Technology Sales & Installation"],"restrictions":[],"max_funding_amount":2000000,"submission_url":"https://redlinecapitalinc.com/apply-now/","source_url":"https://redlinecapitalinc.com/"},{"id":349,"name":"ROK Financial","fico":500,"tib":6,"products":["MCA","Line of Credit","Term Loan","SBA","Equipment","Factoring"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.rok.financial"},{"id":159,"name":"SOS Capital","fico":500,"tib":6,"products":["Term Loan","MCA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://altbanq.com/","source_url":"https://www.soscapital.com"},{"id":353,"name":"Splash Advance","fico":500,"tib":6,"products":["MCA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":1000000,"submission_url":"https://www.splashadvance.com/apply-now","source_url":"https://www.splashadvance.com"},{"id":97,"name":"SuperG Capital","fico":500,"tib":12,"products":["Term Loan"],"preferred_industries":["ISOs","MSPs","VARs","Agents","Residual-based businesses"],"restrictions":["Retail","Restaurants","Manufacturing","Healthcare (non-billing services)","Construction","Any non-residual based business"],"max_funding_amount":5000000,"submission_url":"https://www.supergcapital.com/contact/","source_url":"https://www.supergcapital.com/"},{"id":355,"name":"The Smarter Merchant","fico":500,"tib":6,"products":["MCA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":500000,"submission_url":"https://www.thesmartermerchant.com","source_url":"https://www.thesmartermerchant.com"},{"id":356,"name":"Torro","fico":550,"tib":6,"products":["Factoring","Equipment","MCA","SBA","Term Loan","Line of Credit"],"preferred_industries":["Construction","Healthcare","Restaurants","Retail","Trucking"],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.torro.com/","source_url":"https://www.torro.com"},{"id":357,"name":"Total Merchant Resources","fico":550,"tib":3,"products":["MCA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.totalmerchantresources.com/apply-now","source_url":"https://www.totalmerchantresources.com"},{"id":358,"name":"Triton Capital","fico":620,"tib":6,"products":["Term Loan","Line of Credit","Equipment"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.tritoncapital.com"},{"id":166,"name":"TVT Capital","fico":0,"tib":3,"products":["MCA","Term Loan","Equipment","Factoring"],"preferred_industries":["Service Business","Beauty Salon","Commercial Trucking","Construction Business","Dental Office","Fitness Center","Food Truck","Grocery Store","Healthcare","Hotel/Motel","Laundromat","Medical Office","Nail Salon","Restaurant","Retail Business","Commercial Real Estate"],"restrictions":[],"max_funding_amount":25000000,"submission_url":"","source_url":"https://tvtcapital.com/"},{"id":86,"name":"Velocity Capital Group","fico":500,"tib":3,"products":["MCA"],"preferred_industries":["Healthcare Services","HVAC","Learning Centers","Liquor Stores","Manufacturing","Mechanics","Medical Companies","Professional Services","Plumbing","Rehab Centers","Restaurant / Cafes","Retail Stores","Technology Companies","Accounting","Autoshops","Business Consultants","Construction","Fitness Centers","General Contractors","Grocery Stores"],"restrictions":[],"max_funding_amount":2000000,"submission_url":"","source_url":"https://www.velocitycg.com"},{"id":362,"name":"Vox Funding","fico":550,"tib":6,"products":["MCA","Factoring","Line of Credit","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.voxfunding.com/apply/","source_url":"https://www.voxfunding.com"},{"id":363,"name":"World Business Lenders","fico":550,"tib":6,"products":["Term Loan"],"preferred_industries":["Wholesaler","Trucking","Telecommunication","Mining","Real Estate"],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.worldbusinesslenders.com"},{"id":1087,"name":"TimePayment","fico":550,"tib":0,"products":["Equipment Financing"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.timepayment.com"},{"id":1091,"name":"Celtic Bank","fico":600,"tib":24,"products":["SBA","Term Loan"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.celticbank.com"},{"id":1096,"name":"Ameris Bank Equipment Finance","fico":620,"tib":24,"products":["Equipment Financing"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.amerisbank.com/business/equipment-finance"},{"id":1097,"name":"Triumph Business Capital","fico":450,"tib":6,"products":["Factoring","Term Loan","Supply Chain Finance"],"preferred_industries":["Transportation"],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.triumph.io"},{"id":1098,"name":"Riviera Finance","fico":500,"tib":0,"products":["Factoring"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.rivierafinance.com"},{"id":1102,"name":"Fountainhead (SBA 7a)","fico":0,"tib":0,"products":["SBA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://fountainheadsba.com"},{"id":1103,"name":"U.S. Bank","fico":660,"tib":24,"products":["Term Loan","Line of Credit","SBA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.usbank.com/business-banking"},{"id":1104,"name":"PNC Bank","fico":600,"tib":36,"products":["Term Loan","Line of Credit","SBA"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"","source_url":"https://www.pnc.com/business-banking"},{"id":1200,"name":"Lendio","fico":0,"tib":0,"products":["MCA","Term Loan","Line of Credit","SBA","Equipment","Commercial Real Estate","Factoring"],"preferred_industries":[],"restrictions":[],"max_funding_amount":5000000,"submission_url":"https://www.lendio.com/apply","source_url":"https://www.lendio.com"},{"id":1201,"name":"Fundera by NerdWallet","fico":0,"tib":0,"products":["MCA","Term Loan","Line of Credit","SBA","Equipment","Commercial Real Estate","Factoring"],"preferred_industries":[],"restrictions":[],"max_funding_amount":0,"submission_url":"https://www.fundera.com/apply","source_url":"https://www.fundera.com"}];

// ─────────────────────────────────────────────
// TAG SYSTEM
// ─────────────────────────────────────────────

// NAICS code/prefix → industry tags
const NAICS_TAG_MAP = {
  // 6-digit specific
  '722511':['restaurant','food'],'722513':['restaurant','food','qsr'],'722410':['bar','restaurant','food'],
  '722514':['restaurant','food'],'722515':['restaurant','food','cafe'],'722330':['restaurant','food','food_truck'],
  '722310':['restaurant','food'],'722320':['restaurant','food','catering'],
  '721110':['hotel','hospitality'],'721191':['hotel','hospitality'],'721211':['hotel','hospitality'],
  '484110':['trucking','transportation'],'484121':['trucking','transportation'],'484210':['trucking','transportation'],
  '492110':['transportation','courier'],'493110':['transportation','warehouse'],
  '485310':['transportation'],'485320':['transportation'],'485410':['transportation'],'488410':['transportation'],
  '621111':['healthcare','medical'],'621112':['healthcare','medical','behavioral'],'621210':['healthcare','dental'],
  '621310':['healthcare','medical'],'621320':['healthcare','medical'],'621330':['healthcare','behavioral'],
  '621340':['healthcare','therapy'],'621399':['healthcare','medical'],'621493':['healthcare','medical','surgery'],
  '621511':['healthcare','lab'],'621512':['healthcare','lab'],'621610':['healthcare','home_health'],
  '621910':['healthcare','medical'],'621999':['healthcare','medical'],
  '623110':['healthcare','nursing','senior_care'],'623311':['healthcare','senior_care'],'623312':['healthcare','senior_care','assisted_living'],
  '624410':['healthcare','childcare'],
  '541940':['healthcare','veterinary'],
  '236115':['construction','residential'],'236116':['construction','residential'],'236118':['construction','remodeling'],
  '236220':['construction','commercial'],
  '238110':['construction'],'238130':['construction'],'238140':['construction'],'238160':['construction'],
  '238210':['construction','electrical','hvac'],'238220':['construction','plumbing','hvac'],
  '238310':['construction'],'238320':['construction'],'238330':['construction'],
  '238910':['construction'],'238990':['construction','specialty_trade'],
  '532412':['construction','equipment_rental'],
  '441110':['auto_dealer','retail'],'441120':['auto_dealer','retail'],
  '441310':['auto_parts','retail'],'441320':['auto_parts','retail'],
  '447110':['gas_station','retail'],'447190':['gas_station','retail'],
  '811111':['auto_repair'],'811113':['auto_repair'],'811121':['auto_repair','collision'],
  '811191':['auto_repair'],'811192':['auto_repair','car_wash'],
  '531110':['real_estate','rental'],'531120':['real_estate','commercial_re'],
  '531130':['real_estate','storage','self_storage'],'531210':['real_estate'],
  '531311':['real_estate','property_management'],'531312':['real_estate','property_management'],
  '541110':['professional_services','legal'],'541211':['professional_services','accounting'],
  '541213':['professional_services','accounting','tax'],'541330':['professional_services','engineering'],
  '541511':['professional_services','tech','software'],'541512':['professional_services','tech'],
  '541519':['professional_services','tech','it'],'541611':['professional_services','consulting'],
  '541613':['professional_services','marketing'],'541810':['professional_services','marketing'],
  '561311':['staffing'],'561320':['staffing'],
  '561730':['landscaping'],'561720':['cleaning'],
  '611511':['education','cosmetology'],'611519':['education','trade_school'],
  '713940':['fitness','recreation'],'713110':['entertainment','recreation'],
  '713990':['entertainment','recreation'],
  '812111':['beauty','barber','salon'],'812112':['beauty','salon'],'812113':['beauty','nail_salon','salon'],
  '812910':['pet_care'],'812310':['laundromat'],
  '511210':['tech','software'],'518210':['tech','cloud'],'519130':['tech','media'],
  // 3-digit prefix defaults
  '722':['restaurant','food','hospitality'],'721':['hotel','hospitality'],
  '484':['trucking','transportation'],'492':['transportation','courier'],
  '621':['healthcare','medical'],'622':['healthcare'],'623':['healthcare','senior_care'],
  '624':['healthcare','childcare'],
  '236':['construction'],'237':['construction'],'238':['construction','specialty_trade'],
  '441':['retail','auto_dealer'],'442':['retail'],'443':['retail'],'444':['retail'],
  '445':['retail','food_retail'],'446':['retail'],'447':['retail','gas_station'],
  '448':['retail'],'451':['retail'],'452':['retail'],'453':['retail'],'454':['retail','ecommerce'],
  '531':['real_estate'],'532':['rental','equipment_rental'],
  '541':['professional_services'],'511':['tech','software'],'518':['tech'],
  '561':['business_services','staffing'],'611':['education'],
  '711':['entertainment'],'712':['entertainment'],'713':['recreation','fitness','entertainment'],
  '811':['auto_repair','repair'],'812':['personal_services','beauty'],'813':['nonprofit'],
};

// Lender preferred_industry string → tags
const LIND_TAGS = {
  'Medical':['healthcare','medical'],'Healthcare':['healthcare','medical'],'Healthcare Services':['healthcare','medical'],
  'Healthcare Business':['healthcare','medical'],'Medical Practice':['healthcare','medical'],
  'Medical Companies':['healthcare','medical'],'Medical Office':['healthcare','medical'],'Medical/Health':['healthcare','medical'],
  'Dental Practices':['dental','healthcare'],'Dental & Pharmaceutical':['dental','healthcare'],'Dental Office':['dental','healthcare'],
  'Veterinary Clinics':['healthcare','veterinary'],'Practice':['healthcare','medical'],
  'Physician Practices':['healthcare','medical'],'Allied Health':['healthcare','medical'],
  'Outpatient Care Centers':['healthcare','medical'],'Medical & Diagnostic Labs':['healthcare','lab'],
  'Specialty Hospitals':['healthcare'],'Nursing & Skilled Care':['healthcare','nursing','senior_care'],
  'Senior Care':['healthcare','senior_care'],'Rehab Centers':['healthcare','therapy'],
  'Care Providers - Adult Care':['healthcare','senior_care'],'Care Providers - Child Care':['healthcare','childcare'],
  'Care Providers - Home Health':['healthcare','home_health'],
  'Restaurants':['restaurant','food'],'restaurants':['restaurant','food'],'Restaurant':['restaurant','food'],
  'Restaurant - Franchise':['restaurant','food'],'Restaurant - Non-Franchise':['restaurant','food'],
  'Restaurant - Specialty/Food Service':['restaurant','food','catering'],'Restaurant / Cafes':['restaurant','food','cafe'],
  'Food & Beverage':['restaurant','food','food_retail'],'Food & Hospitality':['restaurant','food','hotel','hospitality'],
  'Food, Agribusiness & Diversified Industries':['restaurant','food_retail','food'],
  'Hospitality':['hotel','restaurant','hospitality'],'Hospitality - Hotel/Motel':['hotel','hospitality'],
  'Hotel/Motel':['hotel','hospitality'],'Hotel & Franchises':['hotel','hospitality','restaurant'],
  'Food Truck':['restaurant','food','food_truck'],'Grocery Store':['food_retail','retail'],
  'Trucking':['trucking','transportation'],'Transportation':['trucking','transportation','courier'],
  'Trucking Companies':['trucking','transportation'],'Trucking business':['trucking','transportation'],
  'Commercial Trucking':['trucking','transportation'],
  'Specialized Freight (except Used Goods) Trucking, Long-Distance':['trucking','transportation'],
  'Construction & Logistics':['trucking','transportation','construction'],
  'Construction':['construction'],'Construction Business':['construction'],
  'Construction - Electrician':['construction','electrical'],'Construction - General Contractor (Commercial)':['construction'],
  'Construction - HVAC/Plumbing':['construction','hvac','plumbing'],'Construction - Other':['construction'],
  'Construction & Heavy Equipment':['construction','equipment_rental'],'General Contractors':['construction'],
  'Retail':['retail'],'Retail stores':['retail'],'retail stores':['retail'],'Retail Stores':['retail'],
  'Retail Business':['retail'],'Wholesale & Ecommerce':['retail','ecommerce'],'Ecommerce':['retail','ecommerce'],
  'e-commerce brands':['retail','ecommerce'],'Wholesaler':['retail'],'Grocery Stores':['food_retail','retail'],
  'Business Services':['professional_services','business_services'],
  'Professional Services':['professional_services','business_services'],
  'professional service organizations':['professional_services'],
  'Services (Professional) - Accounting':['professional_services','accounting'],
  'Services (Professional) - Consulting':['professional_services','consulting'],
  'Services (Professional) - Legal Services':['professional_services','legal'],
  'Services (Professional) - Marketing/Research':['professional_services','marketing'],
  'Services (Professional) - Tax Preparation':['professional_services','accounting','tax'],
  'Services (Professional) - Staffing':['staffing'],
  'Services (Professional) - Other':['professional_services'],
  'Architecture Firm':['professional_services'],'Transportation Business':['transportation','trucking'],
  'Auto Repair':['auto_repair'],'Automotive - Sales':['auto_dealer'],'Automotive - Repair':['auto_repair'],
  'Automotive - Other':['auto_dealer','auto_repair'],'Autoshops':['auto_repair'],'Mechanics':['auto_repair'],
  'Gas Station':['gas_station'],'Beauty Salon':['salon','beauty'],'Beauty & Wellness':['salon','beauty'],
  'Nail Salon':['nail_salon','beauty','salon'],'Service Business':['personal_services','beauty'],
  'Cosmetology':['beauty','salon','cosmetology'],'TVT Capital Beauty Salon':['salon','beauty'],
  'Gym and Fitness Center':['fitness','recreation'],'Health & Fitness':['fitness','recreation'],
  'Fitness Centers':['fitness','recreation'],'Fitness Center':['fitness','recreation'],
  'Industrial & Manufacturing':['manufacturing'],'Manufacturing & Distribution':['manufacturing'],
  'Manufacturing':['manufacturing'],'Manufactured Housing, RV & Self Storage':['real_estate','storage'],
  'Agriculture':['agriculture'],'Nursery & Landscaping':['landscaping','construction'],
  'HVAC':['hvac','construction'],'Plumbing':['plumbing','construction'],
  'Education & Training':['education'],'Learning Centers':['education'],
  'Laundromat':['laundromat','personal_services'],'Commercial Real Estate':['real_estate','commercial_re'],
  'Entertainment - Bar/Nightclub':['bar','entertainment'],'Liquor Stores':['retail','bar'],
  'Technology Companies':['tech','software'],'Technology Sales & Installation':['tech','it'],
  'Venture Banking, Technology & Startup':['tech','software'],'Technology':['tech','software'],
  'Real Estate':['real_estate'],'Services (Professional) - Real Estate':['real_estate'],
};

// Restriction string → tags that conflict
const RESTRICT_TAGS = {
  'Restaurants':['restaurant'],'Retail':['retail'],'Construction':['construction'],
  'Manufacturing':['manufacturing'],'Cannabis':['cannabis'],'cannabis':['cannabis'],
  'Gambling':['gambling'],'Adult Entertainment':['adult'],'Firearms':['firearms'],
  'Pawn Shops':['pawn'],'Check Cashing':['check_cashing'],'Tobacco/Vape':['tobacco'],
  'Non-Profits':['nonprofit'],'Illegal Activities':['illegal'],
  'financial services':['financial_services'],'heavy mining':['mining'],
  'Healthcare (non-billing services)':[],// too vague to reliably match
  'Any non-residual based business':[],  // intentionally skip — too broad
};

function getTagsForCode(code) {
  const tags = new Set();
  const add = arr => arr.forEach(t => tags.add(t));
  if (NAICS_TAG_MAP[code]) add(NAICS_TAG_MAP[code]);
  const p3 = code.slice(0,3); if (NAICS_TAG_MAP[p3]) add(NAICS_TAG_MAP[p3]);
  const p2 = code.slice(0,2); if (NAICS_TAG_MAP[p2]) add(NAICS_TAG_MAP[p2]);
  return [...tags];
}

function getLenderTags(l) {
  const tags = new Set();
  (l.preferred_industries||[]).forEach(ind => {
    const t = LIND_TAGS[ind]; if(t) t.forEach(x => tags.add(x));
  });
  return [...tags];
}

function getRestrictionTags(l) {
  const tags = new Set();
  (l.restrictions||[]).forEach(r => {
    const t = RESTRICT_TAGS[r]; if(t) t.forEach(x => tags.add(x));
  });
  return [...tags];
}

function isRestricted(lender, naicsTags) {
  const rt = getRestrictionTags(lender);
  return rt.some(t => naicsTags.includes(t));
}

// Normalize product label for display chip
function normProd(p) {
  const m = {
    'Merchant Cash Advance':'MCA','Revenue-based Financing':'RBF','Revenue-Based Financing':'RBF',
    'Working Capital Loan':'Term Loan','Working Capital Loans':'Term Loan','Working Capital':'Term Loan',
    'Small Business Loan':'Term Loan','SBA Loans':'SBA',
    'Equipment Financing':'Equipment','Equipment Funding':'Equipment','Equipment Leasing':'Equipment',
    'Commercial Real Estate':'CRE','Line of Credit':'LOC','Ecommerce Funding':'Ecommerce',
    'Gig & 1099 Funding':'Gig Funding','Home Equity Line of Credit':'HELOC',
    'Supply Chain Finance':'Supply Chain',
  };
  return m[p] || p;
}

const PROD_CHIP_CLASS = {
  'SBA':'lp-sba','Term Loan':'lp-term','LOC':'lp-loc','MCA':'lp-mca',
  'Equipment':'lp-equip','Factoring':'lp-factor','CRE':'lp-cre',
  'RBF':'lp-mca','Bridge':'lp-cre','HELOC':'lp-cre',
  'Ecommerce':'lp-term','Supply Chain':'lp-factor','Gig Funding':'lp-mca',
};

// Products that count as a match for each NAICS product stack
function codeToProductSet(code, tier) {
  const prods = getProds(code, tier);
  return new Set(prods.map(([l]) => l.split(' ')[0].toLowerCase())); // first word, lowercase
}

function lenderOffersRelevantProduct(lender, prodSet) {
  return (lender.products||[]).some(p => {
    const n = normProd(p);
    return prodSet.has(n.toLowerCase()) || prodSet.has(n.split(' ')[0].toLowerCase());
  });
}

// ─────────────────────────────────────────────
// CATCH-ALL ("generic") CODE DETECTION
// A 6-digit NAICS code is a catch-all when it names a broad industry
// but no specific activity — the "All Other / Other / Miscellaneous"
// buckets. These lose: they carry only the broad sector tag, so they
// never match industry-SPECIALIST lenders and underwriting defaults
// them to a more conservative tier. Accounts enter them by mistake.
//
// Carefully EXCLUDES legit specifics that merely contain a trigger word
// ("General Freight Trucking", "Supermarkets and Other Grocery Retailers").
// ─────────────────────────────────────────────
function isGenericDesc(d){
  if(!d) return false;
  // "Other …" or "All Other …" as a phrase, or any "Misc"/"Miscellaneous".
  // A LEADING "Other" (start of name) or the phrase "All Other" is the
  // catch-all signal; a mid-phrase "and Other Grocery Retailers" is not.
  return /^other\b/i.test(d) || /\ball other\b/i.test(d) || /\bmisc/i.test(d);
}
function isGenericCode(code){
  const e = NAICS_DB.find(n=>n.c===code);
  return e ? isGenericDesc(e.d) : false;
}

// Human label for the family a catch-all belongs to — derived from its
// own name by stripping the catch-all prefix. e.g.
// "All Other Specialty Trade Contractors" -> "Specialty Trade Contractors"
function familyLabel(code){
  const e = NAICS_DB.find(n=>n.c===code);
  if(!e) return 'this industry';
  return e.d
    .replace(/^all other\s+/i,'')
    .replace(/^other\s+/i,'')
    .replace(/^miscellaneous\s+/i,'')
    .replace(/^misc\.?\s+/i,'') || 'this industry';
}

// Specific (non-catch-all) siblings the borrower might actually belong to.
// Shares the 3-digit subsector (widest useful redirect); same 4-digit
// industry group surfaces first, then better tiers, then code order.
function specificSiblings(code){
  const sub3 = code.slice(0,3), grp4 = code.slice(0,4);
  const tierRank = {g:0,w:1,r:2,n:3};
  return NAICS_DB
    .filter(n => n.c!==code && n.c.slice(0,3)===sub3 && !isGenericDesc(n.d))
    .sort((a,b)=>{
      const ga=a.c.slice(0,4)===grp4?0:1, gb=b.c.slice(0,4)===grp4?0:1;
      if(ga!==gb) return ga-gb;
      const ta=tierRank[TIER[a.c]||'g'], tb=tierRank[TIER[b.c]||'g'];
      if(ta!==tb) return ta-tb;
      return a.c.localeCompare(b.c);
    });
}
// total codes (incl. the catch-all) under the same 3-digit subsector
function familySize(code){
  const sub3 = code.slice(0,3);
  return NAICS_DB.filter(n => n.c.slice(0,3)===sub3).length;
}

// ─────────────────────────────────────────────
// UNDERWRITING FACTOR BANDS
// Each borrower factor (FICO / time-in-business / monthly revenue) reads
// into a band: a tone (g/w/r/n = prime→restricted), a short tag, and a
// one-line implication. The "logic" string is the deeper rationale reps
// can surface. Thresholds reflect common bank/SBA vs alt-lending cutoffs.
// ─────────────────────────────────────────────
const FICO_BANDS = [
  {min:720, tone:'g', tag:'Prime credit',        line:'Opens every program. Lead with the cheapest capital — bank term or SBA.'},
  {min:680, tone:'g', tag:'Bank & SBA eligible', line:'Clears the typical 680 SBA/bank floor. The lowest-cost money is on the table.'},
  {min:640, tone:'w', tag:'Conventional + alt',  line:'Above most alt minimums, just under the SBA floor. Strong term-loan range.'},
  {min:600, tone:'w', tag:'Alt-lending',         line:'Banks unlikely; alt term, LOC and revenue-based programs fit well here.'},
  {min:550, tone:'r', tag:'Sub-prime alt',       line:'MCA and revenue-based lead. A handful of alt term lenders still play.'},
  {min:500, tone:'r', tag:'High-risk',           line:'Mostly MCA. Expect higher cost, shorter terms, smaller sizes.'},
  {min:0,   tone:'n', tag:'Sub-500 — very limited',line:'Very few lenders. MCA only, at the highest cost.'},
];
const TIB_BANDS = [
  {min:60, tone:'g', tag:'Established',  line:'Long track record — clears every time-in-business minimum.'},
  {min:24, tone:'g', tag:'Bank-ready',  line:'Meets the standard 24-month bank/SBA threshold.'},
  {min:12, tone:'w', tag:'Alt-lending', line:'Past the 1-year mark most alt lenders want; banks still want 24.'},
  {min:6,  tone:'r', tag:'Early-stage', line:'Alt and MCA territory. Banks and SBA generally pass under a year.'},
  {min:3,  tone:'r', tag:'Just opened', line:'MCA-only for most lenders; expect small initial sizes.'},
  {min:0,  tone:'n', tag:'Startup',     line:'Little operating history. Very few lenders; startup or collateral-based only.'},
];
const REV_BANDS = [
  {min:100000, tone:'g', tag:'Strong',          line:'Supports six-figure facilities across products.'},
  {min:50000,  tone:'g', tag:'Healthy',         line:'Comfortable for term, SBA, and sizable MCA.'},
  {min:25000,  tone:'w', tag:'Solid',           line:'Funds most alt products; size scales with deposits.'},
  {min:12000,  tone:'w', tag:'Workable',        line:'Above typical MCA minimums; funding sizes are modest.'},
  {min:8000,   tone:'r', tag:'Thin',            line:'Near the ~$10k/mo MCA floor. Options start to narrow.'},
  {min:0,      tone:'n', tag:'Below minimums',  line:'Under most lenders’ revenue floor. Limited or no fit.'},
];
const FACTOR_LOGIC = {
  fico:'FICO decides which doors are open and what you pay once inside — it rarely sets the amount. Banks and SBA typically want 680+. Alt-lenders start around 500–550, and pricing improves at roughly every 20-point step.',
  tib:'Time in business is a proxy for survival risk. The standard bank/SBA line is 24 months; most alt lenders fund from 6, and some MCA lenders from 3. Crossing 24 months is what re-opens the cheapest capital.',
  rev:'Revenue rarely changes WHICH products qualify — it sets how MUCH you can borrow and whether daily/weekly repayment is survivable. Most MCA lenders want ~$10–15k/mo in deposits; term and SBA size off annualized revenue and DSCR.',
};
function bandFor(bands, v){ for(const b of bands){ if(v>=b.min) return b; } return bands[bands.length-1]; }
function factorRead(kind, v){
  if(v==null || v==='' || isNaN(v)) return null;
  if(kind==='fico') return bandFor(FICO_BANDS, v);
  if(kind==='tib')  return bandFor(TIB_BANDS, v);
  if(kind==='rev')  return bandFor(REV_BANDS, v);
  return null;
}

// ─────────────────────────────────────────────
// ATR ENGINE — Amount · Term · Rate
// Produces a defensible INDICATIVE band for each of the three lending
// dimensions, given the deal. These are reasonable ranges a seller can
// stand behind, not an offer. Driven by lead product family + the
// borrower factors (FICO sets Rate, TIB sets Term, Revenue sets Amount).
// ─────────────────────────────────────────────
const ATR_AMOUNT_MULT = { // × monthly revenue → [lo, hi]
  mca:[0.8,1.5], rbf:[0.8,1.5], term:[1,3], loc:[1,2.5], sba:[3,8],
  cre:[4,10], equip:[1,3], factor:[1,2], bridge:[2,5], _def:[1,2.5]
};
const ATR_TERM = { // months [lo, hi]
  mca:[4,12], rbf:[6,15], term:[12,36], loc:[6,24], sba:[60,120],
  cre:[60,300], equip:[24,72], factor:[3,12], bridge:[6,18], _def:[6,24]
};
const ATR_RATE = { // apr % | factor × | fee %/mo
  sba:{kind:'apr',lo:11,hi:16}, cre:{kind:'apr',lo:8,hi:13}, term:{kind:'apr',lo:15,hi:38},
  loc:{kind:'apr',lo:18,hi:45}, equip:{kind:'apr',lo:9,hi:22}, factor:{kind:'fee',lo:1,hi:4},
  mca:{kind:'factor',lo:1.22,hi:1.49}, rbf:{kind:'factor',lo:1.18,hi:1.42},
  bridge:{kind:'apr',lo:10,hi:14}, _def:{kind:'apr',lo:15,hi:40}
};
const ATR_TERM_DOMAIN = {sba:130,cre:300,equip:84,term:48,_def:36}; // for spread bar scaling
function prodFamily(label){
  if(!label) return '_def';
  const l=String(label).toLowerCase();
  if(l.includes('sba')) return 'sba';
  if(l.includes('cre')||l.includes('real estate')) return 'cre';
  if(l.includes('mca')) return 'mca';
  if(l.includes('rbf')||l.includes('revenue')) return 'rbf';
  if(l.includes('equip')) return 'equip';
  if(l.includes('factor')) return 'factor';
  if(l.includes('loc')||l.includes('line')) return 'loc';
  if(l.includes('bridge')) return 'bridge';
  if(l.includes('term')) return 'term';
  return '_def';
}
function roundNice(n){
  if(n>=100000) return Math.round(n/5000)*5000;
  if(n>=20000)  return Math.round(n/1000)*1000;
  return Math.max(2000, Math.round(n/500)*500);
}
function computeATR(deal){
  const fam = prodFamily(deal.leadProduct);
  // quality multiplier from FICO & TIB (affects how high the Amount band reaches)
  let q=1;
  if(deal.fico){ if(deal.fico>=720)q+=0.18; else if(deal.fico>=680)q+=0.10; else if(deal.fico>=640)q+=0.02; else if(deal.fico<580)q-=0.18; else if(deal.fico<620)q-=0.08; }
  if(deal.tib){ if(deal.tib>=60)q+=0.10; else if(deal.tib>=24)q+=0.05; else if(deal.tib<6)q-=0.15; else if(deal.tib<12)q-=0.06; }
  q=Math.max(0.6, Math.min(1.4, q));

  // AMOUNT — revenue driven
  let amount=null;
  if(deal.rev){
    const [ml,mh]=ATR_AMOUNT_MULT[fam]||ATR_AMOUNT_MULT._def;
    amount={ lo:roundNice(deal.rev*ml), hi:roundNice(deal.rev*mh*q) };
    if(amount.hi<=amount.lo) amount.hi=roundNice(amount.lo*1.4);
  }
  // TERM — product + tenure
  const [tl,th]=ATR_TERM[fam]||ATR_TERM._def;
  let termHi=Math.round(th*(deal.tib&&deal.tib<12?0.7:1));
  termHi=Math.max(tl+ (tl<12?2:6), termHi);
  const term={lo:tl, hi:termHi, domain:(ATR_TERM_DOMAIN[fam]||ATR_TERM_DOMAIN._def)};
  // RATE — fico shifts the band
  const rr={...(ATR_RATE[fam]||ATR_RATE._def)};
  if(deal.fico){
    const shift=(680-deal.fico); // >0 means subprime → pricier
    if(rr.kind==='apr'){ const adj=shift*0.06; rr.lo=Math.max(5,rr.lo+adj*0.6); rr.hi=Math.max(rr.lo+2, rr.hi+adj); rr.lo=Math.round(rr.lo); rr.hi=Math.round(rr.hi); }
    else if(rr.kind==='factor'){ const adj=shift*0.0006; rr.lo=Math.max(1.10,rr.lo+adj*0.5); rr.hi=Math.max(rr.lo+0.04, rr.hi+adj); rr.lo=Math.round(rr.lo*100)/100; rr.hi=Math.round(rr.hi*100)/100; }
  }
  // ask vs amount band
  let askFit=null;
  if(amount && deal.reqAmt){
    if(deal.reqAmt>amount.hi) askFit='above';
    else if(deal.reqAmt<amount.lo) askFit='below';
    else askFit='within';
  }
  return {fam, amount, term, rate:rr, askFit, q};
}
// ── ATR formatting ──
function fmtMoney(n){
  if(n>=1000){ const k=n/1000; return '$'+(k%1?k.toFixed(1):k.toFixed(0))+'k'; }
  return '$'+n;
}
function atrAmountText(a){ return a ? `${fmtMoney(a.lo)} – ${fmtMoney(a.hi)}` : '—'; }
function atrTermText(t){ return `${t.lo} – ${t.hi} mo`; }
function atrRateText(r){
  if(r.kind==='apr')    return `${r.lo} – ${r.hi}% APR`;
  if(r.kind==='factor') return `${r.lo.toFixed(2)} – ${r.hi.toFixed(2)}× factor`;
  if(r.kind==='fee')    return `${r.lo} – ${r.hi}% /mo`;
  return '';
}
// normalized [start,end] (0..1) of a band within its dimension domain, for spread bars
function atrSpread(kind, band){
  if(kind==='amount'){ if(!band) return [0,0]; const max=band.hi*1.25; return [band.lo/max, band.hi/max]; }
  if(kind==='term'){ const max=band.domain; return [band.lo/max, band.hi/max]; }
  if(kind==='rate'){
    if(band.kind==='factor'){ const lo=(band.lo-1.0)/0.6, hi=(band.hi-1.0)/0.6; return [Math.max(0,lo),Math.min(1,hi)]; }
    if(band.kind==='fee'){ return [band.lo/6, band.hi/6]; }
    const max=50; return [band.lo/max, band.hi/max];
  }
  return [0,0];
}
