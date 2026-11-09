# PROJEKTSTAND — StromBlick

Datum: 09.11.2026
Version: **v1.0.0 — Erstlieferung**

## Implementiert
- Mobile-First-Oberfläche, installierbare PWA (Manifest, Service Worker)
- Ersteinrichtung mit vorausgefüllten Werten aus der Stromrechnung
- Foto auswählen/aufnehmen, OCR-Lesevorschlag und manuelle Bestätigung
- Manuelle Zählerstandseingabe mit Plausibilitätskontrolle
- Berechnung: Verbrauch, Kosten, Jahresprognose, Abschlagsbilanz
- Zeitabschnittsweise Stromtarife, Diagramm aus interpolierten Messabständen
- Abschlagszahlungen einzeln als bezahlt/offen markieren
- Lokaler Speicher via IndexedDB, Export und vorsichtiger Import von JSON-Sicherungen

## Noch nicht abgeschlossen
- Installation und Fotofunktion auf dem echten Handy sowie Überprüfung mit einem echten Zählerfoto.
- GitHub-Upload und Aktivierung von GitHub Pages durch Benutzer; keine Veröffentlichung bestätigt.
- Nachweis, dass die aktuellen Stromtarifpreise der historischen Rechnung noch entsprechen.

## Upgrade-/Rollback-Konzept
- Vor jedem Update Backup im Menü **Einstellungen → Backup exportieren** erstellen.
- Vorhandene Datei-Version im GitHub-Commit behalten; Updates mit Versionsnummer und getesteter Änderungsliste.
- Rollback: alten GitHub-Commit wiederherstellen; Datenbank bleibt erhalten, solange das Schema kompatibel ist. Bei Schemaänderungen zusätzlich das entsprechende Backup wiederherstellen.
- Vorhandene Mess- und Zahlungsdaten niemals bei einem App-Update automatisch zurücksetzen.
