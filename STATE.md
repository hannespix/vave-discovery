# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r00 · 2026-09-28 · Meilenstein **M0 Fundament → M1 Umfrage** · nächstes Gate **G0**

## Aktueller Meilenstein
M0 ist technisch durch (`npm run check` grün, Katalog 28 Bausteine in 5 Gruppen, Schema fixiert,
Design-Prinzipien mit Ankern). Die M1-Umfrage ist bereits gebaut und in Playwright getestet.
Formal offen bleibt nur die Frage an VAVE (siehe G0). Arbeit läuft daher schon auf M1-Zwischenzielen.

## Offene Gates
- **G0** — Kriterien 2/3 erfüllt. Fehlt: Liste der bei VAVE gebuchten Module.
  Bis dahin gilt D-002 (alle Bausteine zeigen, „Kenne ich nicht“ ist Messwert). Freigabe durch Hannes ausstehend.
- **G1** — offen. Nachweis (`data/results/YYYY-MM-DD_tobias.json`) existiert noch nicht.

## Nächste Zwischenziele (Reihenfolge = Priorität; jedes mit DoD)

1. **Frage an Tobias** — 3 Zeilen: welche Module gebucht, wie viele Power-/Non-Power-User, gibt es das API-Modul?
   DoD: Nachricht formuliert und von Hannes verschickt; Antwort oder „keine Antwort bis <Datum>“ in DECISIONS als D-004.
2. **Kritik-Runde über die fertige Umfrage** — `ui-critic` + `red-team` parallel, Prüfrichtung Umfrage
   DoD: beide Berichte liegen vor; Befunde `FIX` sind als Zwischenziele 3+ eingetragen; kein `BLOCK`.
3. **Test durch eine unbeteiligte Person** — eigenes Handy, ohne Erklärung, Zeit stoppen
   DoD: < 8 Minuten; Export validiert (`npm run check <datei>`); Stolperstellen als Liste in „Gelernt“.
4. **Versandpaket** — `npm run bundle` → `dist/vave-discovery-umfrage.html` + Zwei-Zeilen-Anleitung
   DoD: Datei öffnet auf iPhone-Safari und Android-Chrome aus dem Dateisystem; `npm run check` grün auf `dist/`.
5. **Brief-Probelauf** — `/brief data/results/example.json`
   DoD: Brief entsteht in `docs/brief/`, alle 12 Abschnitte gefüllt, jede Aussage mit Beleg; `red-team` findet keinen Widerspruch zwischen `hypothesis.target` und Gatekeeper-Rechnung.

## Blocker
- keiner

## Erledigt (letzte 5 Runden, älteres → git log)
- r00: Repo-Skelett, CLAUDE.md, ROADMAP mit Gates und Zielbild-Regeln, DECISIONS D-001–003, 6 Agenten, 4 Skills,
  Hook + Rechte in `.claude/settings.json`, `check.mjs`, `bundle.mjs`, Schema `vave-discovery/1`, Recherche-Doku 00–06
- r00: Umfrage (7 Stationen) gebaut und getestet: Drag/Tap/Tasten, Rückholen, Reibungsregler, Chips, Rollen, Budget,
  Export JSON + Brief, Reload-Wiederaufnahme, mobile Taps auf „Weiter“ in allen Stationen; Google-Fonts entfernt

## Gelernt (kurz, was künftige Runden wissen müssen)
- Die Kritik an QuoJob ist fast ausschließlich UX/Starrheit, nicht Funktionsmangel → Zielbild A ist Arbeitshypothese,
  wird aber durch G2 entschieden, nicht durch uns.
- VAVE ist eine Gruppe (mehrere Gesellschaften, Studios in DE/CN/AE/SG) → Mandanten/Währung/Sprache sind Kern, nicht Zusatz.
- Playwright meldete einmal „main#stage intercepts pointer events“ auf `#next` (mobil). Reproduktion mit echten Taps
  nach Scrollen schlug fehl: alle 7 Stationen durchlaufen. Vermutlich Timing mit der Karten-Fluganimation. Auf echtem
  Gerät gegenprüfen (Zwischenziel 3), nicht vorab „fixen“.
- Output-Ordner sind nicht exklusiv: Ergebnisse immer in Git committen, nicht in einem Arbeitsordner liegen lassen.

## Nächste Runde startet mit
`/loop 2` (Kritik-Runde) — Zwischenziel 1 macht Hannes ohne Agenten.
