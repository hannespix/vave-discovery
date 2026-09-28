# vave-discovery

Discovery-Phase für VAVE Studio: Was an der bestehenden Agentursoftware bleibt, was weg kann,
was fehlt — und daraus die belegte Entscheidung, ob und was gebaut wird.

**Kein Nachbau.** Erst Umfrage (M1), dann Brief und Zielbild (M2), dann genau der entschiedene Umfang (M3).

## Quickstart

```bash
git clone <repo> vave-discovery && cd vave-discovery
npm run check            # Katalog, Schema, Beispieldatei — muss grün sein
claude                   # Claude Code starten
> /loop                  # erste Runde auf Zwischenziel 1 aus STATE.md
```

Über den bestehenden GitHub-Workflow: Issue oder PR kommentieren mit `@claude /loop` bzw. `@claude /gate G1`.

## Wie das Repo tickt

- `CLAUDE.md` — Regeln, Loop-Kurzform, Agenten. Claude Code liest es automatisch.
- `STATE.md` — der lebende Zustand. **Immer** zuerst lesen, auch als Mensch.
- `ROADMAP.md` — Meilensteine M0–M5 mit Gates. Stabil; Zwischenziele darin sind nur Startmengen.
- `DECISIONS.md` — Entscheidungen, von Menschen geschrieben. Ein Gate ist erst passiert, wenn hier ein Eintrag steht.
- `.claude/agents/` — scout, builder, ui-critic, red-team, gatekeeper, brief-writer.
- `.claude/skills/` — `/loop`, `/gate`, `/milestone`, `/brief`.
- `docs/survey/` — Modulkatalog und Ergebnis-Schema. `data/results/` — Rohdaten, unantastbar.

## Der Loop in einem Satz

Eine Runde nimmt **ein** Zwischenziel mit Definition of Done, verteilt es auf bis zu drei Builder in eigenen
Worktrees, lässt UI-Kritiker und Red Team parallel prüfen, erlaubt genau eine Korrekturschleife, prüft das Gate
und schreibt die nächsten Zwischenziele aus dem Ergebnis neu in `STATE.md`.

## Rollen

- **Hannes** — Orchestrator-Mensch, gibt Gates frei, schreibt DECISIONS.
- **Tobias (VAVE)** — beantwortet die Umfrage, entscheidet das Zielbild mit.
- **Claude Code** — fährt Runden, schlägt vor, entscheidet nichts.
