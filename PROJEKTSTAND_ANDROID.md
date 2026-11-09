# Projektstand StromBlick v1.2.0 – manuelle Erfassung

## Grundlage
- Weiterentwicklung des zuletzt in GitHub vorliegenden Android-Standes v1.1.1 (mit v1.0.0-Datenmodell).
- GitHub-Repository: Adohadesign/stromblick.
- Android-Paket: de.adohadesign.stromblick.

## Änderungen v1.2.0
- Großes Plus zur Eingabe eines Zählerstands in kWh.
- Tagesdatum beim Öffnen sichtbar; beim Speichern wird das aktuelle lokale Datum des Handys verwendet.
- Fotoerkennung und Kamera-Bedienelemente entfernt.
- Kein Zählerstand wird automatisch aus einem Foto übernommen.
- Bestehende Verbrauchs-, Kosten-, Prognose-, Abschlags- und Backup-Funktionen bleiben vorhanden.
- Es gibt keine automatische Datenlöschung und keine Datenbankmigration.

## Prüfung
- GitHub Actions führt Berechnungs- und Erfassungs-Regressionstests aus.
- APK-Build läuft über GitHub Actions.
- Handyinstallation, Datum bei Mitternachtswechsel, Bedienung und Wiederherstellung vor Ort müssen praktisch verifiziert werden.
- Debug-APKs aus verschiedenen GitHub-Runs können unterschiedlich signiert sein. Vor einer eventuellen Deinstallation zuerst ein Backup exportieren.

## Datenrisiko
Fehlablesungen, die bereits bestätigt und gespeichert wurden, werden **nicht automatisch geändert oder gelöscht**. Ein direktes Überschreiben historischer Einträge ist nicht vorgesehen.
