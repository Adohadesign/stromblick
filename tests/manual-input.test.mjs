import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/prepare-android.mjs',import.meta.url),'utf8');
test('Große Plus-Schaltfläche und Feld für manuelle kWh-Erfassung vorhanden',()=>{
  assert.match(html,/id="manualButton"[^>]*type="button"/);
  assert.match(html,/class="add-reading-icon"[^>]*>\+</);
  assert.match(html,/id="readingInput"/);
});
test('Datum wird beim Speichern automatisch gelesen statt vom Formular übernommen',()=>{
  assert.match(app,/const kwh=numberDE\(\$\('readingInput'\)\.value\),date=todayLocal\(\);/);
  assert.match(app,/\$\('readingDateLabel'\)\.textContent=niceDate\(todayLocal\(\)\)/);
  assert.doesNotMatch(app,/date=\$\('readingDate'\)\.value/);
});
test('Keine OCR- oder Kamera-Elemente bleiben in der Bedienung',()=>{
  assert.doesNotMatch(html,/id="cameraButton"|id="cameraFile"|id="recognizeButton"|id="photoArea"/);
  assert.doesNotMatch(app,/Tesseract|estimateReadingFromOCR|function recognize\(/);
});
test('Bestehende Speicher- und Kostenfunktionen bleiben angebunden',()=>{
  assert.match(app,/await saveState\(next\)/);
  assert.match(app,/c=calculate\(state\)/);
  assert.match(app,/next\.readings\.push\(\{id:ID\(\),date,kwh,createdAt:/);
  assert.match(app,/\$\('exportButton'\)\.addEventListener\('click',downloadBackup\)/);
});
test('Android-Build enthält die aktuelle Versionsmarkierung',()=>{
  assert.match(html,/StromBlick v1\.3\.0/);
  assert.match(build,/StromBlick v1\.3\.0/);
});
