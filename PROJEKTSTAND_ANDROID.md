# Projektstand StromBlick v1.1.0

- Basis: v1.0.0 im Repository, nicht ersetzt.
- Ziel: APK statt Webinstallation, ohne Server, ohne Konto und ohne Datensynchronisierung.
- Neu: Android-WebView-Projekt, Zugriff auf native Kamera-/Dateiauswahl, Android-Backup-Export, GitHub-Actions-Build.
- Android-Paketname: de.adohadesign.stromblick.
- Bestehende Messwerte und Berechnungslogik: unveränderte Web-Basis.
- Status: Android-Quellen und Builddefinition hinzugefügt. Ein erfolgreicher Gradle-Build und ein Funktionstest auf dem Handy sind **noch nicht bestätigt**.
- Sicherheit: Original- und historische Daten nicht löschen. Vor künftigen Updates Backup anlegen. Die aktuelle Debug-Signierung eignet sich noch nicht als dauerhafte Update-Lösung.
