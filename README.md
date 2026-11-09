# StromBlick v1.0.0

Private Stromzähler- und Verbrauchs-App für ein Android-Handy, als installierbare PWA über GitHub Pages.

## Schnellstart

1. Dieses Paket **entpacken** (ZIP nicht ungeöffnet zu GitHub hochladen).
2. Alle **Dateien und Ordner aus dem Paket** in das GitHub-Repository `Adohadesign/stromblick` hochladen (GitHub: **Add file → Upload files**). Die `index.html` muss direkt im Stammverzeichnis liegen.
3. Unter **Settings → Pages** bei **Build and deployment** die Option **Deploy from a branch** wählen, anschließend **main** und **/(root)**, danach **Save**.
4. Nach Veröffentlichung die vom GitHub-Pages-Dialog angegebene Seite auf dem Handy in Chrome öffnen (gewöhnlich `https://adohadesign.github.io/stromblick/`). Chrome-Menü → **Zum Startbildschirm hinzufügen** oder **App installieren**.
5. In StromBlick die vorausgefüllten Rechnungswerte prüfen und einmalig **App einrichten** drücken. Danach Zählerstand fotografieren oder manuell eingeben.

WICHTIG: Die Rechnungswerte sind historisch (Abrechnung 18.06.2026), nicht zwingend die heutigen Preise. In den Einstellungen einen neueren Tarif ab seinem tatsächlichen Gültigkeitsdatum eintragen. Abschläge nur als „bezahlt“ markieren, wenn die Zahlung erfolgt ist.

## Datenschutz und Datensicherung

- Zählerstände, Tarifdaten und Zahlungen werden im **IndexedDB-Speicher des Handys** abgelegt, nicht in GitHub.
- Fotos werden nur zur Erkennung temporär im Browser geladen und **nicht** mit den Messungen gespeichert.
- Fotoerkennung nutzt Tesseract.js (Skript wird von einem CDN geladen) und benötigt dafür beim ersten Mal Internet. Die Bilderkennung erfolgt auf dem Gerät; OCR-Fehler sind möglich. **Jeden erkannten Wert vor dem Speichern prüfen.**
- Nach der ersten Online-Installation kann die Kern-App offline geöffnet und mit manueller Zählerstandserfassung genutzt werden; Fotoerkennung kann offline ausfallen.
- Bei Datenverlust, Browserdaten-Löschung oder Handywechsel ist nur eine zuvor exportierte JSON-Sicherung verfügbar. **Regelmäßig in der App unter Einstellungen ein Backup exportieren** und auf einem sicheren Datenträger aufbewahren.
- Öffentliche GitHub Pages: Quellcode ist öffentlich und die Web-App-Adresse grundsätzlich für jeden abrufbar. Persönliche Daten kommen nicht ins Repository. Keine Konten, keine Loginfunktion.

## Berechnung

- Basis laut Rechnung: Zählerstand **10.396 kWh am 19.05.2026**.
- Historischer Brutto-Arbeitspreis inklusive Stromsteuer: **30,3569 ct/kWh** (= (23,46 + 2,05) × 1,19).
- Historischer Grundpreis: **180 € jährlich**.
- Neue Abschläge aus Rechnung: **11 × 94 €**, August 2026 bis Juni 2027 – zunächst als **unbezahlt** vorgemerkt.
- Verbrauch zwischen zwei Ablesungen: exakt aus der Differenz (sofern der Zähler nicht gewechselt hat).
- Kosten bei Tarifwechseln innerhalb eines Messintervalls sowie Monatsverbrauch: **gleichmäßige Verteilung als Schätzung**.
- Grundpreis: anteilig mit 365 Tagen pro Jahr; Schaltjahre/abweichende Abrechnungslogik eines Versorgers können minimale Abweichungen verursachen.
- Prognose auf Grundlage des bisherigen Tagesdurchschnitts; saisonale Schwankungen, reale Abschläge, Preisänderungen und ein künftiger Jahreswechsel bleiben unsicher.

## Systemvoraussetzungen

Chrome auf Android mit HTTPS (GitHub Pages), aktivierter Kamera für Fotofunktion und lokalem Browserspeicher. Kein Server, keine SQL-Datenbank, keine API-Schlüssel erforderlich.

## Projektinformationen

Siehe `MASTERKONZEPT.md`, `PROJEKTSTAND.md`, `DATEISTRUKTUR.md` und `TESTPROTOKOLL.md` für Konzept, Versionierung und tatsächlichen Teststatus.
