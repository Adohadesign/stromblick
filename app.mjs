import {loadState,saveState} from './storage.mjs';
import {activeTariff,calculate,dateMs,daysBetween,migrateOpenTemplateAdvances,formatEuro,formatNumber,niceDate,numberDE,todayLocal,validState} from './calculations.mjs';
const $=id=>document.getElementById(id);
const ID=()=>globalThis.crypto?.randomUUID?.()??('sb-'+Date.now()+'-'+Math.random().toString(36).slice(2));
let state=null,toastTimer=null;
const defaults={schemaVersion:1,settings:{baselineKwh:10396,periodStart:'2026-05-19',periodEnd:'2027-05-19',invoiceDate:'2027-06-18',lastYearKwh:2819},tariffs:[{id:'initial',from:'2026-05-20',priceCt:30.3569,baseYear:180}],readings:[],payments:[]};
for(let m=0;m<11;m++){
 const d=new Date(Date.UTC(2026,7+m,1)).toISOString().slice(0,10);
 defaults.payments.push({id:'abschlag-'+d,date:d,amount:150,paid:false});
}
function clone(obj){return structuredClone(obj);}
function tell(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3800);}
function displayError(id,message){$(id).textContent=message;}
function setText(id,val){$(id).textContent=val;}
function formValues(form){return new FormData(form);}
function showDialog(id){$(id).showModal();}
function closeDialog(id){$(id).close();}
function fillSetup(){const f=$('setupForm');const v=defaults.settings;f.elements.baselineKwh.value=formatNumber(v.baselineKwh);f.elements.periodStart.value=v.periodStart;f.elements.periodEnd.value=v.periodEnd;f.elements.invoiceDate.value=v.invoiceDate;f.elements.priceCt.value='30,3569';f.elements.baseYear.value='180';}
function validSetup(form){
 const fd=formValues(form);const a=numberDE(fd.get('baselineKwh')),b=numberDE(fd.get('priceCt')),c=numberDE(fd.get('baseYear'));
 const start=fd.get('periodStart'),end=fd.get('periodEnd'),invoice=fd.get('invoiceDate');
 if(!Number.isFinite(a)||a<0||!Number.isFinite(b)||b<=0||!Number.isFinite(c)||c<0)throw Error('Bitte gültige Beträge und Zählerstände eingeben.');
 if(daysBetween(start,end)<1||daysBetween(end,invoice)<0)throw Error('Start, Ende und Rechnungsdatum passen nicht zusammen.');
 const next=clone(defaults);next.settings={baselineKwh:a,periodStart:start,periodEnd:end,invoiceDate:invoice,lastYearKwh:2819};next.tariffs=[{id:ID(),from:start,priceCt:b,baseYear:c}];validState(next);return next;
}
function present(){
 $('welcome').hidden=!!state;$('app').hidden=!state;
 if(state)render();else fillSetup();
}
function showPeriodSettings(){const f=$('settingsForm');const v=state.settings;
 for(const key of ['baselineKwh','periodStart','periodEnd','invoiceDate'])f.elements[key].value=key==='baselineKwh'?formatNumber(v[key]):v[key];f.elements.lastYearKwh.value=formatNumber(v.lastYearKwh??2819);
 const tariff=activeTariff(state.tariffs,todayLocal());f.elements.tariffDate.value=todayLocal();f.elements.priceCt.value=String(tariff.priceCt).replace('.',',');f.elements.baseYear.value=String(tariff.baseYear).replace('.',',');displayError('settingsError','');showDialog('settingsDialog');
}
function chart(monthly){const container=$('monthChart');container.replaceChildren();const dates=Object.keys(monthly).sort().slice(-6);if(!dates.length){const el=document.createElement('p');el.className='empty';el.textContent='Das Diagramm entsteht nach deiner ersten neuen Messung.';container.append(el);return;}
 const max=Math.max(...dates.map(k=>monthly[k]),1);
 for(const d of dates){const col=document.createElement('div');col.className='chart-col';const val=document.createElement('span');val.className='chart-value';val.textContent=Math.round(monthly[d])+' kWh';const bar=document.createElement('span');bar.className='chart-bar';bar.style.height=Math.max(3,Math.round(monthly[d]/max*108))+'px';bar.title=val.textContent;const month=document.createElement('span');month.className='chart-month';month.textContent=new Intl.DateTimeFormat('de-DE',{month:'short'}).format(new Date(d+'-01T12:00:00'));col.append(val,bar,month);container.append(col);}
}
function renderReadings(result){const list=$('readingList');list.replaceChildren();setText('countReading',`${result.entries.length-1} neue Messung(en)`);
 const readings=[...result.entries].reverse();for(const r of readings.slice(0,25)){const div=document.createElement('article');div.className='item';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=(r.baseline?'Startwert · ':'')+formatNumber(r.kwh,Number.isInteger(r.kwh)?0:2)+' kWh';const small=document.createElement('small');small.textContent=niceDate(r.date);left.append(title,small);div.append(left);if(r.baseline){const s=document.createElement('span');s.className='small-muted';s.textContent='Rechnung';div.append(s);}list.append(div);}
}
function renderPayments(){const list=$('paymentsList');list.replaceChildren();for(const p of [...state.payments].sort((a,b)=>a.date.localeCompare(b.date))){const div=document.createElement('article');div.className='item';const left=document.createElement('div');const amount=document.createElement('strong');amount.textContent=formatEuro(p.amount);const date=document.createElement('small');date.textContent='Fällig: '+niceDate(p.date);left.append(amount,date);const btn=document.createElement('button');btn.type='button';btn.dataset.paymentId=p.id;btn.textContent=p.paid?'✓ Bezahlt':'Als bezahlt';if(p.paid)btn.classList.add('is-paid');btn.setAttribute('aria-label',`${formatEuro(p.amount)} vom ${niceDate(p.date)}: ${p.paid?'als nicht bezahlt markieren':'als bezahlt markieren'}`);div.append(left,btn);list.append(div);}
}
function render(){if(!state)return;
 let c;try{c=calculate(state);}catch(e){tell(e.message);return;}
 const v=c.latest;setText('currentReading',formatNumber(v.kwh,Number.isInteger(v.kwh)?0:2));setText('measurementDate',niceDate(v.date));setText('readingInfo',v.baseline?'Startwert aus der letzten Rechnung':'Letzte Messung gespeichert');
 setText('periodLabel',`${niceDate(state.settings.periodStart)} – ${niceDate(state.settings.periodEnd)}`);
 setText('consumptionStat',c.entries.length===1?'Noch offen':formatNumber(c.measuredKwh,2)+' kWh');setText('consumptionSub',c.entries.length===1?'Warte auf neue Ablesung':'Verbrauch bis '+niceDate(v.date));
 setText('costStat',c.entries.length===1?'Noch offen':formatEuro(c.measuredCost));setText('dailyStat',c.elapsed?formatNumber(c.average,2)+' kWh':'–');
 setText('intervalStat',c.lastInterval==null?'–':formatNumber(c.lastInterval,2)+' kWh');setText('intervalSub',c.lastDays==null?'Seit der letzten Messung':`${c.lastDays} Tag(e) seit vorheriger Messung`);
 setText('forecastCost',c.forecastCost==null?'Noch offen':formatEuro(c.forecastCost));setText('forecastKwh',c.forecastKwh==null?'Noch offen':formatNumber(c.forecastKwh,0)+' kWh');
 const progress=Math.max(0,Math.min(100,c.totalDays?100*c.elapsed/c.totalDays:0));$('periodProgress').style.width=progress+'%';setText('progressText',Math.round(progress)+' % des Jahres durch Messungen abgedeckt');setText('remainingText',c.remaining+' Tage bis Periodenende');
 setText('paidStat',formatEuro(c.paid));setText('balanceStat',c.forecastBalance==null?'Noch offen':formatEuro(Math.abs(c.forecastBalance)));
 $('balanceStat').classList.toggle('positive',c.forecastBalance>0);$('balanceStat').classList.toggle('warning',c.forecastBalance<0);
 setText('forecastBadge',c.forecastBalance==null?'Messung nötig':c.forecastBalance>=0?'Guthaben (geschätzt)':'Nachzahlung (geschätzt)');
 setText('quickConsumption',c.entries.length===1?'Noch offen':formatNumber(c.measuredKwh,0)+' kWh');
 setText('quickCost',c.entries.length===1?'Noch offen':formatEuro(c.measuredCost));
 setText('quickInstallment',formatEuro(150));
 setText('quickBalance',c.forecastBalance==null?'Noch offen':formatEuro(Math.abs(c.forecastBalance)));
 setText('quickBalanceLabel',c.forecastBalance==null?'Guthaben / Nachzahlung':c.forecastBalance>=0?'Guthaben (geschätzt)':'Nachzahlung (geschätzt)');
 $('quickBalance').classList.toggle('positive',c.forecastBalance>0);
 $('quickBalance').classList.toggle('warning',c.forecastBalance<0);
 const last=state.settings.lastYearKwh;const comparison=c.forecastKwh!=null&&Number.isFinite(last)&&last>0?Math.round(100*(c.forecastKwh/last-1)):null;setText('priorYearNote',comparison==null?'Vergleich mit dem Vorjahr nach der ersten Messung verfügbar.':`Vorjahr: ${formatNumber(last)} kWh · Prognose ${comparison>=0?'+':''}${comparison} % gegenüber dem Vorjahr`);$('priorYearNote').classList.toggle('warning',comparison!=null&&comparison>10);
 $('periodWarning').hidden=!c.needsNewPeriod;chart(c.monthly);renderReadings(c);renderPayments();
}
async function commit(next,message){validState(next);await saveState(next);state=next;present();if(message)tell(message);}
function openReading(){const form=$('readingForm');form.reset();displayError('readingError','');$('readingDateLabel').textContent=niceDate(todayLocal());showDialog('readingDialog');}
async function saveReading(ev){ev.preventDefault();displayError('readingError','');try{
 const kwh=numberDE($('readingInput').value),date=todayLocal();if(!Number.isFinite(kwh)||kwh<0)throw Error('Bitte einen gültigen Zählerstand eingeben.');dateMs(date);
 if(date>todayLocal())throw Error('Du kannst keine Messung in der Zukunft speichern.');
 if(date<state.settings.periodStart||date>state.settings.periodEnd)throw Error('Messdatum liegt außerhalb des Abrechnungszeitraums. Bitte Einstellungen prüfen.');
 const entries=[{date:state.settings.periodStart,kwh:state.settings.baselineKwh},...state.readings].sort((a,b)=>a.date.localeCompare(b.date)||a.kwh-b.kwh);
 const before=entries.filter(r=>r.date<=date).at(-1),after=entries.find(r=>r.date>date);
 if(before && kwh<before.kwh-0.00001)throw Error('Der Zählerstand ist niedriger als ein vorheriger Wert. Bitte prüfen.');
 if(after && kwh>after.kwh+0.00001)throw Error('Der Zählerstand ist höher als eine bereits später erfolgte Messung.');
 if(state.readings.some(r=>r.date===date && Math.abs(r.kwh-kwh)<.00001))throw Error('Dieser Zählerstand ist für das Datum schon gespeichert.');
 const next=clone(state);next.readings.push({id:ID(),date,kwh,createdAt:new Date().toISOString()});
 await commit(next,'Zählerstand gespeichert.');closeDialog('readingDialog');
 }catch(e){displayError('readingError',e.message);}
}
async function saveSettings(ev){ev.preventDefault();displayError('settingsError','');try{
 const fd=formValues(ev.target);const baseline=numberDE(fd.get('baselineKwh')),priceCt=numberDE(fd.get('priceCt')),baseYear=numberDE(fd.get('baseYear')),lastYearKwh=numberDE(fd.get('lastYearKwh'));
 const start=fd.get('periodStart'),end=fd.get('periodEnd'),invoice=fd.get('invoiceDate'),tariffDate=fd.get('tariffDate');
 if(!Number.isFinite(baseline)||baseline<0||!Number.isFinite(priceCt)||priceCt<=0||!Number.isFinite(baseYear)||baseYear<0||!Number.isFinite(lastYearKwh)||lastYearKwh<0)throw Error('Unzulässige Werte eingegeben.');
 if(daysBetween(start,end)<=0||daysBetween(end,invoice)<0)throw Error('Der Abrechnungszeitraum ist ungültig.');dateMs(tariffDate);
 const changed=start!==state.settings.periodStart||baseline!==state.settings.baselineKwh;
 if(changed && state.readings.length && !confirm('Der Abrechnungsstart oder der Startzählerstand wird geändert. Ältere Messungen bleiben gespeichert, können aber aus der aktuellen Ansicht verschwinden. Vorher ein Backup erstellen?'))return;
 const next=clone(state);next.settings={baselineKwh:baseline,periodStart:start,periodEnd:end,invoiceDate:invoice,lastYearKwh};
 const old=activeTariff(next.tariffs,tariffDate),hasExact=next.tariffs.find(t=>t.from===tariffDate);
 if(old.priceCt!==priceCt||old.baseYear!==baseYear){
   if(hasExact && !confirm('Für dieses Datum existiert bereits ein Tarif. Diesen Tarifwert wirklich korrigieren?'))return;
   if(hasExact){hasExact.priceCt=priceCt;hasExact.baseYear=baseYear;}else next.tariffs.push({id:ID(),from:tariffDate,priceCt,baseYear});
 }
 await commit(next,'Einstellungen gespeichert.');closeDialog('settingsDialog');
 }catch(e){displayError('settingsError',e.message);}
}
async function addPayment(ev){ev.preventDefault();try{const fd=formValues(ev.target);const date=fd.get('date'),amount=numberDE(fd.get('amount'));dateMs(date);if(!Number.isFinite(amount)||amount<=0||amount>100000)throw Error('Ungültiger Betrag.');if(state.payments.some(p=>p.date===date&&Math.abs(p.amount-amount)<.001))throw Error('Ein Abschlag mit diesem Datum und Betrag ist bereits vorhanden. Bitte dessen Zahlungsstatus markieren.');const next=clone(state);next.payments.push({id:ID(),date,amount,paid:fd.get('paid')==='on'});await commit(next,'Abschlag eingetragen.');closeDialog('paymentDialog');}catch(e){tell(e.message);}}
async function togglePayment(id){const next=clone(state);const p=next.payments.find(x=>x.id===id);if(!p)return;p.paid=!p.paid;try{await commit(next,p.paid?'Zahlung bestätigt.':'Zahlung wieder als offen markiert.');}catch(e){tell(e.message);}}
function downloadBackup(){const payload={...clone(state),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='StromBlick_Backup_'+todayLocal()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);tell('Backup erstellt. Bitte sicher aufbewahren.');}
async function importBackup(file){try{if(!file)return;if(file.size>3*1024*1024)throw Error('Sicherungsdatei ist zu groß.');const data=JSON.parse(await file.text());validState(data);const incoming={schemaVersion:1,settings:data.settings,tariffs:data.tariffs,readings:data.readings,payments:data.payments};
 if(!state){if(!confirm(`Backup mit ${incoming.readings.length} Messung(en) und ${incoming.payments.length} Zahlungen übernehmen?`))return;await commit(incoming,'Backup wiederhergestellt.');return;}
 if(incoming.settings.periodStart!==state.settings.periodStart || incoming.settings.baselineKwh!==state.settings.baselineKwh)throw Error('Andere Abrechnungsbasis. Um keine Daten zu überschreiben, ist Zusammenführen nicht möglich.');
 const next=clone(state);const rids=new Set(next.readings.map(r=>r.id));const pids=new Set(next.payments.map(p=>p.id));const tdates=new Set(next.tariffs.map(t=>t.from));
 let added=0;for(const r of incoming.readings){if(!rids.has(r.id)&&!next.readings.some(x=>x.date===r.date&&Math.abs(x.kwh-r.kwh)<.00001)){next.readings.push(r);rids.add(r.id);added++;}}
 for(const p of incoming.payments){if(!pids.has(p.id)){next.payments.push(p);pids.add(p.id);}}
 for(const t of incoming.tariffs){if(!tdates.has(t.from)){next.tariffs.push(t);tdates.add(t.from);}}
 validState(next);if(!confirm(`${added} zusätzliche Messung(en) importieren? Vorhandene Einstellungen und Daten bleiben erhalten.`))return;
 await commit(next,'Backup zusammengeführt.');
 }catch(e){tell('Import fehlgeschlagen: '+e.message);}finally{$('importFile').value='';}}
function wire(){
 $('setupForm').addEventListener('submit',async ev=>{ev.preventDefault();try{await commit(validSetup(ev.target),'StromBlick eingerichtet.');}catch(e){tell(e.message);}});
 $('setupImport').addEventListener('click',()=>{$('importFile').click();});
 $('settingsButton').addEventListener('click',showPeriodSettings);
 document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeDialog(btn.dataset.close)));
 $('readingForm').addEventListener('submit',saveReading);$('settingsForm').addEventListener('submit',saveSettings);$('paymentForm').addEventListener('submit',addPayment);
 $('addPayment').addEventListener('click',()=>{$('paymentForm').reset();$('paymentForm').elements.date.value=todayLocal();$('paymentForm').elements.amount.value='150,00';showDialog('paymentDialog');});
 $('paymentsList').addEventListener('click',event=>{const id=event.target.closest('[data-payment-id]')?.dataset.paymentId;if(id)togglePayment(id);});
 $('exportButton').addEventListener('click',downloadBackup);$('importButton').addEventListener('click',()=>{$('importFile').click();});
 $('importFile').addEventListener('change',event=>importBackup(event.target.files?.[0]));
 $('manualButton').addEventListener('click',openReading);
}
async function start(){wire();try{state=await loadState();let migrated=0;if(state){validState(state);const upgrade=migrateOpenTemplateAdvances(state);if(upgrade.count){validState(upgrade.state);await saveState(upgrade.state);state=upgrade.state;migrated=upgrade.count;}}present();if(migrated)tell(`${migrated} offene Abschläge wurden von 94 € auf 150 € geändert. Bereits bezahlte bleiben erhalten.`);}catch(e){$('welcome').hidden=false;fillSetup();$('setupForm').querySelector('button[type=submit]').disabled=true;tell('Lokaler Speicher nicht verfügbar: '+e.message);}
 if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
}
start();
