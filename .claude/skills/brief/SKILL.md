---
name: brief
description: Erzeugt aus einer oder mehreren validierten Umfrage-Exporten (vave-discovery/1) den Vibecoding-Brief in docs/brief/. Aufruf `/brief data/results/2026-10-02_tobias.json` oder `/brief data/results/*.json` für Aggregation.
argument-hint: [pfad(e) zu results.json]
---

# /brief $ARGUMENTS

## Ablauf
1. `npm run check -- $ARGUMENTS` — validiert die Datei(en) gegen `docs/survey/results-schema.json`. Rot → abbrechen, Fehler zeigen. Rohdaten werden **nie** korrigiert.
2. `brief-writer` beauftragen mit den Pfaden und `survey/modules.js`. Struktur ist in seiner Definition festgelegt.
3. `red-team` **parallel** mit Prüfrichtung „Umfrage: Bias und Repräsentativität“ auf denselben Dateien.
4. Red-Team-Befunde als Abschnitt **12 · Einschränkungen dieses Briefs** an den Brief anhängen (wörtlich, nicht abgeschwächt).
5. STATE.md: unter „Erledigt“ eine Zeile, unter „Nächste Zwischenziele“ prüfen, ob `/gate G2` jetzt das erste Ziel ist.

## Ausgabe an Hannes
- Pfad des Briefs
- Die Top-3-Pain-Points in je einer Zeile
- Ein Warnsatz, falls `finanzen`/`gruppe`-Bausteine unter „Weg damit“ stehen, viele gebuchte Module „Kenne ich nicht“ sind oder kein Wunsch `must` ist
- Empfehlung: `/gate G2` jetzt, oder erst weitere Antworten sammeln
