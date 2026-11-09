# TESTPROTOKOLL_ANDROID.md – StromBlick v1.3.0

## Tatsächlich ausgeführt
- Node.js: `node --check` für app.mjs, calculations.mjs und scripts/prepare-android.mjs: ohne Syntaxfehler.
- `node --test tests/*.test.mjs`: 11 Testgruppen erfolgreich, einschließlich 16 Prüfaussagen der bisherigen Berechnungs-Testdatei.
- Migration: 94 € nur bei unbezahlten ursprünglichen Abschlagsvorlagen auf 150 €; bezahlt und individuelle Einträge unverändert; Idempotenz geprüft.
- Standardwert 150 € für neue geplante Abschläge und für das Zahlungsformular geprüft.
- Vereinfachte Startansicht: erforderliche IDs, Plus und aufklappbare bestehende Detailansichten im HTML geprüft.
- `node scripts/prepare-android.mjs`: Android-Assets mit 10 Dateien generiert; Android-Backup-Anbindung bleibt eingebaut.

## NICHT getestet
- APK-Build auf GitHub / Java-Android-Kompilierung dieser Version (kein Android-SDK hier).
- Start, Datumsanzeige, Datenspeicherung und Backup auf einem echten Android-Gerät.
- Android-Installations-Update über alte Debug-APK mit ggf. abweichender Signatur.
- Echte End-to-End Regression aller App-Bedienungen auf dem Mobiltelefon.

## Prüfung und Schutz
- Grundlage index.html, app.mjs und styles.css aus dem letzten bestätigten GitHub-Stand v1.2.0 per Git-Blob-SHA validiert.
- Alle vorhandenen Messungen und Tarifdaten bleiben unverändert.
- Keine Datenmigration mit Tabellen-/Datenbankänderung; lediglich offene ursprünglich angelegte Abschlagsbeträge werden gezielt aktualisiert.
- Keine GitHub-Änderungen vorgenommen, da Schreibzugriff nicht freigegeben wurde.