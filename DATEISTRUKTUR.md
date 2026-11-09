# DATEISTRUKTUR — StromBlick v1.0.0

Alle Pfade relativ zum Repository-Stammverzeichnis:

```text
stromblick/
├── index.html                 Startoberfläche, Formulare, Dialoge
├── styles.css                 Responsive Design
├── app.mjs                    Bedienlogik, OCR, Diagramme, Import/Export
├── calculations.mjs           Rechen- und Validierungsfunktionen
├── storage.mjs                IndexedDB-Zugriff
├── service-worker.js          Offline-App-Shell, Cacheverwaltung
├── manifest.webmanifest       App-Installation
├── icons/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── tests/
│   ├── calculations.test.mjs  Rechenprüfungen unter Node.js
│   └── ui_smoke.py            Browser-Smoke-Test, benötigt Playwright
├── README.md
├── MASTERKONZEPT.md
├── PROJEKTSTAND.md
├── DATEISTRUKTUR.md
└── TESTPROTOKOLL.md
```
