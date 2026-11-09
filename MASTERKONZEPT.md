# MASTERKONZEPT — StromBlick

Stand: 09.11.2026 · Produktversion: v1.0.0

## Zweck
Ein einziger Nutzer erfasst Stromzählerstände auf einem Android-Handy per Foto/OCR oder manuell. Die App zeigt gemessene Verbräuche, Kosten, geschätzte Monatsverteilung, Jahresprognosen und Abschlagzahlungen an. Elektrische Warmwasserbereitung ist Teil des gesamten gemessenen Stromverbrauchs; einzelne Geräte werden nicht erfasst.

## Feste Entscheidungen
- Ein Gerät: Android-Handy, Mobile-First, installierbare Progressive Web App.
- GitHub-Repository `Adohadesign/stromblick`, GitHub Pages.
- Lokale Datenhaltung per IndexedDB ohne Server und Benutzerkonto.
- Eigenständiges Backup und Wiederherstellen (JSON).
- OCR ist eine **Eingabehilfe**, kein automatisches stilles Buchen: Messwert muss bestätigt werden.
- Keine echten Messungen, Preise nach August 2026 oder Zahlungseingänge werden erfunden.
- Historische Preise müssen bei Preiswechsel aktualisierbar sein.

## Datenmodell
- `settings`: Grundzählerstand, Ablesedatum, Periodenende, erwartetes Rechnungsdatum, Vorjahresverbrauch.
- `tariffs`: Beginn, Brutto-Arbeitspreis in Cent/kWh inklusive Stromsteuer, jährlicher Grundpreis brutto.
- `readings`: interne ID, Messdatum, abgelesene kWh, Zeitstempel.
- `payments`: interne ID, Fälligkeitsdatum, Betrag, bestätigt bezahlt (ja/nein).
- Schema `1`. Sicherung ist JSON mit vollständigen Datenfeldern.

## Berechnung und Darstellung
- Die Zählerdifferenz zwischen gemessenen Werten ist Verbrauch. Negative Fortschritte sind unplausibel und werden abgelehnt.
- Der Arbeitspreis wird mit kWh multipliziert; Grundpreis wird anteilig nach Tagen berechnet.
- Tarifwechsel ohne Messung am Stichtag und Monatsdiagramme basieren auf gleichmäßig verteiltem Verbrauch, ausdrücklich als Schätzung markiert.
- Jahresprognosen verwenden den bisherigen Tagesdurchschnitt und einen zukünftigen Zahlungsplan. Keine verbindliche Rechnung.
- Tatsächlich bezahlte Abschläge und geplante/offene Abschläge werden separat behandelt.

## Grenzen und Weiterentwicklung
- OCR benötigt eine Internetverbindung für die extern geladene Bibliothek und gegebenenfalls Sprachmodelle.
- Keine Synchronisation auf andere Geräte.
- Kein automatisch nachgereichtes Tarifwissen und keine automatische Zahlungserkennung.
- Ein vollständiger Jahresabschluss mit Archivansicht, Korrektur/Editieren einzelner Messungen und Offline-OCR ist für spätere Versionen vorgesehen, nicht Bestandteil v1.0.0.
- Änderungen erfolgen versioniert, nach Datensicherung und Regressionstests.
