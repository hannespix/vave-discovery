# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: nach Runde r01 + Basiswechsel · 2026-09-28 · Meilenstein **M0 Fundament → M1 Umfrage** · nächstes Gate **G0**

## Aktueller Meilenstein
M0 ist technisch durch (`npm run check` grün, Katalog 28 Bausteine in 5 Gruppen, Schema `vave-discovery/1` fixiert,
Design-Prinzipien mit Ankern). Die M1-Umfrage ist gebaut und in Playwright getestet; `pages.yml` deployt sie bei
jedem Merge auf main als Vorschau (https://hannespix.github.io/vave-discovery/). Arbeit läuft auf M1-Zwischenzielen.

## Offene Gates
- **G0** — Kriterien 2/3 erfüllt. Fehlt: Liste der bei VAVE gebuchten Module. Bis dahin gilt D-002
  (alle Bausteine zeigen, „Kenne ich nicht“ ist Messwert). Freigabe durch Hannes ausstehend.
- **G1** — offen. Nachweis `data/results/YYYY-MM-DD_tobias.json` existiert noch nicht. Vor dem Versand an Tobias
  müssen B1 entschieden und Zwischenziel 1 erledigt sein.

## Blocker
- **B1 · Regel 1 schlägt Zielbild C bei Unwissen vor** (Übernahmeprüfung; derselbe Mechanismus wie r01/`killCore`).
  `keptBack` zählt nur „Brauchen wir“; Karten auf „Kenne ich nicht“ senken es wie „Brauchen wir nicht“.
  Headless-Lauf: 6 behalten, Rest per „Rest zu ‚Kenne ich nicht‘“, Regler 75 → „Zielbild C: Eigenes System“,
  das Tobias am Ende angezeigt bekommt. Ändert eine ROADMAP-Regel → Entscheidung Hannes.
  Blockiert den Versand an Tobias, nicht die Arbeit an den Zwischenzielen.

## Offene Entscheidungen (Entwürfe im PR zum Basiswechsel)
- **D-004 Basiswechsel** — im Chat entschieden (Hannes, 2026-09-28), Eintrag in DECISIONS.md fehlt.
- **Regel 1 (B1)** — „Kenne ich nicht“ getrennt von „Brauchen wir nicht“ behandeln, oder Regel 1 erst ab einer
  Mindestzahl bewerteter Finanz-/Gruppen-Karten anwenden.
- **Preise auf den Karten** — D-002 zeigt Konfiguratorpreise; sie verankern Keep/Drop an Kosten.
- **Budget-Neutraloption** — Schema kennt „weiß ich nicht“ nur für heutige Kosten, nicht für Schmerzgrenze und Regler.
- **Rollen** — `asia` ist ein Standort, `freelancer` ein Vertragsverhältnis; beide mischen sich mit Funktionen.

## Nächste Zwischenziele (Reihenfolge = Priorität; jedes mit DoD)

1. **Korrekturen vor dem Versand** — `survey/modules.js`, `survey/index.html`; keine Regel- oder Schemaänderung
   DoD: Bausteinnamen und Beschreibungen in eigenen, generischen Worten, kein Produktname des Herstellers,
   ids unverändert. Kartenreihenfolge verschränkt die fünf Gruppen reihum, Reload zeigt dieselbe Reihenfolge.
   Bei 390 px bricht kein Kartenname mitten im Wort um (Screenshot). Station 5: „Weiter“ erst, wenn jeder Regler
   bewegt oder „weiß ich nicht“ gewählt ist, kein vorbelegter Wert sichtbar. `FRONT` in `hypothesis()` entspricht
   der ROADMAP (`zeit, kalender, pm, app`). `npm run check` grün, `dist/` neu gebündelt.
   Kritik der Runde: `ui-critic` über alle sieben Stationen (390 px und 1280 px), `red-team` Umfrage und Ableitung.
2. **Frage an Tobias** — 3 Zeilen: welche Module gebucht, wie viele Power-/Non-Power-User, gibt es das API-Modul?
   DoD: Nachricht formuliert und von Hannes verschickt; Antwort oder „keine Antwort bis <Datum>“ in DECISIONS.
3. **Test durch eine unbeteiligte Person** — eigenes Handy, Pages-Link, ohne Erklärung, Zeit stoppen
   DoD: < 8 Minuten; Export validiert (`npm run check -- <datei>`); Stolperstellen als Liste in „Gelernt“.
4. **Versandpaket** — Pages-Link oder `dist/vave-discovery-umfrage.html` + Zwei-Zeilen-Anleitung
   DoD: öffnet auf iPhone-Safari und Android-Chrome; `npm run check` grün auf `dist/`.
5. **Brief-Probelauf** — `/brief data/results/example.json`
   DoD: Brief entsteht in `docs/brief/`, alle Abschnitte gefüllt, jede Aussage mit Beleg; `red-team` findet keinen
   Widerspruch zwischen `hypothesis.target` und Gatekeeper-Rechnung.

## Erledigt (letzte 5 Runden, älteres → git log)
- Basiswechsel (Hannes, 2026-09-28): Upload-Fassung übernommen — Umfrage (7 Stationen), `survey/modules.js`,
  Schema `vave-discovery/1`, Recherche 00–06, `bundle.mjs`, erweiterter Check. Übernahmeprüfung (Headless,
  390 × 844, Touch): Check grün, Bundle byte-gleich, alle Stationen erreichbar, Export valide, Reload setzt fort,
  keine Konsolenfehler, keine externen Requests. CI: `pages.yml` bündelt und deployt die Einzeldatei.
- r01 (alter Katalog `docs/survey/modules.json`, jetzt ersetzt): ui-critic FIX, red-team BLOCK (`killCore` zählte
  Kills auf nicht gebuchten Modulen). Übertragbare Befunde stehen unter „Gelernt“.
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
- Kartentexte tragen die Zielbild-Rechnung mit (r01): Eine missverständliche Karte verschiebt die Regeln.
  Texte vor der Erhebung einfrieren.
- Übernahmeprüfung, außer B1:
  - Budgetregler starten bei 1.500 €, 2.500 €, 50 und landen unberührt im Export → Anker und Scheinantwort.
  - Karten tragen Produktnamen des Herstellers („HR Professional“, „Projektmanagement Pro“, „Media-Abwicklung“,
    „Wiederkehrende Leistungen“) → widerspricht „Nicht verhandelbar“ in CLAUDE.md.
  - Kartenreihenfolge fest nach Gruppe, Finanzen und Gruppe zuletzt; „Rest zu ‚Kenne ich nicht‘“ trifft genau die
    Karten, die Regel 1 entscheiden.
  - Bei 390 px sind die drei Zonen zu schmal, Kartennamen brechen mitten im Wort („Vollt exts uche“).
  - `FRONT` in `hypothesis()` hat 6 Bausteine, die ROADMAP nennt 4.
  - D-002 und D-003 wurden in der Upload-Fassung überschrieben statt durch neue Einträge ergänzt; die alten
    Fassungen stehen im git log (r00).

## Nächste Runde startet mit
`/loop 1` (Korrekturen vor dem Versand) als r02. Zwischenziel 2 macht Hannes ohne Agenten.
