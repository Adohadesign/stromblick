# TESTPROTOKOLL — StromBlick v1.0.0

Datum: 09.11.2026

## Tatsächlich ausgeführt
- JavaScript-Rechentests (`node tests/calculations.test.mjs`): bestanden. Prüfung u. a. Kalender-/Schaltjahresrechnung, deutsches Zahlenformat, OCR-Zahlenextraktion, Referenzzähler, Verbrauch, Bruttopreise, Grundpreis, Prognose, Tarifwechsel und Abwehr unplausibler Rückgänge.
- JavaScript-Syntaxprüfungen (`node --check`): siehe Validierungsprotokoll vor Auslieferung.
- Manifest-JSON und Paketdateistruktur: siehe Validierungsprotokoll vor Auslieferung.

## Nicht abgeschlossen / nicht getestet
- Playwright-Handyoberfläche: Testlauf wurde in der Containerumgebung beim lokalen Browseraufruf durch `ERR_BLOCKED_BY_ADMINISTRATOR` blockiert. Kein erfolgreicher Browserintegrationstest behauptet.
- OCR mit einem echten Zählerfoto und Kamera-Zugriff auf dem echten Android-Gerät.
- Android-PWA-Installation auf dem Gerät, GitHub-Pages-Deployment, Service-Worker-Cache nach Live-Update.
- Tarifabweichungen nach Ablauf der auf der Rechnung ausgewiesenen Vertragsdauer.

## Funktionsrisiken
- OCR kann Zahlen falsch interpretieren, deshalb ausdrückliche Bestätigung vor Speicherung.
- Löschung des lokalen Browserprofils kann Messdaten ohne zuvor erstelltes Backup vernichten.
- Die Kostenprognose ist kein Ersatz für die Jahresabrechnung des Versorgers.
