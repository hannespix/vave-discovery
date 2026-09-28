# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r01 · 2026-09-28 · Meilenstein **M0 Fundament** · nächstes Gate **G0**

## Aktueller Meilenstein
M0 — Fundament. Ziel: Repo, Regeln, Modulkatalog, Schema stehen; `npm run check` grün.

## Offene Gates
- **G0** — Kriterien 3/3 formal erfüllt: `npm run check` grün auf `data/results/example.json`, Katalog hat 37 Module,
  Annahme zu gebuchten Modulen steht in D-002. Freigabe durch Hannes ausstehend, **blockiert durch B1**.

## Blocker
- **B1 · Kill auf nicht gebuchten Modulen verzerrt `killCore`** (red-team r01, Schwere hoch). Braucht Entscheidung Hannes.
  13 von 27 core/backoffice-Karten sind `assumedBooked: false`. Ein Kill darauf zählt in `killCore`
  (ROADMAP → Zielbild-Regeln) und kann den Vorschlag zwischen A und C kippen. In `example.json` stammt
  `killCore = 1` allein von `media` (nicht gebucht). Optionen für einen D-Eintrag:
  (a) D-002 präzisieren: nicht gebuchte Karten bieten nur „fehlt mir“ und „weiß nicht“ an;
  (b) `killCore` zählt nur gebuchte Module (ROADMAP-Regel per D-Eintrag ändern);
  (c) VAVE bestätigt die gebuchte Modulliste (Zwischenziel 3), dann ersetzt die Liste die Annahme.

## Offene Entscheidungen (vor dem Versand der Umfrage; Vorlagen im PR zu r01)
- **E1 · Layer-Regel:** ein Kriterium statt drei, vor der Erhebung einfrieren. Betrifft vor allem `multilingual`,
  `media`, `time-tracking`; `multilingual` allein kippt ein plausibles Gruppenprofil zwischen B und A.
- **E2 · Rollen:** Funktion und Standort getrennt erfassen; `asia` ist ein Standort. Ändert das Ergebnis-Schema.
- **E3 · Frust-Skala:** Häufigkeit oder Intensität messen; „weiß nicht“ bei keep erlauben (`frust: null`),
  Schema 1.0 lässt das nicht zu. Ändert das Ergebnis-Schema.

## Nächste Zwischenziele (Reihenfolge = Priorität; jedes mit DoD)

1. **Katalogtexte neu fassen** — `docs/survey/modules.json`: `label`, `hint`, Rollen-Bezeichnungen, eine neue Karte.
   `id`, `layer`, `roles`, `assumedBooked` bestehender Karten bleiben unverändert (E1, E2 offen).
   DoD: Die r01-Paare (retainer/recurring, calendar/absence/calendar-sync, crm/bizdev, correspondence/mail-client,
   time-tracking/hr, project-board/jobs, controlling/data-export, mobile-app/invoices-in) nennen je ihr
   Trennmerkmal, kein Schlüsselwort steht auf zwei Karten. Jedes Label ≤ 28 Zeichen, eine Sache, ohne „&“, „/“
   oder Klammer; jeder Hint ein Satzteil ≤ 45 Zeichen in derselben Form. Ein Begriff pro Sache, keine
   unaufgelöste Abkürzung, kein Label gleich einem Modulnamen des Herstellers. Neue Karte für Projektplanung mit
   Zeitachse. `npm run check` grün.
2. **Umfrage-Skelett** — `survey/index.html`, `scripts/check.mjs`, `package.json`
   DoD: Start, 5 Screens und Ende sind mit Maus, Touch und Tastatur navigierbar; jeder Bewertungs-Screen hat eine
   sichtbare Neutraloption. Karten kommen nur aus eingebettetem JSON; `npm run check` meldet Abweichungen von
   `modules.json` und keine externen Referenzen. Die Kartenreihenfolge verschränkt die Layer, der Rollen-Screen
   startet ohne Vorbelegung. Die heruntergeladene Datei besteht `npm run check -- <datei>`.
3. **Frage an Tobias** — `docs/messages/2026-09-28-frage-an-tobias.md`, Hannes schickt sie.
   DoD: höchstens 3 Zeilen; fragt, welche Module VAVE gebucht hat (löst B1 über Option c) und ob die
   Gesellschaften in Asien selbst Angebote und Rechnungen schreiben (stützt E2).

## Erledigt (letzte 5 Runden, älteres → git log)
- r01: Zwischenziel „Katalog prüfen“. DoD formal erfüllt, keine Änderung am Katalog. ui-critic FIX
  (Bauchbedienung 6, Klarheit 5, Ton 7), red-team BLOCK (B1), Runde ohne Korrekturschleife beendet.
  Zwischenziele „Beispiel-Ergebnis“ und „Design-Prinzipien schärfen“ gestrichen: DoD schon mit r00 erfüllt
  (`example.json` validiert und deckt keep/kill/miss/skip, `missing`, `budget`, `wand` ab; Anker 4/7/10 in allen
  8 Dimensionen). CI: `check.yml` prüft jeden PR, `pages.yml` deployt `survey/` bei Push auf main.
- r00: Repo-Skelett, CLAUDE.md, ROADMAP, Agenten, Skills, Schema, Katalog v1, Recherche-Notiz

## Gelernt (kurz, was künftige Runden wissen müssen)
- Die Kritik an QuoJob ist fast ausschließlich UX/Starrheit, nicht Funktionsmangel → Zielbild A ist die Arbeitshypothese, wird aber durch G2 entschieden, nicht durch uns.
- VAVE ist eine Gruppe (mehrere Gesellschaften, Studios in DE/CN/AE/SG) → Mandanten/Währung/Sprache sind für sie Kern, nicht Zusatz.
- Kartentexte tragen die Zielbild-Rechnung mit: Eine missverständliche oder doppelte Karte, die auf Kill landet,
  erhöht `killCore`. Texte vor der Erhebung einfrieren.
- `modules.json` ist nach Layer sortiert. Übernimmt die Umfrage diese Reihenfolge, wird jeder Reihenfolge- und
  Ermüdungseffekt zum Layer-Effekt.
- Frust misst Häufigkeit („0 nie … 5 täglich“). Monatliche Backoffice-Vorgänge erreichen die oberen Stufen kaum,
  Regel 2 (B) ist damit strukturell schwer erreichbar.
- `example.json` ist als Referenz uneinheitlich: `media` (nicht gebucht) steht auf kill, `cashbook` (nicht gebucht)
  auf skip; alle Rollenlisten sind Teilmengen der Katalogvorgabe, wie bei einer Vorbelegung.

## Nächste Runde startet mit
`/loop` auf Zwischenziel 1 (Katalogtexte). B1 wartet auf Hannes und blockiert die Zwischenziele 1–3 nicht.
