# ROADMAP — Meilensteine, Gates, Verzweigungen

Die ROADMAP ist **stabil**: Meilensteine und Gates ändern sich nur per Eintrag in `DECISIONS.md`.
Die **Zwischenziele** innerhalb eines Meilensteins sind **dynamisch**: der `gatekeeper` leitet
sie am Ende jeder Runde aus dem tatsächlichen Ergebnis ab und schreibt sie in `STATE.md`.
Was hier unter „Zwischenziele (Startmenge)“ steht, ist nur die erste Ableitung.

Ein Gate hat immer: **Nachweis** (Datei/Pfad), **Kriterien** (prüfbar), **Verzweigung** (was danach
passiert, je nach Ergebnis), **Abbruchkriterium** (wann wir aufhören statt weitermachen).

```
M0 Fundament ──G0──▶ M1 Umfrage ──G1──▶ M2 Auswertung & Zielbild ──G2──┬─▶ M3A Frontend auf Bestand
                                                                        ├─▶ M3B Markt-Screening + Ergänzungen
                                                                        └─▶ M3C Eigener Kern
                                                        M3x ──G3──▶ M4 Pilot ──G4──▶ M5 Rollout/Stop
```

---

## M0 — Fundament

**Ziel:** Repo, Regeln, Katalog und Schema stehen; jeder Agent kann ohne Rückfrage loslegen.

Zwischenziele (Startmenge):
- Baustein-Katalog `survey/modules.js` vollständig: jeder Baustein mit `group` und `price`; Wünsche, Rollen, Reibungsskala
- `docs/survey/results-schema.json` fixiert; `npm run check` validiert `data/results/example.json`
- `docs/design-principles.md` mit messbaren Kriterien für den `ui-critic`
- Offene Frage an Tobias/VAVE beantwortet: **welche QuoJob-Module sind tatsächlich gebucht?**

### Gate G0 — „Bauen darf beginnen“
- Nachweis: `npm run check` grün; Katalog hat ≥ 20 Bausteine in 5 Gruppen
- Kriterium: Liste der gebuchten Module liegt vor **oder** ist als Annahme in `DECISIONS.md` dokumentiert
- Verzweigung: → M1
- Abbruch: keiner (M0 kann nicht scheitern, nur dauern)

---

## M1 — Umfrage

**Ziel:** Tobias füllt in 5–7 Minuten aus, hat Spaß dabei, und wir bekommen ein valides `results.json`.

Stand r00: Die sieben Stationen sind gebaut (Eingang · Sortieren Keep/Drop/Unknown per Drag, Tap oder
Tasten 1/2/3 · Reibung 0–4 mit animiertem Gesicht · Wünsche 3-stufig + eigene · Rollen × Häufigkeit ·
Budget mit drei Reglern · Zauberstab + „Darf nicht passieren“ · Ergebnis mit Hypothese, JSON- und
Brief-Download, Confetti). Desktop, Touch-Tap und Touch-Drag laufen in Playwright.

Zwischenziele (Startmenge, was noch fehlt):
- Test durch eine unbeteiligte Person auf dem eigenen Handy, Zeit stoppen (< 8 Min.)
- `ui-critic` einmal über alle sieben Stationen (Viewport 390 px und 1280 px)
- `red-team` Prüfrichtung Umfrage: Suggestivität, Reihenfolgeeffekt der Karten, Neutraloption sichtbar?
- `npm run bundle` → Einzeldatei an Tobias, mit Zwei-Zeilen-Anleitung (öffnen, am Ende beide Downloads zurückschicken)

### Gate G1 — „Daten sind da“
- Nachweis: `data/results/YYYY-MM-DD_tobias.json` validiert gegen Schema (`npm run check`)
- Kriterien: `ui-critic` ≥ 8/10 in allen Dimensionen aus `design-principles.md`;
  `red-team` findet keine Bias-Falle mit Schwere „hoch“ (Suggestivfragen, Reihenfolgeeffekte, fehlende Neutraloption);
  Testlauf durch eine unbeteiligte Person unter 8 Minuten
- Verzweigung:
  - Antwort vollständig → M2
  - Antwort abgebrochen / unvollständig → Runde „Umfrage kürzen“, dann erneut G1
  - Tobias will mehr Personen befragen → Zwischenziel „Mehrpersonen-Modus“ (Aggregation im `brief-writer`), dann M2
- Abbruch: nach 2 Kürzungsrunden ohne vollständige Antwort → Interview statt Umfrage (`docs/survey/interview-guide.md`), Ergebnis manuell ins Schema

---

## M2 — Auswertung & Zielbild

**Ziel:** Aus den Rohdaten wird ein Vibecoding-Brief und ein Zielbild-Vorschlag mit Begründung.

Zwischenziele (Startmenge):
- `/brief` erzeugt `docs/brief/<datum>-vibecoding-brief.md` (Struktur siehe Skill)
- `gatekeeper` wendet die Zielbild-Regeln (unten) an und schreibt `docs/brief/<datum>-zielbild-vorschlag.md`
- `red-team` versucht das Zielbild zu kippen (Mindestens: „Was, wenn Tobias nur für sich geantwortet hat?“)
- Gespräch Hannes + Tobias über den Vorschlag; Ergebnis als `D-0xx` in `DECISIONS.md`

### Zielbild-Regeln (der `gatekeeper` rechnet, Menschen entscheiden)

Die Umfrage berechnet selbst eine Hypothese (`hypothesis()` in `survey/index.html`, Feld `hypothesis` im
Export). Der Gatekeeper rechnet **unabhängig** mit denselben Definitionen nach; stimmen beide nicht überein,
ist das ein Red-Team-Befund. Aus dem Export (`schema: vave-discovery/1`) werden berechnet:

- `keep` = Bausteine mit `sort[id] == "keep"`; `unknown` wird ignoriert (Neutraloption)
- `keptBack` = Anzahl `keep`-Bausteine der Gruppen `finanzen` und `gruppe` (Backoffice/Gruppe)
- `frontPain` = Ø `friction` der `keep`-Bausteine `zeit, kalender, pm, app` (Alltag)
- `backPain` = Ø `friction` der `keep`-Bausteine aus `finanzen` + `gruppe`
- `bb` = `budget.buildBuy` (0 = kaufen … 100 = bauen)
- `dailyMakers` = Anzahl Rollen aus {`kreation`, `tech`} mit `roles[id] == "daily"`
- `costSignal` = `!budget.currentUnknown && budget.max < 0.8 × budget.current`

Regeln, in dieser Reihenfolge, erste zutreffende gewinnt (identisch mit `hypothesis()`):

| # | Bedingung | Vorschlag | Begründungspflicht |
|---|---|---|---|
| 1 | `bb ≥ 70` **und** `keptBack ≤ 2` | **C** — Eigener Kern | Risikoliste: Rechnungsnummern, E-Rechnung, Mandanten, Steuer in mehreren Ländern |
| 2 | `backPain ≥ 2.5` **und** `bb ≤ 40` | **B** — Markt-Screening + Ergänzungen | Welche Backoffice-Bausteine reiben; Kandidaten aus `docs/research/06-marktscreening.md` |
| 3 | `backPain ≥ 2.5` **und** `bb ≥ 60` | **C** — Eigener Kern | wie Regel 1, zusätzlich: warum kein SaaS |
| 4 | sonst | **A** — Frontend auf Bestand | Die drei Alltags-Bausteine mit höchster Reibung; `keptBack` als Argument für Bestand |

Zusätzlich immer prüfen: `costSignal` → Kosten sind Teil des Problems, im Vorschlag benennen.
Der Vorschlag enthält: Konfidenz (niedrig, wenn eine Regel bei ±1 Reibungspunkt oder ±10 `bb` kippt),
die Zahlen, die ihn tragen, was ihn kippen würde, und ob er mit `hypothesis.target` der Umfrage übereinstimmt.

### Gate G2 — „Zielbild entschieden“
- Nachweis: `DECISIONS.md` enthält `D-0xx Zielbild` mit A/B/C, Unterschrift Hannes + Tobias (Name, Datum)
- Kriterien: Brief existiert; Red-Team-Einwände sind im Entscheidungstext adressiert (nicht zwingend entkräftet)
- Verzweigung: → M3A / M3B / M3C
- Abbruch: Entscheidung „nichts bauen, bei QuoJob bleiben“ ist ein gültiges Ergebnis → M5 mit Status *Stop*, Repo bleibt als Doku

---

## M3A — Frontend auf Bestand

**Annahme:** QuoJob bleibt System of Record (Rechnungen, FiBu, Mandanten). Wir bauen die
Oberfläche, die PMs und Kreative täglich anfassen.

Zwischenziele (Startmenge, Reihenfolge nach Reibungs-Rangfolge aus dem Brief):
- Datenmodell nur für Surface-Objekte (Zeitbuchung, Aufgabe, Projektstatus, Nutzer) — read-only Mock aus Beispieldaten
- Flow 1: Zeit buchen in < 3 Interaktionen, mobil
- Flow 2: Projektstatus-Board mit Budgetampel, für Junioren lesbar
- Flow 3: Persönliches Dashboard (heute, offene Buchungen, meine Aufgaben)
- Anbindungs-Spike: REST-API des Bestandssystems (JSON-RPC) — nur Lesen, nur ein Endpunkt, Ergebnis dokumentieren

### Gate G3A
- Nachweis: `prototype/` läuft lokal mit Mock-Daten; API-Spike-Protokoll in `docs/spikes/`
- Kriterien: alle drei Flows `ui-critic` ≥ 8/10; Spike beantwortet „Schreiben möglich? Auth? Rate-Limits?“
- Verzweigung: Schreiben über API möglich → M4 mit Echtdaten; nicht möglich → M4 nur lesend + Export, `DECISIONS.md` ergänzen
- Abbruch: API-Modul wird von VAVE nicht freigegeben/gebucht → zurück zu G2, Zielbild B prüfen

## M3B — Markt-Screening + Ergänzungen

Zwischenziele (Startmenge):
- Bewertungsmatrix (Must/Nice aus dem Brief × Kandidaten aus `docs/research/`), Gewichte von Tobias
- 2 Demo-Termine begleiten, Protokoll im selben Schema
- 1–2 kleine Ergänzungstools (Einzeldatei-HTML) für Lücken, die kein Kandidat schließt

### Gate G3B
- Nachweis: `docs/screening/matrix.md` + Empfehlung
- Verzweigung: Empfehlung angenommen → M4 Pilot mit dem SaaS; abgelehnt → zurück zu G2

## M3C — Eigener Kern

Nur mit `D-0xx Zielbild = C`. Erstes Zwischenziel ist **immer** eine Risikoliste mit Gegenmaßnahmen,
zweites die Nicht-Ziele (was der Kern in Version 1 ausdrücklich **nicht** kann). Erst dann Datenmodell.

### Gate G3C
- Kriterien: Risikoliste von Tobias abgenommen; Nicht-Ziele in `DECISIONS.md`; Datenmodell ohne Buchhaltungspflichtfelder in V1
- Abbruch: Wenn V1 ohne Rechnungsstellung für VAVE nutzlos ist → Zielbild falsch, zurück zu G2

---

## M4 — Pilot

**Ziel:** 3–5 echte VAVE-Nutzer (mind. 1 PM, 1 Kreativer, 1 Backoffice) arbeiten zwei Wochen damit.

Zwischenziele (Startmenge):
- Pilotgruppe benannt, Onboarding in < 10 Minuten ohne Hannes
- Nutzungsdaten lokal (keine Tracker), wöchentliche Mini-Umfrage — **die M1-Umfrage wiederverwenden**, nur auf „Prototyp“ umgestellt
- Wöchentlicher `/gate G4`-Check

### Gate G4
- Nachweis: `data/results/pilot-*.json`
- Kriterien: ≥ 60 % der Pilotnutzer buchen Zeiten im Prototyp statt im Altsystem (Selbstauskunft); Ø Reibung der Alltags-Bausteine sinkt gegenüber M1
- Verzweigung: erfüllt → M5 Rollout-Plan; nicht erfüllt → eine Runde „Top-3-Pain-Points“, dann erneut G4
- Abbruch: nach 2 Pilotzyklen ohne Verbesserung → M5 mit Status *Stop*, Learnings dokumentieren

## M5 — Rollout oder Stop

Kein Bauen mehr. Ergebnis ist ein Dokument: Rollout-Plan (Betrieb, Pflege, Kosten pro Jahr, Verantwortliche)
oder Stop-Bericht (was wir gelernt haben, was VAVE stattdessen tut). Beides ist ein Erfolg der Discovery.
