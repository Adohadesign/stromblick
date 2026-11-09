// StromBlick v1.0.0 — pure billing and validation utilities.
// Dates use local calendar dates (YYYY-MM-DD); day math uses UTC to avoid DST errors.
const DAY = 86400000;
export function dateMs(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new Error('Ungültiges Datum.');
  const [y, m, d] = s.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==m-1 || dt.getUTCDate()!==d) throw new Error('Ungültiges Datum.');
  return t;
}
export const daysBetween = (a,b) => Math.round((dateMs(b)-dateMs(a))/DAY);
export function addDays(s, num) { return new Date(dateMs(s)+num*DAY).toISOString().slice(0,10); }
export function todayLocal(d=new Date()) {
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
export function numberDE(v) {
  let s = String(v ?? '').trim().replace(/\s|€/g,'');
  if(!s) return NaN;
  if(s.includes(',') && s.includes('.')) s=s.replace(/\./g,'').replace(',','.');
  else if(s.includes(',')) s=s.replace(',','.');
  else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  const n = Number(s);
  return Number.isFinite(n)?n:NaN;
}
export function formatNumber(n, digits=0) {return new Intl.NumberFormat('de-DE',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);}
export function formatEuro(n) {return new Intl.NumberFormat('de-DE',{style:'currency', currency:'EUR'}).format(n);}
export function niceDate(s) {return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(dateMs(s)));}

export function validState(s) {
  if(!s || typeof s!=='object' || !s.settings || !Array.isArray(s.readings) || !Array.isArray(s.tariffs) || !Array.isArray(s.payments)) throw new Error('Die Sicherungsdatei hat nicht das erwartete Format.');
  const cfg=s.settings;
  for(const d of [cfg.periodStart,cfg.periodEnd,cfg.invoiceDate]) dateMs(d);
  if(daysBetween(cfg.periodStart,cfg.periodEnd)<=0 || daysBetween(cfg.periodEnd,cfg.invoiceDate)<0) throw new Error('Abrechnungsdaten sind unplausibel.');
  if(!Number.isFinite(cfg.baselineKwh)||cfg.baselineKwh<0) throw new Error('Startzählerstand ungültig.');
  if(s.readings.length>30000||s.tariffs.length>300||s.payments.length>2000) throw new Error('Zu viele Einträge.');
  const keys=new Set();
  for (const r of s.readings){dateMs(r.date);if(!Number.isFinite(r.kwh)||r.kwh<0)throw new Error('Ungültiger Zählerstand.');if(typeof r.id!=='string'||keys.has(r.id))throw new Error('Ungültige oder doppelte Messungs-ID.');keys.add(r.id);}
  const list=orderedReadings(s);
  for(let i=1;i<list.length;i++)if(list[i].kwh<list[i-1].kwh-0.00001)throw new Error('Zählerstände dürfen nicht rückwärts laufen.');
  for(const t of s.tariffs) {dateMs(t.from);if(!Number.isFinite(t.priceCt)||t.priceCt<0||t.priceCt>300||!Number.isFinite(t.baseYear)||t.baseYear<0||t.baseYear>10000)throw new Error('Ungültiger Tarif.');}
  if(!s.tariffs.length) throw new Error('Mindestens ein Tarif ist erforderlich.');
  for(const p of s.payments) {dateMs(p.date);if(!Number.isFinite(p.amount)||p.amount<0||p.amount>100000||typeof p.paid!=='boolean'||typeof p.id!=='string')throw new Error('Ungültiger Abschlag.');}
  return true;
}
export function orderedReadings(state) {
  const start={id:'baseline',date:state.settings.periodStart,kwh:state.settings.baselineKwh,baseline:true};
  const future=state.readings.filter(r=>daysBetween(start.date,r.date)>=0).map(r=>({...r}));
  const all=[start,...future].sort((a,b)=>a.date.localeCompare(b.date)||Number(a.baseline===true)*-1||a.kwh-b.kwh);
  return all;
}
export function activeTariff(tariffs,date) {
  const list=[...tariffs].sort((a,b)=>a.from.localeCompare(b.from));
  return [...list].reverse().find(t=>t.from<=date) || list[0];
}
function dailyRate(tariffs,date) {const tariff=activeTariff(tariffs,date);return {kwh:tariff.priceCt/100,base:tariff.baseYear/365};}
export function calculate(state, asOf=todayLocal()) {
  validState(state);
  const {periodStart,periodEnd,invoiceDate}=state.settings;
  const upto=asOf<periodEnd?asOf:periodEnd;
  const entries=orderedReadings(state).filter(r=>r.date<=upto);
  const start=entries[0];
  const latest=entries.at(-1);
  const elapsed=daysBetween(periodStart,latest.date);
  const totalDays=daysBetween(periodStart,periodEnd);
  let measuredEnergyCost=0,measuredBaseCost=0;
  const monthly={};
  // Observed interval consumption is exact; day allocation between readings is estimated.
  for(let j=1;j<entries.length;j++) {
    const a=entries[j-1],b=entries[j],span=daysBetween(a.date,b.date),usage=b.kwh-a.kwh;
    if(span===0) { const date=b.date,rate=dailyRate(state.tariffs,date);measuredEnergyCost+=usage*rate.kwh;monthly[date.slice(0,7)]=(monthly[date.slice(0,7)]||0)+usage;continue; }
    for(let i=1;i<=span;i++) {
      const date=addDays(a.date,i),rate=dailyRate(state.tariffs,date);
      measuredEnergyCost+=usage/span*rate.kwh;
      measuredBaseCost+=rate.base;
      const key=date.slice(0,7);monthly[key]=(monthly[key]||0)+usage/span;
    }
  }
  const measuredKwh=latest.kwh-start.kwh;
  const measuredCost=measuredEnergyCost+measuredBaseCost;
  const average=elapsed>0?measuredKwh/elapsed:0;
  const remaining=Math.max(0,totalDays-elapsed);
  let futureEnergy=0,futureBase=0;
  if(elapsed>0) for(let i=1;i<=remaining;i++) {
    const date=addDays(latest.date,i),rate=dailyRate(state.tariffs,date);
    futureEnergy+=average*rate.kwh;
    futureBase+=rate.base;
  }
  const forecastKwh=elapsed>0?measuredKwh+average*remaining:null;
  const forecastCost=elapsed>0?measuredCost+futureEnergy+futureBase:null;
  const paid=state.payments.filter(p=>p.paid).reduce((sum,p)=>sum+p.amount,0);
  const dueUnpaid=state.payments.filter(p=>!p.paid && p.date<=invoiceDate).reduce((sum,p)=>sum+p.amount,0);
  const forecastPayments=paid+dueUnpaid;
  const lastInterval=entries.length>=2?entries.at(-1).kwh-entries.at(-2).kwh:null;
  const lastDays=entries.length>=2?daysBetween(entries.at(-2).date,latest.date):null;
  return {latest,entries,elapsed,totalDays,remaining,measuredKwh,measuredEnergyCost,measuredBaseCost,measuredCost,average,forecastKwh,forecastCost,paid,dueUnpaid,forecastPayments,forecastBalance:forecastCost===null?null:forecastPayments-forecastCost,monthly,lastInterval,lastDays,needsNewPeriod:asOf>periodEnd};
}
export function estimateReadingFromOCR(raw, reference=0) {
  // OCR can contain multiple numeric blocks. Do not trust it: user must always confirm.
  const str=String(raw||'').replace(/\s+/g,' ').trim();
  let matches=[...str.matchAll(/\d{4,7}(?:[.,]\d{1,3})?/g)].map(m=>numberDE(m[0]));
  if(!matches.length) matches=[...str.matchAll(/(?:\d\s+){3,8}\d/g)].map(m=>numberDE(m[0].replace(/\s/g,'')));
  const candidates=matches.filter(n=>Number.isFinite(n) && n>=0 && n<=99999999);
  if(!candidates.length) return null;
  const bigger=candidates.filter(n=>n>=reference);
  if(bigger.length) return bigger.sort((a,b)=>a-b)[0];
  return candidates.sort((a,b)=>Math.abs(a-reference)-Math.abs(b-reference))[0];
}
