# Projektstand – StromBlick v1.3.0

## Basis
- Weiterentwicklung des zuletzt aus GitHub geprüften Stands v1.2.0. Inhalt von index.html, app.mjs und styles.css vor Änderungen mit GitHub-Blob-SHAs verifiziert.
- Keine Datenbankänderung und kein Löschen bestehender Messungen.

## Änderungen
- Vereinfachte Startseite: Zähler, große Plus-Eingabe, vier Hauptwerte; Details bleiben aufklappbar.
- Neue Abschlagsvorlagen und Vorschlagswert beim Hinzufügen: **150 €** statt 94 €.
- Beim ersten Start: ausschliesslich offene 94-€-Abschläge mit den ursprünglichen Vorlagen-IDs von August 2026 bis Juni 2027 auf 150 € anpassen.
- Bereits als bezahlt markierte Abschläge und individuelle Zusatzzahlungen bleiben unverändert.
- Messungen, Berechnungen, Tarife, Backup und Datenbanknamen bleiben erhalten.

## Prüfung
- Node-Tests für Berechnungen, manuelle Erfassung, Migration und Dashboard.
- Android-Asset-Vorbereitung und HTML-Validierung vor Auslieferung.
- Android-APK-Build und Handytest stehen noch aus.
- Debug-APKs aus verschiedenen GitHub-Läufen können unterschiedlich signiert sein. Vor eventueller Deinstallation zuerst Backup exportieren.

## Status
GitHub wurde aufgrund fehlender Freigabe für Schreibzugriffe **nicht geändert**. Dieses Paket enthält vollständige ersetzbare Dateien.