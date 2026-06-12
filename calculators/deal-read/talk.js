/* ════════════════════════════════════════════════════════════
   LendPaper · Deal Read — conversation + cross-effect engine
   Pure-ish helpers on top of data.js. Reads the shared global S.
   ════════════════════════════════════════════════════════════ */

// ── Product ladder narrative ─────────────────────────────────
const PROD_NARR = {
  'SBA 7(a)':  {short:'an SBA 7(a) loan',            rank:5, credit:true,  why:'the lowest-cost, longest-term capital a small business can get'},
  'SBA 504':   {short:'an SBA 504 loan',             rank:5, credit:true,  why:'long-term, fixed-rate money for real estate and major equipment'},
  'CRE':       {short:'a commercial real estate loan',rank:5, credit:true, why:'long-term financing secured by the property itself'},
  'Term Loan': {short:'a term loan',                 rank:4, credit:true,  why:'a fixed lump sum with predictable payments that builds your business credit'},
  'LOC':       {short:'a line of credit',            rank:3, credit:true,  why:'flexible, revolving capital you only pay for when you actually draw it'},
  'Equipment': {short:'equipment financing',         rank:3, credit:true,  why:'the equipment itself secures the deal, so it funds faster and costs less'},
  'Bridge':    {short:'a bridge loan',               rank:2, credit:true,  why:'short-term capital to move now while permanent financing comes together'},
  'Factoring': {short:'invoice factoring',           rank:2, credit:false, why:'cash for your unpaid invoices today instead of waiting 30–90 days to get paid'},
  // HARD RULE (LEN-162): client-facing copy never says "MCA" / "merchant cash
  // advance" — always "revenue-based financing." The legal term lives only in
  // the disclaimer block (the purchase-of-receivables definition), not the script.
  'MCA':       {short:'revenue-based financing',     rank:1, credit:false, why:'capital that flexes with your sales, repaid as a small share of revenue'},
  'RBF':       {short:'revenue-based financing',     rank:1, credit:false, why:'capital that flexes with your sales, repaid as a small share of revenue'},
};
function pn(label){ return PROD_NARR[label] || {short:label.toLowerCase(), rank:3, credit:true, why:'capital structured around your situation'}; }
function capFirst(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function ttEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
// Bold the umbrella product term wherever it surfaces in a talk track (LEN-317).
// Display-only: the raw string is untouched, so copied text (ttPlain) stays clean.
function ttRender(s){ return ttEsc(s).replace(/⟦/g,'<span class="hi">').replace(/⟧/g,'</span>').replace(/short-term financing/gi, m=>'<b>'+m+'</b>'); }
function ttPlain(s){ return String(s).replace(/[⟦⟧]/g,''); }

// ── Payment cadence by lead-product family ───────────────────
const PAY_FREQ = {
  mca:'Daily / weekly', rbf:'Weekly', factor:'Per invoice',
  term:'Monthly', sba:'Monthly', cre:'Monthly', bridge:'Monthly',
  equip:'Monthly', loc:'Monthly on draws', _def:'Monthly',
};
function payFreqFor(fam){ return PAY_FREQ[fam] || PAY_FREQ._def; }
// how the cadence reads to a borrower — the "why"
function payFreqWhy(fam){
  if(fam==='mca'||fam==='rbf') return 'a small slice comes out of your daily deposits, so the payment scales with how the business actually performs';
  if(fam==='factor') return 'you get paid when the invoice is funded — there is no fixed monthly payment to carry';
  if(fam==='loc') return 'you only owe on what you draw, repaid monthly';
  return 'one predictable payment a month you can budget around';
}

// ── Accent palettes (tweak) ──────────────────────────────────
const ACCENTS = {
  forest:{ green:'#1A3C2E', dk:'#0f2a1f', wash:'#eef5ef', line:'#cde3d2' },
  emerald:{ green:'#1c8553', dk:'#13633c', wash:'#e9f5ee', line:'#c5e6d2' },
  pine:{   green:'#1f6f5f', dk:'#165246', wash:'#e8f1ee', line:'#c6e0d8' },
  slate:{  green:'#2a5d7a', dk:'#1d4257', wash:'#eaf1f5', line:'#cadce6' },
};

// ── Lender fit (profile-aware) ───────────────────────────────
function lenderQualifies(l, fico, tib, rev){
  if(l.fico>0 && fico && l.fico>fico) return false;
  if(l.tib>0  && tib  && l.tib>tib)   return false;
  if(l.rev>0  && rev  && l.rev>rev)   return false;
  return true;
}
function matchPool(code, tier){
  const naicsTags = getTagsForCode(code);
  const prodSet = codeToProductSet(code, tier);
  const specialty=[], productMatch=[], restricted=[];
  LENDERS.forEach(l=>{
    if(isRestricted(l, naicsTags)){ restricted.push(l); return; }
    if(!l.products || !l.products.length) return;
    const lTags = getLenderTags(l);
    if(lTags.some(t=>naicsTags.includes(t))) specialty.push(l);
    else if(lenderOffersRelevantProduct(l, prodSet)) productMatch.push(l);
  });
  return { specialty, productMatch, restricted, pool:[...specialty,...productMatch] };
}
// count how many in the pool clear a hypothetical profile
function fitCount(pool, fico, tib, rev){ return pool.filter(l=>lenderQualifies(l,fico,tib,rev)).length; }

// ── Combined borrower talk track (call / text / email) ───────
// Mirrors the established expectation-setting engine. Reads global S.
// Talk-track lead product (LEN-227): the Overview script ALWAYS leads with
// Short-Term Financing (MCA/RBF) by default, then the pager cycles the rest —
// UNLESS the rep set a "Requested product", in which case we lead with that.
function talkLeadLabel(prods){
  if(!prods||!prods.length) return null;
  const fams=prods.map(([l])=>[l, prodFamily(l)]);
  const req=S.reqProduct;
  if(req){ const m=fams.find(([l,f])=> f===req || (req==='mca'&&f==='rbf')); if(m) return m[0]; }
  const mca=fams.find(([l,f])=> f==='mca'||f==='rbf'); if(mca) return mca[0];
  return prods[0][0];
}
function buildCombinedTracks(code, tier, prods, industry){
  const ind = industry.replace(/\s*\(.*?\)\s*/g,' ').trim();
  const leadLabel = talkLeadLabel(prods);
  const lead = leadLabel ? pn(leadLabel) : null;
  let dest=null;
  prods.forEach(([l])=>{ const p=pn(l); if(p.credit && (!dest || p.rank>dest.rank)) dest={...p}; });
  const climbing = !!(lead && dest && dest.rank>lead.rank);
  const hasMCA = prods.some(([l])=>l==='MCA'||l==='RBF');
  const toneRank={g:0,w:1,r:2,n:3};
  const reads=[];
  if(S.fico){const b=factorRead('fico',S.fico); if(b) reads.push({k:'fico',b,v:S.fico});}
  if(S.tib ){const b=factorRead('tib', S.tib ); if(b) reads.push({k:'tib', b,v:S.tib });}
  if(S.rev ){const b=factorRead('rev', S.rev ); if(b) reads.push({k:'rev', b,v:S.rev });}
  let weak=null; reads.forEach(r=>{ if(toneRank[r.b.tone]>=2 && (!weak||toneRank[r.b.tone]>toneRank[weak.b.tone])) weak=r; });
  const anyProfile = reads.length>0;
  const psHi=[]; if(S.fico)psHi.push(`⟦${S.fico} FICO⟧`); if(S.tib)psHi.push(`⟦${S.tib} months in⟧`); if(S.rev)psHi.push(`⟦$${S.rev.toLocaleString()}/mo⟧`);
  const psPlain=[]; if(S.fico)psPlain.push(`${S.fico} FICO`); if(S.tib)psPlain.push(`${S.tib} months in business`); if(S.rev)psPlain.push(`$${S.rev.toLocaleString()}/mo revenue`);

  const discl =
    (hasMCA ? 'A merchant cash advance is a purchase of future receivables, not a loan, and does not build business credit. ' : '') +
    'Nothing here is guaranteed — final terms always depend on your business’s performance, broader market and economic conditions, and each lender’s underwriting at the time, all of which change. Nothing here is a commitment or offer to lend.';

  if(!lead){
    const talk =
`I’m going to be straight with you, because that’s how this works best. Your industry sits in a category most banks and lenders ⟦restrict⟧, so I won’t promise capital I can’t deliver.

Here’s what I can do. First, confirm we have your exact classification right — a neighboring code sometimes changes the whole picture. Second, map out what would have to be true — time in business, revenue, structure — for real options to open up.

That’s a plan, not a no. Let’s build it together so when the door opens, you’re ready to walk through it.`;
    const text =
`Hi [Name] — straight talk from our call: your industry sits in a restricted category for most lenders, so I won’t over-promise. Next step is confirming your exact classification and mapping what would open up options down the road. I’ll be in touch.`;
    const email =
`Subject: Where things stand — and the plan from here

Hi [Name],

Thanks for the time today. I’d rather be straight with you than sell you something I can’t deliver.

WHERE THINGS STAND
Your industry falls into a category most banks and lenders restrict. That doesn’t make it a dead end — but it does mean we plan carefully instead of forcing a product that won’t fund.

THE PLAN
1) Confirm your exact classification — a neighboring code sometimes changes everything.
2) Map what needs to be true (time in business, revenue, structure) for options to open.
3) Build toward that, so you’re ready the moment the door opens.

Happy to walk through any of it.

[Your name]`;
    return {talk:[talk], labels:['Straight talk'], text, email, discl};
  }

  let why;
  if(lead.rank<=2)      why = 'We lead here because it gets capital working fast — without the two years of history and the collateral a bank wants up front.';
  else if(lead.rank<=4) why = 'We lead here because you’ve got enough of a track record to skip the most expensive money and go straight to something that actually builds your credit.';
  else                  why = 'We lead here because your profile already clears the bar for the best capital available — there’s no reason to start anywhere lower.';

  const bridgeTalk = climbing
    ? `And this is the part most people miss: today isn’t the ceiling, it’s the on-ramp. Six to twelve months of clean payments is exactly the history lenders look for — and that’s what graduates you to ⟦${dest.short}⟧ at better terms. We’re building a ladder, not doing a one-off deal.`
    : `From here, the work is keeping you there — protecting the credit profile and the cash flow that qualified you, so the next round is even cheaper.`;
  const bridgeText = climbing
    ? `clean payments here open the door to ${dest.short} at better rates down the road`
    : `the goal now is keeping your terms strong so the next round is even cheaper`;
  const bridgeEmail = climbing
    ? `This is a bridge, not the destination. As you build a track record, you graduate to ${dest.short} — longer terms, lower cost. The plan is to keep moving you up that ladder.`
    : `You already qualify for strong capital. From here we protect your profile and cash flow so every future round gets cheaper.`;

  const angleA =
`For a business like yours, the strongest fit right now is ⟦${lead.short}⟧ — ${lead.why}.

${why}

${bridgeTalk}`;

  let angleB, labelB;
  if(weak){
    labelB = 'The workaround';
    if(weak.k==='fico') angleB=`Let me be straight about credit. At ⟦${weak.v} FICO⟧ the cheapest bank money is tough today — but that’s not the part that decides this. ${capFirst(lead.short)} funds on your sales, not your score, so we get you moving now while every on-time payment rebuilds the file toward cheaper capital later.`;
    else if(weak.k==='tib') angleB=`You’re ⟦${weak.v} months⟧ in, and most banks want 24. That’s fine — we’re not going to the bank yet. ${capFirst(lead.short)} looks at your revenue, not your tenure, gets you funded now, and the clock keeps running toward bank-eligibility.`;
    else angleB=`Revenue is the lever here. At ⟦$${weak.v.toLocaleString()}/mo⟧ we size conservatively, so the payment never outruns your deposits — and as revenue grows, so does what you qualify for. We build up to it, not over your head.`;
  } else if(anyProfile){
    labelB = 'Your leverage';
    angleB=`On paper you check the boxes lenders want — ${psHi.join(', ')}. That’s leverage. It means we don’t take the first offer that lands; we shop you for the best terms and hold out for the cheapest capital you actually qualify for.`;
  } else {
    labelB = 'Sharpen it';
    angleB=`The honest part: the exact terms depend on your numbers. Get me a ⟦FICO⟧, your ⟦time in business⟧, and ⟦monthly revenue⟧, and I’ll tell you precisely which lenders fit and what the money costs — no guessing, no surprises in underwriting.`;
  }

  const angleC =
`Here’s how I size it — not by the biggest number you’d qualify for, but by what your cash flow can actually carry. Enough to ⟦keep the lights on⟧ and still leave a profit.

A payment that strangles the business helps no one. We’ll put hard numbers on it with a ⟦payment-affordability⟧ review, so you can see exactly how the payment sits against your revenue before you ever sign.`;

  const text =
`Hi [Name] — recap from our chat: for your business, the best-fit financing right now is ⟦${lead.short}⟧. It’s ${lead.why}.${weak? ` ${(weak.k==='fico'?`Your ⟦${weak.v} FICO⟧ means we go alt-first, not bank`:weak.k==='tib'?`At ⟦${weak.v} months⟧ in, we use lenders that weigh revenue over tenure`:`We’ll size to your ⟦$${weak.v.toLocaleString()}/mo⟧ so payments stay comfortable`)}.` : ''} Think of it as step one — ${bridgeText}. I’ll size it to your cash flow so it still leaves you a profit, not just the biggest number you qualify for. More soon.`;

  const profSection = anyProfile
    ? `\n\nYOUR NUMBERS\n${psPlain.join(' · ')}. ${weak?(weak.k==='fico'?'Credit points us to alt-lending first, not the bank — and we rebuild from there.':weak.k==='tib'?'Time in business keeps us with revenue-focused lenders until you cross the 24-month bank line.':'We size to your revenue so the payment stays comfortable as you grow.'):'These put you in a strong position; we’ll shop for the best terms available.'}`
    : '';
  const email =
`Subject: Your financing plan — where to start and where it leads

Hi [Name],

Thanks for the time today. Here’s the straight version.

WHERE TO START
${capFirst(lead.short)} is the best fit right now — ${lead.why}. For a ${ind.toLowerCase()} business at this stage, it’s the right first move.${profSection}

THE LONGER GAME
${bridgeEmail}

THE REAL TEST
How the payment sits against your cash flow. I size every offer to keep the lights on and still leave profit — never just the maximum you qualify for. We’ll put exact numbers to this with a payment-affordability review shortly.

Happy to walk through any of it.

[Your name]`;

  return {talk:[angleA, angleB, angleC], labels:['The plan', labelB, 'Affordability'], text, email, discl};
}

// ── Per-factor talk track — explain ONE lever to the borrower ─
// This is the "reverse-engineer the offer, factor by factor" piece.
function buildFactorTrack(kind, deal){
  const e = NAICS_DB.find(n=>n.c===deal.code);
  const ind = e ? e.d.replace(/\s*\(.*?\)\s*/g,' ').trim() : 'your business';
  const atr = deal.leadProduct ? computeATR(deal) : null;
  const leadLabel = deal.prods.length ? prodDisplay(deal.prods[0][0]) : null;
  const lead = deal.prods.length ? pn(deal.prods[0][0]) : null;

  if(kind==='industry'){
    const tierWord = ({g:'a clean, bankable category',w:'a fundable category that leans alt-lending',r:'a high-scrutiny category',n:'a restricted category most lenders avoid'})[deal.tier];
    const talk = lead
      ? `Your business is classified as ⟦${ind}⟧. To a lender that reads as ${tierWord} — and that’s exactly why the offers you’re seeing lead with ⟦${leadLabel}⟧: ${lead.why}. The industry sets the menu; everything else just tunes the numbers.`
      : `Your business is classified as ⟦${ind}⟧, which most lenders ⟦restrict⟧. That single fact is what’s shaping — and limiting — the offers. Before anything else we confirm the exact code, because a neighboring one can change the whole menu.`;
    const text = lead
      ? `Quick context: your industry (${ind}) is ${tierWord.replace(/^a /,'')}, which is why the lead product is ${leadLabel}. The rest of your numbers tune the amount, term, and rate from there.`
      : `Your industry (${ind}) sits in a restricted category for most lenders — that’s the main thing shaping your options. Let’s confirm the exact classification first.`;
    return {talk, text, owns:'Product type', value:leadLabel||'Restricted'};
  }

  const v = kind==='fico'?deal.fico : kind==='tib'?deal.tib : deal.rev;
  const b = factorRead(kind, v);
  if(b==null){
    const ask = {fico:'a credit score',tib:'how long you’ve been in business',rev:'your monthly revenue'}[kind];
    return {talk:`Give me ⟦${ask}⟧ and I can tell you exactly how it moves this offer — and which lenders it opens or closes.`, text:`Send over ${ask} and I’ll firm up the numbers.`, owns:({fico:'Rate',tib:'Term',rev:'Amount'})[kind], value:'—'};
  }

  if(kind==='fico'){
    const rate = atr ? atrRateText(atr.rate) : 'your rate';
    const talk = b.tone==='g'
      ? `Your credit is ⟦${v}⟧ — ${b.tag.toLowerCase()}. That’s the number that earns you the ⟦${rate}⟧ pricing here; strong credit is what keeps this on the cheaper end and the cheapest programs open.`
      : `Your credit is ⟦${v}⟧ — ${b.tag.toLowerCase()}. That score is what sets your rate at ⟦${rate}⟧ and why this is structured as ${lead?lead.short:'an alt product'}, not a bank loan. It isn’t permanent: every ~20 points of credit improvement typically moves the price in your favor.`;
    const text = `Your ${v} FICO is what drives the rate (${rate}). ${b.tone==='g'?'It keeps you on the cheaper end.':'As credit improves, the cost comes down — this is step one, not the ceiling.'}`;
    return {talk, text, owns:'Rate', value:atr?atrRateText(atr.rate):'—'};
  }
  if(kind==='tib'){
    const term = atr ? atrTermText(atr.term) : 'your term';
    const talk = v>=24
      ? `You’re ⟦${v} months⟧ in — past the 24-month line banks care about. That tenure is what earns you the ⟦${term}⟧ term and keeps bank-length pricing on the table.`
      : `You’re ⟦${v} months⟧ in. Most banks want 24, so for now your term lands around ⟦${term}⟧ with revenue-focused lenders. The clock is the asset here — crossing 24 months is what reopens longer, cheaper bank terms.`;
    const text = `Your ${v} months in business sets the term (${term}). ${v>=24?'You clear the bank line.':'Crossing 24 months reopens longer bank-length terms.'}`;
    return {talk, text, owns:'Term', value:atr?atrTermText(atr.term):'—'};
  }
  // rev
  const amt = atr&&atr.amount ? atrAmountText(atr.amount) : null;
  const fam = atr?atr.fam:'_def';
  const cadence = payFreqFor(fam);
  const talk = amt
    ? `At ⟦$${Number(v).toLocaleString()}/mo⟧ in deposits, a responsible size for this profile is ⟦${amt}⟧, repaid ⟦${cadence.toLowerCase()}⟧ — ${payFreqWhy(fam)}. I size to your cash flow, not the maximum, so the payment never outruns the business. As deposits grow, so does the number.`
    : `Your ⟦$${Number(v).toLocaleString()}/mo⟧ in deposits is the lever that sets how much you can responsibly carry. Pick the product and I’ll put a real amount on it.`;
  const text = amt
    ? `At $${Number(v).toLocaleString()}/mo, a responsible amount is ${amt}, repaid ${cadence.toLowerCase()}. We size to cash flow, not the max.`
    : `Your $${Number(v).toLocaleString()}/mo in revenue sets the amount you can carry.`;
  return {talk, text, owns:'Amount', value:amt||'—'};
}
