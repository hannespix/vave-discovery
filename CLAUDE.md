# vave-discovery — Projektgedächtnis für Claude Code

Discovery-Phase für VAVE Studio (Ansprechpartner: Tobias Geisler, Geschäftsführer).
Frage: Was an QuoJob bleibt, was weg kann, was fehlt — und daraus die belegte
Entscheidung, **ob** und **was** wir bauen.

Das ist **kein QuoJob-Klon**. Ergebnis der Discovery ist ein Eintrag in `DECISIONS.md`
(Zielbild A, B oder C, siehe ROADMAP) und danach ein Prototyp mit genau diesem Umfang.

## Zuerst lesen — in dieser Reihenfolge, sonst nichts

1. `STATE.md` — aktueller Meilenstein, offene Gates, nächste Zwischenziele. Max. 150 Zeilen, immer aktuell.
2. In `ROADMAP.md` **nur** den Abschnitt des aktuellen Meilensteins.
3. Die Dateien, die das aktuelle Zwischenziel ausdrücklich nennt.

`docs/research/` und `DECISIONS.md` nur bei Bedarf öffnen. Kontext ist das knappste Gut:
Agenten bekommen einen Auftrag mit Dateipfaden, nicht „schau dich mal um“.

## Stack & Konventionen

- **Umfrage (M1):** `survey/index.html` + `survey/modules.js` (einzige Datenquelle: Bausteine,
  Wünsche, Rollen). Vanilla JS, inline SVG- und CSS-Animationen, **keine Laufzeit-Abhängigkeiten,
  kein Build für die Entwicklung**. Läuft per Doppelklick aus dem Dateisystem, offline, auf dem Handy.
  Zum Verschicken erzeugt `npm run bundle` die Einzeldatei `dist/vave-discovery-umfrage.html`.
  Ergebnis wird als JSON + Markdown-Brief heruntergeladen → `data/results/YYYY-MM-DD_<vorname>.json`.
  Zustand liegt im `localStorage` unter `vave-discovery-v1`.
- **Prototyp (M3+):** React/Vite. Datenhaltung je Zielbild (PGlite lokal oder Firebase) —
  wird in Gate G2 entschieden. **Vorher keine Zeile Prototyp-Code.**
- **Sprache:** UI Deutsch, Code und Identifier Englisch, Doku Deutsch.
- **Commits:** Conventional Commits mit Runden-Präfix: `feat(r12): keep-kill-miss board`.
  Ein Zwischenziel = ein PR.
- **Branches:** `loop/r<NN>-<slug>`. Builder arbeiten in eigenen `git worktree`s.
- **Vor jedem Commit:** `npm run check` (keine externen Referenzen, Katalog konsistent, Exporte
  gegen Schema). Läuft automatisch als Hook, siehe `.claude/settings.json`.
  Syntax des Inline-Scripts: `node --check` auf den extrahierten Script-Block (macht der Builder).

## Nicht verhandelbar

- Keine Rechnungs-, Buchhaltungs- oder Mandantenlogik vor Gate G2.
- Kein QuoJob-Branding, keine Screenshots, keine Textkopien aus fremder Software.
  Modulnamen im Katalog sind generisch formuliert.
- `data/results/*.json` sind Rohdaten von Menschen: lesen ja, verändern nie.
- Agenten **schlagen vor**, Menschen **entscheiden**. Ein Gate gilt erst als passiert,
  wenn Hannes (und bei Zielbild-Fragen Tobias) den Eintrag in `DECISIONS.md` gesetzt haben.
- Jede Runde endet mit fortgeschriebener `STATE.md`. Keine Ausnahme, auch bei Abbruch.

## Der Loop — Kurzform (Details: `.claude/skills/loop/SKILL.md`)

Eine Runde = **ein** Zwischenziel aus `STATE.md`, Zeitbox eine Sitzung.

1. **Lesen** — STATE.md: Zwischenziel und Definition of Done (DoD).
2. **Zerlegen** — max. 3 unabhängige Teilaufgaben. Geht es nicht, ist das Ziel zu groß:
   kleiner schneiden, STATE.md korrigieren, dann erst starten.
3. **Fan-out** — je Teilaufgabe ein `builder` im eigenen Worktree, Auftrag mit DoD und Zeitbox.
4. **Merge** — Orchestrator (du) integriert und führt `npm run check` aus.
5. **Kritik, parallel** — `ui-critic` (Bedienung, Gestaltung) und `red-team` (Widerlegen).
   Verdict `PASS` / `FIX` / `BLOCK`, höchstens 5 Befunde, nach Schwere sortiert.
6. **FIX** → genau eine Korrekturschleife. **BLOCK** → Runde abbrechen, Blocker in STATE.md.
7. **Gate-Check** — `gatekeeper` prüft, ob ein Gate der ROADMAP erreicht oder blockiert ist.
8. **STATE.md fortschreiben** — Erledigt, Gelernt, nächste 3–5 Zwischenziele.
   Zwischenziele werden aus dem Ergebnis **neu abgeleitet**, nicht aus der ROADMAP abgeschrieben.

Faustregeln: Kein Zwischenziel ohne DoD. Kein Builder ohne Zeitbox. Kein Kritiker mit
Schreibrechten. Zwei Runden ohne messbaren Fortschritt → `/milestone` neu planen,
nicht härter drücken.

## Agenten (`.claude/agents/`)

| Agent | Tut | Tut nicht |
|---|---|---|
| `scout` | liest, sucht, fasst zusammen | Code schreiben |
| `builder` | setzt genau eine Teilaufgabe um | Scope erweitern, Workarounds verschweigen |
| `ui-critic` | bewertet gegen `docs/design-principles.md` | Code ändern |
| `red-team` | sucht Gründe, warum Umfrage, Ableitung oder Code falsch sind | beschönigen |
| `gatekeeper` | prüft Gate-Kriterien, leitet Zwischenziele ab | Entscheidungen treffen |
| `brief-writer` | macht aus `results.json` den Vibecoding-Brief | Daten interpretieren, die nicht da sind |

## Skills

`/loop` eine Runde fahren · `/gate <G>` Gate prüfen · `/milestone` Zwischenziele neu ableiten ·
`/brief <results.json>` Vibecoding-Brief erzeugen. Definitionen in `.claude/skills/`.

## Dateikarte

```
CLAUDE.md              du liest das gerade
STATE.md               lebender Zustand — Einstiegspunkt jeder Runde
ROADMAP.md             Meilensteine M0–M5, Gates, Verzweigungen A/B/C
DECISIONS.md           Entscheidungslog (D-001 …), von Menschen geschrieben
docs/design-principles.md         Maßstab für ui-critic
docs/research/00-kurzfassung.md   Recherche in 60 Zeilen — reicht meist
docs/research/01…06-*.md          OSINT, Modulpreise, VAVE-Profil, Zielbilder, Umfrage-Konzept, Marktscreening
docs/survey/results-schema.json   Exportformat `vave-discovery/1` — exakt das, was die Umfrage herunterlädt
survey/index.html                 die Umfrage (M1) — Markup, CSS, Inline-Script
survey/modules.js                 Bausteine (mit Gruppe + Preis), Wünsche, Rollen, Reibungsskala — einzige Datenquelle
data/results/                     Rohdaten, unantastbar (+ example.json zum Testen)
docs/brief/                       Vibecoding-Briefs und Zielbild-Vorschläge (Agenten-Output)
scripts/check.mjs                 npm run check
scripts/bundle.mjs                npm run bundle → dist/vave-discovery-umfrage.html
```
