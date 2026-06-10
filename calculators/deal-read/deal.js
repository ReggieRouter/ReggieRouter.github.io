/* ════════════════════════════════════════════════════════════
   LendPaper · Deal Read — expectation, affordability & APR engine
   Reads shared global S. Loaded after talk.js, before read.js.
   ════════════════════════════════════════════════════════════ */

// ── Short-Term Financing surface label (LEN-162) ──────────────
// Broker-facing umbrella for the MCA/RBF product. The structural split
// (MCA = Receivables Purchase Agreement + performance guarantee · STL/BLA =
// Business Loan Agreement + personal guarantee) is surfaced in the product
// modal. Client-facing copy still says "Revenue-Based Financing" (see talk.js).
function prodDisplay(label){ if(!label) return label; if(label==='MCA'||label==='RBF') return 'Short-Term Financing'; return label; }

// ── Requested-product options (what the borrower asked for) ───
const REQ_PRODUCTS=[
  ['','No preference'],['mca','Short-Term Financing'],['loc','Line of credit'],
  ['term','Term loan'],['sba','SBA / longer term'],['equip','Equipment'],['factor','Factoring'],
];
const REQ_LABEL={mca:'Short-Term Financing',rbf:'Short-Term Financing',loc:'a line of credit',term:'a term loan',sba:'an SBA / longer-term loan',equip:'equipment financing',factor:'invoice factoring',cre:'a CRE loan',bridge:'a bridge loan'};
const PROD_REQ={
  sba:'roughly 660+ credit minimum (680+ recommended — score can shift during underwriting) and two years in business',
  loc:'around 640+ credit and steady, bankable revenue',
  term:'roughly 600+ credit and 12–24 months in business',
  equip:'equipment to pledge as collateral',
  factor:'business-to-business invoices to factor',
  cre:'commercial real estate as collateral',
  bridge:'a clear near-term takeout',
  mca:'mainly consistent daily or weekly deposits',
};
const PAY_EXP=[['','No preference'],['monthly','Monthly'],['weekly','Weekly'],['daily','Daily']];

// ── APR-disclosure states (LEN-227) ───────────────────────────
// Derived from the live compliance matrix (compliance-rules.js, the machine
// mirror of LEGAL.md Part II) so this list AUTO-UPDATES as new disclosure laws
// take effect — no hardcoded NY/CA. A state triggers the APR surface when its
// disclosureLaw.aprRequired === true. Falls back to NY/CA if rules unavailable.
function aprStateCodes(){
  try{
    const st=window.LP_COMPLIANCE_RULES && window.LP_COMPLIANCE_RULES.states;
    if(st){
      const out=Object.keys(st).filter(k=>{ const dl=st[k]&&st[k].disclosureLaw; return dl&&dl.aprRequired===true; });
      if(out.length) return out;
    }
  }catch(e){}
  return ['NY','CA'];
}
const STATE_NAME_FALLBACK={NY:'New York',CA:'California',CT:'Connecticut',UT:'Utah',FL:'Florida',MD:'Maryland',DE:'Delaware'};
function aprStateName(code){
  try{ const s=window.LP_COMPLIANCE_RULES.states[code]; if(s&&s.name) return s.name; }catch(e){}
  return STATE_NAME_FALLBACK[code]||code;
}
function aprStateRequired(code){ return !!code && aprStateCodes().indexOf(code)>=0; }
// "Not NY or CA" / "Not NY, CA, or CT" — generated from the live set.
function notAprStateLabel(){
  const c=aprStateCodes();
  if(c.length===1) return 'Not '+c[0];
  if(c.length===2) return 'Not '+c[0]+' or '+c[1];
  return 'Not '+c.slice(0,-1).join(', ')+', or '+c[c.length-1];
}
// Inline list of code(s) for copy, e.g. "NY & CA" or "NY, CA & CT".
function aprStateInline(){
  const c=aprStateCodes();
  if(c.length===1) return c[0];
  return c.slice(0,-1).join(', ')+' &amp; '+c[c.length-1];
}
function buildUSStates(){
  return [['', notAprStateLabel()], ...aprStateCodes().map(c=>[c, aprStateName(c)])];
}
const US_STATES=buildUSStates();
function capW(s){ return s? s.charAt(0).toUpperCase()+s.slice(1):s; }

// ── Payment-affordability projection ──────────────────────────
// Builds an estimated periodic payment from the indicative band and
// tests it against monthly deposits. Conservative midpoints.
function affordability(deal, atr){
  if(!atr||!atr.amount||!deal.rev) return null;
  const rev=deal.rev;
  const amt=Math.round((atr.amount.lo+atr.amount.hi)/2);
  const termM=Math.max(1,Math.round((atr.term.lo+atr.term.hi)/2));
  const fam=atr.fam;
  let perMonth=null, paybackTotal, perPayment=null, perLabel='', cadence=payFreqFor(fam);
  if(atr.rate.kind==='factor'){
    const f=(atr.rate.lo+atr.rate.hi)/2;
    paybackTotal=amt*f; perMonth=paybackTotal/termM;
    if(fam==='mca'){ perPayment=paybackTotal/(termM*21.7); perLabel='/day'; }
    else { perPayment=paybackTotal/(termM*4.33); perLabel='/wk'; }
  } else if(atr.rate.kind==='apr'){
    const apr=((atr.rate.lo+atr.rate.hi)/2)/100, r=apr/12;
    perMonth = r>0 ? amt*r/(1-Math.pow(1+r,-termM)) : amt/termM;
    paybackTotal=perMonth*termM; perPayment=perMonth; perLabel='/mo'; cadence='Monthly';
  } else { // fee (factoring)
    const fee=((atr.rate.lo+atr.rate.hi)/2)/100; paybackTotal=amt*(1+fee);
  }
  const pct = perMonth!=null ? perMonth/rev : null;
  let tone, verdict;
  if(pct==null){ tone='g'; verdict='Cost scales with invoices funded — no fixed payment to carry'; }
  else if(pct<0.12){ tone='g'; verdict='Comfortable against current deposits'; }
  else if(pct<0.20){ tone='g'; verdict='Manageable against current deposits'; }
  else if(pct<0.30){ tone='w'; verdict='Tight — keep an eye on cash flow'; }
  else { tone='r'; verdict='Strained — size down or extend the term'; }
  return {amt,termM,perMonth,perPayment,perLabel,cadence,
    paybackTotal:Math.round(paybackTotal),costTotal:Math.round(paybackTotal-amt),
    pct,tone,verdict,kind:atr.rate.kind};
}
function fmtUSD(n){ return '$'+Math.round(n).toLocaleString(); }

// ── APR — exact for term/SBA, approximate for factor products ─
// Factor products are short-term; annualizing a fixed fee makes the
// percentage look enormous even when the dollar cost is modest.
function approxAPR(atr){
  if(!atr) return null;
  if(atr.rate.kind==='apr'){ const lo=Math.round(atr.rate.lo),hi=Math.round(atr.rate.hi); return {lo,hi,rep:Math.round((lo+hi)/2),exact:true}; }
  if(atr.rate.kind==='factor'){
    const f=(fac,months)=> ((fac-1)/(months/12))*2.0*100; // ~declining-balance approximation
    const lo=f(atr.rate.lo, atr.term.hi), hi=f(atr.rate.hi, atr.term.lo);
    const midF=(atr.rate.lo+atr.rate.hi)/2, midT=(atr.term.lo+atr.term.hi)/2;
    return {lo:Math.max(5,Math.round(lo)),hi:Math.round(hi),rep:Math.round(f(midF,midT)),exact:false};
  }
  return null;
}
// the plain-English reason APR looks the way it does
function aprWhy(atr, lang){
  const factor = atr && atr.rate.kind==='factor';
  const states = aprStateInline();
  if(lang==='es'){
    return factor
      ? `El APR es una cifra <b>anualizada</b> exigida en ${states}. Esto <b>no es un préstamo anual</b> — se paga en ~${atrTermText(atr.term)}. Anualizar un costo de corto plazo hace que el porcentaje parezca enorme aunque el costo en dólares sea modesto. El costo real es el factor <b>${atrRateText(atr.rate)}</b>.`
      : `El APR mostrado es la tasa anual real del producto, requerida en ${states}.`;
  }
  return factor
    ? `APR is an <b>annualized</b> figure required in ${states}. This is <b>not an annual loan</b> — it is repaid in about ${atrTermText(atr.term)}. Annualizing a short, fixed cost makes the percentage look enormous even when the dollar cost is modest. The real price is the <b>${atrRateText(atr.rate)}</b> — roughly <b>$X_COST</b> on the advance.`
    : `The APR shown is the product's true annual rate, required for disclosure in ${states}.`;
}

// ── Expectation vs. reality ───────────────────────────────────
// When the rep knows what the borrower wanted, spell out every gap.
function expectationGaps(deal, atr){
  const gaps=[];
  const leadFam = deal.leadProduct?prodFamily(deal.leadProduct):null;
  const leadDisp = deal.leadProduct?prodDisplay(deal.leadProduct):null;
  const profShort = (()=>{ const p=[]; if(deal.fico)p.push(`${deal.fico} credit`); if(deal.tib)p.push(`${deal.tib}mo`); return p.length?p.join(' / '):'this profile'; })();

  if(S.reqProduct && leadFam){
    const reqFam=S.reqProduct;
    if(reqFam===leadFam){
      gaps.push({lever:'Product',exp:capW(REQ_LABEL[reqFam]),act:leadDisp,status:'match',
        why:`What they asked for is exactly what leads here — an easy, aligned conversation.`});
    } else {
      const inStack=deal.prods.some(([l])=>prodFamily(l)===reqFam);
      const why = inStack
        ? `${capW(REQ_LABEL[reqFam])} is also on the table here, but <b>${leadDisp}</b> fits this file with less friction today. If the business wants ${REQ_LABEL[reqFam]} later, that depends on its performance and a lender's underwriting at the time — it's never promised up front.`
        : `${capW(REQ_LABEL[reqFam])} usually calls for ${PROD_REQ[reqFam]||'a stronger file'} — ${profShort} doesn't reach that today, so <b>${leadDisp}</b> is the practical path now. Set that expectation early so the offer doesn't surprise them; any later option turns on performance and underwriting at the time.`;
      gaps.push({lever:'Product',exp:capW(REQ_LABEL[reqFam]),act:leadDisp,status:'diff',why});
    }
  }
  if(S.reqAmt && atr && atr.amount){
    const band=atrAmountText(atr.amount);
    if(S.reqAmt>atr.amount.hi) gaps.push({lever:'Amount',exp:fmtUSD(S.reqAmt),act:band,status:'over',
      why:`Their ask is above the ${band} a ${deal.rev?'$'+deal.rev.toLocaleString()+'/mo':'profile of this size'} can support. Expect to structure it down, stage it, or build revenue first — and say so before you quote a number.`});
    else if(S.reqAmt<atr.amount.lo) gaps.push({lever:'Amount',exp:fmtUSD(S.reqAmt),act:band,status:'under',
      why:`Their ask is below what the cash flow supports — there's room to offer more if they want it.`});
    else gaps.push({lever:'Amount',exp:fmtUSD(S.reqAmt),act:band,status:'match',
      why:`Their ask sits inside the supportable band — defensible to quote as-is.`});
  }
  if(S.expTerm && atr && atr.term){
    if(S.expTerm>atr.term.hi) gaps.push({lever:'Term',exp:`~${S.expTerm} mo`,act:atrTermText(atr.term),status:'over',
      why:`They're expecting longer than this product runs. Term is shaped by time in business (${deal.tib?deal.tib+' months':'short tenure'}); longer terms are generally associated with a term loan or SBA, which typically look for 24+ months — though any approval depends on underwriting at the time.`});
    else gaps.push({lever:'Term',exp:`~${S.expTerm} mo`,act:atrTermText(atr.term),status:'match',
      why:`Their term expectation fits what this product offers.`});
  }
  if(S.expPayFreq && atr){
    const cad=payFreqFor(atr.fam), cadLow=cad.toLowerCase(), actMonthly=/month/i.test(cad);
    if(S.expPayFreq==='monthly' && !actMonthly) gaps.push({lever:'Payment',exp:'Monthly',act:cad,status:'diff',
      why:`They're picturing one monthly payment; <b>${leadDisp}</b> remits ${cadLow} from deposits — ${/daily/i.test(cad)?'micro-payments that scale':'a small slice that scales'} with sales. Fixed monthly payments come with a term loan or SBA, which need a stronger file.`});
    else if(S.expPayFreq!=='monthly' && actMonthly) gaps.push({lever:'Payment',exp:capW(S.expPayFreq),act:cad,status:'diff',
      why:`They expected ${cadLow} remittance; this product is a fixed monthly payment instead — usually a plus.`});
    else gaps.push({lever:'Payment',exp:capW(S.expPayFreq),act:cad,status:'match',
      why:`Repayment cadence matches what they expect.`});
  }
  return gaps;
}
function anyExpectation(){ return !!(S.reqProduct||S.reqAmt||S.expTerm||S.expPayFreq); }
