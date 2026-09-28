# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r00 · 2026-09-28 · Meilenstein **M0 Fundament** · nächstes Gate **G0**

## Aktueller Meilenstein
M0 — Fundament. Ziel: Repo, Regeln, Modulkatalog, Schema stehen; `npm run check` grün.

## Offene Gates
- **G0** — offen. Fehlt: Antwort von VAVE, welche Module tatsächlich gebucht sind
  (bis dahin Annahme in `docs/survey/modules.json` → `"assumedBooked"`; Annahme in DECISIONS als D-002 vermerken).

## Nächste Zwischenziele (Reihenfolge = Priorität; jedes mit DoD)

1. **Katalog prüfen** — `docs/survey/modules.json`
   DoD: jedes Modul hat `id, label, hint, layer, roles`; ≥ 20 Einträge; `npm run check` grün.
2. **Beispiel-Ergebnis** — `data/results/example.json`
   DoD: validiert gegen `results-schema.json`; deckt alle drei Zonen, `missing`, `budget`, `wand` ab.
3. **Design-Prinzipien schärfen** — `docs/design-principles.md`
   DoD: jede Dimension hat eine 0–10-Skala mit prüfbarem Ankerbeispiel für 4, 7 und 10.
4. **Umfrage-Skelett** — `survey/index.html`
   DoD: 5 Screens navigierbar, Katalog wird aus eingebettetem JSON gerendert, noch ohne Politur;
   `npm run check` meldet keine externen Referenzen.
5. **Frage an Tobias formulieren** — kurze Nachricht, 3 Zeilen, welche Module gebucht sind (Hannes schickt sie).

## Blocker
- keiner

## Erledigt (letzte 5 Runden, älteres → git log)
- r00: Repo-Skelett, CLAUDE.md, ROADMAP, Agenten, Skills, Schema, Katalog v1, Recherche-Notiz

## Gelernt (kurz, was künftige Runden wissen müssen)
- Die Kritik an QuoJob ist fast ausschließlich UX/Starrheit, nicht Funktionsmangel → Zielbild A ist die Arbeitshypothese, wird aber durch G2 entschieden, nicht durch uns.
- VAVE ist eine Gruppe (mehrere Gesellschaften, Studios in DE/CN/AE/SG) → Mandanten/Währung/Sprache sind für sie Kern, nicht Zusatz.

## Nächste Runde startet mit
`/loop` auf Zwischenziel 1.
