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
- Modulkatalog `docs/survey/modules.json` vollständig, jedes Modul mit `layer` und `roles`
- `docs/survey/results-schema.json` fixiert; `scripts/check.mjs` validiert Beispieldatei
- `docs/design-principles.md` mit messbaren Kriterien für den `ui-critic`
- Offene Frage an Tobias/VAVE beantwortet: **welche QuoJob-Module sind tatsächlich gebucht?**

### Gate G0 — „Bauen darf beginnen“
- Nachweis: `npm run check` grün auf `data/results/example.json`; Katalog hat ≥ 20 Module
- Kriterium: Liste der gebuchten Module liegt vor **oder** ist als Annahme in `DECISIONS.md` dokumentiert
- Verzweigung: → M1
- Abbruch: keiner (M0 kann nicht scheitern, nur dauern)

---

## M1 — Umfrage

**Ziel:** Tobias füllt in 5–7 Minuten aus, hat Spaß dabei, und wir bekommen ein valides `results.json`.

Zwischenziele (Startmenge):
- Screen 1 Keep/Kill/Miss: Modulkarten per Drag in drei animierte Zonen (Touch + Maus + Tastatur)
- Screen 2 Frust-Heatmap: Emoji-Slider 0–5 pro behaltenem Modul
- Screen 3 Rollen-Matrix: wer nutzt was (GF, PM, Kreation, Backoffice, Studios Asien/ME)
- Screen 4 Budget: heutige Kosten, Schmerzgrenze, Bereitschaft zur Eigenentwicklung (0–10)
- Screen 5 Zauberstab: ein Freitext, dann JSON-Download + Confetti
- Fortschrittsanzeige als animierte SVG, Wiederaufnahme nach Reload (localStorage, try/catch)

### Gate G1 — „Daten sind da“
- Nachweis: `data/results/tobias-<datum>.json` validiert gegen Schema
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

Aus `results.json` werden berechnet (Definitionen in `docs/survey/modules.json` → `layer`):

- `pain[layer]` = Summe `frust` aller Module des Layers mit `zone == "keep"`, normiert auf 1 über alle Layer
- `killCore` = Anzahl Module mit `layer in {core, backoffice}` und `zone == "kill"`
- `missCount` = Anzahl Einträge unter `missing`
- `will` = `budget.buildWillingness` (0–10)
- `ratio` = `budget.painThresholdEur / budget.currentMonthlyEur` (wenn beide > 0)

Regeln, in dieser Reihenfolge, erste zutreffende gewinnt:

| # | Bedingung | Vorschlag | Begründungspflicht |
|---|---|---|---|
| 1 | `pain.surface ≥ 0.60` **und** `killCore == 0` | **A** — Frontend auf Bestand | Zeigen, welche 3 Surface-Module den meisten Frust tragen |
| 2 | `pain.backoffice ≥ 0.50` **und** `will ≤ 5` | **B** — Markt-Screening + Ergänzungen | Zeigen, welche Backoffice-Module fehlen/nerven; Kandidatenliste aus `docs/research/` |
| 3 | `will ≥ 8` **und** `ratio ≥ 2` **und** Zauberstab nennt explizit Ablösung | **C** — Eigener Kern | Explizite Risikoliste (Rechnungsnummern, E-Rechnung, Mandanten, Steuer in mehreren Ländern) |
| 4 | sonst | **A** mit Vermerk „unklares Signal“ | Vorschlag für eine zweite, kürzere Befragung von 3 PMs + 1 Backoffice |

Der Vorschlag enthält immer: Konfidenz (niedrig/mittel/hoch), die drei Zahlen, die ihn tragen,
und was ihn kippen würde.

### Gate G2 — „Zielbild entschieden“
- Nachweis: `DECISIONS.md` enthält `D-0xx Zielbild` mit A/B/C, Unterschrift Hannes + Tobias (Name, Datum)
- Kriterien: Brief existiert; Red-Team-Einwände sind im Entscheidungstext adressiert (nicht zwingend entkräftet)
- Verzweigung: → M3A / M3B / M3C
- Abbruch: Entscheidung „nichts bauen, bei QuoJob bleiben“ ist ein gültiges Ergebnis → M5 mit Status *Stop*, Repo bleibt als Doku

---

## M3A — Frontend auf Bestand

**Annahme:** QuoJob bleibt System of Record (Rechnungen, FiBu, Mandanten). Wir bauen die
Oberfläche, die PMs und Kreative täglich anfassen.

Zwischenziele (Startmenge, Reihenfolge nach Frust-Rangfolge aus dem Brief):
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
- Kriterien: ≥ 60 % der Pilotnutzer buchen Zeiten im Prototyp statt im Altsystem (Selbstauskunft); Frust-Summe der Surface-Module sinkt gegenüber M1
- Verzweigung: erfüllt → M5 Rollout-Plan; nicht erfüllt → eine Runde „Top-3-Pain-Points“, dann erneut G4
- Abbruch: nach 2 Pilotzyklen ohne Verbesserung → M5 mit Status *Stop*, Learnings dokumentieren

## M5 — Rollout oder Stop

Kein Bauen mehr. Ergebnis ist ein Dokument: Rollout-Plan (Betrieb, Pflege, Kosten pro Jahr, Verantwortliche)
oder Stop-Bericht (was wir gelernt haben, was VAVE stattdessen tut). Beides ist ein Erfolg der Discovery.
