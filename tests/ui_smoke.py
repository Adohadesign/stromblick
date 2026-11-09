from playwright.sync_api import sync_playwright
import subprocess,time,os,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
server=subprocess.Popen(['python','-m','http.server','8722','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.7)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,locale='de-DE')
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('http://127.0.0.1:8722/',wait_until='load')
  page.locator('#welcome').wait_for(state='visible',timeout=15000)
  assert page.locator('input[name=baselineKwh]').first.input_value()=='10.396',page.locator('input[name=baselineKwh]').first.input_value()
  page.locator('#setupForm button[type=submit]').click()
  page.locator('#app').wait_for(state='visible',timeout=15000)
  assert '10.396' in page.locator('#currentReading').inner_text()
  assert '0,00' in page.locator('#costStat').inner_text()
  page.locator('#manualButton').click()
  page.locator('#readingInput').fill('11.750')
  page.locator('#readingDate').fill('2026-11-09')
  page.locator('#readingForm button[type=submit]').click()
  page.locator('#readingDialog').wait_for(state='hidden',timeout=5000)
  assert '11.750' in page.locator('#currentReading').inner_text(),page.locator('#currentReading').inner_text()
  assert '1.354' in page.locator('#consumptionStat').inner_text()
  assert '€' in page.locator('#costStat').inner_text()
  page.screenshot(path='/mnt/data/stromblick_handyanzeige.png',full_page=True)
  page.locator('#paymentsList [data-payment-id]').first.click()
  assert '94,00' in page.locator('#paidStat').inner_text()
  page.reload()
  page.locator('#app').wait_for(state='visible')
  assert '11.750' in page.locator('#currentReading').inner_text(),'Daten nach Reload weg'
  assert '94,00' in page.locator('#paidStat').inner_text(),'Zahlung nach Reload weg'
  page.locator('#settingsButton').click()
  page.locator('#exportButton').click()
  page.locator('[data-close=settingsDialog]').click()
  page.locator('#manualButton').click()
  page.locator('#readingInput').fill('9.000')
  page.locator('#readingForm button[type=submit]').click()
  assert 'niedriger' in page.locator('#readingError').inner_text()
  assert not errors,errors
  print('UI-Smoke: Einrichtung, Messung, Rechnung, Zahlungsstatus, Speichern, Reload, Exportbutton, Plausibilität: bestanden.')
  browser.close()
finally:
 server.terminate();server.wait(timeout=3)
