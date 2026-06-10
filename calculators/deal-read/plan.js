/* ════════════════════════════════════════════════════════════
   LendPaper · Deal Read — PDF generator (combined + per-factor)
   Bilingual EN/ES. Indicative framing — not advice, not an offer.
   ════════════════════════════════════════════════════════════ */

const PROD_WHY_ES = {
  'SBA 7(a)':'el capital de menor costo y mayor plazo al que puede acceder un pequeño negocio',
  'SBA 504':'financiamiento a largo plazo y tasa fija para bienes raíces y equipo mayor',
  'CRE':'financiamiento a largo plazo garantizado por la propiedad',
  'Term Loan':'una suma fija con pagos predecibles que construye el crédito de su negocio',
  'LOC':'capital rotativo y flexible que solo paga cuando lo usa',
  'Equipment':'el equipo mismo garantiza el préstamo, por lo que se financia más rápido y cuesta menos',
  'Bridge':'capital de corto plazo para avanzar mientras se concreta el financiamiento permanente',
  'Factoring':'efectivo por sus facturas pendientes hoy, en lugar de esperar 30 a 90 días',
  'MCA':'capital de trabajo rápido adelantado contra sus ventas diarias, con poco papeleo',
  'RBF':'capital que se ajusta a sus ventas, pagado como un pequeño porcentaje de ingresos',
};

const PLAN_I18N = {
  en:{
    eyebrow:'Prepared for you by LendPaper', title:'Your Financing Plan',
    sub:(ind)=>`A clear look at what your business — ${ind} — can access today, and the path beyond it.`,
    profile:'Your profile', fico:'Credit (FICO)', tib:'Time in business', rev:'Monthly revenue', none:'not provided', months:'months',
    today:'What you qualify for today',
    todayLead:`Based on the profile we reviewed, here is a reasonable, defensible range of what a business like yours can access in today's market. These are indicative ranges — the exact offer is confirmed by the lender once your file is complete.`,
    amount:'Amount', term:'Term', rate:'Rate', payment:'Payment', product:'Lead product',
    estH:'Important — this is an estimate', estBody:'The figures below are indicative ranges based on the information provided and current market conditions. They are not an offer or commitment to lend. Final amount, term, rate, and payment are set solely by the lender\u2019s underwriting and can change.',
    aprH:'About the APR', afford:'What the payment looks like', affPay:'Est. payment', affPayback:'Total payback', affCost:'Cost of capital', affOf:'of monthly deposits',
    gapsH:'What you asked for vs. what fits today', gapWants:'You asked for', gapGets:'What fits',
    ack:'Acknowledgement & signatures',
    products:'The products that fit', lead:'BEST FIT',
    path:'Your path forward',
    footer:'This plan is for general informational purposes and is not financial, legal, or tax advice, nor an offer or commitment to lend. Amounts, terms, and rates shown are indicative ranges based on the information provided and prevailing market conditions; actual terms are set solely by each lender\u2019s underwriting and can change over time. Future funding depends on your business\u2019s performance and is never guaranteed.',
    mca:'A merchant cash advance is a purchase of future receivables, not a loan, and does not build business credit.',
    sgClient:'Borrower', sgRep:'LendPaper representative', sgDate:'Date',
    // per-factor
    facTitle:{industry:'Your Industry & Why It Shapes the Offer',fico:'Your Credit & What It Means',tib:'Your Time in Business & What It Unlocks',rev:'Your Revenue & How We Size It'},
    facSub:'A plain-language look at one piece of your file — what it is, and exactly how it moves your offer.',
    facReads:'What this means', facDrives:'What it drives', facSay:'In plain terms',
    facLever:{industry:'Product type',fico:'Rate / cost of capital',tib:'Term length',rev:'Funding amount'},
  },
  es:{
    eyebrow:'Preparado para usted por LendPaper', title:'Su Plan de Financiamiento',
    sub:(ind)=>`Una visión clara de lo que su negocio — ${ind} — puede obtener hoy, y el camino a seguir.`,
    profile:'Su perfil', fico:'Crédito (FICO)', tib:'Tiempo en el negocio', rev:'Ingreso mensual', none:'no proporcionado', months:'meses',
    today:'Para lo que califica hoy',
    todayLead:`Según el perfil que revisamos, este es un rango razonable y defendible de lo que un negocio como el suyo puede obtener en el mercado actual. Son rangos indicativos — la oferta exacta la confirma el prestamista una vez completo su expediente.`,
    amount:'Monto', term:'Plazo', rate:'Tasa', payment:'Pago', product:'Producto principal',
    estH:'Importante — esto es un estimado', estBody:'Las cifras siguientes son rangos indicativos basados en la informaci\u00f3n proporcionada y las condiciones del mercado. No constituyen una oferta ni un compromiso de pr\u00e9stamo. El monto, plazo, tasa y pago finales los determina \u00fanicamente el an\u00e1lisis del prestamista y pueden cambiar.',
    aprH:'Sobre el APR', afford:'C\u00f3mo se ve el pago', affPay:'Pago estimado', affPayback:'Pago total', affCost:'Costo del capital', affOf:'de los dep\u00f3sitos mensuales',
    gapsH:'Lo que pidi\u00f3 vs. lo que aplica hoy', gapWants:'Usted pidi\u00f3', gapGets:'Lo que aplica',
    ack:'Reconocimiento y firmas',
    products:'Los productos que encajan', lead:'MEJOR OPCIÓN',
    path:'Su camino a seguir',
    footer:'Este plan tiene fines informativos generales y no constituye asesoría financiera, legal o fiscal, ni una oferta o compromiso de préstamo. Los montos, plazos y tasas mostrados son rangos indicativos basados en la información proporcionada y las condiciones del mercado; los términos reales los determina únicamente el análisis de cada prestamista y pueden cambiar con el tiempo. El financiamiento futuro depende del desempeño de su negocio y nunca está garantizado.',
    mca:'Un adelanto de efectivo (MCA) es una compra de cuentas por cobrar futuras, no un préstamo, y no construye crédito comercial.',
    sgClient:'Prestatario', sgRep:'Representante de LendPaper', sgDate:'Fecha',
    facTitle:{industry:'Su Industria y Por Qué Define la Oferta',fico:'Su Crédito y Qué Significa',tib:'Su Tiempo en el Negocio y Qué Abre',rev:'Sus Ingresos y Cómo Dimensionamos'},
    facSub:'Una mirada en lenguaje claro a una parte de su expediente — qué es y cómo mueve su oferta.',
    facReads:'Qué significa', facDrives:'Qué define', facSay:'En palabras simples',
    facLever:{industry:'Tipo de producto',fico:'Tasa / costo del capital',tib:'Plazo',rev:'Monto de financiamiento'},
  },
};

function planMonths(t, lang){ return `${t.lo} – ${t.hi} ${PLAN_I18N[lang].months}`; }
function pathBody(lang, leadLabel, destLabel, climbing){
  if(lang==='es') return climbing
    ? `El punto de partida recomendado hoy es ${leadLabel} — diseñado para poner capital a trabajar de inmediato. A medida que su negocio acumula un historial de pagos puntuales, normalmente de 6 a 12 meses, califica para ${destLabel}, con plazos más largos y menor costo. El plan es subirlo por esa escalera con el tiempo, no detenerse aquí.`
    : `Usted ya califica para capital sólido y de bajo costo con ${leadLabel}. De aquí en adelante, el enfoque es proteger el crédito y el flujo de caja que lo llevaron ahí, para que cada ronda futura sea aún más favorable.`;
  return climbing
    ? `Today's recommended starting point is ${leadLabel} — built to get capital working now. As your business builds a record of on-time payments, typically 6 to 12 months, you become eligible for ${destLabel}, with longer terms and lower cost. The plan is to move you up that ladder over time, not to stop here.`
    : `You already qualify for strong, low-cost capital with ${leadLabel}. From here, the focus is protecting the credit and cash flow that got you there, so every future round is even more favorable.`;
}
function pdfStrip(s){ return String(s).replace(/[⟦⟧]/g,'').replace(/<[^>]+>/g,''); }
// Personalize-this-estimate line for the PDF (LEN-227).
function prepLine(lang){
  const p=S.prep||{}; const by=(p.by||'').trim(), co=(p.company||'').trim(), forr=(p.forr||'').trim();
  if(!by && !co && !forr) return '';
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const byLbl=lang==='es'?'Preparado por':'Prepared by';
  const forLbl=lang==='es'?'Preparado para':'Prepared for';
  const parts=[];
  if(by||co){ const who=[by,co].filter(Boolean).map(esc).join(' · '); parts.push(`<b>${byLbl}:</b> ${who}`); }
  if(forr){ parts.push(`<b>${forLbl}:</b> ${esc(forr)}`); }
  return `<div class="pd-prep" style="font-size:11.5px;line-height:1.5;color:var(--ink-2);margin:-14px 0 22px;padding-bottom:14px;border-bottom:1px solid var(--line)">${parts.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>`;
}

function renderPdfDoc(){
  const doc=document.getElementById('pdfDoc'); if(!doc) return;
  const lang=S.lang||'en'; const t=PLAN_I18N[lang];
  const d=currentDeal();
  if(!d.code){ doc.innerHTML=`<p>${lang==='es'?'Seleccione una industria primero.':'Select an industry first.'}</p>`; return; }
  if(S.pdfScope && S.pdfScope!=='combined'){ doc.innerHTML=factorDoc(S.pdfScope,d,lang,t); return; }

  const e=NAICS_DB.find(n=>n.c===d.code);
  const ind=(e?e.d:'').replace(/\s*\(.*?\)\s*/g,' ').trim();
  const atr=d.leadProduct?computeATR(d):null;
  const today=new Date().toLocaleDateString(lang==='es'?'es-ES':'en-US',{year:'numeric',month:'long',day:'numeric'});

  // five-lever cells
  let cellsHtml='';
  if(atr){
    const amt=atr.amount?atrAmountText(atr.amount):'—';
    const pay=payFreqFor(atr.fam); const prod=d.prods.length?prodDisplay(d.prods[0][0]):'—';
    cellsHtml=`<div class="pd-atr five">
      <div class="pd-cell"><div class="k">${t.amount}</div><div class="v">${amt}</div></div>
      <div class="pd-cell"><div class="k">${t.term}</div><div class="v">${planMonths(atr.term,lang)}</div></div>
      <div class="pd-cell"><div class="k">${t.rate}</div><div class="v">${atrRateText(atr.rate)}</div></div>
      <div class="pd-cell"><div class="k">${t.payment}</div><div class="v">${pay}</div></div>
      <div class="pd-cell" style="grid-column:1 / -1"><div class="k">${t.product}</div><div class="v">${prod}</div></div>
    </div>`;
  }
  const lead=d.prods.length?pn(d.prods[0][0]):null;
  let dest=null; d.prods.forEach(([l])=>{const p=pn(l); if(p.credit&&(!dest||p.rank>dest.rank)) dest={...p,label:l};});
  const climbing=!!(lead&&dest&&dest.rank>lead.rank);
  const prodHtml=d.prods.length?`<div class="pd-prod">${d.prods.slice(0,4).map(([l],i)=>{
    const why=lang==='es'?(PROD_WHY_ES[l]||pn(l).why):pn(l).why;
    return `<div class="pd-prod-item"><span class="pn">${prodDisplay(l)}${i===0?` · ${t.lead}`:''}</span><span>${why}.</span></div>`;
  }).join('')}</div>`:`<p>${lang==='es'?'No hay un producto estándar para esta industria en este momento.':'No standard product fits this industry at this time.'}</p>`;

  const prof=[]; if(S.fico)prof.push(`${t.fico}: ${S.fico}`); if(S.tib)prof.push(`${t.tib}: ${S.tib} ${t.months}`); if(S.rev)prof.push(`${t.rev}: $${S.rev.toLocaleString()}/mo`);
  const hasMCA=d.prods.some(([l])=>l==='MCA'||l==='RBF');
  const disc=(hasMCA?t.mca+' ':'')+t.footer;

  // estimate banner
  const estBanner=`<div style="border:1px solid var(--t3-line);background:#fbf4e4;border-radius:8px;padding:13px 15px;margin:18px 0 4px"><div style="font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8a6a14;margin-bottom:4px">${t.estH}</div><div style="font-size:12px;line-height:1.55;color:#6b5310">${t.estBody}</div></div>`;
  // APR (NY/CA)
  let aprHtml='';
  if(atr && aprStateRequired(S.state)){
    const apr=approxAPR(atr);
    if(apr){ const aprTxt=`${apr.rep}%${apr.lo!==apr.hi?` (range ${apr.lo}-${apr.hi}%)`:''}`;
      let why=aprWhy(atr,lang); const af=affordability(d,atr); if(why.indexOf('$X_COST')>=0) why=why.replace('$X_COST', af?fmtUSD(af.costTotal):'the fixed fee');
      aprHtml=`<h2>${t.aprH}</h2><p><b>APR ${aprTxt}${apr.exact?'':' (approx.)'} · ${S.state}.</b> ${why}</p>`;
    }
  }
  // affordability
  let affHtml=''; const aff=atr?affordability(d,atr):null;
  if(aff){ const pct=aff.pct!=null?` · ${Math.round(aff.pct*100)}% ${t.affOf}`:'';
    affHtml=`<h2>${t.afford}</h2><div class="pd-atr"><div class="pd-cell"><div class="k">${t.affPay}</div><div class="v">${aff.perPayment!=null?fmtUSD(aff.perPayment)+aff.perLabel:'—'}</div></div><div class="pd-cell"><div class="k">${t.affPayback}</div><div class="v">${fmtUSD(aff.paybackTotal)}</div></div><div class="pd-cell"><div class="k">${t.affCost}</div><div class="v">${fmtUSD(aff.costTotal)}</div></div></div><p>${aff.perMonth!=null?`≈ ${fmtUSD(aff.perMonth)}/mo${pct}. `:''}${aff.verdict}.</p>`;
  }
  // expectation gaps
  let gapHtml='';
  if(anyExpectation()){ const gaps=expectationGaps(d,atr);
    if(gaps.length) gapHtml=`<h2>${t.gapsH}</h2><div class="pd-prod">${gaps.map(g=>`<div class="pd-prod-item"><span class="pn">${g.lever}: ${pdfStrip(g.exp)} → ${pdfStrip(g.act)}</span><span>${pdfStrip(g.why)}</span></div>`).join('')}</div>`;
  }

  doc.innerHTML=`
    <div class="print-header-content"></div>
    <div class="pd-eyebrow">${t.eyebrow}</div>
    <h1>${t.title}</h1>
    <div class="pd-sub">${t.sub(ind)} · ${today}</div>
    ${prepLine(lang)}
    ${estBanner}
    ${prof.length?`<h2>${t.profile}</h2><p>${prof.join(' &nbsp;·&nbsp; ')}</p>`:''}
    <h2>${t.today}</h2>
    <p>${t.todayLead}</p>
    ${cellsHtml}
    ${aprHtml}
    ${affHtml}
    ${gapHtml}
    <h2>${t.products}</h2>
    ${prodHtml}
    <h2>${t.path}</h2>
    <p>${pathBody(lang, lead?prodDisplay(d.prods[0][0]):'', dest?prodDisplay(dest.label):'', climbing)}</p>
    <div class="pd-foot">* ${disc}<br><span style="display:inline-block;margin-top:6px">Full terms: <a href="https://lendpaper.com/legal/estimates" style="color:var(--green-dk);font-weight:600;text-decoration:none">lendpaper.com/legal/estimates</a></span></div>`;
}

// ── per-factor one-pager ──────────────────────────────────────
function factorDoc(kind, d, lang, t){
  const e=NAICS_DB.find(n=>n.c===d.code);
  const ind=(e?e.d:'').replace(/\s*\(.*?\)\s*/g,' ').trim();
  const today=new Date().toLocaleDateString(lang==='es'?'es-ES':'en-US',{year:'numeric',month:'long',day:'numeric'});
  const ft=buildFactorTrack(kind,d);
  const lever=t.facLever[kind];

  // value + read
  let valTxt, readTxt;
  if(kind==='industry'){
    valTxt=`${d.code} · ${ind} (${({g:'Tier 1 · Prime',w:'Tier 2 · Alt-lending',r:'Tier 3 · High scrutiny',n:'Tier 4 · Restricted'})[d.tier]})`;
    readTxt=pdfStrip(ft.talk);
  } else {
    const v=d[kind]; const b=factorRead(kind,v);
    valTxt=kind==='fico'?`${v}`:kind==='tib'?`${v} ${t.months}`:`$${Number(v).toLocaleString()}/mo`;
    if(b) valTxt+=` — ${b.tag}`;
    readTxt=pdfStrip(ft.talk);
  }

  // the value it drives (the lever output)
  let driveVal='—';
  if(d.leadProduct){
    const atr=computeATR(d);
    if(kind==='industry') driveVal=prodDisplay(d.leadProduct);
    else if(kind==='fico') driveVal=atrRateText(atr.rate);
    else if(kind==='tib') driveVal=planMonths(atr.term,lang);
    else if(kind==='rev') driveVal=atr.amount?atrAmountText(atr.amount):'—';
  }

  const hasMCA=d.prods.some(([l])=>l==='MCA'||l==='RBF');
  const disc=(hasMCA&&kind!=='fico'?t.mca+' ':'')+t.footer;
  const estBanner=`<div style="border:1px solid var(--t3-line);background:#fbf4e4;border-radius:8px;padding:12px 14px;margin:16px 0 4px"><div style="font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8a6a14;margin-bottom:4px">${t.estH}</div><div style="font-size:11.5px;line-height:1.5;color:#6b5310">${t.estBody}</div></div>`;

  return `
    <div class="print-header-content"></div>
    <div class="pd-eyebrow">${t.eyebrow}</div>
    <h1>${t.facTitle[kind]}</h1>
    <div class="pd-sub">${t.facSub} · ${today}</div>
    ${prepLine(lang)}
    ${estBanner}

    <div class="pd-atr">
      <div class="pd-cell"><div class="k">${PLAN_I18N[lang].profile}</div><div class="v" style="font-size:13px">${valTxt}</div></div>
      <div class="pd-cell"><div class="k">${t.facDrives}</div><div class="v" style="font-size:13px">${lever}</div></div>
      <div class="pd-cell"><div class="k">${lever}</div><div class="v">${driveVal}</div></div>
    </div>

    <h2>${t.facReads}</h2>
    <p>${readTxt}</p>

    <h2>${t.facSay}</h2>
    <p>“${pdfStrip(ft.text)}”</p>

    <div class="pd-foot">* ${disc}<br><span style="display:inline-block;margin-top:6px">Full terms: <a href="https://lendpaper.com/legal/estimates" style="color:var(--green-dk);font-weight:600;text-decoration:none">lendpaper.com/legal/estimates</a></span></div>`;
}
