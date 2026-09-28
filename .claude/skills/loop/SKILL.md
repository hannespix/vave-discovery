---
name: loop
description: Fährt eine komplette Loop-Runde — ein Zwischenziel aus STATE.md, Fan-out auf Builder, parallele Kritik, Gate-Check, STATE fortschreiben. Aufruf `/loop` (nimmt Zwischenziel 1) oder `/loop 3` (nimmt Zwischenziel 3).
argument-hint: [zwischenziel-nummer]
---

# /loop — eine Runde

Du bist der Orchestrator. Du baust nicht selbst, du verteilst, integrierst, entscheidest über den Rundenverlauf.
Dein Kontext bleibt klein: Berichte der Agenten, nicht deren Arbeitsweg.

## 0 · Vorbedingungen (30 Sekunden)
- `git status` sauber? Sonst abbrechen: „Arbeitsverzeichnis nicht sauber, erst committen oder stashen.“
- `STATE.md` lesen. Rundenzähler merken → diese Runde ist `r<NN+1>`.
- Zwischenziel wählen: `$ARGUMENTS` oder Nr. 1. Hat es **keine DoD** → nicht starten, erst `/milestone`.
- Blocker in STATE.md, der dieses Ziel betrifft? → anderes Ziel wählen oder abbrechen und sagen warum.

## 1 · Zerlegen (Plan, max. 15 Zeilen, wird in den Runden-Commit geschrieben)
Zerlege das Zwischenziel in **1–3 Teilaufgaben**, die sich nicht gegenseitig blockieren
(verschiedene Dateien oder klar getrennte Abschnitte einer Datei).
Für jede Teilaufgabe: Titel · DoD (2–4 prüfbare Sätze) · Dateien · Zeitbox.
Geht es nicht in ≤ 3 → Zwischenziel halbieren, STATE.md korrigieren, mit der ersten Hälfte weitermachen.

## 2 · Fan-out
Für jede Teilaufgabe **parallel** einen `builder` starten, jeder in eigenem Worktree:
```
git worktree add ../wt-r<NN>-<slug> -b loop/r<NN>-<slug>
```
Auftrag an den Builder enthält wörtlich: Teilaufgabe, DoD, Dateien, Zeitbox, Worktree-Pfad, Branch.
Nichts anderes. Kein „Kontext zur Sicherheit“.

Ein Builder ist fertig, wenn sein Bericht kommt. Kein Nachfragen zwischendurch.

## 3 · Merge
- Branches der Builder in Reihenfolge der Abhängigkeit in einen Runden-Branch `loop/r<NN>` mergen.
- Konflikt → selbst lösen, wenn trivial (< 10 Zeilen); sonst den betroffenen Builder mit dem Konflikt als neuer Teilaufgabe nochmal starten.
- `npm run check`. Rot → fixen (nur der Fehler, nichts anderes) oder Runde als BLOCK beenden.
- Worktrees aufräumen: `git worktree remove`.

## 4 · Kritik (parallel, beide zugleich)
- `ui-critic` mit Pfad zur geänderten Datei und Commit-Hash.
- `red-team` mit Pfad, Commit-Hash und der Prüfrichtung, die zur Runde passt (Umfrage / Ableitung / Code / Roadmap).
Beide liefern Verdict + max. 5 Befunde. Du liest nur die Berichte.

## 5 · Verdict verarbeiten
| ui-critic | red-team | Aktion |
|---|---|---|
| PASS | PASS | weiter zu 6 |
| FIX | ≤ FIX | **eine** Korrekturschleife: Befunde als 1–2 Teilaufgaben an Builder, dann erneut Kritik nur auf die Befunde. Danach weiter zu 6, egal wie. |
| BLOCK | * | Runde beenden, Blocker in STATE.md, zu 7 |
| * | BLOCK | Runde beenden, Blocker in STATE.md, zu 7 |

Zweite Korrekturschleife gibt es nicht. Was nach einer Schleife offen ist, wird Zwischenziel der nächsten Runde.

## 6 · Gate-Check
`gatekeeper` starten mit: aktueller Meilenstein, alle Berichte dieser Runde, Liste der geänderten Dateien.
Er prüft das Gate, leitet Zwischenziele ab und schreibt `STATE.md`.

## 7 · Abschluss (immer, auch bei Abbruch)
- Prüfen, dass `STATE.md` fortgeschrieben ist (Rundenzähler, Erledigt, Zwischenziele). Wenn nicht → selbst nachziehen.
- Runden-Commit auf `loop/r<NN>`: Plan aus Schritt 1 als Commit-Body, Berichte kurz zusammengefasst.
- PR öffnen: Titel = Zwischenziel, Body = DoD-Status ✅/❌, Verdicts, Blocker, Link zum STATE-Diff.
- Auf `main` mergen nur, wenn beide Verdicts PASS **oder** Hannes es explizit sagt.

## Ausgabe an Hannes (max. 15 Zeilen)
**r<NN> · Zwischenziel:** …
**Ergebnis:** erledigt / teilweise / abgebrochen — ein Satz
**Verdicts:** ui-critic X · red-team Y
**Wichtigster Befund:** …
**Gate:** Kriterien x/y · Freigabe ausstehend / blockiert
**Nächste Runde:** Zwischenziel 1 aus STATE.md, ein Halbsatz
**Braucht von dir:** Entscheidung / Info / nichts
