# StromBlick v1.1.0 – Android-Testinstallation

Die ursprüngliche Web-App v1.0.0 bleibt unangetastet. Der zusätzliche Android-Build verpackt sie als lokal startbare Android-App.

## APK erstellen
1. Repository https://github.com/Adohadesign/stromblick öffnen.
2. Oben **Actions** wählen.
3. Workflow **Android-APK erstellen** öffnen.
4. **Run workflow** → Branch `main` → **Run workflow**.
5. Nach erfolgreichem Lauf den Durchlauf öffnen, unter **Artifacts** das Paket `StromBlick-v1.1.0-TEST-APK` herunterladen.
6. ZIP entpacken und die darin enthaltene `android-debug.apk` auf dem Handy installieren.

## Hinweise
- Es handelt sich um eine **Test-APK**, nicht um eine signierte Produktionsfreigabe.
- Neue Debug-Builds lassen sich wegen unterschiedlicher Signaturen möglicherweise nicht über die alte Version installieren. Vor Deinstallation oder Versionswechsel zuerst ein Backup exportieren.
- Die Handy-Datenbank der APK ist von einer eventuell zuvor benutzten Browser-PWA getrennt.
- Erfassung, Speicherung und Berechnung erfolgen lokal. Die OCR-Bibliothek wird aktuell aus dem Internet geladen; für die automatische Erkennung ist daher eine Verbindung erforderlich.
- Kamera, Dateiauswahl und Backup müssen auf dem echten Android-Gerät geprüft werden.
