/* ════════════════════════════════════════════════════════════
   LendPaper · Deal Read — application layer
   Consolidated 4-factor read. Each factor owns a lever:
   Industry→Product · FICO→Rate · Time-in-business→Term · Revenue→Amount
   ════════════════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────────────────────
const S = {
  selected:null, q:'', indEditing:false, mode:'broker',
  fico:null, tib:null, rev:null, reqAmt:null, ficoBad:false,
  reqProduct:'', expTerm:null, expPayFreq:'', state:'', stateConfirmed:false, expOpen:false, fundBy:'',
  deposits:{}, depOpen:false, depCount:4, aprOpen:false, tibUnit:'mo', affOpen:false, modal:null, prodIdx:0,
  amtOpen:false, rateMode:null, cmpGates:[3,6,12], cmpLocApr:null,
  lang:'en', tipHidden:false,
  facOpen:{}, uwOpen:false, uwMode:'swipe', uwIdx:0, uwCat:'all', uw:{},
  pdfScope:'combined',
  tweaks:{ accent:'forest', density:'regular', disclosures:'show', deltas:'on' },
};
const LS='lp_deal_read_v1';
function save(){ try{ localStorage.setItem(LS, JSON.stringify({
  selected:S.selected, q:S.q, mode:S.mode, fico:S.fico, tib:S.tib, rev:S.rev, reqAmt:S.reqAmt,
  reqProduct:S.reqProduct, expTerm:S.expTerm, expPayFreq:S.expPayFreq, state:S.state, stateConfirmed:S.stateConfirmed, expOpen:S.expOpen, fundBy:S.fundBy,
  deposits:S.deposits, depOpen:S.depOpen, depCount:S.depCount, aprOpen:S.aprOpen, tibUnit:S.tibUnit, affOpen:S.affOpen,
  amtOpen:S.amtOpen, rateMode:S.rateMode, cmpGates:S.cmpGates, cmpLocApr:S.cmpLocApr,
  lang:S.lang, tipHidden:S.tipHidden, facOpen:S.facOpen, uwOpen:S.uwOpen, uwMode:S.uwMode, uwIdx:S.uwIdx, uwCat:S.uwCat, uw:S.uw, tweaks:S.tweaks
})); }catch(e){} }
function load(){ try{ const d=JSON.parse(localStorage.getItem(LS)||'{}');
  if(d.selected) S.selected=d.selected; if(d.q) S.q=d.q; if(d.mode) S.mode=d.mode;
  S.fico=d.fico??null; S.tib=d.tib??null; S.rev=d.rev??null; S.reqAmt=d.reqAmt??null;
  S.reqProduct=d.reqProduct||''; S.expTerm=d.expTerm??null; S.expPayFreq=d.expPayFreq||''; S.state=d.state||''; S.stateConfirmed=!!d.stateConfirmed; S.expOpen=!!d.expOpen; S.fundBy=d.fundBy||'';
  S.deposits=d.deposits||{}; S.depOpen=!!d.depOpen; S.depCount=d.depCount||4; S.aprOpen=!!d.aprOpen;
  S.tibUnit=d.tibUnit==='yr'?'yr':'mo'; S.affOpen=!!d.affOpen;
  S.amtOpen=!!d.amtOpen; S.rateMode=(d.rateMode==='apr'||d.rateMode==='cents')?d.rateMode:null;
  if(Array.isArray(d.cmpGates)&&d.cmpGates.length) S.cmpGates=d.cmpGates; if(d.cmpLocApr!=null) S.cmpLocApr=d.cmpLocApr;
  if(d.lang) S.lang=d.lang; S.tipHidden=!!d.tipHidden;
  if(d.facOpen) S.facOpen=d.facOpen;
  S.uwOpen=!!d.uwOpen; S.uwMode=d.uwMode==='all'?'all':'swipe'; S.uwIdx=d.uwIdx||0; S.uwCat=d.uwCat||'all'; if(d.uw&&typeof d.uw==='object') S.uw=d.uw;
  if(d.tweaks) S.tweaks={...S.tweaks,...d.tweaks};
}catch(e){} }

// ── Icons ─────────────────────────────────────────────────────
const I = {
  search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  copy:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  pdf:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  up:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  dn:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  tag:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/></svg>',
  lift:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>',
  drag:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>',
  warn:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  cc:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h3"/></svg>',
  cal:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M3 9h18"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>',
  rev:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h5v5"/></svg>',
  factory:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M7 18h.01"/><path d="M12 18h.01"/><path d="M17 18h.01"/></svg>',
  info:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  edit:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  // file-at-a-glance status icons (LEN-186): soft-green up-right (strength),
  // red down-right (limit), question mark (needs clarification).
  arrowDn:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7 17 17"/><path d="M17 7v10H7"/></svg>',
  qmark:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
};
const TC={g:'1',w:'2',r:'3',n:'4'};
const DOT={g:'#1f9d57',w:'#e0a400',r:'#d2524f',n:'#d2524f',x:'var(--faint)'};
const TONE_TAG={g:'Strong',w:'Limiting',r:'Flag',n:'Flag'};
function toneTag(t){ return TONE_TAG[t]||'—'; }
const TIER_SHORT={g:'Tier 1 · Prime',w:'Tier 2 · Bank + alt',r:'Tier 3 · High scrutiny',n:'Tier 4 · Restricted'};
const QUICK=[['722511','Restaurant'],['484121','Trucking'],['561320','Staffing'],['621210','Dental'],['812112','Salon'],['238220','HVAC']];

// ── deal + levers ─────────────────────────────────────────────
function currentDeal(){
  const code=S.selected; const tier=code?(TIER[code]||'g'):null;
  const prods=code?getProds(code,tier):[];
  return {code,tier,prods,leadProduct:prods.length?prods[0][0]:null,fico:S.fico,tib:S.tib,rev:S.rev,reqAmt:S.reqAmt,depMonths:depMonthsEntered()};
}
function computeLevers(deal){
  if(!deal.leadProduct) return null;
  const atr=computeATR(deal); const fam=atr.fam;
  return {
    atr, fam,
    amount: atr.amount?atrAmountText(atr.amount):null, amountProxy: atr.amount?atr.amount.hi:0,
    term: atrTermText(atr.term), termProxy: atr.term.hi,
    rate: atrRateText(atr.rate), rateProxy:(atr.rate.lo+atr.rate.hi)/2,
    pay: payFreqFor(fam),
    product: deal.prods.length?deal.prods[0][0]:null,
  };
}
// Which product the user is currently viewing in the Product tile (lead by default)
function selProdLabel(d){ const p=d.prods||[]; const i=(S.prodIdx>=0&&S.prodIdx<p.length)?S.prodIdx:0; return p.length?p[i][0]:null; }
function leversForProduct(d,label){ if(!label) return null; return computeLevers({...d,leadProduct:label}); }
function currentLevers(){ const d=currentDeal(); return leversForProduct(d, selProdLabel(d)); }

// ── search ────────────────────────────────────────────────────
function searchMatches(){
  const q=S.q.trim().toLowerCase(); let list;
  if(!q) list=NAICS_DB.slice();
  else{
    const isCode=/^\d/.test(q);
    list=NAICS_DB.filter(n=>isCode?n.c.startsWith(q):n.d.toLowerCase().includes(q));
    if(!isCode) list.sort((a,b)=>{const score=s=>{const i=s.toLowerCase().indexOf(q);if(i===0)return 0;if(i>0&&/[\s\-(]/.test(s[i-1]))return 1;return 2;};return score(a.d)-score(b.d);});
  }
  return list;
}

// ════════════════════════════════════════════════════════════
//  RENDER — inputs column
// ════════════════════════════════════════════════════════════
function renderInputs(){
  const el=document.getElementById('inputs');
  const tip = S.tipHidden ? '' :
    `<div class="tip">Enter the four factors. The read updates live — <b>amount, term, rate, payment, and product</b> — and shows exactly which factor drives each, plus what to tell the borrower.<button class="tip-x" onclick="hideTip()" title="Dismiss">×</button></div>`;
  el.innerHTML = tip +
    `<div class="in-sec-label">Borrower profile</div>
     <div class="fields">
       ${fieldIndustry()}
       ${fieldNum('fico')}
       ${fieldNum('tib')}
       ${fieldNum('rev')}
       ${fieldFundBy()}
       ${depositsPanel()}
     </div>
     <div id="uwChipsHost">${uwChips()}</div>
     <div style="height:20px"></div>
     ${expectationsPanel()}
     ${uwPanel()}
     <div id="fundingRangeHost" class="fr-host">${fundingRangeBlock()}</div>`;
  if(S.indEditing){ const i=document.getElementById('indSearch'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } }
}
function expectationsPanel(){
  const count=[S.reqProduct,S.reqAmt,S.expTerm,S.expPayFreq].filter(Boolean).length;
  const open=S.expOpen;
  const sel=(id,opts,val,onch)=>`<div class="sel-box"><select id="${id}" onchange="${onch}">${opts.map(([v,l])=>`<option value="${v}" ${val===v?'selected':''}>${l}</option>`).join('')}</select><span class="chev">${I.dn}</span></div>`;
  return `<div class="exp-wrap">
    <button class="exp-toggle" onclick="toggleExp()">
      <span class="et-plus">${open?'\u2013':'+'}</span>
      <span class="et-main"><span class="et-t">What does the borrower expect?</span><span class="et-h">Optional — sharpens every line of the read &amp; the talk track</span></span>
      ${count?`<span class="et-count">${count}</span>`:''}
      <span class="fac-chev" style="${open?'transform:rotate(180deg)':''}">${I.dn}</span>
    </button>
    <div class="exp-panel ${open?'open':''}" id="expPanel">
      <div class="exp-grid">
        <div class="field full"><label>Requested product</label>${sel('exp-prod',REQ_PRODUCTS,S.reqProduct,"onExp('reqProduct',this.value)")}</div>
        <div class="field"><label>Requested amount</label><div class="sel-box"><span class="pre">$</span><input type="number" id="exp-amt" placeholder="optional" value="${S.reqAmt!=null?S.reqAmt:''}" oninput="onExp('reqAmt',this.value)"></div></div>
        <div class="field"><label>Expected term</label><div class="sel-box"><input type="number" id="exp-term" placeholder="optional" value="${S.expTerm!=null?S.expTerm:''}" oninput="onExp('expTerm',this.value)"><span class="suf">mos</span></div></div>
        <div class="field"><label>Expected payment</label>${sel('exp-pay',PAY_EXP,S.expPayFreq,"onExp('expPayFreq',this.value)")}</div>
        <div class="field"><label>Business state · for APR</label>${sel('exp-state',US_STATES,S.state,"onExp('state',this.value)")}</div>
      </div>
    </div>
  </div>`;
}
function toggleExp(){
  S.expOpen=!S.expOpen; save();
  const p=document.getElementById('expPanel'), tog=document.querySelector('.exp-toggle');
  if(p) p.classList.toggle('open',S.expOpen);
  if(tog){ tog.querySelector('.et-plus').textContent=S.expOpen?'\u2013':'+'; const ch=tog.querySelector('.fac-chev'); if(ch) ch.style.transform=S.expOpen?'rotate(180deg)':''; }
}
function onExp(kind,val){
  if(kind==='reqProduct') S.reqProduct=val;
  else if(kind==='reqAmt') S.reqAmt=parseInt(val)||null;
  else if(kind==='expTerm') S.expTerm=parseInt(val)||null;
  else if(kind==='expPayFreq') S.expPayFreq=val;
  else if(kind==='state'){ S.state=val; S.stateConfirmed=true; const box=document.querySelector('#exp-state')?.closest('.sel-box'); if(box) box.classList.remove('need'); const note=document.querySelector('.state-need-note'); if(note) note.remove(); }
  save(); updateExpCount(); renderRead(); renderBand();
}
// Business State must be actively confirmed before exporting — documented state is more defensible than silence
function requireState(){
  if(S.stateConfirmed) return true;
  S.expOpen=true; renderInputs();
  const sb=document.getElementById('exp-state');
  if(sb){
    const box=sb.closest('.sel-box'); if(box) box.classList.add('need');
    const field=sb.closest('.field');
    if(field && !field.querySelector('.state-need-note')){
      const n=document.createElement('div'); n.className='state-need-note'; n.textContent='Confirm the business state before exporting — select it above.';
      field.appendChild(n);
    }
    try{ sb.focus(); }catch(e){}
  }
  return false;
}
function updateExpCount(){
  const count=[S.reqProduct,S.reqAmt,S.expTerm,S.expPayFreq].filter(Boolean).length;
  const tog=document.querySelector('.exp-toggle'); if(!tog) return;
  let badge=tog.querySelector('.et-count');
  if(count){ if(!badge){ badge=document.createElement('span'); badge.className='et-count'; tog.querySelector('.fac-chev').before(badge);} badge.textContent=count; }
  else if(badge){ badge.remove(); }
}
function fieldIndustry(){
  const showSearch = !S.selected || S.indEditing;
  let inner;
  if(showSearch){
    const q=S.q.trim(); const matches=searchMatches().slice(0,24);
    const rows = q ? (matches.length?matches.map(irRow).join(''):`<div class="ir-row" style="cursor:default;color:var(--muted);font-size:12px">No match — try a shorter keyword or a 6-digit code.</div>`) : '';
    const quick = !q ? `<div class="quick">${QUICK.map(([c,l])=>`<button onclick="pickIndustry('${c}')">${l}</button>`).join('')}</div>` : '';
    inner = `<div class="ind-search">${I.factory}<input type="text" id="indSearch" placeholder="Search industry or NAICS — restaurant, 722513…" autocomplete="off" value="${ttEsc(S.q)}" oninput="onIndSearch(this.value)"></div>
      <div class="ind-res ${rows?'open':''}" id="indRes">${rows}</div>${quick}`;
  } else {
    const e=NAICS_DB.find(n=>n.c===S.selected); const tier=TIER[S.selected]||'g';
    inner = `<div class="in-box ind-box" onclick="editIndustry()" title="Click to change industry">
      <span class="in-ico">${I.factory}</span>
      <span class="in-field ind-field">
        <span class="ind-name">${ttEsc(e?e.d:'')}</span>
        <span class="ind-code">NAICS ${S.selected}${isGenericCode(S.selected)?' · catch-all':''}</span>
      </span>
      <span class="in-tag"><button class="tg tg-btn" onclick="event.stopPropagation();openLever('product')" title="See what this affects"><span class="d" style="background:${DOT[tier]}"></span>${toneTag(tier)}<span class="tg-go">${I.dn}</span></button></span>
    </div>`;
  }
  return `<div class="field"><label>Industry / NAICS</label>${inner}</div>`;
}
function irRow(m){
  const tier=TIER[m.c]||'g'; const tc=TC[tier];
  return `<div class="ir-row" onclick="pickIndustry('${m.c}')">
    <span class="ir-code">${m.c}</span>
    <div style="min-width:0"><div class="ir-name">${ttEsc(m.d)}</div></div>
    <span class="ir-tier" style="color:var(--t${tc})"><span class="d" style="background:var(--t${tc})"></span>${({g:'Prime',w:'Bank+alt',r:'Tough',n:'Restr.'})[tier]}${isGenericCode(m.c)?'<span class="ir-gen">catch-all</span>':''}</span>
  </div>`;
}
function tibSuf(){ return `<button class="suf suf-toggle" onclick="event.stopPropagation();toggleTibUnit()" title="Switch months / years">${S.tibUnit==='yr'?'yrs':'mos'}<span class="suf-sw">⇅</span></button>`; }
function tibDisplayVal(){ if(S.tib==null) return ''; return S.tibUnit==='yr'?(Math.round(S.tib/12*10)/10):S.tib; }
function tibPh(){ return S.tibUnit==='yr'?'2':'24'; }
function toggleTibUnit(){ S.tibUnit=S.tibUnit==='yr'?'mo':'yr'; save(); const i=document.getElementById('in-tib'); if(i) i.value=tibDisplayVal(); const b=document.querySelector('.field[data-field="tib"] .suf-toggle'); if(b) b.innerHTML=(S.tibUnit==='yr'?'yrs':'mos')+'<span class="suf-sw">\u21c5</span>'; const ph=document.getElementById('in-tib'); if(ph) ph.placeholder=tibPh(); }
function fieldNum(kind){
  const cfg={
    fico:{label:'FICO', icon:I.cc, pre:'',suf:'',ph:'640',val:S.fico},
    tib:{label:'Time in business', icon:I.cal, pre:'',suf:tibSuf(),ph:tibPh(),val:tibDisplayVal()},
    rev:{label:'Monthly revenue', icon:I.rev, pre:'$',suf:'',ph:'50,000',val:S.rev},
  }[kind];
  const val=cfg.val!=null&&cfg.val!==''?cfg.val:'';
  const invalid=kind==='fico'&&S.ficoBad;
  return `<div class="field ${invalid?'invalid':''}" data-field="${kind}">
    <label>${cfg.label}</label>
    <div class="in-box" onclick="this.querySelector('input').focus()">
      <span class="in-ico">${cfg.icon}</span>
      <span class="in-field">
        ${cfg.pre?`<span class="pre">${cfg.pre}</span>`:''}
        <input type="number" id="in-${kind}" placeholder="${cfg.ph}" value="${val}" oninput="onInput('${kind}',this.value)">
        ${cfg.suf||''}
      </span>
      <span class="in-tag" id="tag-${kind}">${tagHTML(kind)}</span>
    </div>
  </div>`;
}
// Mandatory "Funding needed by" — a simple time-range below Monthly Revenue (LEN-186 r3).
// Required before export; urgency also feeds the read (fast products / Next steps).
const FUND_BY=[['','Select…'],['asap','ASAP — within a week'],['2-4w','In 2–4 weeks'],['1-3m','In 1–3 months'],['flex','No firm deadline']];
function fundByLabel(v){ const f=FUND_BY.find(x=>x[0]===v); return f?f[1]:''; }
function fundByUrgent(){ return S.fundBy==='asap'||S.fundBy==='2-4w'; }
function fieldFundBy(){
  return `<div class="field" data-field="fundby">
    <label>Funding needed by</label>
    <div class="in-box fundby-box" id="fundByBox" onclick="this.querySelector('select').focus()">
      <span class="in-ico">${I.cal}</span>
      <span class="in-field"><select id="in-fundby" onchange="onFundBy(this.value)">${FUND_BY.map(([v,l])=>`<option value="${v}" ${S.fundBy===v?'selected':''}>${l}</option>`).join('')}</select></span>
      <span class="fac-chev">${I.dn}</span>
    </div>
  </div>`;
}
function onFundBy(v){
  S.fundBy=v; save();
  const box=document.getElementById('fundByBox'); if(box) box.classList.remove('need');
  const n=document.querySelector('.fundby-need-note'); if(n) n.remove();
  renderRead(); renderBand();
}
// Mandatory before export — documented urgency is more useful than a blank
function requireFundBy(){
  if(S.fundBy) return true;
  const box=document.getElementById('fundByBox');
  if(box){
    box.classList.add('need');
    const field=box.closest('.field');
    if(field && !field.querySelector('.fundby-need-note')){ const n=document.createElement('div'); n.className='state-need-note fundby-need-note'; n.textContent='Choose when funding is needed before exporting.'; field.appendChild(n); }
    try{ box.querySelector('select').focus(); }catch(e){}
    try{ box.scrollIntoView({block:'center',behavior:'smooth'}); }catch(e){}
  }
  return false;
}
function tagHTML(kind){
  if(kind==='fico'&&S.ficoBad) return `<span class="tg err"><span class="d"></span>300–850</span>`;
  const v=kind==='fico'?S.fico:kind==='tib'?S.tib:S.rev;
  const b=factorRead(kind,v);
  if(!b) return '';
  const lever={fico:'rate',tib:'term',rev:'amount'}[kind];
  return `<button class="tg tg-btn" onclick="event.stopPropagation();openLever('${lever}')" title="See what this affects"><span class="d" style="background:${DOT[b.tone]}"></span>${toneTag(b.tone)}<span class="tg-go">${I.dn}</span></button>`;
}
function statHTML(kind){
  if(kind==='industry'){ return ''; }
  if(kind==='amount'){ return S.reqAmt?`<span class="lever" style="margin-left:0;color:var(--muted)">plotted on the amount band</span>`:''; }
  if(kind==='fico'&&S.ficoBad) return `<span class="sdot" style="background:var(--t4)"></span><span style="color:var(--t4)">Score is 300–850</span>`;
  const v=kind==='fico'?S.fico:kind==='tib'?S.tib:S.rev;
  const b=factorRead(kind,v);
  const lever={fico:'Rate',tib:'Term',rev:'Amount'}[kind];
  if(!b) return `<span class="lever" style="margin-left:0;white-space:nowrap">→ sets the ${lever.toLowerCase()}</span>`;
  const tc=TC[b.tone];
  return `<span class="sdot" style="background:var(--t${tc})"></span><span style="color:var(--t${tc})">${b.tag}</span><span class="lever" style="white-space:nowrap">→ ${lever}</span>`;
}

// ── Deposits by month (bank-statement history) ───────────────
function depMonths(count){
  const now=new Date(); const arr=[];
  for(let i=count-1;i>=0;i--){
    const dt=new Date(now.getFullYear(), now.getMonth()-i, 1);
    const key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    arr.push({key, isMTD:i===0, label:i===0?'MTD':dt.toLocaleString('en-US',{month:'short'})});
  }
  return arr;
}
function mtdKey(){ const now=new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; }
function depAvg(){
  const mk=mtdKey();
  const completed=Object.entries(S.deposits).filter(([k,v])=>k!==mk && v>0).sort((a,b)=>a[0]<b[0]?-1:1);
  if(!completed.length) return null;
  let wsum=0,vsum=0; completed.forEach(([k,v],i)=>{ const w=i+1; wsum+=w; vsum+=v*w; });
  return {avg:Math.round(vsum/wsum), n:completed.length};
}
function depCountEntered(){ return Object.values(S.deposits).filter(v=>v>0).length; }
// non-MTD months with a real deposit figure — drives the Funding Range gate
function depMonthsEntered(){ const mk=mtdKey(); return Object.entries(S.deposits).filter(([k,v])=>k!==mk && v>0).length; }
function depAvgNote(){ const av=depAvg(); return av?`<span class="dep-avg">Recency-weighted avg · ${av.n} mo → <b>$${av.avg.toLocaleString()}/mo</b></span>`:''; }
function depositsPanel(){
  const open=S.depOpen; const months=depMonths(S.depCount); const n=depCountEntered();
  const cells=months.map(m=>{
    const v=S.deposits[m.key]!=null?S.deposits[m.key]:'';
    return `<div class="dep-cell${m.isMTD?' mtd':''}"><label>${m.label}</label><div class="dep-in"><span class="dep-pre">$</span><input type="number" inputmode="numeric" placeholder="0" value="${v}" oninput="onDeposit('${m.key}',this.value)"></div></div>`;
  }).join('');
  return `<div class="dep-wrap">
    <button class="dep-toggle" onclick="toggleDep()"><span class="dep-tg-ico">${open?'\u2013':'+'}</span><span class="dep-tg-t">Deposits by month</span><span class="dep-tg-h">bank-statement history${n?` · ${n} entered`:''}</span><span class="fac-chev" style="${open?'transform:rotate(180deg)':''}">${I.dn}</span></button>
    <div class="dep-panel ${open?'open':''}" id="depPanel">
      <div class="dep-row">${cells}</div>
      <div class="dep-actions"><button class="dep-more" onclick="depMore()" ${S.depCount>=12?'disabled':''}>+ older month</button>${depAvgNote()}</div>
      <div class="dep-note">For short-term financing, deposits usually matter more than credit. <b>The most recent month usually carries the most weight.</b> Most underwriters want <b>3–4 months</b>; SBA often <b>6–12</b>. <b>Seasonal business?</b> Add more months — a fuller year smooths out the slow stretch and makes a stronger case with underwriters. These are generalizations and requirements vary by lender.</div>
    </div>
  </div>`;
}
function toggleDep(){ S.depOpen=!S.depOpen; save(); const p=document.getElementById('depPanel'), tog=document.querySelector('.dep-toggle'); if(p)p.classList.toggle('open',S.depOpen); if(tog){tog.querySelector('.dep-tg-ico').textContent=S.depOpen?'\u2013':'+'; const ch=tog.querySelector('.fac-chev'); if(ch) ch.style.transform=S.depOpen?'rotate(180deg)':'';} }
function depMore(){ if(S.depCount<12){ S.depCount++; save(); const w=document.querySelector('.dep-wrap'); if(w) w.outerHTML=depositsPanel(); } }
function onDeposit(key,val){
  const n=parseInt(val); if(!val||isNaN(n)||n<=0) delete S.deposits[key]; else S.deposits[key]=n;
  const av=depAvg();
  if(av){ S.rev=av.avg; const rf=document.getElementById('in-rev'); if(rf) rf.value=S.rev; const tag=document.getElementById('tag-rev'); if(tag) tag.innerHTML=tagHTML('rev'); }
  save();
  const togH=document.querySelector('.dep-toggle .dep-tg-h'); if(togH) togH.innerHTML=`bank-statement history${depCountEntered()?` · ${depCountEntered()} entered`:''}`;
  const acts=document.querySelector('.dep-actions');
  if(acts){ let avgEl=acts.querySelector('.dep-avg'); if(av){ const html=`Recency-weighted avg · ${av.n} mo → <b>$${av.avg.toLocaleString()}/mo</b>`; if(avgEl) avgEl.innerHTML=html; else { avgEl=document.createElement('span'); avgEl.className='dep-avg'; avgEl.innerHTML=html; acts.appendChild(avgEl);} } else if(avgEl){ avgEl.remove(); } }
  renderRead(); renderBand();
}

// ════════════════════════════════════════════════════════════
//  ADD UNDERWRITING DETAIL — bottom-left panel (Group C, LEN-155)
//  Optional broker context for tricky files. Two views: all-at-once and
//  one-field-at-a-time "swipe". Values persist in S.uw; they are internal
//  context only — never surfaced in the read, the PDF, or Copy Results.
// ════════════════════════════════════════════════════════════
const UW_ICON={
  card:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  bank:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 2 7 22 7"/></svg>',
  trend:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  file:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  dollar:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  brief:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
};
const UW_FIELDS=[
  { key:'util', cat:'credit', icon:'card', name:'Credit Utilization %', weight:3,
    hint:'If 30%+, this is a talk track: financing can lower utilization — and that’s 30% of the FICO score. Worth knowing before the call.',
    type:'num', suffix:'%', width:110, ph:'e.g. 42',
    source:{title:'How to find credit utilization', body:'Pull the borrower’s credit report summary. Look for “Revolving Credit Utilization” or “Credit Used / Credit Available.” Experian, Equifax, and TransUnion all report it. If the borrower shares a Nav or CreditWise screenshot, it’s usually on the front page. Formula: Total Balances ÷ Total Credit Limits = Utilization %.'} },
  { key:'depcount', cat:'cashflow', icon:'bank', name:'Avg. Deposit Count / Month', weight:2,
    hint:'≤5 deposits/mo → nearly unfundable. 5–15 → pricing worsens. 15+ → underwriting is comfortable. Count unique deposits, not transfers.',
    type:'num', width:110, ph:'e.g. 22',
    source:{title:'How to source deposit count', body:'Pull 2–3 months of bank statements. Count the number of distinct deposit entries per month — not the dollar amount, the transaction count. Wire transfers and ACH receipts count. Payroll reversals and inter-account transfers don’t. Most underwriting runs this itself — knowing it ahead of time frames the conversation.'} },
  { key:'trend', cat:'cashflow', icon:'trend', name:'Most Recent Month Trend', weight:3,
    hint:'If the most recent month is 15%+ below the prior 3-month average, underwriting tightens — sometimes significantly. Always know this before you quote.',
    type:'select', options:['','Up or flat vs. prior avg','Down 1–14%','Down 15%+ (significant)'],
    source:{title:'How to assess the trend', body:'Pull the last 3 months of bank statements. Total deposits for each month. Take the average of months 2 and 3 (the older months). Compare to month 1 (the most recent). If month 1 is 15%+ below that average, flag it. The most recent month is often weighted 2–3× more than older months. A sharp dip — even for a legitimate reason — will affect pricing and approvals.'} },
  { key:'liens', cat:'credit', icon:'file', name:'Liens · Litigation · Bankruptcy', weight:3,
    hint:'Any of these can stop a deal or shift the available products entirely. Ask directly — easier now than at due diligence.',
    type:'select', options:['','None','Active lien(s)','Pending litigation','Prior bankruptcy (discharged)','Active bankruptcy'],
    source:{title:'How to uncover liens and legal issues', body:'Ask the borrower directly: “Before we submit, are there any outstanding liens, judgments, or legal matters on the business or personally?” For verification: search the UCC filing registry for the borrower’s state (most are free online). Tax liens appear on the credit report. Federal cases via PACER. These surface in due diligence — knowing first lets you frame it proactively.'} },
  { key:'nrd', cat:'useoffunds', icon:'dollar', name:'Non-Refundable Deposits (NRDs)', weight:1,
    hint:'NRDs are upfront fees paid before funding. Rare but worth flagging — they reduce effective proceeds and must be disclosed.',
    type:'num', prefix:'$', width:140, ph:'amount if known',
    source:{title:'What NRDs are and how to find them', body:'Non-refundable deposits are fees charged upfront — before the deal funds. Look for language in any LOI or commitment letter referencing “deposit,” “underwriting fee,” or “processing fee” due before funding. If present, disclose to the borrower upfront — failure to do so creates legal and trust risk.'} },
  { key:'biz-hist', cat:'credit', icon:'brief', name:'Prior Business Financing', weight:1,
    hint:'Prior financing history is a positive signal if clean. Stacked positions, defaults, or recent settlements all affect appetite.',
    type:'select', options:['','No prior financing','Prior financing — paid off cleanly','Active position(s) — current','Active position(s) — late','Prior default or settlement'],
    source:{title:'How to assess financing history', body:'Ask the borrower: “Have you had any business financing before — advances, loans, lines of credit?” Pull a DataMerch or SBFE check if available (these track advance history outside the traditional bureaus). For bank products, the credit report shows trade lines. Active positions matter — stacking limits are typically 1–2 positions max.'} },
  { key:'renewal', cat:'useoffunds', icon:'trend', name:'Early-Renewal / Refi Program', weight:1,
    hint:'If the funder offers early renewals or refis for additional capital, flag it — it changes the forward plan (pre-pay now to unlock more, often at better terms).',
    type:'select', options:['','Yes — early renewal / refi available','No / not sure'],
    source:{title:'What an early-renewal program is', body:'Many short-term and revenue-based funders let a borrower “renew” — pay down or pay off the current balance early and take additional capital, often at better terms once a track record is established. Check the agreement (or ask the funder) for “renewal,” “refinance,” or “additional funding” language. If it’s available, the pre-pay math — run it in the Amortization calculator — shows exactly when it pays to renew.'} },
];
function uwIcon(t){ return UW_ICON[t]||''; }
// Category sort (LEN-186): credit / cash flow / use of funds, plus All. Swipe + see-all
// both operate on the FILTERED list via uwVisibleFields() — every length / index read
// routes through it so navigation stays in-bounds.
const UW_CATS=[['all','All'],['credit','Credit'],['cashflow','Cash flow'],['useoffunds','Use of funds']];
function uwVisibleFields(){ return S.uwCat==='all'?UW_FIELDS:UW_FIELDS.filter(f=>f.cat===S.uwCat); }
function uwCountFilled(){ return UW_FIELDS.filter(f=>{ const v=S.uw[f.key]; return v!=null && String(v).trim()!==''; }).length; }
function uwDots(w){
  const tips=['Low weight — useful context but rarely decisive on its own','Medium weight — one of several factors; can tip the balance','High weight — significantly affects approval, pricing, or both'];
  return `<span class="uw-wt"><span class="uw-dots">${[1,2,3].map(i=>`<span class="uw-dot${i<=w?' on':''}"></span>`).join('')}</span><span class="uw-wt-tip">${tips[w-1]||''}</span></span>`;
}
function uwCtrl(f){
  const v=S.uw[f.key]!=null?S.uw[f.key]:'';
  if(f.type==='select'){
    return `<select class="uw-ctrl" style="width:100%" onchange="setUW('${f.key}',this.value)">`
      + f.options.map(o=>`<option value="${ttEsc(o)}" ${String(v)===o?'selected':''}>${o===''?'Select…':ttEsc(o)}</option>`).join('')
      + `</select>`;
  }
  const pre=f.prefix?`<span class="uw-affix">${f.prefix}</span>`:'';
  const suf=f.suffix?`<span class="uw-affix">${f.suffix}</span>`:'';
  return `<span class="uw-num">${pre}<input class="uw-ctrl" type="number" inputmode="numeric" placeholder="${ttEsc(f.ph||'')}" value="${ttEsc(v)}" style="width:${f.width||110}px" oninput="setUW('${f.key}',this.value)">${suf}</span>`;
}
function uwCard(f){
  return `<div class="uw-card">
    <div class="uw-ch"><span class="uw-icon">${uwIcon(f.icon)}</span><span class="uw-name">${f.name}</span>${uwDots(f.weight)}</div>
    <div class="uw-hint">${f.hint}</div>
    ${uwCtrl(f)}
    <div><span class="uw-source" onclick="openUWSource('${f.key}')">How to find this →</span></div>
  </div>`;
}
function uwSwipeCard(f){
  return `<div class="uw-sw-name"><span class="uw-icon">${uwIcon(f.icon)}</span><span class="uw-sw-nm">${f.name}</span>${uwDots(f.weight)}</div>
    <div class="uw-sw-sub">${f.hint}</div>
    <button class="uw-sw-source-btn" onclick="openUWSource('${f.key}')">${I.info}<span>How to find this</span></button>
    <div class="uw-sw-ctrl">${uwCtrl(f)}</div>`;
}
function uwChipRow(){
  return `<div class="uw-cats" id="uwCats">${UW_CATS.map(([k,l])=>`<button class="uw-cat-chip${S.uwCat===k?' on':''}" onclick="changeUWCat('${k}')">${l}</button>`).join('')}</div>`;
}
function uwPanel(){
  const open=S.uwOpen, swipe=S.uwMode==='swipe', n=uwCountFilled();
  const vf=uwVisibleFields(); if(S.uwIdx>=vf.length) S.uwIdx=0;
  const last=S.uwIdx===vf.length-1;
  return `<div class="uw-wrap">
    <div class="uw-hdr">
      <button class="uw-toggle" onclick="toggleUW()">
        <span class="uw-tg-ico">${open?'–':'+'}</span>
        <span class="uw-tg-main"><span class="uw-tg-t">Add underwriting detail</span><span class="uw-tg-h">Optional — for tricky files</span></span>
        ${n?`<span class="uw-count">${n}</span>`:''}
        <span class="fac-chev" style="${open?'transform:rotate(180deg)':''}">${I.dn}</span>
      </button>
      <button class="uw-mode-btn${swipe?' active':''}" id="uwModeBtn" style="${open?'':'display:none'}" onclick="toggleUWMode()">${swipe?'See all':'Swipe'}</button>
    </div>
    <div class="uw-panel ${open?'open':''}" id="uwPanel">
      ${uwChipRow()}
      <div id="uwAll" class="uw-all" style="${swipe?'display:none':''}">${vf.map(uwCard).join('')}</div>
      <div id="uwSwipe" style="${swipe?'':'display:none'}">
        <div class="uw-swipe">
          <div class="uw-sw-pg">
            <span class="uw-sw-count" id="uwSwCount">${vf.length?S.uwIdx+1:0} OF ${vf.length}</span>
            <div class="uw-sw-nav">
              <button id="uwSwBack" onclick="swipeUW(-1)" ${S.uwIdx===0?'disabled':''}>← Back</button>
              <button class="pri" id="uwSwNext" onclick="${last?'toggleUW()':'swipeUW(1)'}">${last?'Done ✓':'Next →'}</button>
            </div>
          </div>
          <div class="uw-sw-body" id="uwSwBody">${vf.length?uwSwipeCard(vf[S.uwIdx]||vf[0]):''}</div>
          <div class="uw-sw-dots" id="uwSwDots">${vf.map((_,i)=>`<span class="uw-sw-dot${i===S.uwIdx?' on':''}" onclick="swipeUWTo(${i})"></span>`).join('')}</div>
        </div>
      </div>
    </div>
  </div>`;
}
function changeUWCat(cat){
  S.uwCat=cat; S.uwIdx=0; save();
  const p=document.getElementById('uwPanel'); if(!p) return;
  // rebuild the panel body in place (keeps the toggle/header + open state)
  const vf=uwVisibleFields(), swipe=S.uwMode==='swipe', last=S.uwIdx===vf.length-1;
  document.querySelectorAll('#uwCats .uw-cat-chip').forEach((b,i)=>b.classList.toggle('on',UW_CATS[i][0]===cat));
  const all=document.getElementById('uwAll'); if(all) all.innerHTML=vf.map(uwCard).join('');
  const cnt=document.getElementById('uwSwCount'); if(cnt) cnt.textContent=`${vf.length?S.uwIdx+1:0} OF ${vf.length}`;
  const back=document.getElementById('uwSwBack'); if(back) back.disabled=true;
  const next=document.getElementById('uwSwNext'); if(next){ next.textContent=last?'Done ✓':'Next →'; next.onclick=last?()=>toggleUW():()=>swipeUW(1); }
  const body=document.getElementById('uwSwBody'); if(body) body.innerHTML=vf.length?uwSwipeCard(vf[0]):'';
  const dots=document.getElementById('uwSwDots'); if(dots) dots.innerHTML=vf.map((_,i)=>`<span class="uw-sw-dot${i===0?' on':''}" onclick="swipeUWTo(${i})"></span>`).join('');
}
function toggleUW(){
  S.uwOpen=!S.uwOpen; save();
  const p=document.getElementById('uwPanel'); if(p) p.classList.toggle('open',S.uwOpen);
  const tog=document.querySelector('.uw-toggle');
  if(tog){ const ic=tog.querySelector('.uw-tg-ico'); if(ic) ic.textContent=S.uwOpen?'–':'+'; const ch=tog.querySelector('.fac-chev'); if(ch) ch.style.transform=S.uwOpen?'rotate(180deg)':''; }
  const mb=document.getElementById('uwModeBtn'); if(mb) mb.style.display=S.uwOpen?'':'none';
}
function toggleUWMode(){
  S.uwMode=S.uwMode==='all'?'swipe':'all'; save();
  const mb=document.getElementById('uwModeBtn'); if(mb){ mb.textContent=S.uwMode==='swipe'?'See all':'Swipe'; mb.classList.toggle('active',S.uwMode==='swipe'); }
  const all=document.getElementById('uwAll'), sw=document.getElementById('uwSwipe');
  if(all) all.style.display=S.uwMode==='all'?'':'none';
  if(sw) sw.style.display=S.uwMode==='swipe'?'':'none';
  if(S.uwMode==='swipe'){ S.uwIdx=0; save(); renderUWSwipe(); }
}
function swipeUW(d){ const n=uwVisibleFields().length; S.uwIdx=Math.max(0,Math.min(n-1,S.uwIdx+d)); save(); renderUWSwipe(); }
function swipeUWTo(i){ const n=uwVisibleFields().length; S.uwIdx=Math.max(0,Math.min(n-1,i)); save(); renderUWSwipe(); }
function renderUWSwipe(){
  const vf=uwVisibleFields(); const f=vf[S.uwIdx]; if(!f) return; const total=vf.length, last=S.uwIdx===total-1;
  const cnt=document.getElementById('uwSwCount'); if(cnt) cnt.textContent=`${S.uwIdx+1} OF ${total}`;
  const back=document.getElementById('uwSwBack'); if(back) back.disabled=S.uwIdx===0;
  const next=document.getElementById('uwSwNext'); if(next){ next.textContent=last?'Done ✓':'Next →'; next.onclick=last?()=>toggleUW():()=>swipeUW(1); }
  const body=document.getElementById('uwSwBody'); if(body) body.innerHTML=uwSwipeCard(f);
  const dots=document.getElementById('uwSwDots'); if(dots) dots.innerHTML=vf.map((_,i)=>`<span class="uw-sw-dot${i===S.uwIdx?' on':''}" onclick="swipeUWTo(${i})"></span>`).join('');
}
function setUW(key,val){
  if(val==null||String(val).trim()==='') delete S.uw[key]; else S.uw[key]=val;
  save();
  // live-update the filled-count badge on the toggle (no rebuild → input keeps focus)
  const tog=document.querySelector('.uw-toggle');
  if(tog){
    const n=uwCountFilled(); let badge=tog.querySelector('.uw-count');
    if(n){ if(!badge){ badge=document.createElement('span'); badge.className='uw-count'; tog.querySelector('.fac-chev').before(badge); } badge.textContent=n; }
    else if(badge){ badge.remove(); }
  }
  // a selected risk factor "slides up" to join the 4 main categories
  refreshUWChips();
}
// Filled UW factors surface as chips beside the borrower profile, sliding up the
// first time the set grows (no animation on subsequent value edits).
function uwChips(){
  const filled=UW_FIELDS.filter(f=>{ const v=S.uw[f.key]; return v!=null && String(v).trim()!==''; });
  if(!filled.length) return '';
  return `<div class="uw-chips"><div class="uw-chips-lbl">Risk factors added</div><div class="uw-chips-row">${filled.map(uwChip).join('')}</div></div>`;
}
function uwChip(f){
  return `<button class="uw-chip" onclick="jumpToUW('${f.key}')" title="Edit this factor"><span class="uw-chip-ico">${uwIcon(f.icon)}</span><span class="uw-chip-l">${uwChipLabel(f)}</span><span class="uw-chip-v">${ttEsc(uwChipVal(f))}</span></button>`;
}
function uwChipLabel(f){ return ({util:'Utilization',depcount:'Deposits/mo',trend:'Trend',liens:'Liens / legal',nrd:'NRDs','biz-hist':'Prior financing'})[f.key]||f.name; }
function uwChipVal(f){
  let v=String(S.uw[f.key]);
  if(f.type==='num'){ const n=Number(v); if(!isNaN(n)){ v=(f.prefix==='$'?'$'+n.toLocaleString():String(n))+(f.suffix||''); } }
  else if(v.length>24){ v=v.slice(0,22)+'…'; }
  return v;
}
function refreshUWChips(){
  const host=document.getElementById('uwChipsHost'); if(!host) return;
  const had=!!host.querySelector('.uw-chips');
  host.innerHTML=uwChips();
  const blk=host.querySelector('.uw-chips');
  if(blk && !had) blk.classList.add('uw-anim'); // animate only when newly appearing
}
function jumpToUW(key){
  if(!S.uwOpen) toggleUW();
  if(S.uwMode==='swipe'){ const i=UW_FIELDS.findIndex(x=>x.key===key); if(i>=0){ S.uwIdx=i; save(); renderUWSwipe(); } }
  const el=document.querySelector('.uw-wrap'); if(el){ try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
}

// ── First-use intro: what this tool gives you (over the talk box) ─────
// Shows once the read is active and the user has entered a factor. Gated to
// first use, and re-shows if it hasn't been seen in ~30 days.
// Eligible once the read is active and a factor is entered; gated to first use,
// re-shows if not seen in ~30 days. Rendered into the template so it survives the
// per-keystroke re-render; animates only on the render where it first appears.
function introEligible(){
  if(!S.selected) return false;
  const cnt=(S.fico!=null?1:0)+(S.tib!=null?1:0)+(S.rev!=null?1:0);
  if(cnt<1) return false;
  try{ const ts=parseInt(localStorage.getItem('lp_dr_intro')||'0',10); if(ts && (Date.now()-ts)<30*86400000) return false; }catch(e){}
  return true;
}
function introMarkup(anim){
  return `<div class="intro-pop${anim?' intro-anim':''}">
    <button class="intro-x" onclick="dismissIntro()" aria-label="Dismiss">×</button>
    <div class="intro-h">${I.lift}<span>What you’ll get</span></div>
    <div class="intro-b">The file’s strengths and limits — plus a talk track to walk the borrower through it.</div>
  </div>`;
}
function dismissIntro(){ S._introState='dismissed'; const p=document.querySelector('#read .intro-pop'); if(p) p.remove(); }

// ── File read: 1 strength + 2 limits (set expectations w/ silver linings) ──
function fileAssessment(d){
  if(!d.code) return null;
  const e=NAICS_DB.find(n=>n.c===d.code);
  const indName=e?e.d.replace(/\s*\(.*?\)\s*/g,' ').trim():'This industry';
  const items=[];
  items.push({cat:'industry', tone:d.tier||'g',
    up:`<b>${indName}</b> is a fundable category — it sets the product stack you can work with.`,
    down: d.tier==='n'?`<b>${indName}</b> is commonly restricted — confirm the exact NAICS before relying on this read.`:`<b>${indName}</b> draws extra underwriting scrutiny — expect a narrower set of options.`});
  if(d.fico!=null){ const b=factorRead('fico',d.fico); if(b) items.push({cat:'credit', tone:b.tone,
    up:`Credit (<b>${d.fico}</b>) is a strength to lead with — it anchors pricing and keeps better programs open.`,
    down:`Credit (<b>${d.fico}</b>) is the heaviest factor on this file — it lifts the rate and holds the lowest-cost programs back for now.`}); }
  if(d.tib!=null){ const b=factorRead('tib',d.tib); if(b) items.push({cat:'tib', tone:b.tone,
    up:`<b>${d.tib} months</b> in business is real history to point to — it supports the term you quote.`,
    down:`<b>${d.tib} months</b> in business is short — it caps the term and keeps bank &amp; SBA options out for now.`}); }
  if(d.rev!=null){ const b=factorRead('rev',d.rev); if(b) items.push({cat:'revenue', tone:b.tone,
    up:`<b>$${d.rev.toLocaleString()}/mo</b> in deposits is the engine — it sizes the amount you can offer.`,
    down:`Revenue (<b>$${d.rev.toLocaleString()}/mo</b>) caps the amount — size conservatively until deposits grow.`}); }
  const rank={g:0,w:1,r:2,n:3};
  const positive=items.slice().sort((a,b)=>rank[a.tone]-rank[b.tone])[0];
  let negatives=items.filter(x=>x!==positive).sort((a,b)=>rank[b.tone]-rank[a.tone]);
  // Credit is the top item when it's a limiting factor (Steve, LEN-186).
  const ci=negatives.findIndex(n=>n.cat==='credit'); if(ci>0){ const [c]=negatives.splice(ci,1); negatives.unshift(c); }
  negatives=negatives.slice(0,2);
  return {positive, negatives, count:items.length};
}
// Two icons per row (LEN-186): a category emoji + a status arrow. Order is
// negatives first (credit on top), then one positive.
const FR_CAT_EMOJI={industry:'🏭', credit:'💳', tib:'📅', revenue:'📈'};
function frRow(cat, dir, text){
  const emoji=FR_CAT_EMOJI[cat]||'';
  const ico = dir==='up'?I.lift : dir==='q'?I.qmark : I.arrowDn;
  const cls = dir==='up'?'pos' : dir==='q'?'clarify' : 'neg';
  return `<div class="fr-row ${cls}"><span class="fr-cat">${emoji}</span><span class="fr-ico">${ico}</span><span>${text}</span></div>`;
}
function fileReadHTML(d){
  if(!d.code) return '';
  const a=fileAssessment(d); if(!a) return '';
  const rows=[];
  a.negatives.forEach(n=>{ const dir=(n.cat==='industry'&&d.tier==='n')?'q':'down'; rows.push(frRow(n.cat,dir,n.down)); });
  if(a.positive) rows.push(frRow(a.positive.cat,'up',a.positive.up));
  let thin='';
  if(a.count<3){
    const missing=[]; if(d.fico==null)missing.push('FICO'); if(d.tib==null)missing.push('time in business'); if(d.rev==null)missing.push('monthly revenue');
    if(missing.length) thin=`<div class="fr-thin">${I.qmark}<span>Add ${missing.join(' &amp; ')} and I can sharpen this.</span></div>`;
  }
  return `<div class="file-read"><div class="fr-eyebrow eyebrow">The file at a glance</div><div class="fr-rows">${rows.join('')}</div>${thin}</div>`;
}
// Underwriter mode is not built yet — clicking the toggle shows a "coming soon"
// note and never switches mode (LEN-155, Steve).
function underwriterSoon(btn){
  let pop=document.getElementById('uwSoonPop');
  if(!pop){ pop=document.createElement('div'); pop.id='uwSoonPop'; pop.className='soon-pop'; pop.textContent='Coming soon'; document.body.appendChild(pop); }
  try{ const r=btn.getBoundingClientRect(); pop.style.top=(r.bottom+9)+'px'; pop.style.left=(r.left+r.width/2)+'px'; }catch(e){}
  pop.classList.add('show');
  clearTimeout(window._soonT); window._soonT=setTimeout(()=>{ pop.classList.remove('show'); },1700);
}
function openUWSource(key){
  const f=UW_FIELDS.find(x=>x.key===key); if(!f) return;
  S.modal='uwsrc';
  const wrap=document.getElementById('leverModal'); if(!wrap) return;
  wrap.innerHTML=`<div class="lm-backdrop" onclick="closeLever()"></div>
    <div class="lm-card" role="dialog" aria-modal="true">
      <button class="lm-x" onclick="closeLever()" aria-label="Close">×</button>
      <div class="lm-title">${ttEsc(f.source.title)}</div>
      <div class="uw-src-body">${ttEsc(f.source.body)}</div>
    </div>`;
  wrap.classList.add('open'); document.body.style.overflow='hidden';
}

// ════════════════════════════════════════════════════════════
//  RENDER — read column (combined)
// ════════════════════════════════════════════════════════════
let _prevProxy={};
function renderRead(){
  const el=document.getElementById('read');
  if(!S.selected){ el.innerHTML=readEmpty(); return; }
  const d=currentDeal(); const lv=leversForProduct(d, selProdLabel(d));
  let introNew=false;
  if(S._introState==null && introEligible()){ S._introState='show'; introNew=true; try{ localStorage.setItem('lp_dr_intro', String(Date.now())); }catch(e){} }
  const introMk = S._introState==='show' ? introMarkup(introNew) : '';

  el.innerHTML =
    catchAllBanner(d) +
    `<div class="read-eyebrow eyebrow">Indicative offer</div>
     ${offerBox(d,lv)}
     ${aprBlockHTML(d, lv)}
     ${introMk}
     ${talkTrackHTML(d)}
     <div class="read-acts">
       <button class="btn btn-primary" id="copyResultsBtn" onclick="copyResults()">${I.copy}<span>Copy results</span></button>
       <button class="btn btn-ghost" onclick="openPdf()">${I.pdf}<span>Save PDF</span></button>
     </div>
     ${relatedTools(d, lv)}
     ${aprToggleHTML(lv)}
     ${DISCLAIMER_FOOT}`;

  ttBind(d);
  refreshFundingRange();
}
function qchip(lever, label, val){
  const sm = String(val).length>12 ? ' sm':'';
  return `<button class="qchip" onclick="openLever('${lever}')"><span class="qc-l">${label}</span><span class="qc-v${sm}">${ttEsc(val)}<span class="qc-go">${I.dn}</span></span></button>`;
}

// ── cross-tool handoffs ──────────────────────────────────────
// Midpoint of the modeled amount band (falls back to the rep's requested amount).
function handoffAmount(d, lv){
  if(lv && lv.atr && lv.atr.amount) return Math.round((lv.atr.amount.lo+lv.atr.amount.hi)/2);
  return S.reqAmt || null;
}
function handoffFactor(lv){
  if(lv && lv.atr && lv.atr.rate && lv.atr.rate.kind==='factor') return ((lv.atr.rate.lo+lv.atr.rate.hi)/2).toFixed(2);
  return null;
}
function handoffTerm(lv){
  if(lv && lv.atr && lv.atr.term) return Math.round((lv.atr.term.lo+lv.atr.term.hi)/2);
  return null;
}
// Fundability calculator — stacking risk + net funding requirement. Real-file path
// (not the /tools/ slug) so query params survive the SPA's 404 fallback. Param names
// map to Fundability's field ids (funding_amt / monthly_rev / factor / term_val / term_unit).
function fundabilityHref(d, lv){
  const p=new URLSearchParams();
  const amt=handoffAmount(d,lv); if(amt) p.set('funding_amt', amt);
  if(S.rev) p.set('monthly_rev', S.rev);
  const f=handoffFactor(lv); if(f) p.set('factor', f);
  const tv=handoffTerm(lv); if(tv){ p.set('term_val', tv); p.set('term_unit','months'); }
  p.set('src','deal-read');
  return '/calculators/FundabilityCalculator.html?'+p.toString();
}
// Standalone Payment Fit calc (LEN-125, calculators/AffordabilityCalculator.html,
// slug /tools/affordability). Param names map to its hydrateFromParams() reader:
// deposits / payback (+paybackMode) / payment / freq / term / state / deal. Real-file
// path so params survive the SPA 404 fallback.
function affordabilityHref(d, lv){
  const p=new URLSearchParams();
  const a=(lv && lv.atr)?affordability(d, lv.atr):null;
  if(S.rev) p.set('deposits', S.rev);
  if(a){
    if(a.paybackTotal){ p.set('payback', a.paybackTotal); p.set('paybackMode','entered'); }
    if(a.perPayment!=null) p.set('payment', Math.round(a.perPayment));
    p.set('freq', a.perLabel==='/day'?'daily':a.perLabel==='/wk'?'weekly':'monthly');
    if(a.termM) p.set('term', Math.round(a.termM));
  } else { const tv=handoffTerm(lv); if(tv) p.set('term', tv); }
  if(S.state==='CA'||S.state==='NY') p.set('state', S.state);
  const e=(d && d.code)?NAICS_DB.find(n=>n.c===d.code):null;
  if(e && e.d) p.set('deal', e.d);
  p.set('src','deal-read');
  return '/calculators/AffordabilityCalculator.html?'+p.toString();
}
function relatedTools(d, lv){
  if(!lv) return '';
  const open=S.affOpen;
  return `<div class="rel-tools" style="display:flex;flex-wrap:wrap;gap:9px;margin-top:14px">`
    + `<a class="offer-compare" href="${fundabilityHref(d,lv)}" target="_top" style="margin-top:0;text-decoration:none">${I.lift}<span>Check stacking &amp; net requirement</span></a>`
    + cashFlowControl(d,lv)
    + `</div>`
    + `<div class="cf-detail${open?' open':''}" id="affPanel">${affBody(d,lv)}</div>`;
}

// ── the offer box (light green, mirrors the affordability card) ──
function offerHeadline(d, lv){
  if(d.tier==='n') return {tone:'r', text:`This industry is commonly restricted. Confirm the exact NAICS first — a neighboring code can change the picture.`};
  if(!lv) return {tone:'x', text:`Add monthly revenue and the offer sizes itself — amount, term, rate, and payment.`};
  if(S.reqProduct){
    const g=gapForLever(d,lv,'product');
    if(g && g.status==='diff') return {tone:'w', text:`The business asked about ${REQ_LABEL[S.reqProduct]||'another option'}. On today's file, ${prodDisplay(lv.product)} looks like the strongest path to funding — here's how that offer shapes up.`};
  }
  const cons=collectConstraints(d);
  if(cons.length){
    const c=cons[0]; const v=d[c.kind]; const tone=(factorRead(c.kind,v)||{}).tone||'w';
    const txt={
      fico:`Credit is the heaviest factor on this file — a ${v} score lifts the rate and keeps the lowest-cost loans out of reach for now.`,
      tib:`Time in business is the main limit — ${v} month${v===1?'':'s'} caps how long the term can run and keeps banks on the sidelines for now.`,
      rev:`Revenue is the main limit right now — it sets the ceiling on the amount.`,
    }[c.kind];
    return {tone, text:txt||`This is the main thing shaping the offer right now.`};
  }
  return {tone:'g', text:`This file reads strong — it lines up well with the better options on the table.`};
}
const PROD_REQS={sba:{fico:660,tib:24,rev:15000},term:{fico:600,tib:12,rev:15000},loc:{fico:640,tib:12,rev:20000},equip:{fico:600,tib:6,rev:10000},mca:{fico:500,tib:3,rev:10000},rbf:{fico:500,tib:3,rev:10000},factor:{fico:0,tib:0,rev:0},cre:{fico:640,tib:12,rev:0},bridge:{fico:600,tib:6,rev:0}};
// Hard minimums above; recommended thresholds for cautionary notes
const PROD_RECOMMENDED={sba:{fico:680,note:'680+ recommended — scores can shift during underwriting'}};
// Neutral, standardized qualification ladder (LEN-186). One config so labels +
// colors live in a single place. dot = status-dot hex, color = label text color.
const QUALIFY_LADDER={
  likely:   {word:'Likely',                  dot:'#1f9d57', color:'#1f7a4d'},
  possible: {word:'Possible',                dot:'#e0a400', color:'#a9750f'},
  unlikely: {word:'Unlikely',                dot:'#e07b39', color:'#b5611f'},
  vunlikely:{word:'Very unlikely',           dot:'#d2524f', color:'#c0413e'},
  buildup:  {word:'Not yet — build up to it', dot:'#d2524f', color:'#c0413e'},
};
function qualifyRung(key, caution){ const r=QUALIFY_LADDER[key]||QUALIFY_LADDER.possible; return {word:r.word, dotColor:r.dot, statusColor:r.color, rung:key, caution:caution||null}; }
// Equipment & invoice factoring aren't credit-gated — when they'd read Likely/Possible
// the honest label is "Depends on use" (on buying equipment / having receivables). The
// rung (and its color) stays so the page still surfaces; only the word changes (LEN-186).
function applyUseOverride(fam, res){
  if((fam==='equip'||fam==='factor') && (res.rung==='likely'||res.rung==='possible')) res.word='Depends on use';
  return res;
}
// Verdict driven by the WORST limiting factor (not the average) — the file reads as
// risky as its hardest constraint, matching "credit is the heaviest factor." Each
// factor scores 0 (comfortable) → 0.08 (meets the hard floor but below the
// recommended/"comfortable" bar) → 0.18+ (below the hard floor, scaled by depth).
// SBA uses its RECOMMENDED 680 as the comfortable bar, so 655 reads risky (Unlikely),
// 670 reads Possible, and 680+ reads Likely. Missing data caps at Possible.
function productQualify(label, d){
  const fam=prodFamily(label); const req=PROD_REQS[fam]||{fico:0,tib:0,rev:0};
  const rec=PROD_RECOMMENDED[fam]||null;
  const caution=rec&&d.fico!=null&&d.fico>=req.fico&&d.fico<rec.fico?rec.note:null;
  const reqd=[['fico',d.fico],['tib',d.tib],['rev',d.rev]].filter(([k])=>req[k]>0);
  if(!reqd.length) return applyUseOverride(fam, qualifyRung('likely', caution));   // no hard reqs (e.g. factoring)
  const known=reqd.filter(([,v])=>v!=null);
  if(!known.length) return applyUseOverride(fam, qualifyRung('possible', null));   // nothing entered yet — neutral
  let worst=0;
  known.forEach(([k,v])=>{
    const floor=req[k];
    const comf=(k==='fico'&&rec)?rec.fico:floor;                   // SBA fico: 680 is the "likely" line
    let s;
    if(v>=comf)       s=0;                                         // comfortable
    else if(v>=floor) s=0.08;                                      // meets hard floor, below comfortable
    else              s=0.18+Math.min(0.42,(floor-v)/floor*2);     // below hard floor → scaled by depth
    if(s>worst) worst=s;
  });
  const unknown=reqd.length-known.length;
  let rung;
  if(worst===0)        rung = unknown ? 'possible' : 'likely';
  else if(worst<=0.10) rung='possible';
  else if(worst<=0.25) rung='unlikely';
  else if(worst<=0.45) rung='vunlikely';
  else                 rung='buildup';
  return applyUseOverride(fam, qualifyRung(rung, (rung==='likely'||rung==='possible')?caution:null));
}
function offTile(lever,label,val){
  return `<button class="off-tile" onclick="openLever('${lever}')"><div class="ot-top"><span class="ot-l">${label}</span></div><span class="ot-v">${ttEsc(val)}</span></button>`;
}
// Funding Range — lives under "Add underwriting detail" (LEN-186). Shows only when
// relevant: 2+ months of deposit history AND a computed amount band. Otherwise renders
// nothing (no up-front "locked" placeholder — Steve found that confusing).
function amountTile(d, lv){
  const months=d.depMonths||0;
  if(months<2 || !lv || !lv.amount) return '';
  const open=S.amtOpen;
  const tighten = months>=6 ? `<b>6+ months</b> in — this is the tightest read.` : months>=3 ? `Add <b>6+ months</b> to tighten it further.` : `Add a 3rd month to tighten this range.`;
  const detail=`Indicative range${d.rev?` · sized on <b>$${d.rev.toLocaleString()}/mo</b> in deposits`:''}. ${tighten} An estimate, not an offer.`;
  return `<div class="off-tile amount-tile${open?' open':''}" id="amountTile">
    <div class="ot-top"><span class="ot-l">Funding range</span>
      <button class="ot-toggle" onclick="event.stopPropagation();toggleAmt()">${open?'Less':'Details'}<span class="tg-go">${I.dn}</span></button></div>
    <button class="ot-v-btn" onclick="openLever('amount')"><span class="ot-v">${ttEsc(lv.amount)}</span></button>
    ${reqMismatchLine(d,lv,'amount')}
    <div class="amt-detail">${detail}</div>
  </div>`;
}
// Funding range now renders in the LEFT input column, beneath "Add underwriting
// detail" — a stable host (#fundingRangeHost) refreshed from renderRead() so it tracks
// deposit changes even though it lives outside the #read column.
function fundingRangeBlock(){
  if(!S.selected) return '';
  const d=currentDeal(); const lv=leversForProduct(d, selProdLabel(d));
  return amountTile(d, lv);
}
function refreshFundingRange(){ const h=document.getElementById('fundingRangeHost'); if(h) h.innerHTML=fundingRangeBlock(); }
// Passive requested-vs-modeled signal on a tile face. No color — information, not warning.
function reqMismatchLine(d, lv, lever){
  if(!lv||!lv.atr) return '';
  if(lever==='amount'){
    const a=lv.atr.amount; if(!a||!S.reqAmt) return '';
    if(S.reqAmt>a.hi||S.reqAmt<a.lo){ const dir=S.reqAmt>a.hi?'\u2193':'\u2191'; return `<div class="tile-req">${dir} Requested ${fmtMoney(S.reqAmt)}</div>`; }
    return '';
  }
  if(lever==='term'){
    const t=lv.atr.term; if(!t||!S.expTerm) return '';
    if(S.expTerm>t.hi||S.expTerm<t.lo){ const dir=S.expTerm>t.hi?'\u2193':'\u2191'; return `<div class="tile-req">${dir} Requested ${S.expTerm} mo</div>`; }
    return '';
  }
  return '';
}
function termTile(d, lv){
  return `<button class="off-tile" onclick="openLever('term')"><div class="ot-top"><span class="ot-l">Term</span></div><span class="ot-v">${ttEsc(lv.term)}</span>${reqMismatchLine(d,lv,'term')}</button>`;
}
function toggleAmt(){ S.amtOpen=!S.amtOpen; save(); const t=document.getElementById('amountTile'); if(t){ t.classList.toggle('open',S.amtOpen); const b=t.querySelector('.ot-toggle'); if(b) b.innerHTML=(S.amtOpen?'Less':'Details')+`<span class="tg-go">${I.dn}</span>`; } }
// Rate — cents-on-the-dollar by default, toggle to APR
function rateCents(atr){
  const r=atr.rate;
  if(r.kind==='factor') return {lo:Math.round((r.lo-1)*100), hi:Math.round((r.hi-1)*100)};
  if(r.kind==='apr'){
    const perDollar=(apr,term)=>{ const m=apr/100/12; const pay=m>0?m/(1-Math.pow(1+m,-term)):1/term; return pay*term-1; };
    return {lo:Math.round(perDollar(r.lo, atr.term.lo)*100), hi:Math.round(perDollar(r.hi, atr.term.hi)*100)};
  }
  if(r.kind==='fee') return {lo:Math.round(r.lo*atr.term.lo), hi:Math.round(r.hi*atr.term.hi)};
  return null;
}
function effectiveRateMode(atr){ if(S.rateMode==='cents'||S.rateMode==='apr') return S.rateMode; return (atr&&atr.rate.kind==='apr')?'apr':'cents'; }
function rateValueText(atr, mode){
  if(mode==='apr'){
    if(atr.rate.kind==='apr') return `${atr.rate.lo}–${atr.rate.hi}%`;
    const a=approxAPR(atr); if(a) return `~${a.rep}%`;
    return atrRateText(atr.rate);
  }
  const c=rateCents(atr); if(!c) return atrRateText(atr.rate);
  return c.lo===c.hi?`${c.hi}¢`:`${c.lo}–${c.hi}¢`;
}
function rateCaption(atr, mode){
  if(mode==='cents') return 'cost per $1 borrowed';
  return 'annualized'+(atr.rate.kind!=='apr'?' · approx*':'');
}
function rateTile(d, lv){
  const atr=lv.atr; const factorKind=atr.rate.kind==='factor';
  const c=rateCents(atr);
  const centsTxt = c ? (c.lo===c.hi?`${c.hi}¢`:`${c.lo}–${c.hi}¢`) : atrRateText(atr.rate);
  const apr=approxAPR(atr);
  const aprTxt = apr ? (apr.lo===apr.hi?`${apr.rep}%`:`${apr.lo}–${apr.hi}%`) : null;
  const stateOn = (S.state==='CA'||S.state==='NY');
  const aprPill = stateOn ? `<span class="rate-apr-pill">APR disclosure applies</span>` : '';
  let primary, subs='';
  if(factorKind){
    primary=centsTxt;
    const lo=atr.rate.lo.toFixed(2), hi=atr.rate.hi.toFixed(2);
    subs += `<div class="rate-sub">${lo===hi?lo:lo+'–'+hi}x</div>`;
    if(aprTxt) subs += `<div class="rate-sub rate-apr">APR ${aprTxt}${apr&&!apr.exact?'*':''}${aprPill}</div>`;
  } else {
    primary = aprTxt || centsTxt;
    if(c) subs += `<div class="rate-sub">${centsTxt} per $1</div>`;
    if(aprTxt && stateOn) subs += `<div class="rate-sub rate-apr">${aprPill}</div>`;
  }
  return `<div class="off-tile rate-tile" id="rateTile">
    <div class="ot-top"><span class="ot-l">Rate</span></div>
    <button class="ot-v-btn" onclick="openLever('rate')"><span class="ot-v">${ttEsc(primary)}</span></button>
    ${subs}
  </div>`;
}
function toggleRate(){ const d=currentDeal(), lv=currentLevers(); const cur=lv?effectiveRateMode(lv.atr):'cents'; S.rateMode=(cur==='apr')?'cents':'apr'; save(); const t=document.getElementById('rateTile'); if(t&&lv) t.outerHTML=rateTile(d,lv); }
// LOC vs RBF/MCA cost comparison (illustrative, with tunable APR + gates)
function cmpGates(){ return (Array.isArray(S.cmpGates)&&S.cmpGates.length)?S.cmpGates:[3,6,12]; }
function cmpLocApr(){ return S.cmpLocApr!=null?S.cmpLocApr:ATR_RATE.loc.hi; }
function cmpModel(d, lv){
  if(!lv||!lv.atr||!lv.atr.amount) return null;
  const fam=prodFamily(selProdLabel(d));
  if(fam!=='mca'&&fam!=='rbf') return null;
  const amt=Math.round((lv.atr.amount.lo+lv.atr.amount.hi)/2);
  const fMid=(lv.atr.rate.lo+lv.atr.rate.hi)/2;
  const fixed=Math.round(amt*(fMid-1));
  const apr=cmpLocApr();
  const loc=(m)=>Math.round(amt*(apr/100/12)*m);
  return {amt,fixed,apr,loc,lead:prodDisplay(selProdLabel(d))};
}
function cmpTableMarkup(m){
  const gates=cmpGates();
  const cell=(v,fixedCol)=>{ const win=fixedCol?(m.fixed<=v):(v<m.fixed); return `<div class="cv ${fixedCol?'fixed':''}${win?' win':''}">${fmtUSD(v)}</div>`; };
  return `<div class="cmp-tbl" id="cmpTbl" style="grid-template-columns:1.3fr repeat(${gates.length},1fr)">
      <div class="ch lead">Cost of capital</div>${gates.map(g=>`<div class="ch">held ~${g} mo</div>`).join('')}
      <div class="rl">${m.lead}<div class="ot-cap" style="margin:0">fixed up front</div></div>${gates.map(()=>cell(m.fixed,true)).join('')}
      <div class="rl">Line of credit<div class="ot-cap" style="margin:0">~${m.apr}% APR · accrues</div></div>${gates.map(g=>cell(m.loc(g),false)).join('')}
    </div>`;
}
function costCompareHTML(d, lv){
  const m=cmpModel(d,lv); if(!m) return null;
  const gates=cmpGates();
  const gateChips=gates.map((g,i)=>`<span class="cmp-gate"><input type="number" value="${g}" oninput="setCmpGate(${i},this.value)" aria-label="months">mo${gates.length>1?`<button onclick="removeCmpGate(${i})" title="Remove">×</button>`:''}</span>`).join('');
  return `<div class="cmp" id="cmpWrap">
    <div class="cmp-intro">A <b>line of credit</b> charges interest only while the balance is out — cheap if it's paid back fast, but the cost climbs the longer it's carried. <b>${m.lead}</b>'s cost is set up front and doesn't grow, so for funds held a while it can land lower. Set the assumptions to the real competing offer.</div>
    <div class="cmp-controls">
      <label class="cmp-ctl">LOC APR<span class="cmp-in"><input type="number" value="${m.apr}" oninput="setCmpApr(this.value)" aria-label="line of credit APR">%</span></label>
      <div class="cmp-ctl gates">Held for<span class="cmp-gates">${gateChips}${gates.length<5?`<button class="cmp-add" onclick="addCmpGate()">+</button>`:''}</span></div>
    </div>
    ${cmpTableMarkup(m)}
    <div class="cmp-note"><b>Illustrative only</b>, on a ${fmtUSD(m.amt)} balance — a simple-interest estimate for a line of credit carried at full balance. A real line for this profile may price higher or carry draw/maintenance fees; set the APR to the actual competing offer. Cost depends on repayment speed, the final rate, and underwriting. Not an offer.</div>
  </div>`;
}
function cmpUpdateTable(){ const m=cmpModel(currentDeal(),currentLevers()); if(!m)return; const t=document.getElementById('cmpTbl'); if(t){ const tmp=document.createElement('div'); tmp.innerHTML=cmpTableMarkup(m); t.replaceWith(tmp.firstElementChild); } }
function cmpRebuild(){ const w=document.getElementById('cmpWrap'); if(!w)return; const tmp=document.createElement('div'); tmp.innerHTML=costCompareHTML(currentDeal(),currentLevers()); if(tmp.firstElementChild) w.replaceWith(tmp.firstElementChild); }
function setCmpApr(v){ const n=parseFloat(v); S.cmpLocApr=isNaN(n)?null:Math.max(0,Math.min(200,n)); save(); cmpUpdateTable(); }
function setCmpGate(i,v){ const n=parseInt(v); const g=cmpGates().slice(); if(!isNaN(n)&&n>0&&n<=120) g[i]=n; S.cmpGates=g; save(); cmpUpdateTable(); }
function addCmpGate(){ const g=cmpGates().slice(); if(g.length>=5) return; g.push((g[g.length-1]||6)+6); S.cmpGates=g; save(); cmpRebuild(); }
function removeCmpGate(i){ const g=cmpGates().slice(); if(g.length<=1) return; g.splice(i,1); S.cmpGates=g; save(); cmpRebuild(); }
function compareBtn(d, lv){
  if(!cmpModel(d,lv)) return '';
  return `<button class="offer-compare" onclick="openLever('product','compare')">${I.lift}<span>Compare ${prodDisplay(selProdLabel(d))} vs a line of credit</span></button>`;
}
function offerBox(d, lv){
  const h=offerHeadline(d,lv);
  const head=h?`<div class="offer-head"><span class="oh-txt">${h.text}</span></div>`:'';
  let grid='';
  if(lv){
    // Term / Rate / Payment tiles removed (LEN-155). Funding range moved out of the
    // offer box entirely (LEN-186) — it now lives under "Add underwriting detail" and
    // only appears once there are 2+ months of deposits. The read leads with the
    // product stack; pricing lives in the CA/NY APR block, factor tags, and the
    // (opt-in) cost comparison.
    grid=`${prodKeynote(d)}
    ${compareBtn(d,lv)}`;
  } else if((d.prods||[]).length){
    grid=prodKeynote(d);
  }
  return `<div class="offer-box">${head}${grid}</div>`;
}
function prodTile(d){
  const list=d.prods||[]; if(!(S.prodIdx>=0)||S.prodIdx>=list.length) S.prodIdx=0;
  const cur=list.length?list[S.prodIdx][0]:null;
  const label=cur?prodDisplay(cur):'—';
  const multi=list.length>1;
  const q=productQualify(cur||'', d);
  const lead=S.prodIdx===0;
  return `<div class="off-tile prod-tile">
    <div class="ot-top"><span class="ot-l">Product</span>${multi?`<span class="prod-cyc"><button onclick="cycleProd(-1)" aria-label="Previous product">${I.up}</button><button onclick="cycleProd(1)" aria-label="Next product">${I.dn}</button></span>`:''}</div>
    <button class="ot-v-btn" onclick="openLever('product')"><span class="ot-v" id="prodVal">${ttEsc(label)}</span></button>
    <span class="prod-q" id="prodQ"><span class="pq-dot" style="background:${q.dotColor}"></span>${q.word}</span>
  </div>`;
}
// ── Product keynote — hero replaces the 4-panel top ──────────
// Fixed DISPLAY order (LEN-186): Short-Term → LOC → Term → SBA → anything else.
// This is purely how tiles are laid out — it is decoupled from best-fit. The
// talk track, levers, and pricing still read the unsorted prods[0]. No lead pick.
const PROD_DISPLAY_PRIORITY={mca:0, rbf:0, loc:1, term:2, sba:3};
function displayOrderedProds(list){
  return (list||[]).map((p,i)=>({p,i}))
    .sort((a,b)=>{ const pa=PROD_DISPLAY_PRIORITY[prodFamily(a.p[0])]??99, pb=PROD_DISPLAY_PRIORITY[prodFamily(b.p[0])]??99; return (pa-pb)||(a.i-b.i); })
    .map(x=>x.p);
}
function prodKeynote(d){
  const list=displayOrderedProds(d.prods); if(!list.length) return '';
  const cards=list.map((p)=>{
    const label=p[0]; const q=productQualify(label,d); const display=prodDisplay(label);
    const sub=prodSubline(label);
    return `<button class="kn-card" onclick="openLever('product')">
      <div class="kn-name">${ttEsc(display)}</div>
      ${sub?`<div class="kn-sub">${sub}</div>`:''}
      <div class="kn-status"><span class="kn-dot" style="background:${q.dotColor}"></span><span class="kn-word" style="color:${q.statusColor}">${q.word}</span></div>
      ${q.caution?`<div class="kn-caution">${I.warn}<span>${q.caution}</span></div>`:''}
    </button>`;
  }).join('');
  const hint=`<div class="kn-hint">${I.info}<span>Tap any tile to see what it means &amp; how to explain it</span></div>`;
  return `<div class="kn-wrap"><div class="kn-eyebrow eyebrow">Eligible products</div><div class="kn-row">${cards}${hint}</div></div>`;
}
// Quiet subline under the surface label. "Short-Term Financing" carries the
// broker shorthand so the umbrella stays legible.
function prodSubline(label){ const fam=prodFamily(label); return (fam==='mca'||fam==='rbf')?'typically MCA / RBF':''; }
// Structural split, shown on demand in the product modal (LEN-162).
function stfStructureHTML(){
  return `<div class="stf-split">
    <p class="stf-lead"><b>“Short-Term Financing”</b> is the simple umbrella — under it sit two legally distinct structures. Know which one the borrower is actually signing.</p>
    <div class="stf-opt">
      <div class="stf-h">Revenue-Based Financing <span class="stf-tag">MCA</span></div>
      <div class="stf-b">A <b>Receivables Purchase Agreement</b> — the funder buys a slice of future sales, so repayment flexes as a percentage of revenue with no fixed end date. Backed by a <b>performance guarantee</b>, not a personal one.</div>
    </div>
    <div class="stf-opt">
      <div class="stf-h">Short-Term Loan <span class="stf-tag">BLA</span></div>
      <div class="stf-b">A <b>Business Loan Agreement</b> with a <b>personal guarantee</b> — fixed daily/weekly payments and a fixed term. Higher bar, often <b>625–640+ FICO</b> (lenders like OnDeck, Credibly).</div>
    </div>
    <div class="stf-rule">${I.info}<span>Client-facing, always call the MCA structure <b>“Revenue-Based Financing”</b> — never “MCA.” A short-term loan on a BLA is <b>never</b> “RBF.”</span></div>
  </div>`;
}
function renderProdTile(d){
  const list=d.prods||[]; const idx=S.prodIdx||0; const cur=list.length?list[idx][0]:null;
  const label=cur?prodDisplay(cur):'—'; const q=productQualify(cur||'',d);
  const pv=document.getElementById('prodVal'); if(pv){ pv.textContent=label; pv.className='ot-v'; }
  const pq=document.getElementById('prodQ'); if(pq) pq.innerHTML=`<span class="pq-dot" style="background:${q.dotColor}"></span>${q.word}`;
}
function cycleProd(dir){ const d=currentDeal(); const n=(d.prods||[]).length; if(n<2) return; S.prodIdx=((S.prodIdx||0)+dir+n)%n; save(); renderRead(); }
function applyDeltas(lv){
  if(S.tweaks.deltas!=='on'){ _prevProxy = lv?{amount:lv.amountProxy,termProxy:lv.termProxy,rateProxy:lv.rateProxy}:{}; return; }
  document.querySelectorAll('.lever-cell').forEach(cell=>{
    const key=cell.dataset.proxy, dir=cell.dataset.dir, cur=parseFloat(cell.dataset.proxyval);
    if(!key||!dir||isNaN(cur)) return;
    const prev=_prevProxy[key];
    if(prev!=null && prev!==cur){
      const badge=cell.querySelector('.lc-delta');
      let favorable, label;
      if(dir==='up'){ favorable=cur>prev; label=cur>prev?'▲ longer':'▼ shorter'; }
      else { favorable=cur<prev; label=cur<prev?'▲ better':'▼ pricier'; } // rateLow
      badge.textContent=label;
      badge.className='lc-delta '+(favorable?'up':'dn')+' show';
      cell.classList.add('pulse');
      setTimeout(()=>{ badge.classList.remove('show'); },2400);
    }
  });
  // hero amount pulse
  if(lv){ _prevProxy={amount:lv.amountProxy,termProxy:lv.termProxy,rateProxy:lv.rateProxy}; }
}
function readEmpty(){
  return `<div class="read-empty">
    <span class="eyebrow">Deal Read</span>
    <h1 style="margin-top:13px">Four factors. <em>One</em> live read of the whole offer.</h1>
    <p>Pick an industry and the read activates. Each factor owns one lever of the offer — change any one and watch the amount, term, rate, payment, and product move in real time, with the talk track to match.</p>
    <div class="re-grid">
      <div class="re-cell"><div class="k">Industry</div><div class="t">→ Product type</div><div class="d">Sets the product stack and lender appetite.</div></div>
      <div class="re-cell"><div class="k">FICO</div><div class="t">→ Rate</div><div class="d">Sets the price and which programs open.</div></div>
      <div class="re-cell"><div class="k">Time in business</div><div class="t">→ Term</div><div class="d">Sets the length and bank eligibility.</div></div>
      <div class="re-cell"><div class="k">Monthly revenue</div><div class="t">→ Amount</div><div class="d">Sizes the offer and the payment cadence.</div></div>
    </div>
    <div class="read-ghost" aria-hidden="true">
      <div class="rg-cap"><span class="rg-pulse"></span> Your live read is standing by — pick an industry to light it up</div>
      <div class="rg-stage">
        <div class="rg-hero-num">$&mdash;&mdash;,&mdash;&mdash;&mdash;</div>
        <div class="rg-hero-sub">Funding range &middot; monthly payment &middot; product stack</div>
        <div class="rg-levers">
          <div class="rg-cell"><div class="rg-k">Amount</div><div class="rg-bar s1"></div></div>
          <div class="rg-cell"><div class="rg-k">Term</div><div class="rg-bar s2"></div></div>
          <div class="rg-cell"><div class="rg-k">Rate</div><div class="rg-bar s3"></div></div>
          <div class="rg-cell"><div class="rg-k">Payment</div><div class="rg-bar s4"></div></div>
        </div>
        <div class="rg-tt">
          <div class="rg-tt-lbl">Talk track</div>
          <div class="rg-line w1"></div>
          <div class="rg-line w2"></div>
          <div class="rg-line w3"></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── disclaimers (quiet but clear) ──
const HERO_DISCLAIMER = `<div class="hero-discl">${I.info}<span>Estimate only — generalized ranges that vary by lender. Not an offer.</span></div>`;
const DISCLAIMER_FOOT = `<div class="read-foot-discl"><b>These are generalizations.</b> Underwriting weighs 25+ factors and varies by lender; nothing here is an offer, commitment, or guarantee of funding.</div>`;
function catchAllBanner(d){
  if(!d.code || !isGenericCode(d.code)) return '';
  return `<div class="catch-banner">
    <span class="cb-ico">${I.warn}</span>
    <div class="cb-main">
      <div class="cb-t">Catch-all NAICS code — confirm before you rely on this</div>
      <div class="cb-b">“All-other / miscellaneous” codes are imprecise and can <b>skew the whole read and the underwriting</b>. If the business has a specific trade, pick that exact code — suggested matches are in the breakdown below.</div>
    </div>
  </div>`;
}
function aprActive(){ return S.state==='NY'||S.state==='CA'||S.aprOpen; }
function aprToggleHTML(lv){
  if(!lv) return '';
  if(S.state==='NY'||S.state==='CA') return `<div class="apr-toggle req"><span class="apr-tg-dot"></span>APR disclosure required in ${S.state} — shown above.</div>`;
  if(S.aprOpen) return `<button class="apr-toggle on" onclick="toggleApr()"><span class="apr-tg-dot"></span>APR preview shown above<span class="apr-tg-x">hide</span></button>`;
  return `<button class="apr-toggle" onclick="toggleApr()">${I.info}<span>Operating in <b>CA or NY</b>? APR disclosure applies — click to show it</span></button>`;
}
function toggleApr(){ if(S.state==='NY'||S.state==='CA') return; S.aprOpen=!S.aprOpen; save(); renderRead(); }

// ── cyclable constraints (the prominent cross-effect) ──
let _constraints=[], ccIndex=0;
function collectConstraints(deal){
  if(!deal.code) return [];
  if(deal.tier==='n') return [{title:'This industry is restricted.',lead:'It is declined outright in most underwriting.',unlock:'Verify the exact NAICS before declining — a neighboring code can change everything.'}];
  const pool=matchPool(deal.code,deal.tier).pool;
  const toneRank={g:0,w:1,r:2,n:3}; const out=[];
  ['fico','tib','rev'].forEach(kind=>{
    const v=deal[kind]; if(v==null) return;
    const b=factorRead(kind,v); if(!b) return;
    if(b.tone==='g'||b.tone==='x') return; // only genuine constraints (alt / tough), never a strong factor
    const ko=factorKnockout(kind,deal,pool);
    const sev=toneRank[b.tone]*10+ko.fails; if(sev<=0) return;
    const ul=factorUnlock(kind,deal,pool);
    const noun={fico:'Credit',tib:'Time in business',rev:'Revenue'}[kind];
    const valTxt=kind==='fico'?`${v}`:kind==='tib'?`${v} mo`:`$${v.toLocaleString()}/mo`;
    const impactLead={fico:`It's setting your rate and gating the cheaper programs.`,tib:`It's capping the term and bank eligibility.`,rev:`It's sizing how much you can offer.`}[kind];
    out.push({sev,kind,title:`${noun} (${valTxt}) ${b.tone==='w'?'is the limiting factor':'is a hard constraint'}.`,
      lead: impactLead||`It's the lever holding the offer back.`,
      unlock: ul?ul.text:null});
  });
  out.sort((a,b)=>b.sev-a.sev);
  return out;
}
function constraintLine(deal){
  _constraints=collectConstraints(deal); ccIndex=0;
  if(!_constraints.length) return '';
  const c=_constraints[0];
  const lever={fico:'rate',tib:'term',rev:'amount'}[c.kind]||'';
  const more=_constraints.length>1?`<span class="cl-more">+${_constraints.length-1} more</span>`:'';
  return `<button class="constraint-line" ${lever?`onclick="openLever('${lever}')"`:''}>
    <span class="cl-dot"></span><span class="cl-txt"><b>${c.title}</b> ${c.lead}</span>${more}<span class="cl-go">${I.dn}</span>
  </button>`;
}
function gapForLever(deal, lv, lever){
  if(!anyExpectation()) return null;
  const atr=lv?lv.atr:(deal.leadProduct?computeATR(deal):null);
  const map={amount:'Amount',product:'Product',term:'Term',payment:'Payment'};
  const want=map[lever]; if(!want) return null;
  return expectationGaps(deal,atr).find(g=>g.lever===want)||null;
}

// ════════════════════════════════════════════════════════════
//  LEVER MODAL — surfaces factor logic only when asked
// ════════════════════════════════════════════════════════════
const LEVER_FACTOR={amount:'rev',product:'industry',term:'tib',rate:'fico'};
const LEVER_TITLE={amount:'Funding range',product:'Product',term:'Term',rate:'Rate / cost',payment:'Payment'};
function leverValue(lv,lever){
  if(!lv) return '—';
  if(lever==='rate') return rateValueText(lv.atr, effectiveRateMode(lv.atr))+((effectiveRateMode(lv.atr)==='apr')?' APR':' / $1');
  return {amount:lv.amount||'—',product:prodDisplay(lv.product)||'—',term:lv.term,payment:lv.pay}[lever];
}
function driverLine(lever, d){
  const m={
    amount:`Primarily shaped by <b>monthly revenue</b>, then refined by product type, lender appetite and the rest of the file.`,
    product:`Primarily shaped by <b>industry</b>, then by credit, time in business and revenue — together they set which stack leads.`,
    term:`Primarily shaped by <b>time in business</b>, then by product type and overall file strength.`,
    rate:`Primarily shaped by <b>credit (FICO)</b>, then by industry risk, tenure and revenue stability.`,
    payment:`Set by the <b>product structure</b> — daily/weekly remittance for Short-Term Financing, fixed monthly for term and SBA.`,
  };
  return `<div class="lm-driver">${m[lever]} <span class="lm-driver-note">One factor leads; the real decision weighs 25+.</span></div>`;
}
let lvScreens=[], lvLever=null;
function openLever(lever, jumpLabel){
  const d=currentDeal(); const lv=currentLevers();
  S.modal=lever; lvLever=lever;
  const wrap=document.getElementById('leverModal');
  wrap.innerHTML=`<div class="lm-backdrop" onclick="closeLever()"></div>
    <div class="lm-card" role="dialog" aria-modal="true">
      <button class="lm-x" onclick="closeLever()" aria-label="Close">×</button>
      <div class="lm-title">${LEVER_TITLE[lever]} <span class="lm-val">${ttEsc(leverValue(lv,lever))}</span></div>
      <div class="lm-verdict">${leverVerdict(lever,d,lv)}</div>
      ${leverTeasers(lever,d,lv)}
      <div class="lm-fineprint"><span class="lm-fp-label">Fine print</span>${leverLegal(lever)}</div>
    </div>`;
  wrap.classList.add('open'); document.body.style.overflow='hidden';
  if(jumpLabel){ const t=wrap.querySelector(`[data-teaser="${jumpLabel}"]`); if(t){ t.open=true; requestAnimationFrame(()=>{ try{ t.scrollIntoView({block:'nearest'}); }catch(e){} }); } }
}
// Expandable teasers — deeper context shown inline on demand (no horizontal swipe)
function teaser(key, title, body){
  return `<details class="lm-teaser" data-teaser="${key}"><summary class="lm-teaser-sum"><span>${title}</span><span class="lm-teaser-chev">${I.dn}</span></summary><div class="lm-teaser-body">${body}</div></details>`;
}
function leverTeasers(lever, d, lv){
  const rows=[];
  const gap=gapForLever(d,lv,lever);
  if(gap){
    const title = lever==='product'
      ? `Set expectations from ${ttEsc(gap.exp)} to ${ttEsc(gap.act)}`
      : `Set expectations · requested ${ttEsc(gap.exp)}`;
    const gapBody=`<div class="lm-gap ${gap.status}"><div class="lm-gap-h"><span class="lm-gap-dot"></span><span>Requested ${ttEsc(gap.exp)} → <b>${ttEsc(gap.act)}</b></span></div><div class="lm-gap-why">${gap.why}</div></div>`;
    rows.push(teaser('expectations', title, gapBody));
  }
  const depth=leverDepth(lever,d,lv);
  if(depth){
    const dt={amount:'How this is sized', rate:(lv&&lv.atr.rate.kind==='factor')?'Factor rate vs. APR':'What moves the rate', term:'About the term'}[lever]||'More detail';
    rows.push(teaser('depth', dt, `<div class="lm-logic">${depth}</div>`));
  }
  if(lever==='product' && lv){
    const fam=prodFamily(lv.product);
    if(fam==='mca'||fam==='rbf') rows.push(teaser('structure', 'What “Short-Term Financing” actually is', stfStructureHTML()));
  }
  if(lever==='product'||lever==='payment'||lever==='amount'){
    const cmp=costCompareHTML(d,lv);
    if(cmp) rows.push(teaser('compare', `Compare ${prodDisplay(selProdLabel(d))||'this'} vs. a line of credit`, cmp));
  }
  return rows.length?`<div class="lm-teasers">${rows.join('')}</div>`:'';
}
function leverVerdict(lever, d, lv){
  if(!lv) return leverMeaning(lever,d,lv);
  const atr=lv.atr;
  if(lever==='amount'){
    const band=lv.amount||'—';
    const rev=d.rev?`$${d.rev.toLocaleString()}/mo`:'these deposits';
    if(S.reqAmt && atr.amount && S.reqAmt>atr.amount.hi) return `At ${rev} in deposits, this file supports <b>${band}</b>. They asked for ${fmtMoney(S.reqAmt)} — that's above the ceiling without stronger revenue history.`;
    if(S.reqAmt && atr.amount && S.reqAmt<atr.amount.lo) return `At ${rev} in deposits, this file supports <b>${band}</b>. They asked for ${fmtMoney(S.reqAmt)} — there's room to offer more if they want it.`;
    return `At ${rev} in deposits, this file supports <b>${band}</b>. Steadier, higher deposits raise the ceiling.`;
  }
  if(lever==='term'){
    const prod=prodDisplay(lv.product);
    const isShort=/mca|rbf|factor/.test(atr.fam);
    if(isShort) return `${prod} runs <b>${lv.term}</b>, not the multi-year term of a bank loan. A longer term needs 2+ years in business and stronger credit.`;
    return `This file supports a <b>${lv.term}</b> term. Length tracks time in business — more tenure opens longer, cheaper bank terms.`;
  }
  if(lever==='rate'){
    if(d.fico==null) return `Pricing is set mostly by credit. Add a FICO and this sharpens — it's the single biggest factor on cost.`;
    if(d.fico>=680) return `At a ${d.fico}, the file clears the 680 recommended mark for SBA. Strong credit keeps pricing on the cheaper end.`;
    if(d.fico>=660) return `At a ${d.fico}, the file meets the 660 SBA minimum — but 680+ is recommended since scores can shift during underwriting.`;
    if(d.fico>=600) return `At a ${d.fico}, pricing lands toward the higher end. A 650 minimum and 680+ recommended score would open SBA and cheaper options.`;
    return `At a ${d.fico}, this is higher-risk pricing near the top of the range. Improving credit brings the cost down over time.`;
  }
  if(lever==='payment'){
    const monthly=/month/i.test(lv.pay);
    if(monthly) return `Not a surprise bill — one fixed monthly payment the business can plan around. Predictable, but it takes a stronger file to qualify for.`;
    const isDaily=/daily/i.test(lv.pay);
    return isDaily
      ? `Not a monthly bill — these are micro-payments, a tiny ${lv.pay.toLowerCase()} slice of deposits. They flex with revenue, not against it.`
      : `Not a monthly bill — a small ${lv.pay.toLowerCase()} slice of deposits. It flexes with revenue, not against it.`;
  }
  if(lever==='product'){
    const lead=prodDisplay(lv.product);
    return `On today's numbers, <b>${lead}</b> is the strongest path to funding. Stronger credit and more time in business can open lower-cost options later.`;
  }
  return leverMeaning(lever,d,lv);
}
function leverDepth(lever, d, lv){
  if(!lv) return null;
  if(lever==='amount') return `Advances are sized at <b>75%–150%</b> of monthly deposits depending on consistency. 3+ months of statements tighten this range significantly.`;
  if(lever==='rate'){
    if(lv.atr.rate.kind==='factor'){ const mid=((lv.atr.rate.lo+lv.atr.rate.hi)/2).toFixed(2); return `Factor rate measures <b>total repayment</b>, not annual interest. ${mid}x means $${mid} back per $1 borrowed — not the same as an APR.`; }
    return `Pricing weighs credit, industry risk, tenure and revenue stability together. A stronger file on any of these can move the rate.`;
  }
  if(lever==='product') return null;
  return null;
}
function leverLegal(lever){
  const noun={amount:'amount',term:'term',rate:'pricing',payment:'payment schedule',product:'product fit'}[lever]||'outcome';
  return `These figures are generalizations. Final ${noun} depends on lender underwriting at time of application.`;
}
// Plain-English, about THE BUSINESS (not the borrower). A 12-year-old gets it, a CEO isn't insulted.
function leverMeaning(lever, d, lv){
  if(!lv){
    return ({amount:`Add monthly revenue and this fills in — revenue sets how much the business can borrow.`,
      term:`Add time in business and this fills in — it sets how long the term can run.`,
      rate:`Add a credit score and this fills in — it's the single biggest thing that moves the price.`,
      product:`Pick an industry and the product that fits leads here.`,
      payment:`This fills in once the offer sizes.`})[lever]||`Enter the missing factor and this fills in.`;
  }
  if(lever==='rate'){
    const rv=rateValueText(lv.atr, effectiveRateMode(lv.atr));
    const unit=(effectiveRateMode(lv.atr)==='apr')?'':' per $1 borrowed';
    if(d.fico==null) return `The rate is driven mostly by the owner's <b>credit score</b>. Add a FICO and it sharpens — it's the single biggest factor on price.`;
    const note = d.fico>=680 ? `the file clears the <b>680</b> recommended mark for SBA, so the lowest-cost options — bank term loans and SBA — are in range.`
      : d.fico>=660 ? `the file meets the <b>660</b> SBA minimum, but <b>680+</b> is recommended — scores can shift during underwriting and stronger credit locks in better pricing.`
      : d.fico>=600 ? `the file is above non-bank minimums but under the <b>660</b> SBA minimum, so pricing sits toward the <b>higher end</b>. Improving credit opens lower-cost options — but any future offer depends on underwriting at that time.`
      : `this is <b>higher-risk</b> pricing — mostly Short-Term Financing, near the top of the cost range. Improving credit generally helps the price over time, though any future offer depends on performance and underwriting at that point.`;
    return `The rate (<b>${rv}${unit}</b>) is set mostly by <b>credit</b>. At a <b>${d.fico}</b> score, ${note}`;
  }
  if(lever==='term'){
    if(d.tib==null) return `Term length is driven by <b>time in business</b>. Add it and this sharpens.`;
    const note = d.tib>=24 ? `the business is past the <b>24-month</b> mark banks and SBA look for, so longer terms — and lower-cost products — are in range.`
      : d.tib>=12 ? `the business is past 12 months, so non-bank options extend the term; banks and SBA generally look for <b>24</b> before going longer.`
      : `the business is early, so the term stays short until it crosses <b>12 months</b>. A shorter term means a larger payment for the same dollars.`;
    return `The term (<b>${lv.term}</b>) tracks how long the business has been open. At <b>${d.tib} months</b>, ${note}`;
  }
  if(lever==='amount'){
    if(d.rev==null) return `How much the business can borrow is sized off <b>monthly deposits</b>. Add revenue and this fills in.`;
    return `How much the business can borrow (<b>${lv.amount}</b>) is sized off <b>monthly deposits</b>. At <b>$${d.rev.toLocaleString()}/mo</b>, the math points here. Steadier, higher deposits raise the ceiling — and 3+ months of statements make a larger figure more credible to underwriting.`;
  }
  if(lever==='product'){
    const lead=prodDisplay(lv.product);
    return `The product that leads here (<b>${lead}</b>) is set by the <b>industry</b> and how the whole file reads together. It's the fastest path to funding on today's numbers. Stronger credit and more time in business can open lower-cost options later — but any future offer depends on the business's performance and a lender's underwriting at the time, and is never guaranteed.`;
  }
  if(lever==='payment'){
    const a=affordability(d,lv.atr);
    const est=a&&a.perPayment!=null?` Roughly <b>${fmtUSD(a.perPayment)}${a.perLabel}</b>${a.perMonth!=null?` (≈ ${fmtUSD(a.perMonth)}/mo)`:''}.`:'';
    const monthly=/month/i.test(lv.pay);
    const isDaily=/daily/i.test(lv.pay);
    return (monthly
      ? `This product is paid <b>monthly</b> — one fixed bill the business can plan around. Predictable, but it takes a stronger file to qualify for.`
      : isDaily
      ? `This product is paid in <b>micro-payments</b> — a tiny slice of the business's deposits each day instead of one large monthly bill, so it rises and falls with sales rather than landing all at once.`
      : `This product is paid <b>${lv.pay.toLowerCase()}</b> — a small slice of the business's deposits instead of one large monthly bill, so it rises and falls with sales rather than landing all at once.`)+est;
  }
  return '';
}
function leverMoves(lever, d, lv){
  if(lever==='payment') return null;
  const factor=LEVER_FACTOR[lever]; // fico / tib / rev / industry
  const pool=d.tier&&d.tier!=='n'?matchPool(d.code,d.tier).pool:[];
  if(lever==='product'){
    if(!pool.length) return null;
    const m=matchPool(d.code,d.tier);
    const items=[`<div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt"><b>${m.specialty.length}</b> industry-specialist and <b>${m.productMatch.length}</b> product-match lender${m.productMatch.length===1?'':'s'} fund this stack today.</span></div>`];
    if(isGenericCode(d.code)) items.push(`<div class="cross-item drag"><span class="ci-ico">${I.drag}</span><span class="ci-txt">This is a <b>catch-all code</b> — it only matches broad lenders, which holds the read back. If the business has a specific trade, pick that code.</span></div>`);
    return `<div class="fac-cross" style="margin-top:0">${items.join('')}</div>`;
  }
  const v=d[factor];
  if(v==null) return `<div class="lm-logic">Enter ${({fico:'a credit score',tib:'time in business',rev:'monthly revenue'})[factor]} to see exactly what would move this.</div>`;
  if(!pool.length) return null;
  const ko=factorKnockout(factor,d,pool); const ul=factorUnlock(factor,d,pool);
  const items=[];
  if(ul && (ul.lenderDelta>0||ul.leverTxt)) items.push(`<div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt">${ul.text}</span></div>`);
  if(ko.fails>0) items.push(`<div class="cross-item drag"><span class="ci-ico">${I.drag}</span><span class="ci-txt"><b>${ko.fails} of ${ko.total}</b> matched lenders need ${KIND_NOUN[factor]} than this — they're out at today's value.</span></div>`);
  else if(ko.gated>0) items.push(`<div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt">Clears all ${ko.total} matched lenders on this factor.</span></div>`);
  return items.length?`<div class="fac-cross" style="margin-top:0">${items.join('')}</div>`:null;
}
function closeLever(){ S.modal=null; const w=document.getElementById('leverModal'); if(w){ w.classList.remove('open'); w.innerHTML=''; } document.body.style.overflow=''; }
function leverTalk(kind,d){
  const ft=buildFactorTrack(kind,d);
  return `<div class="fac-talk"><div class="fac-talk-head"><span class="eyebrow">How to explain it</span><button class="fac-talk-copy" id="lmCopy" onclick="lmCopyTalk('${kind}')">${I.copy}Copy</button></div><div class="fac-talk-body">“${ttRender(ft.talk)}”</div></div>`;
}
function lmCopyTalk(kind){ const d=currentDeal(); const ft=buildFactorTrack(kind,d); navigator.clipboard.writeText('“'+ttPlain(ft.talk)+'”').then(()=>{ const b=document.getElementById('lmCopy'); if(b){b.innerHTML=I.copy+'Copied';setTimeout(()=>b.innerHTML=I.copy+'Copy',1400);} }); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&S.modal) closeLever(); });

// ── APR block (NY / CA disclosure) ──
function aprBlockHTML(deal, lv){
  if(!lv || !aprActive()) return '';
  const apr=approxAPR(lv.atr); if(!apr) return '';
  let why=aprWhy(lv.atr,'en');
  if(why.indexOf('$X_COST')>=0){ const aff=affordability(deal,lv.atr); why=why.replace('$X_COST', aff?fmtUSD(aff.costTotal):'the fixed fee'); }
  const range=(apr.lo!==apr.hi)?`range ${apr.lo}–${apr.hi}%`:'';
  const stateLabel=S.state||'CA/NY';
  return `<div class="apr-block">
    <div class="apr-top"><span class="apr-label">APR${apr.exact?'':' · approx'}</span><span class="apr-val tnum">${apr.rep}%</span><span class="apr-state">${range?range+' · ':''}${stateLabel} disclosure</span></div>
    <div class="apr-why">${why}</div></div>`;
}

// ── expectation vs. the read ──
function gapsHTML(deal, lv){
  if(!anyExpectation()) return '';
  const atr=lv?lv.atr:(deal.leadProduct?computeATR(deal):null);
  const gaps=expectationGaps(deal,atr); if(!gaps.length) return '';
  const icon={match:'\u2713',over:'!',under:'+',diff:'\u2260'};
  const dotc={match:'#1f9d57',over:'#e0a400',under:'#2a7fd6',diff:'#e0a400'};
  return `<div class="gaps-box">
    <div class="rc-head">Expectation vs. the read</div>
    ${gaps.map(g=>`<div class="gap-row">
      <span class="gap-dot" style="background:${dotc[g.status]||'var(--muted)'}"></span>
      <div class="gap-main"><div class="gap-vs"><span class="gap-lever">${g.lever}</span> wants ${ttEsc(g.exp)} \u2192 <b>${ttEsc(g.act)}</b></div><div class="gap-why">${g.why}</div></div>
    </div>`).join('')}
  </div>`;
}

// ── payment-affordability — collapsible cash-flow case ──
function affConfidence(){
  const n=depCountEntered();
  if(n>=3) return {key:'high', note:`Backed by <b>${n} months</b> of bank statements.`};
  if(n>=1) return {key:'low', note:`Only <b>${n} month${n>1?'s':''}</b> of statements entered — pull <b>3+</b> to make this case stick with underwriting.`};
  if(S.rev) return {key:'single', note:`Based on a <b>single revenue figure</b> — pull <b>3+ months</b> of statements to firm this up before you lean on it.`};
  return {key:'none', note:''};
}
function affVerdict(a){
  if(!a) return {label:'Need cash-flow data', tone:'x'};
  if(a.perMonth==null) return {label:'Scales with invoices', tone:'g'};
  return {g:{label:'Affordable',tone:'g'},w:{label:'Tight',tone:'w'},r:{label:'Strained',tone:'r'}}[a.tone];
}
// Cash flow check — relocated to a small bottom button next to "Check stacking"
// (LEN-186). De-lavendered: the green base styling now shows. The button carries the
// verdict; clicking expands the full break-even detail inline below the button row.
function cashFlowControl(deal, lv){
  if(!lv) return '';
  const a=affordability(deal, lv.atr); const v=affVerdict(a); const open=S.affOpen;
  const c=v.tone==='x'?'var(--muted)':DOT[v.tone];
  return `<button class="offer-compare cf-toggle${open?' open':''}" onclick="toggleAff()">
    <span class="cf-dot" style="background:${c}"></span><span>Cash flow check</span>
    <span class="cf-verdict" style="color:${c==='var(--muted)'?'var(--muted)':c}">${v.label}</span>
    <span class="fac-chev" style="${open?'transform:rotate(180deg)':''}">${I.dn}</span>
  </button>`;
}
function affBody(deal, lv){
  if(!lv) return '';
  const a=affordability(deal, lv.atr); const conf=affConfidence();
  if(!a){
    return `<div class="aff-empty">${I.info}<div><b>No affordability case yet.</b> Enter monthly revenue — or better, 3+ months of deposits above — and this shows whether the borrower can carry the payment from cash flow, even when the rate looks high.</div></div>`;
  }
  const rev=deal.rev;
  const cells=[];
  cells.push(`<div class="aff-cell"><div class="ac-l">Est. payment</div><div class="ac-v tnum">${a.perPayment!=null?fmtUSD(a.perPayment)+a.perLabel:'scales'}</div>${a.perMonth!=null?`<div class="ac-s">≈ ${fmtUSD(a.perMonth)}/mo</div>`:''}</div>`);
  if(a.pct!=null){
    const cov=rev/a.perMonth;
    cells.push(`<div class="aff-cell"><div class="ac-l">Share of deposits</div><div class="ac-v tnum">${Math.round(a.pct*100)}%</div><div class="ac-s">deposits cover it ${cov>=10?'10+':cov.toFixed(1)}×</div></div>`);
    cells.push(`<div class="aff-cell"><div class="ac-l">Left after payment</div><div class="ac-v tnum">${fmtUSD(rev-a.perMonth)}</div><div class="ac-s">/mo of deposits remain</div></div>`);
  }
  cells.push(`<div class="aff-cell"><div class="ac-l">Cost of capital</div><div class="ac-v tnum">${fmtUSD(a.costTotal)}</div><div class="ac-s">${fmtUSD(a.paybackTotal)} total payback</div></div>`);
  const barW=a.pct!=null?Math.min(100,a.pct/0.4*100):0;
  const tc=TC[a.tone];
  const bar=a.pct!=null?`<div class="aff-bar"><div class="fill" style="width:${barW}%;background:var(--t${tc})"></div></div><div class="aff-scale"><span>0%</span><span>20%</span><span>40%+ of deposits</span></div>`:'';
  const breakeven=a.perMonth!=null?`<div class="aff-be"><span class="aff-be-ico">${I.lift}</span><div><b>Break-even hurdle.</b> Even at this rate, the advance pays for itself if it generates at least <b>${fmtUSD(a.perMonth)}/mo</b> in new gross profit — about <b>${Math.round(a.perMonth/rev*100)}%</b> on top of current deposits. That's the line to sell against.</div></div>`:'';
  const confCls=conf.key==='high'?'ok':conf.key==='none'?'':'warn';
  const confNote=conf.note?`<div class="aff-conf ${confCls}"><span class="d"></span><span>${conf.note}</span></div>`:'';
  return `<div class="aff-verdict-row" style="color:var(--t${tc})"><span class="av-dot" style="background:var(--t${tc})"></span>${a.verdict}</div>
    <div class="aff-grid">${cells.join('')}</div>${bar}${breakeven}${confNote}
    <div class="aff-note">Estimate using band midpoints. Affordability depends on the final amount, term, and pricing — and on the rest of the operating expenses, which this does not see.</div>
    <a class="aff-fulllink" href="${affordabilityHref(deal,lv)}" target="_top" style="display:inline-flex;align-items:center;gap:6px;margin-top:11px;font-size:11.5px;font-weight:600;color:var(--green);text-decoration:none;border-bottom:1px dashed var(--green-line);padding-bottom:1px">${I.lift}<span>Open full Payment Fit</span></a>`;
}
function toggleAff(){
  S.affOpen=!S.affOpen; save();
  const p=document.getElementById('affPanel'); if(p) p.classList.toggle('open',S.affOpen);
  const t=document.querySelector('.cf-toggle'); if(t){ t.classList.toggle('open',S.affOpen); const ch=t.querySelector('.fac-chev'); if(ch) ch.style.transform=S.affOpen?'rotate(180deg)':''; }
}

// talk track — cycles by PRODUCT TYPE (LEN-186 r3). Overview → one page per eligible
// product the borrower can realistically get → Next steps. A product page is hidden
// when its verdict is Unlikely or worse, so a seller with no SBA/LOC access never gets
// a track for capital they can't reach.
let TTI=[], ttiIndex=0, ttActive='talk';
// Per-product client-facing track, composed from the product narrative + verdict + cadence.
function buildProductTrack(label, d){
  const p=pn(label); const fam=prodFamily(label); const display=prodDisplay(label);
  const q=productQualify(label,d); const cadence=payFreqFor(fam).toLowerCase();
  const useDep=(fam==='equip'||fam==='factor')&&(q.rung==='likely'||q.rung==='possible');
  const fit=useDep ? 'an option that depends on how you’ll use the funds' : ({likely:'a strong fit for you right now',possible:'a realistic option worth running',unlikely:'a stretch on today’s file',vunlikely:'unlikely on today’s file',buildup:'something to build toward, not today'}[q.rung]||'an option');
  const talk=`${capFirst(p.short)} is ${fit} — ${p.why}. Repayment runs ${cadence}: ${payFreqWhy(fam)}.${q.caution?` Worth knowing: ${q.caution}.`:''}`;
  const text=`${capFirst(p.short)} — ${p.why}. Repaid ${cadence}.${q.caution?` Note: ${q.caution}.`:''}`;
  return {label:display, talk, text, email:text};
}
// Forward-planning nudges → cross-link the right calculator from the live signals.
function buildNextSteps(d){
  const lv=leversForProduct(d, selProdLabel(d));
  const nudges=[];
  const renewal=(S.uw&&S.uw.renewal)||'';
  if(/^yes/i.test(renewal)){
    nudges.push({txt:'Early-renewal program in play — run <b>Amortization</b> to build the pre-pay case: show how paying down early unlocks a renewal for more capital at better terms.', href:'/calculators/AmoScheduleCalculator.html?src=deal-read', cta:'Open Amortization'});
  }
  if(lv){ const a=affordability(d,lv.atr); const v=affVerdict(a); if(v&&(v.tone==='w'||v.tone==='r')){
    nudges.push({txt:'Cash flow looks tight against this payment — run <b>Payment Fit</b> to pressure-test it against real deposits before you commit.', href:affordabilityHref(d,lv), cta:'Open Payment Fit'});
  }}
  const bh=(S.uw&&S.uw['biz-hist'])||'';
  if(/active position/i.test(bh)){
    nudges.push({txt:'There’s an active position on file — run <b>Net &amp; Position</b> to check stacking and the true net funding requirement.', href:fundabilityHref(d,lv), cta:'Open Net &amp; Position'});
  }
  const sbaLabel=(d.prods||[]).map(p=>p[0]).find(l=>prodFamily(l)==='sba');
  if(sbaLabel && productQualify(sbaLabel,d).rung==='likely' && S.reqProduct==='sba'){
    nudges.push({txt:'Strong SBA candidate and the borrower’s leaning that way — run <b>DSCR</b> to confirm the debt-service coverage SBA underwriting will want.', href:'/calculators/DSCRCalculator.html?src=deal-read', cta:'Open DSCR'});
  }
  if(!nudges.length) return null;
  const html=`<div class="ns-list">`+nudges.map(n=>`<div class="ns-item"><div class="ns-txt">${n.txt}</div><a class="ns-cta" href="${n.href}" target="_top">${I.lift}<span>${n.cta}</span></a></div>`).join('')+`</div>`;
  const plain=nudges.map(n=>'• '+n.txt.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')).join('\n');
  return {html, plain};
}
function buildTalkItems(d){
  const e=NAICS_DB.find(n=>n.c===d.code);
  const c=buildCombinedTracks(d.code,d.tier,d.prods,e?e.d:'');
  const items=[{label:'Overview', talk:c.talk[0], text:c.text, email:c.email, discl:c.discl}];
  // Product-type pages in display order, gated to what the borrower can realistically get.
  const ACCESSIBLE=new Set(['likely','possible']);
  displayOrderedProds(d.prods).forEach(([label])=>{
    if(!ACCESSIBLE.has(productQualify(label,d).rung)) return;
    const pt=buildProductTrack(label,d);
    items.push({label:pt.label, talk:pt.talk, text:pt.text, email:pt.email, discl:c.discl});
  });
  const ns=buildNextSteps(d);
  if(ns) items.push({label:'Next steps', kind:'nextsteps', html:ns.html, talk:ns.plain, text:ns.plain, email:ns.plain, discl:c.discl});
  return items;
}
function ttPane(it, tab){ if(it.kind==='nextsteps') return it.html; const raw=tab==='talk'?it.talk:tab==='text'?it.text:it.email; return tab==='talk'?'“'+ttRender(raw)+'”':ttRender(raw); }
// Re-shows on first use and after ~30 idle days — same staleness signal as the intro.
function ttHintEligible(){
  try{ const ts=parseInt(localStorage.getItem('lp_dr_tt_hint')||'0',10); if(ts && (Date.now()-ts)<30*86400000) return false; }catch(e){}
  return true;
}
function dismissTTHint(){ S._ttHintState='dismissed'; const p=document.querySelector('.tt-hint'); if(p) p.remove(); }
function talkTrackHTML(d){
  TTI=buildTalkItems(d); ttiIndex=0; ttActive='talk';
  const it=TTI[0]; const multi=TTI.length>1;
  const discl = S.tweaks.disclosures==='show' ? `<div class="tt-discl">${ttEsc(it.discl)}</div>` : `<div class="tt-discl"></div>`;
  // Always-on pager (when >1 page) makes it unmissable that tracks cycle by product type.
  const pager = multi ? `<div class="tt-pager">
      <button class="tt-pg-btn" onclick="ttCycle(-1)" aria-label="Previous talk track">${I.up}</button>
      <span class="tt-pg-lbl">Talk track <b id="ttPgNum">1</b> of ${TTI.length} · <span id="ttPgName">${ttEsc(it.label)}</span></span>
      <button class="tt-pg-btn" onclick="ttCycle(1)" aria-label="Next talk track">${I.dn}</button>
      <span class="tt-pg-hint">one per product type — cycle through</span>
    </div>` : '';
  return `<div class="tt">
    <div class="tt-head">
      <span class="eyebrow">What you tell the borrower</span>
      <span class="tt-angle" id="ttAngle">${it.label}</span>
      <div class="tt-seg"><button class="on" data-tt="talk" onclick="ttTab('talk')">Talk</button><button data-tt="text" onclick="ttTab('text')">Text</button><button data-tt="email" onclick="ttTab('email')">Email</button></div>
    </div>
    ${pager}
    <div class="tt-bodywrap">
      <div class="tt-body">
        <div class="tt-pane on" id="tt-talk">${ttPane(it,'talk')}</div>
        <div class="tt-pane" id="tt-text">${ttPane(it,'text')}</div>
        <div class="tt-pane" id="tt-email">${ttPane(it,'email')}</div>
      </div>
    </div>
    ${fileReadHTML(d)}
    <div class="tt-foot">
      ${discl}
      <button class="tt-copy" id="ttCopy" onclick="copyTT()">${I.copy}Copy</button>
    </div>
  </div>`;
}
function ttBind(d){ /* state set in talkTrackHTML */ }
function ttTab(w){
  ttActive=w;
  document.querySelectorAll('.tt-seg button').forEach(b=>b.classList.toggle('on',b.dataset.tt===w));
  document.querySelectorAll('.tt-pane').forEach(p=>p.classList.toggle('on',p.id==='tt-'+w));
}
function ttCycle(dir){
  const n=TTI.length; if(n<2) return;
  ttiIndex=(ttiIndex+dir+n)%n; const it=TTI[ttiIndex];
  document.getElementById('tt-talk').innerHTML=ttPane(it,'talk');
  document.getElementById('tt-text').innerHTML=ttPane(it,'text');
  document.getElementById('tt-email').innerHTML=ttPane(it,'email');
  const pgNum=document.getElementById('ttPgNum'); if(pgNum) pgNum.textContent=ttiIndex+1;
  const pgName=document.getElementById('ttPgName'); if(pgName) pgName.textContent=it.label;
  document.getElementById('ttAngle').textContent=it.label;
}
function copyTT(){
  const it=TTI[ttiIndex];
  const raw = it.kind==='nextsteps' ? ('NEXT STEPS\n'+it.talk)
    : ttActive==='talk' ? '“'+ttPlain(it.talk)+'”' : ttPlain(ttActive==='text'?it.text:it.email)+(S.tweaks.disclosures==='show'?`\n\n* ${it.discl}`:'');
  const b=document.getElementById('ttCopy');
  navigator.clipboard.writeText(raw).then(()=>{ b.innerHTML=I.copy+'Copied'; b.classList.add('ok'); setTimeout(()=>{b.innerHTML=I.copy+'Copy';b.classList.remove('ok');},1600); });
}

// ════════════════════════════════════════════════════════════
//  CROSS-EFFECT ENGINE
// ════════════════════════════════════════════════════════════
const BANDS={fico:FICO_BANDS,tib:TIB_BANDS,rev:REV_BANDS};
function bandIndex(bands,v){ for(let i=0;i<bands.length;i++){ if(v>=bands[i].min) return i; } return bands.length-1; }
const KIND_FIELD={fico:'fico',tib:'tib',rev:'rev'};
const KIND_NOUN={fico:'a higher score',tib:'more time in business',rev:'more revenue'};

// how many matched lenders this factor knocks out at the entered value
function factorKnockout(kind, deal, pool){
  let gated=0, fails=0;
  pool.forEach(l=>{
    const min=kind==='fico'?l.fico:kind==='tib'?l.tib:l.rev;
    const v=kind==='fico'?deal.fico:kind==='tib'?deal.tib:deal.rev;
    if(min>0){ gated++; if(v && min>v) fails++; }
  });
  return {gated,fails,total:pool.length};
}
// what the next better band threshold unlocks (rate/term/amount + lenders)
function factorUnlock(kind, deal, pool){
  const v=deal[kind]; if(v==null) return null;
  const bands=BANDS[kind]; const i=bandIndex(bands,v);
  if(i<=0) return null; // already top band
  const target=bands[i-1].min;
  const hypo={...deal,[kind]:target};
  const baseFit=fitCount(pool,deal.fico,deal.tib,deal.rev);
  const newFit=fitCount(pool,kind==='fico'?target:deal.fico,kind==='tib'?target:deal.tib,kind==='rev'?target:deal.rev);
  const lenderDelta=newFit-baseFit;
  // lever change
  let leverTxt='';
  if(deal.leadProduct){
    const a=computeATR(deal), b=computeATR(hypo);
    if(kind==='fico'){ const ra=atrRateText(a.rate), rb=atrRateText(b.rate); leverTxt = ra!==rb?`rate moves to <b>${rb}</b>`:'pricing firms up'; }
    else if(kind==='tib'){ const ta=atrTermText(a.term), tb=atrTermText(b.term); leverTxt = ta!==tb?`term extends to <b>${tb}</b>`:'term holds'; }
    else { const aa=a.amount?atrAmountText(a.amount):null, ab=b.amount?atrAmountText(b.amount):null; leverTxt = (ab&&ab!==aa)?`amount grows to <b>${ab}</b>`:'amount scales up'; }
  }
  const diff = kind==='fico'?`+${target-v} pts`:kind==='tib'?`+${target-v} mo`:`$${target.toLocaleString()}/mo`;
  const at = kind==='rev'?`At ${diff}`:`At ${kind==='fico'?target:target+' mo'} (${diff})`;
  return {target, diff, leverTxt, lenderDelta,
    text:`<b>${at}:</b> ${leverTxt}${lenderDelta>0?`, <b>+${lenderDelta}</b> more lenders open`:''}.`};
}
// the single tightest constraint, for the headline callout
function weakestFactor(deal){
  if(!deal.code) return null;
  const pool=matchPool(deal.code,deal.tier).pool;
  const toneRank={g:0,w:1,r:2,n:3};
  let worst=null;
  ['fico','tib','rev'].forEach(kind=>{
    const v=deal[kind]; if(v==null) return;
    const b=factorRead(kind,v); if(!b) return;
    const ko=factorKnockout(kind,deal,pool);
    const score=toneRank[b.tone]*10 + (ko.fails);
    if(score<=0) return;
    if(!worst || score>worst.score){
      const ul=factorUnlock(kind,deal,pool);
      const noun={fico:'credit',tib:'time in business',rev:'revenue'}[kind];
      const valTxt=kind==='fico'?`${v}`:kind==='tib'?`${v} mo`:`$${v.toLocaleString()}/mo`;
      worst={kind,score,
        title:`${capFirst(noun)} (${valTxt}) is the tightest constraint.`,
        lead: ko.fails>0?`It currently sets you below <b>${ko.fails}</b> of ${ko.total} matched lenders.`:`It's the lever holding the offer back.`,
        unlock: ul?ul.text:null};
    }
  });
  return worst;
}

// ════════════════════════════════════════════════════════════
//  RENDER — band (factor breakdown + lenders)
// ════════════════════════════════════════════════════════════
const FAC_LIST=['industry','fico','tib','rev'];
const FAC_META={
  industry:{name:'Industry',badge:'I',owns:'Product type'},
  fico:{name:'FICO',badge:'F',owns:'Rate'},
  tib:{name:'Time in business',badge:'T',owns:'Term'},
  rev:{name:'Monthly revenue',badge:'R',owns:'Amount'},
};
function renderBand(){
  const el=document.getElementById('band');
  if(!S.selected){ el.innerHTML=''; el.style.display='none'; return; }
  // Lender-pool surface removed (Steve, LEN-155): no named-lender list / match counts on
  // the Deal Analysis page. The band now only carries the catch-all NAICS warning (with
  // sibling-code chips) when the code is generic; otherwise it's hidden.
  const html=gwarnHTML(currentDeal());
  el.innerHTML=html;
  el.style.display=html?'block':'none';
}
function facCard(kind, d){
  const meta=FAC_META[kind]; const lv=computeLevers(d);
  let tone, valTxt, impact, pillTxt, entered=true;
  if(kind==='industry'){
    const e=NAICS_DB.find(n=>n.c===d.code);
    tone=d.tier; valTxt=`${d.code} · ${e?e.d:''}`;
    impact=`Sets the product stack → <b>${d.leadProduct?prodDisplay(d.leadProduct):'restricted'}</b> leads`;
    pillTxt=TIER_SHORT[d.tier].split(' · ')[1]||TIER_SHORT[d.tier];
  } else {
    const v=kind==='fico'?d.fico:kind==='tib'?d.tib:d.rev;
    const b=factorRead(kind,v);
    if(!b){
      entered=false; tone='x';
      valTxt='Not entered'; pillTxt='Add to sharpen';
      impact=({fico:'Sets your <b>rate</b> once entered',tib:'Sets your <b>term</b> once entered',rev:'Sizes the <b>amount</b> once entered'})[kind];
    } else {
      tone=b.tone; pillTxt=b.tag;
      valTxt=kind==='fico'?String(v):kind==='tib'?`${v} months`:`$${Number(v).toLocaleString()}/mo`;
      if(kind==='fico') impact=`Sets your rate → <b>${lv?lv.rate:'—'}</b>`;
      else if(kind==='tib') impact=`Sets your term → <b>${lv?lv.term:'—'}</b>`;
      else impact=`Sizes the amount → <b>${lv&&lv.amount?lv.amount:'add to size'}</b>`;
    }
  }
  const tc=tone==='x'?'x':TC[tone];
  const badgeStyle='background:var(--green-wash);color:var(--green)';
  const open=S.facOpen[kind]?' open':'';
  return `<div class="fac${open}${entered?'':' empty'}" id="fac-${kind}">
    <button class="fac-head" onclick="toggleFac('${kind}')">
      <span class="fac-badge" style="${badgeStyle}">${meta.badge}</span>
      <span class="fac-main">
        <span class="fac-name-row"><span class="fac-name">${meta.name}</span><span class="fac-owns">owns ${meta.owns}</span></span>
        <span class="fac-val">${ttEsc(valTxt)}</span>
        <span class="fac-impact">${impact}</span>
      </span>
      <span class="fac-right"><span class="fac-pill tg"><span class="d" style="background:${DOT[tone]||DOT.x}"></span>${pillTxt}</span><span class="fac-chev">${I.dn}</span></span>
    </button>
    <div class="fac-detail"><div class="fac-detail-in"><div class="fac-dd">${facDetail(kind,d)}</div></div></div>
  </div>`;
}
function facDetail(kind, d){
  let logic, cross='';
  const pool=d.tier&&d.tier!=='n'?matchPool(d.code,d.tier).pool:[];
  if(kind==='industry'){
    const uw=getUW(d.code);
    logic = uw ? `<b>What underwriting checks:</b> DSCR ${uw.dscr}. Minimum time in business: <b>${uw.tib_bank}mo</b> bank · <b>${uw.tib_alt}mo</b> alt.` : `Industry sets the product stack and the baseline lender appetite that every other factor adjusts.`;
    const m=d.tier&&d.tier!=='n'?matchPool(d.code,d.tier):null;
    if(m){ cross=`<div class="fac-cross">
      <div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt"><b>${m.specialty.length}</b> industry-specialist lender${m.specialty.length===1?'':'s'} and <b>${m.productMatch.length}</b> product-match lenders fund this stack.</span></div>
      ${isGenericCode(d.code)?`<div class="cross-item drag"><span class="ci-ico">${I.drag}</span><span class="ci-txt">This is a <b>catch-all code</b> — it only matches broad-sector lenders, which suppresses the read. If the business has a specific trade, pick that code.</span></div>`:''}
    </div>`; }
  } else {
    logic = FACTOR_LOGIC[kind];
    const v=d[kind];
    if(v!=null && pool.length){
      const ko=factorKnockout(kind,d,pool); const ul=factorUnlock(kind,d,pool);
      const items=[];
      if(ko.fails>0) items.push(`<div class="cross-item drag"><span class="ci-ico">${I.drag}</span><span class="ci-txt"><b>${ko.fails} of ${ko.total}</b> matched lenders need ${KIND_NOUN[kind]} than this — they're out at the current value.</span></div>`);
      else if(ko.gated>0) items.push(`<div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt">Clears every one of the ${ko.total} matched lenders on this factor.</span></div>`);
      if(ul && (ul.lenderDelta>0 || ul.leverTxt)) items.push(`<div class="cross-item lift"><span class="ci-ico">${I.lift}</span><span class="ci-txt">${ul.text}</span></div>`);
      if(items.length) cross=`<div class="fac-cross">${items.join('')}</div>`;
    }
  }
  // per-factor talk track
  const ft=buildFactorTrack(kind,d);
  const mode=(S._facTalk&&S._facTalk[kind])||'talk';
  const talk=`<div class="fac-talk">
    <div class="fac-talk-head"><span class="eyebrow">Explain ${kind==='industry'?'the industry':'this factor'} to the borrower</span>
      <div class="fac-talk-seg"><button class="${mode==='talk'?'on':''}" onclick="facTalkTab('${kind}','talk')">Talk</button><button class="${mode==='text'?'on':''}" onclick="facTalkTab('${kind}','text')">Text</button></div>
      <button class="fac-talk-copy" id="facCopy-${kind}" onclick="copyFacTalk('${kind}')">${I.copy}Copy</button></div>
    <div class="fac-talk-body" id="facTalk-${kind}">${mode==='talk'?'“'+ttRender(ft.talk)+'”':ttRender(ft.text)}</div>
  </div>
  <button class="fac-pdf" onclick="openPdf('${kind}')">${I.pdf} Generate a one-pager on this factor</button>`;
  return `<div class="fac-logic">${logic}</div>${cross}${talk}`;
}
function toggleFac(kind){
  S.facOpen[kind]=!S.facOpen[kind]; save();
  document.getElementById('fac-'+kind).classList.toggle('open',S.facOpen[kind]);
}
function facTalkTab(kind,mode){
  if(!S._facTalk) S._facTalk={}; S._facTalk[kind]=mode;
  const d=currentDeal(); const ft=buildFactorTrack(kind,d);
  document.getElementById('facTalk-'+kind).innerHTML=mode==='talk'?'“'+ttRender(ft.talk)+'”':ttRender(ft.text);
  document.querySelectorAll(`#fac-${kind} .fac-talk-seg button`).forEach(b=>b.classList.toggle('on',b.textContent.toLowerCase()===mode));
}
function copyFacTalk(kind){
  const d=currentDeal(); const ft=buildFactorTrack(kind,d);
  const mode=(S._facTalk&&S._facTalk[kind])||'talk';
  navigator.clipboard.writeText(mode==='talk'?'“'+ttPlain(ft.talk)+'”':ttPlain(ft.text)).then(()=>{
    const b=document.getElementById('facCopy-'+kind); if(!b)return; b.innerHTML=I.copy+'Copied'; b.classList.add('ok'); setTimeout(()=>{b.innerHTML=I.copy+'Copy';b.classList.remove('ok');},1500);
  });
}

// generic warning
function gwarnHTML(d){
  if(!isGenericCode(d.code)) return '';
  const sibs=specificSiblings(d.code).slice(0,6);
  const chips=sibs.map(s=>{const tc=TC[TIER[s.c]||'g'];return `<button class="gw-chip" onclick="pickIndustry('${s.c}')"><span class="gwc-code">${s.c}</span><span style="font-size:11px;color:var(--ink)">${ttEsc(s.d.length>26?s.d.slice(0,24)+'…':s.d)}</span><span class="gwc-dot" style="background:var(--t${tc})"></span></button>`;}).join('');
  return `<div class="gwarn"><div class="gw-h"><span class="gw-bang">!</span><span class="gw-t">Catch-all code — verify before you trust this read</span></div>
    <div class="gw-b">This is a general “all-other” code. Catch-all buckets only match broad-sector lenders and underwriting defaults them conservative. <b>If the business has a specific trade, pick that code instead.</b></div>
    ${sibs.length?`<div class="gw-chips">${chips}</div>`:''}</div>`;
}

// ════════════════════════════════════════════════════════════
//  INPUT HANDLERS
// ════════════════════════════════════════════════════════════
function onInput(kind, raw){
  raw=String(raw).trim();
  if(kind==='fico'){ const n=parseInt(raw); S.ficoBad=raw!==''&&(isNaN(n)||n<300||n>850); S.fico=(!S.ficoBad&&n)?n:null; }
  else if(kind==='tib'){ const n=parseFloat(raw); S.tib=(!isNaN(n)&&n>0)?(S.tibUnit==='yr'?Math.round(n*12):Math.round(n)):null; }
  else if(kind==='rev'){ S.rev=parseInt(raw)||null; }
  else if(kind==='amount'){ S.reqAmt=parseInt(raw)||null; }
  save();
  // update this field's status inline (no rebuild → caret kept)
  const tag=document.getElementById('tag-'+kind); if(tag) tag.innerHTML=tagHTML(kind);
  const fld=document.querySelector(`.field[data-field="${kind}"]`); if(fld&&kind==='fico') fld.classList.toggle('invalid',S.ficoBad);
  renderRead(); renderBand();
}
function onIndSearch(v){
  S.q=v; save();
  const r=document.getElementById('indRes'); if(!r) return;
  const q=v.trim(); const matches=searchMatches().slice(0,24);
  r.innerHTML=q?(matches.length?matches.map(irRow).join(''):`<div class="ir-row" style="cursor:default;color:var(--muted);font-size:12px">No match — try a shorter keyword or a 6-digit code.</div>`):'';
  r.classList.toggle('open',!!q);
  const quick=document.querySelector('#inputs .quick'); if(quick) quick.style.display=q?'none':'flex';
}
function pickIndustry(code){
  S.selected=code; S.indEditing=false; S.q=''; S.prodIdx=0; _prevProxy={}; save();
  renderInputs(); renderRead(); renderBand();
}
function editIndustry(){ S.indEditing=true; renderInputs(); }
function hideTip(){ S.tipHidden=true; save(); const t=document.querySelector('.tip'); if(t) t.classList.add('hidden'); }

// ── mode ──────────────────────────────────────────────────────
function setMode(m){
  S.mode=m; document.body.dataset.mode=m; save();
  document.querySelectorAll('#modeseg button').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  renderRead(); renderBand();
}

// ── copy results ──────────────────────────────────────────────
function copyResults(){
  if(!requireFundBy()) return;
  if(!requireState()) return;
  const d=currentDeal(); const e=NAICS_DB.find(n=>n.c===d.code); const lv=computeLevers(d);
  const L=['LENDPAPER — DEAL READ'];
  L.push(`Industry: ${d.code} ${e?e.d:''} (${TIER_SHORT[d.tier]})`);
  const prof=[]; if(S.fico)prof.push(`FICO ${S.fico}`); if(S.tib)prof.push(`${S.tib}mo TIB`); if(S.rev)prof.push(`$${S.rev.toLocaleString()}/mo`);
  if(prof.length) L.push(`Profile: ${prof.join(' · ')}`);
  if(S.fundBy) L.push(`Funding needed by: ${fundByLabel(S.fundBy)}`);
  if(lv){
    if(lv.amount) L.push(`Amount: ${lv.amount}  ·  Term: ${lv.term}  ·  Rate: ${lv.rate}`);
    L.push(`Payment: ${lv.pay}  ·  Lead product: ${prodDisplay(lv.product)}`);
    const aff=affordability(d,lv.atr);
    if(aff) L.push(`Est. payment: ${aff.perPayment!=null?fmtUSD(aff.perPayment)+aff.perLabel:'scales w/ invoices'}  ·  Total payback: ${fmtUSD(aff.paybackTotal)}  ·  Cost of capital: ${fmtUSD(aff.costTotal)}`);
    if(S.state==='NY'||S.state==='CA'){ const apr=approxAPR(lv.atr); if(apr) L.push(`APR (${S.state}): ${apr.lo===apr.hi?apr.lo:apr.lo+'–'+apr.hi}%${apr.exact?'':' (approx — short-term product, annualized figure looks high)'}`); }
  }
  if(S.reqAmt) L.push(`Requested: $${S.reqAmt.toLocaleString()}`);
  if(anyExpectation()){ const gaps=expectationGaps(d, lv?lv.atr:null); if(gaps.length){ L.push('Expectation vs. read:'); gaps.forEach(g=>L.push(`  • ${g.lever}: wants ${g.exp} → ${g.act}`)); } }
  L.push('— ESTIMATE, NOT AN OFFER. Final amount, term, rate & payment set by lender underwriting; figures can change.');
  saveDealReadEstimate(false);
  navigator.clipboard.writeText(L.join('\n')).then(()=>{
    const b=document.getElementById('copyResultsBtn'); if(!b)return; b.innerHTML=I.copy+'<span>Copied</span>'; b.classList.add('ok'); setTimeout(()=>{b.innerHTML=I.copy+'<span>Copy results</span>';b.classList.remove('ok');},1700);
  });
}

// ── PDF ───────────────────────────────────────────────────────
function openPdf(scope){
  if(!S.selected) return;
  if(!requireFundBy()) return;
  if(!requireState()) return;
  S.pdfScope=scope||'combined';
  if(!S.lang) S.lang='en';
  document.querySelectorAll('#langTg button').forEach(b=>b.classList.toggle('on',b.dataset.lang===S.lang));
  buildPdfPicker();
  renderPdfDoc();
  document.getElementById('pdfOverlay').classList.add('open');
}
function closePdf(){ document.getElementById('pdfOverlay').classList.remove('open'); }
// Route the deal-memo through the shared LendPaper PDF pipeline: Quote ID, 3-layer
// anti-fraud watermark, tiered brand header (.print-header-content), legal footer.
function savePdf(btn){
  const doc=document.getElementById('pdfDoc'); if(!doc) return;
  const lang=S.lang||'en'; const scope=S.pdfScope||'combined'; const pl=PLAN_I18N[lang]||PLAN_I18N.en;
  const title=(scope!=='combined' && pl.facTitle && pl.facTitle[scope]) ? pl.facTitle[scope] : (pl.title||'Deal Read');
  const d=currentDeal(); const e=(d&&d.code)?NAICS_DB.find(n=>n.c===d.code):null;
  const slug=e?('-'+String(e.d||'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,40)):'';
  const fileBase='LendPaper-DealRead'+slug;
  if(window.PDF_HELPER && PDF_HELPER.generatePDF){
    const orig=btn?btn.innerHTML:'';
    if(btn) btn.disabled=true;
    PDF_HELPER.generatePDF(doc, String(title).toUpperCase(), fileBase+'.pdf', btn, orig)
      .then(()=>{ saveDealReadEstimate(true); }).catch(()=>{});
  } else {
    window.print();
    saveDealReadEstimate(true);
  }
}
// Quote Log (LEN-123): log every read on Copy + Save PDF. Schemaless params; silent
// localStorage fallback when Supabase/the table aren't available.
function saveDealReadEstimate(pdfGenerated){
  try{
    if(!window.saveEstimate) return;
    const d=currentDeal(); if(!d || !d.code) return;
    const e=NAICS_DB.find(n=>n.c===d.code); const lv=computeLevers(d);
    const aff=lv?affordability(d,lv.atr):null;
    let apr=null;
    if((S.state==='NY'||S.state==='CA') && lv){ const a=approxAPR(lv.atr); if(a) apr=(a.lo===a.hi?String(a.lo):a.lo+'–'+a.hi)+'%'; }
    window.saveEstimate({
      calculator_type:'deal_read',
      params:{
        naics:d.code, industry:e?e.d:'', tier:d.tier,
        fico:S.fico, tib:S.tib, monthly_revenue:S.rev, requested_amount:S.reqAmt,
        lead_product: lv?prodDisplay(lv.product):null,
        amount: lv?lv.amount:null, term: lv?lv.term:null, rate: lv?lv.rate:null, payment: lv?lv.pay:null,
        est_payment: (aff&&aff.perPayment!=null)?fmtUSD(aff.perPayment)+aff.perLabel:null,
        cost_of_capital: aff?fmtUSD(aff.costTotal):null,
        share_of_deposits: (aff&&aff.pct!=null)?Math.round(aff.pct*100)+'%':null,
        apr: apr,
        borrower_state: S.state||''
      },
      pdf_generated: !!pdfGenerated
    });
  }catch(e){}
}
function setPdfScope(s){ S.pdfScope=s; buildPdfPicker(); renderPdfDoc(); }
function setLang(l){ S.lang=l; save(); document.querySelectorAll('#langTg button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l)); renderPdfDoc(); }
function buildPdfPicker(){
  const scopes=[['combined','Combined'],['industry','Industry']];
  if(S.fico) scopes.push(['fico','FICO']);
  if(S.tib) scopes.push(['tib','Time']);
  if(S.rev) scopes.push(['rev','Revenue']);
  document.getElementById('pdfPick').innerHTML=scopes.map(([s,l])=>`<button class="${S.pdfScope===s?'on':''}" onclick="setPdfScope('${s}')">${l}</button>`).join('');
}

// ── Tweaks ────────────────────────────────────────────────────
function applyTweaks(){
  const t=S.tweaks; const a=ACCENTS[t.accent]||ACCENTS.forest; const r=document.documentElement.style;
  r.setProperty('--green',a.green); r.setProperty('--green-dk',a.dk); r.setProperty('--green-wash',a.wash); r.setProperty('--green-line',a.line);
  document.body.dataset.density=t.density;
  document.body.dataset.discl=t.disclosures;
}
function buildTweaks(){
  const t=S.tweaks;
  const seg=(label,key,opts)=>`<div class="tw-row"><label>${label}</label><div class="seg2">${opts.map(o=>`<button class="${t[key]===o?'on':''}" onclick="setTweak('${key}','${o}')">${o}</button>`).join('')}</div></div>`;
  document.getElementById('twBody').innerHTML=`
    <div class="tw-sec">Accent</div>
    <div class="tw-row"><div class="swatches">${Object.keys(ACCENTS).map(k=>`<div class="swatch ${t.accent===k?'on':''}" style="background:${ACCENTS[k].green}" title="${k}" onclick="setTweak('accent','${k}')"></div>`).join('')}</div></div>
    <div class="tw-sec">Density</div>${seg('Layout','density',['regular','compact'])}
    <div class="tw-sec">Compliance disclosures</div>${seg('Show','disclosures',['show','hide'])}
    <div class="tw-sec">Live cross-effect deltas</div>${seg('Animate','deltas',['on','off'])}`;
}
function setTweak(k,val){ S.tweaks[k]=val; save(); applyTweaks(); buildTweaks(); renderRead(); renderBand(); window.parent.postMessage({type:'__edit_mode_set_keys',edits:{[k]:val}},'*'); }
function dismissTweaks(){ document.getElementById('tweaks').classList.remove('open'); window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); }
window.addEventListener('message',e=>{ const ty=e?.data?.type;
  if(ty==='__activate_edit_mode') document.getElementById('tweaks').classList.add('open');
  else if(ty==='__deactivate_edit_mode') document.getElementById('tweaks').classList.remove('open');
});
(function(){ const head=document.getElementById('twHead'),panel=document.getElementById('tweaks'); let dx=0,dy=0,drag=false;
  head.addEventListener('mousedown',e=>{drag=true;dx=e.clientX-panel.offsetLeft;dy=e.clientY-panel.offsetTop;e.preventDefault();});
  window.addEventListener('mousemove',e=>{if(!drag)return;panel.style.left=(e.clientX-dx)+'px';panel.style.top=(e.clientY-dy)+'px';panel.style.right='auto';panel.style.bottom='auto';});
  window.addEventListener('mouseup',()=>drag=false);
})();
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePdf(); });
document.addEventListener('click',e=>{ const r=document.getElementById('indRes');
  if(r&&r.classList.contains('open')&&!e.target.closest('.field')&&!S.indEditing){ /* keep */ }
});

// ── boot ──────────────────────────────────────────────────────
function boot(){
  load();
  if(S.selected && !NAICS_DB.find(n=>n.c===S.selected)) S.selected=null;
  document.body.dataset.mode=S.mode;
  document.querySelectorAll('#modeseg button').forEach(b=>b.classList.toggle('on',b.dataset.mode===S.mode));
  applyTweaks(); buildTweaks();
  renderInputs(); renderRead(); renderBand();
  window.parent.postMessage({type:'__edit_mode_available'},'*');
}
document.addEventListener('DOMContentLoaded',boot);
