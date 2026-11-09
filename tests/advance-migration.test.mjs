import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {migrateOpenTemplateAdvances, calculate, validState} from '../calculations.mjs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fixture=()=>({schemaVersion:1,settings:{baselineKwh:10396,periodStart:'2026-05-19',periodEnd:'2027-05-19',invoiceDate:'2027-06-18'},tariffs:[{id:'base',from:'2026-05-20',priceCt:30.3569,baseYear:180}],readings:[],payments:[
{id:'abschlag-2026-08-01',date:'2026-08-01',amount:94,paid:true},
{id:'abschlag-2026-09-01',date:'2026-09-01',amount:94,paid:false},
{id:'abschlag-2027-06-01',date:'2027-06-01',amount:94,paid:false},
{id:'user-1',date:'2026-10-01',amount:94,paid:false},
{id:'user-2',date:'2026-11-01',amount:120,paid:false}]});
test('Only unpaid 94-Euro scheduled template advances migrate',()=>{
 const source=fixture(),before=JSON.stringify(source),result=migrateOpenTemplateAdvances(source);
 assert.equal(result.count,2);
 assert.deepEqual(result.state.payments.map(x=>x.amount),[94,150,150,94,120]);
 assert.equal(JSON.stringify(source),before);
 assert.equal(validState(result.state),true);
 assert.equal(calculate(result.state,'2026-11-09').forecastPayments,608);
});
test('Migration is repeatable and leaves paid items untouched',()=>{
 const once=migrateOpenTemplateAdvances(fixture()),twice=migrateOpenTemplateAdvances(once.state);
 assert.equal(twice.count,0);assert.strictEqual(twice.state,once.state);
 const s=fixture();s.payments[1].paid=true;s.payments[2].amount=150;
 assert.equal(migrateOpenTemplateAdvances(s).count,0);
});
test('Default 150 Euro and migration on app startup',()=>{
 assert.match(app,/amount:150,paid:false/);
 assert.match(app,/elements\.amount\.value='150,00'/);
 assert.match(app,/migrateOpenTemplateAdvances\(state\)/);
});
test('Simple overview retains all detailed functions',()=>{
 for(const id of ['quickConsumption','quickCost','quickInstallment','quickBalance','moreDetails','forecastCost','paymentsList','readingList'])assert.ok(html.includes('id="'+id+'"'),id);
});
