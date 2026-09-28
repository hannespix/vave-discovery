---
name: gate
description: Prüft ein bestimmtes Gate aus ROADMAP.md gegen den Ist-Zustand — Kriterium für Kriterium mit Beleg — und bereitet bei G2 den Zielbild-Vorschlag vor. Aufruf `/gate G1`, `/gate G2` usw. Ändert nichts außer STATE.md und docs/brief/.
argument-hint: [gate-id]
---

# /gate $ARGUMENTS

Ziel: Hannes sieht in einer Tabelle, ob `$ARGUMENTS` freigegeben werden kann — und wenn nicht, was genau fehlt.

## Ablauf
1. In `ROADMAP.md` den Abschnitt zu `$ARGUMENTS` lesen: Nachweis, Kriterien, Verzweigung, Abbruch.
2. `gatekeeper` beauftragen mit: Gate-ID, Pfade der Nachweise, Hinweis „Kriterien einzeln prüfen“.
3. `red-team` **parallel** beauftragen mit Prüfrichtung „Gate-Kriterien und Ableitung“.
4. Bei **G2** zusätzlich: `brief-writer` muss vorher gelaufen sein (Brief existiert unter `docs/brief/`); sonst erst `/brief`.
   Der Gatekeeper rechnet die Zielbild-Regeln nach und schreibt `docs/brief/<datum>-zielbild-vorschlag.md`
   mit: Zahlen, greifende Regel, Konfidenz, Kipppunkt, Red-Team-Einwände.
5. Ergebnis in STATE.md unter „Offene Gates“ eintragen: `Kriterien x/y · Freigabe ausstehend` oder `blockiert durch …`.

## Ausgabe an Hannes
Tabelle: Kriterium | Status (✅ / ❌ / ⚠️ nicht prüfbar) | Beleg
Darunter:
- **Verzweigung, die greift:** …
- **Abbruchkriterium erreicht?** ja/nein
- **Zum Freigeben in DECISIONS.md einfügen:** fertiger D-0xx-Absatz zum Kopieren (Entscheider-Feld leer lassen)
- **Red-Team-Einwände, die du kennen musst:** max. 3 Zeilen

Du gibst nichts frei. Das steht in CLAUDE.md.
