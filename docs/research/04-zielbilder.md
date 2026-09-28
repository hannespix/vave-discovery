# Zielbilder

Die Umfrage soll nicht „ja/nein zum Nachbau" beantworten, sondern zwischen
drei realistischen Zielbildern unterscheiden. Die Hypothese steht unten;
sie ist zu prüfen, nicht gesetzt.

## A – Neues Frontend, altes Rückgrat

QuoJob bleibt **System of Record** für alles Kaufmännische: Angebote,
Rechnungen, Nummernkreise, FiBu-Export, Mandanten, Währungen, HR.
Wir bauen die Oberfläche, die 80 % der Leute täglich anfassen:

- Zeiterfassung, die in fünf Sekunden erledigt ist (Desktop und Handy)
- Aufgaben und Projektstatus pro Person/Team/Studio
- Budget-Ampel pro Projekt, für alle sichtbar
- Kapazitäts-Übersicht über Studios und Zeitzonen
- Dashboards je Rolle (GF, PM, Kreation, Backoffice)

Anbindung über die QuoJob REST-API (JSON-RPC, 52 €/Monat, Einrichtung mit
QuoTec-Admin). Rechte bleiben die QuoJob-Rechte.

**Passt, wenn:** Frust liegt bei den Nutzern (Wege, Klicks, Oberfläche),
nicht im Backoffice; Mandanten/FiBu funktionieren; Budget < 2 T€/Monat.
**Risiken:** API-Abdeckung und -Stabilität unter Fortes; Doppelpflege,
wenn die API bestimmte Objekte nicht schreibt; Abhängigkeit vom Anbieter
bleibt.
**Aufwand:** Vibecoding-tauglich. Kein Steuer-, kein GoBD-Risiko.

## B – Wechsel auf ein modernes SaaS

QuoJob wird durch ein System ersetzt, das für 100+ Leute und mehrere
Standorte gebaut ist (Kandidaten in `06-marktscreening.md`). Wir bauen
höchstens kleine Ergänzungen (Dashboards, Import-Helfer).

**Passt, wenn:** Frust liegt auch im Backoffice; Fortes-Übernahme macht
nervös; Migration ist organisatorisch tragbar.
**Risiken:** Migration von 20 Jahren Daten; Schulung von 100+ Leuten;
Mandanten/Währungen sind nicht bei allen Anbietern gleich stark.
**Aufwand:** Beschaffung und Change-Management, kaum Entwicklung.

## C – Vollnachbau

Eigenes System für Projekte, Zeiten, Faktura, Mandanten, FiBu-Export.

**Passt nur, wenn:** Pain Points im Kern liegen (Rechnungslogik, Mandanten),
kein SaaS passt, Tobias ein dauerhaftes Budget für Pflege nennt, und jemand
die Verantwortung für Rechnungsnummern, E-Rechnung/XRechnung, GoBD,
Aufbewahrung und Steuerregime in DE/CN/AE/SG übernimmt.
**Risiken:** Das ist ein ERP mit Buchhaltungsrelevanz in vier Ländern.
Fehler kosten Geld und Prüfungsärger, nicht nur Nerven. Ein Vibecoding-
Prototyp ist schnell, ein wartbares Produkt mit Nummernkreisen, Rechten,
Backups und Audit-Trail ist eine Firma.
**Aufwand:** Nicht abschätzbar ohne Antworten auf die offenen Fragen.

## Entscheidungskriterien aus der Umfrage

| Signal aus der Umfrage | Deutet auf |
|---|---|
| „Brauchen wir" bei Mandanten, FiBu, Währung + Reibung dort niedrig | A |
| Reibung hoch bei Zeiterfassung, PM, Kalender, App | A |
| Reibung hoch bei Rechnungen, OP, FiBu-Export | B oder C |
| Rollen: Kreation/Tech nutzt täglich, GF selten | A |
| Bauen-vs-Kaufen-Regler klar Richtung „bauen" **und** Backoffice-Module „weg" | C |
| Regler Richtung „kaufen", Frust auch im Backoffice | B |
| Schmerzgrenze deutlich unter heutigen Kosten | B (günstigeres SaaS) oder A (QuoJob abspecken) |

Die Logik steckt in `hypothesis()` in `survey/index.html`. Schwellen dort
sind erste Setzungen (Reibung ≥ 2,5; Regler ≤ 40 / ≥ 60 / ≥ 70) – bei
Bedarf anpassen und hier nachziehen.

## Arbeitshypothese

**A.** Begründung: Die öffentliche Kritik an QuoJob ist fast ausschließlich
UX-Kritik. VAVEs Struktur (Gruppe, Währungen, Sprachen) ist genau das, was
QuoJob gut kann und was ein Nachbau am teuersten macht. Der Hebel liegt
bei den vielen Non-Power-Usern, nicht bei den 15 Leuten mit Controlling-
Zugriff.

## Offene Fragen (blockieren die Entscheidung)

1. Welche Module sind gebucht, wie viele Nutzer je Lizenztyp?
2. Ist die REST-API aktiv? Was kann sie lesen/schreiben (Zeiten, Aufgaben,
   Jobs, Kontakte)? Gibt es eine Doku, die wir sehen dürfen?
3. Wer trägt heute die Buchhaltung, und was darf sich dort nicht ändern?
4. Wie arbeiten Shanghai/Shenzhen/Dubai/Singapur heute mit QuoJob –
   gar nicht, per MyTime, per eigenem Mandanten?
5. Was ist Tobias' Zeithorizont – Prototyp in Wochen oder Produkt in Monaten?
