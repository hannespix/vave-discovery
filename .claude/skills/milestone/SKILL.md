---
name: milestone
description: Plant die Zwischenziele des aktuellen Meilensteins neu — nach einem Gate, nach zwei Runden ohne Fortschritt, nach einer neuen Entscheidung in DECISIONS.md oder wenn STATE.md Zwischenziele ohne DoD enthält. Aufruf `/milestone`, optional `/milestone M3A` für einen Wechsel.
argument-hint: [meilenstein-id]
---

# /milestone $ARGUMENTS

Die ROADMAP bleibt, wie sie ist. Neu wird nur, **welche Schritte als Nächstes** sinnvoll sind.

## Auslöser (einer reicht)
- Ein Gate wurde in DECISIONS.md freigegeben → Meilenstein wechselt, Startmenge der Verzweigung laden
- Zwei Runden ohne messbaren Fortschritt auf Zwischenziel 1
- Neuer Eintrag in DECISIONS.md, der Annahmen ändert
- STATE.md enthält ein Zwischenziel ohne DoD oder mehr als 5 Zwischenziele

## Ablauf
1. Lies STATE.md und den letzten Eintrag in DECISIONS.md.
2. Wenn `$ARGUMENTS` gesetzt: prüfe, dass DECISIONS.md den Wechsel deckt (Gate freigegeben). Sonst abbrechen und sagen, welcher D-Eintrag fehlt.
3. `scout` beauftragen: „Was ist seit dem letzten Gate erledigt (git log seit Tag/Commit), was ist liegen geblieben?“ — Antwort max. 20 Zeilen.
4. `gatekeeper` beauftragen: Zwischenziele neu ableiten. Regeln wie in seiner Definition, plus:
   - Aus „Beobachtet“-Punkten der Builder-Berichte der letzten Runden auswählen, was das nächste Gate näherbringt; Rest verwerfen
   - Liegengebliebenes explizit streichen oder halbieren — und in „Gelernt“ notieren, warum es liegen blieb
   - Bei Meilensteinwechsel: Startmenge aus ROADMAP als Rohmaterial, aber gegen den Brief/DECISIONS abgleichen
5. `red-team` kurz: „Welches dieser Zwischenziele bringt das Gate nicht näher?“ — Befunde einarbeiten.
6. STATE.md schreiben. Abschnitt „Aktueller Meilenstein“ aktualisieren, Rundenzähler unverändert.

## Ausgabe an Hannes
- Vorher/Nachher der Zwischenziele (zwei kurze Listen)
- Ein Satz pro gestrichenem Ziel, warum
- „Nächste Runde startet mit …“
