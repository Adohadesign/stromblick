import {loadState,saveState} from './storage.mjs';
import {activeTariff,calculate,dateMs,daysBetween,estimateReadingFromOCR,formatEuro,formatNumber,niceDate,numberDE,todayLocal,validState} from './calculations.mjs';
const $=id=>document.getElementById(id);
const ID=()=>globalThis.crypto?.randomUUID?.()??('sb-'+Date.now()+'-'+Math.random().toString(36).slice(2));
let state=null,photoUrl=null,photoBlob=null,selection=null,toastTimer=null,working=false;
const defaults={schemaVersion:1,settings:{baselineKwh:10396,periodStart:'2026-05-19',periodEnd:'2027-05-19',invoiceDate:'2027-06-18',lastYearKwh:2819},tariffs:[{id:'initial',from:'2026-05-20',priceCt:30.3569,baseYear:180}],readings:[],payments:[]};
for(let m=0;m<11;m++){
 const d=new Date(Date.UTC(2026,7+m,1)).toISOString().slice(0,10);
 defaults.payments.push({id:'abschlag-'+d,date:d,amount:94,paid:false});
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
 const last=state.settings.lastYearKwh;const comparison=c.forecastKwh!=null&&Number.isFinite(last)&&last>0?Math.round(100*(c.forecastKwh/last-1)):null;setText('priorYearNote',comparison==null?'Vergleich mit dem Vorjahr nach der ersten Messung verfügbar.':`Vorjahr: ${formatNumber(last)} kWh · Prognose ${comparison>=0?'+':''}${comparison} % gegenüber dem Vorjahr`);$('priorYearNote').classList.toggle('warning',comparison!=null&&comparison>10);
 $('periodWarning').hidden=!c.needsNewPeriod;chart(c.monthly);renderReadings(c);renderPayments();
}
async function commit(next,message){validState(next);await saveState(next);state=next;present();if(message)tell(message);}
function openReading(){const form=$('readingForm');form.reset();displayError('readingError','');$('photoArea').hidden=true;$('ocrStatus').textContent='';$('readingDate').value=todayLocal();clearPhoto();showDialog('readingDialog');}
function clearPhoto(){if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=null;photoBlob=null;selection=null;$('cropRect').style.display='none';}
function initCamera(){
 $('cameraButton').addEventListener('click',()=>{$('cameraFile').value='';$('cameraFile').click();});
 $('manualButton').addEventListener('click',openReading);
 $('cameraFile').addEventListener('change',event=>{
   const f=event.target.files?.[0];if(!f)return;
   if(!f.type.startsWith('image/')){tell('Bitte ein Foto auswählen.');return;}
   if(f.size>15*1024*1024){tell('Bitte ein kleineres Foto auswählen (maximal 15 MB).');return;}
   openReading();photoBlob=f;photoUrl=URL.createObjectURL(f);$('photoPreview').src=photoUrl;$('photoArea').hidden=false;
   $('ocrStatus').textContent='Foto geladen. Die Erkennung startet automatisch …';
   recognize();
 });
 $('readingDialog').addEventListener('close',clearPhoto);
 $('resetCrop').addEventListener('click',()=>{selection=null;$('cropRect').style.display='none';});
 const container=$('photoContainer');let sx=0,sy=0,dragging=false;
 function relative(e){const r=container.getBoundingClientRect();return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};}
 container.addEventListener('pointerdown',e=>{if(!photoBlob)return;dragging=true;const p=relative(e);sx=p.x;sy=p.y;selection={x:sx,y:sy,w:0,h:0};container.setPointerCapture(e.pointerId);});
 container.addEventListener('pointermove',e=>{if(!dragging)return;const p=relative(e);const x=Math.min(sx,p.x),y=Math.min(sy,p.y);selection={x,y,w:Math.abs(p.x-sx),h:Math.abs(p.y-sy)};const rect=$('cropRect');rect.style.display='block';rect.style.left=x+'px';rect.style.top=y+'px';rect.style.width=selection.w+'px';rect.style.height=selection.h+'px';});
 container.addEventListener('pointerup',()=>{dragging=false;if(selection&&(selection.w<20||selection.h<15)){selection=null;$('cropRect').style.display='none';}});
}
async function selectedImage(){if(!photoBlob)throw Error('Kein Foto ausgewählt.');if(!selection)return photoBlob;
 const img=$('photoPreview');await img.decode();const iw=img.naturalWidth,ih=img.naturalHeight;if(!iw||!ih)return photoBlob;
 const rect=img.getBoundingClientRect(),wrap=$('photoContainer').getBoundingClientRect();const scale=Math.min(rect.width/iw,rect.height/ih);const w=iw*scale,h=ih*scale;const xOffset=(rect.width-w)/2+rect.left-wrap.left,yOffset=(rect.height-h)/2+rect.top-wrap.top;
 const sx=Math.max(0,(selection.x-xOffset)/scale),sy=Math.max(0,(selection.y-yOffset)/scale),ex=Math.min(iw,(selection.x+selection.w-xOffset)/scale),ey=Math.min(ih,(selection.y+selection.h-yOffset)/scale);
 if(ex-sx<5||ey-sy<5)throw Error('Der markierte Bereich enthält keine Bilddaten.');
 const cvs=document.createElement('canvas');cvs.width=Math.min(2500,Math.round(ex-sx));cvs.height=Math.min(1500,Math.round(ey-sy));const ctx=cvs.getContext('2d');if(!ctx)throw Error('Bildverarbeitung nicht verfügbar.');ctx.drawImage(img,sx,sy,ex-sx,ey-sy,0,0,cvs.width,cvs.height);return cvs.toDataURL('image/png');
}
async function loadOCR(){if(window.Tesseract)return window.Tesseract;
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';script.crossOrigin='anonymous';script.onload=resolve;script.onerror=()=>reject(Error('Fotoerkennung konnte nicht geladen werden. Prüfe die Internetverbindung.'));document.head.appendChild(script);});
 if(!window.Tesseract)throw Error('Fotoerkennung nicht verfügbar.');return window.Tesseract;
}
async function recognize(){if(working)return;working=true;const btn=$('recognizeButton');btn.disabled=true;const status=$('ocrStatus');status.textContent='Erkennung wird vorbereitet …';
 let worker=null;try{const input=await selectedImage();const ocr=await loadOCR();worker=await ocr.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')status.textContent=`Erkenne Zahlen … ${Math.round((m.progress??0)*100)} %`;}});await worker.setParameters({tessedit_char_whitelist:'0123456789., ',tessedit_pageseg_mode:'6'});const out=await worker.recognize(input);const ref=calculate(state).latest.kwh;const guess=estimateReadingFromOCR(out.data.text,ref);
 if(guess===null){status.textContent='Keine eindeutigen Zahlen erkannt. Bitte Zählerstand von Hand eintragen.';}else{if(!$('readingInput').value.trim())$('readingInput').value=String(guess).replace('.',',');status.textContent='Vorschlag erkannt. Bitte am Zählerfoto prüfen und erst dann speichern.';}
 }catch(err){status.textContent=err.message+' Du kannst den Stand manuell eingeben.';}finally{try{await worker?.terminate();}catch{}working=false;btn.disabled=false;}
}
async function saveReading(ev){ev.preventDefault();displayError('readingError','');try{
 const kwh=numberDE($('readingInput').value),date=$('readingDate').value;if(!Number.isFinite(kwh)||kwh<0)throw Error('Bitte einen gültigen Zählerstand eingeben.');dateMs(date);
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
 $('addPayment').addEventListener('click',()=>{$('paymentForm').reset();$('paymentForm').elements.date.value=todayLocal();$('paymentForm').elements.amount.value='94,00';showDialog('paymentDialog');});
 $('paymentsList').addEventListener('click',event=>{const id=event.target.closest('[data-payment-id]')?.dataset.paymentId;if(id)togglePayment(id);});
 $('exportButton').addEventListener('click',downloadBackup);$('importButton').addEventListener('click',()=>{$('importFile').click();});
 $('importFile').addEventListener('change',event=>importBackup(event.target.files?.[0]));
 $('recognizeButton').addEventListener('click',recognize);initCamera();
}
async function start(){wire();try{state=await loadState();if(state)validState(state);present();}catch(e){$('welcome').hidden=false;fillSetup();$('setupForm').querySelector('button[type=submit]').disabled=true;tell('Lokaler Speicher nicht verfügbar: '+e.message);}
 if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
}
start();
