# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: **r06 läuft** (UI-Entwurf Prototyp, Wunsch Hannes; live unter `/prototyp/`, Kritik folgt) · 2026-09-29 · **M1** · **verschickt, Antwort ausstehend**

## Aktueller Meilenstein
M1 — Umfrage, **live und eingefroren**. Hannes (Chat, 2026-09-29): „Jetzt mach mal fertig! Ich will es abschicken!“
Live auf https://hannespix.github.io/vave-discovery/ (`noindex`); Hannes schickt Tobias den Link per E-Mail (kennt ihn
flüchtig, Kontakt bisher über Matthias). Bewusst vor B1/D-005, E3, E7, E9 verschickt: sie werden Auswertungsregeln.
- **Eingefroren bis zu Tobias' Antwort:** Texte, Skalen, Regeln, Export. Erlaubt sind nur Fehlerkorrekturen ohne
  Messwirkung, jede mit Deploy-Zeit hier. In r05 Beobachtetes bleibt liegen, bis ZZ 3 es einordnet.
- **Live-Stände** (Merge auf `main` ≈ Deploy, 2026-09-29, +02:00): #5 Hotfix 06:49 · #6 08:24 · #7 (K2) 09:02 · #8 (K1:
  Bedienung Station 1, „Halbzeit.“, Fix `.stage` `overflow-x: clip` – K2-Notiz ragte beim Einblenden 0,3 s über
  den Rand, Handy zoomte, „Los geht’s“ sprang) 10:03; Zustand und Export gleich. Der Export trägt
  keinen Stand, `respondent` ist fest „Tobias“: Fassung und Person zeigen nur `startedAt` und der Absender der Mail.

## Offene Gates
- **G0** — Kriterien 3/3 erfüllt, Freigabe durch Hannes ausstehend (seit r03; M1 ging ohne Eintrag raus). Belege am
  Stand `f322688`: `npm run check` grün (28 Module, 14 Wünsche, 7 Rollen, 1 Export); `survey/modules.js` 28 Bausteine
  in 5 Gruppen (alltag 6, projekt 3, finanzen 10, gruppe 4, anbindung 5); Annahme D-002 in `DECISIONS.md`.
- **G1** — 0/4 erfüllt, 1 Punkt nicht prüfbar (Stand `f322688`, live `bf121bf`).
  - Nachweis `data/results/YYYY-MM-DD_tobias.json`: nicht erfüllt, dort nur `README.md` und `example.json`.
  - ui-critic ≥ 8 in allen 8 Dimensionen: nicht erfüllt. r05 erste volle Bewertung (`2354545`, 7 Stationen): Tempo 7,
    Bauchbedienung 7, Klarheit 8, Bewegung 8, Mobil 8, Zugänglichkeit 8, Vertrauen 9, Freude 7. K1/K2 nicht nachgeprüft.
  - red-team ohne Bias-Falle „hoch“: nicht erfüllt. r05 (`2354545`) höchstens „mittel“, aber B1 (Mechanismus in r01
    „hoch“) ist offen, lösbar nur in der Auswertung (D-005); das Vorwort wurde nach der Prüfung umgeschrieben (K2, E9).
  - Testlauf einer unbeteiligten Person < 8 min: nicht erfüllt, nie durchgeführt (offen seit r03).
  - Nicht prüfbar: „Antwort vollständig“ ist undefiniert. Neu: Die ROADMAP regelt weder den Versand vor den drei
    Qualitätskriterien (seither nur per Urteil, ZZ 3, oder Ausnahme erreichbar) noch eine ausbleibende Antwort; der
    Abbruchpfad nennt `docs/survey/interview-guide.md`, die Datei fehlt. Vorschläge unter „Offene Entscheidungen“.

## Blocker
- **B1 · Regel 1 schlägt Zielbild C bei Unwissen vor** (Nr. 1, seit r02). `keptBack` zählt nur `keep`, „Kenne ich
  nicht“ senkt es wie „weg“ (ROADMAP M2, Regel 1: `bb ≥ 70` und `keptBack ≤ 2` von 14). Blockiert seit dem Versand nicht
  mehr die Erhebung, sondern einen belastbaren Zielbild-Vorschlag (G2); Tobias' Ergebnisseite und `.md` rechnen nach
  der alten Regel. Lösung D-005 als Auswertungsregel (ZZ 2), Rohdaten bleiben.
- **Risiko, kein Blocker · Empfang unbestätigt (E8).** Noch nie kam eine Mail aus der Umfrage bei `hannes@pix-el.de`
  an. Ist die Adresse falsch oder kappt ein Mailprogramm den Datenblock, fehlt der G1-Nachweis → ZZ 1, vor der Antwort.

## Offene Entscheidungen (Hannes; Entwürfe D-004/D-005 in PR #2) — jetzt vor bzw. in der Auswertung (M2/G2)
**Vor dem Öffnen von Tobias' Daten (ZZ 2)**, sonst wird die Regel am Ergebnis ausgerichtet. Ein Ja genügt:
- **D-005 · Regel 1 (B1)** — „Kenne ich nicht“ zählt weder als behalten noch als weg; Regel 1 greift erst ab N sortierten
  der 14 Finanz-/Gruppen-Karten. Vorschlag N = 7, Zahl setzt Hannes. Abweichung von `hypothesis.target` ist dann erklärt.
- **Konfidenz (E2, E3, E9)** — „niedrig“, wenn ±1 Reibung auf `frontPain`/`backPain` (Mittelwert) oder `bb` ±1 Stufe
  (0/35/50/65/100) eine Regel kippt. Nachgerechnet: ±1 Stufe weicht von ROADMAP ±10 nur bei `bb` = 100 ab (Regel 1),
  bei 0 kippt keine, bei 35/50/65 in beiden Lesarten → E9 faktisch Option (c). E3: Reibung gelesen wie gemessen
  (Häufigkeit, „monatlich“ fehlt → monatlich höchstens 2, Schieflage zu A); `backPain` 1,5 bis < 3,5 ist damit „niedrig“.
- **„Vollständig“ (G1)** — (1) Kaufen-oder-Bauen eingestellt, (2) N aus D-005 erreicht, (3) mindestens die Hälfte der
  behaltenen Finanz-/Gruppen-Karten hat einen Reibungswert, (4) Export besteht `npm run check`. Sonst „unvollständig“:
  Vorschlag Nachfrage oder Interview statt zweiter Umfrage (Tobias kennt Hannes nur flüchtig).
**In der Auswertung, ohne Eile:**
- **G1 mit Ausnahme** (neu) — verschickt vor ui-critic ≥ 8, red-team ohne „hoch“ und Testlauf. Vorschlag: G1 zählt mit
  Tobias' geprüfter Datei, ZZ-3-Befunde als Einschränkung im Brief, Tobias' Dauer statt Testlauf.
- **Keine Antwort** (neu) — Vorschlag: am 2026-10-06 über Matthias nachfassen, ohne Antwort bis 2026-10-13 Interview.
- **E7** Export ohne Stand, Nachsteuern ohne Spur: nicht mehr einbaubar → Einschränkung im Brief, Frage im Gespräch.
  **E8** `hannes@pix-el.de` (diktiert „Hannes at pics-el.de“) bestätigt die Testmail (ZZ 1). **E10** Nebentätigkeit
  öffentlich im Vorwort: bis zur Antwort hinnehmen, danach Seite abschalten, außer Tobias will mehr Personen befragen?
- **Formal:** G0-Freigabe · D-004 Basiswechsel und Versand 2026-09-29 (im Chat entschieden, ohne Eintrag). E1, E4–E6,
  Preise, Budget-Neutraloption, Rollen: durch den Versand gemessen „wie heute“, mit einem Ja erledigt.

## Nächste Zwischenziele (ZZ; Reihenfolge = Priorität; kommt Tobias' Mail, geht ZZ 4 vor)

1. **Empfang sichern** (r06; aus alt 3b halbiert und alt 4C) — `scripts/ingest.mjs` (neu), `package.json`,
   `survey/README.md`; `survey/index.html` nur bei falscher Adresse. Hannes + ein Builder (Basis-SHA = K1 auf `main`).
   DoD Hannes (sofort nach K1-Deploy): Eine Testmail vom eigenen Handy über den Live-Link mit `?test` kommt bei
   `hannes@pix-el.de` an, der Datenblock endet mit „===== ENDE DATEN =====“, die Mail liegt als `.eml` außerhalb von
   `data/results/`; Gerät, Programm, Zeichenzahl in „Gelernt“. Sonst Blocker Nr. 1: Adresse korrigieren, Tobias Bescheid.
   DoD Builder: `npm run ingest -- <datei>` liest `.eml`, Text (CRLF, quoted-printable, format=flowed) oder JSON, nimmt
   nur den Datenblock, prüft ihn wie `npm run check`, schreibt ihn byte-gleich mit dem JSON-Download nach
   `data/results/YYYY-MM-DD_<vorname>.json` (Brief-Block als `.md`), überschreibt nie, nennt Absender, `startedAt`,
   `exportedAt`, Dauer; Testdaten prüft es, schreibt sie nie. Headless kommen mailto „Brief + Daten“, „nur Daten“ und
   die Desktop-`.eml` byte-gleich zurück, Hannes' Testmail prüft grün. `survey/README.md` nennt Skript und Handweg.

2. **Auswertungsregeln vor dem Öffnen der Daten** (Hannes, kein Builder; von 5 auf 3 Punkte halbiert, r03–r05 ohne
   Eintrag) — `DECISIONS.md`, ggf. `ROADMAP.md` (M2 Regel 1, G1-Verzweigung).
   DoD: D-005 mit Zahl N, Konfidenzregel (E2/E3/E9) und „vollständig“ stehen in `DECISIONS.md`, datiert vor dem Öffnen
   von Tobias' Datei. Kommt sie früher: nur ablegen und prüfen (ZZ 4 bis `npm run check`), Brief und Rechnung erst
   danach, sonst beide Lesarten (ROADMAP, D-005) nebeneinander und gekennzeichnet.

3. **Urteil am gemessenen Stand, nur lesen** (ui-critic + red-team, kein Builder, nach K1-Deploy; holt die entfallene
   Nachprüfung nach) — Live-Link, `survey/index.html` am Deploy-SHA, `docs/design-principles.md`.
   DoD: ui-critic bewertet alle 8 Dimensionen über alle 7 Stationen (390 × 844, 1280 × 800), zu jeder < 8 der Befund;
   red-team prüft Bias am selben Stand, ausdrücklich Vorwort (E9) und K1. Jeder Befund und die fünf r05-Beobachtungen
   (Kopf klebt nur eine Fensterhöhe, Tasten 1/2/3 und Enter ohne Sichtprüfung, `.sorted-note` 14,4 px, doppelte Ansage
   Toast/Statuszeile, „Halbzeit“ je Seitenaufruf) sind eingeordnet: (a) ohne Messwirkung → Hotfix erlaubt, (b) mit
   Messwirkung → Einschränkung im Brief und in der G1-Ausnahme. Keine Code-Änderung in diesem ZZ.

4. **Eingang und Brief** (Auslöser: Tobias' Mail) — `data/results/YYYY-MM-DD_tobias.json` (+ `.md`),
   `docs/brief/<datum>-vibecoding-brief.md`.
   DoD: Mail unverändert gesichert; `npm run ingest` (oder Handweg) legt die Datei ab, `npm run check` grün; Absender =
   Tobias (sonst Zweig „mehr Personen“); Fassung über `startedAt` bestimmt; „vollständig“ nach ZZ 2 geprüft, Zweig
   benannt; `/brief` mit red-team, Abschnitt 12 wörtlich, Budget als Stufenlabel statt „x/100“. Danach `/gate G2`.

5. **Zielbild-Rechnung vorbereiten** (für G2) — `scripts/zielbild.mjs` (neu), `package.json`, `docs/brief/probe-*`,
   `.claude/agents/brief-writer.md` (Budget-Stufen, Vollständigkeit). Builder: A Rechnung · B Probe.
   DoD: `npm run zielbild -- <datei>` rechnet ohne Code aus `survey/index.html` die sieben ROADMAP-Größen, die Regel
   nach ROADMAP und nach D-005 (N als Parameter), die Konfidenz (±1 Reibung, ±10 `bb`, ±1 Stufe), den Kipppunkt und den
   Abgleich mit `hypothesis.target`; in ROADMAP-Lesart gleich mit `hypothesis()` in ≥ 200 Zufallsprofilen und an allen
   Schwellen (`bb` 0/35/50/65/100 × `keptBack` 2/3 × `backPain` 2,4/2,5). Probe an `data/results/example.json` (`bb` 55,
   keine Stufe) läuft durch, Kopf „Probe, erfundene Daten“.

**Gestrichen (durch den Versand überholt):** Alt 1 erledigt. Alt 2 „vor dem Einfrieren“ → ZZ 2 „vor dem Öffnen“.
Alt 3a Zeitprobe sollte vor dem Versand über „Umfrage kürzen“ entscheiden; zwei Runden ohne Fortschritt → gestrichen,
Tobias' Dauer ersetzt sie (G1-Ausnahme). Alt 3b → ZZ 1. Alt 4A/4B ändern, was Tobias sieht → gestrichen; 4C → ZZ 1.
Alt 5 (in der Umfrage umsetzen, einfrieren, abnehmen) → gestrichen: Regeln → Auswertung (ZZ 2, 5), Abnahme → ZZ 3.

## Erledigt (letzte 5 Runden, älteres → git log)
- r05 (PRs #5, #6, #7 gemergt und deployt; K1 `f322688` als PR offen): Hotfix #5 (Hannes' Screenshot) Reibungslinie am
  Handy: p < 0 und Neustart bei gleichem Wert → p ∈ [0,1], kein Neustart zum selben Ziel (Auslenkung 189 258 → 9).
  A Doppeltipp-Sperre 400 ms, Zurückholen nur über × bzw. Liste, Zonen als Knopf mit Anzahl. B Anleitung in der
  Sortier-Einheit sichtbar bei 360×600, 390×664, 667×320, 844×340; quer drei Spalten; Desktop „Zonenkopf + 44 px“
  ersetzt r03 „ganze Zone“. C ohne `budgetTouched` fragen 35/65 neu. D Vorwort „Vorab von Hannes“ (vierte Teilaufgabe,
  bewusst). Kritik `2354545`: ui-critic FIX (7/7/8/8/8/8/9/7), red-team FIX (höchstens „mittel“), `hypothesis()` =
  ROADMAP in 200 Profilen + 10 Grenzfällen. K2 (#7): Test-Merker ab erster Antwort, Vorwort 2 Absätze (Station 0 bei
  390×844 1,59 statt 2,10 Bildschirme), Statuszeile, `noindex`. K1: nie eine ungesehene Karte sortieren, Zurückholen
  hinter der Sperre, keine Knöpfe in Knöpfen, „Halbzeit.“ bei Karte 15. Nachprüfung auf Hannes' Wunsch entfallen.
- r04 (PR #4): Route als Knöpfe, Versand an `hannes@pix-el.de` (Desktop `.eml` mit Anhängen, Touch mailto bis 16 000
  Zeichen), eine Uhr `resultTime()`, `?test`, SVG-Finale. ui-critic FIX (8/5/7/8/7/7/8/7), red-team FIX („mittel“, E7).
- r03 (PR #3 mit r02): B2–B4 behoben (Karte + drei Zonen bei 360–430 px, wischsicher, Rest-Knopf fragt nach), Reibung
  ohne Anker, Kaufen-oder-Bauen in 5 Stufen, Ziele ≥ 44 px, Schrift ≥ 16 px, Kontrast ≥ 4,5:1. Kritik FIX/FIX.
- r02: Namen generisch, Budget ohne Vorbelegung, `FRONT` = ROADMAP; beide BLOCK → B2–B4. Davor Basiswechsel (PR #2).
- r01 (alter Katalog, ersetzt): red-team BLOCK (B1-Mechanismus „hoch“).

## Gelernt (kurz, was künftige Runden wissen müssen)
- QuoJob-Kritik ist fast nur UX/Starrheit → A ist Arbeitshypothese, entschieden wird in G2. VAVE ist eine Gruppe
  (DE/CN/AE/SG): Mandanten, Währung, Sprache sind Kern.
- Texte und Skalen tragen die Zielbild-Rechnung mit; alte Werte nie still umdeuten. Lücken entscheiden mit (ohne
  Reibungswert → A, ohne `keep` → C); „vollständig“ an den Regel-Größen festmachen, nicht an der Schema-Gültigkeit.
- r05: Was vor dem Versand entschieden sein sollte, wird danach Auswertungsregel und muss vor dem Öffnen der Daten
  stehen, sonst wird sie am Ergebnis ausgerichtet.
- r05: Erst r05 bewertete alle 8 Dimensionen über alle 7 Stationen (Teil-Nachprüfungen zählen nicht). Dann ließ
  Versanddruck die Nachprüfung von K1/K2 ausfallen; belegt sind sie nur durch Builder- und Orchestrator-Tests, ein
  unentdeckter Fehler trifft genau die eine Antwort, um die es geht → Urteil nachholen (ZZ 3).
- r05: Am Handy kann der erste rAF-Zeitstempel nach einem Zeiger-Ereignis vor t0 liegen (p < 0) → auf [0,1] klemmen,
  zum selben Ziel nicht neu starten. Gefunden hat das nur ein echtes Gerät.
- r05: Tests paralleler Builder kollidieren beim Merge über Timing (400-ms-Sperre, wachsende Zonen, Scroll nach Reload)
  → Timings als Konstanten in den Auftrag, nach dem Merge alle Tests gemeinsam.
- r05: Zwei Runden ohne Fortschritt → Zeitprobe gestrichen, Versandprobe halbiert. Entscheidungen fallen im Chat,
  nicht in `DECISIONS.md` → fertige Absätze anbieten, Auslöser nennen.
- r05: Export ohne Stand und fester `respondent` → Fassung und Person nur über `startedAt` und Absender; beides gehört
  in eine zweite Erhebung (E7a).
- UI-Lehren r02–r05 (Layout, Timing, Kopfzeile) für eine zweite Erhebung und den Prototyp: `git show 5568d47:STATE.md`.
- Versand ohne Server: mailto hat keine Anhänge, `.eml` öffnet am Handy nicht als Entwurf, `canShare` prüft keine
  Dateitypen; headless prüft nur die URL → echte Geräte. Eine Uhr je Export; Markierungen in den Zustand, nicht die URL.
- Worktrees starten auf `origin/main` → Basis-SHA in jeden Builder-Auftrag, vor der ersten Änderung `git reset --hard`.
  Menschen-Aufgaben brauchen Datum oder Auslöser. Ergebnisse immer in Git committen.

## Nächste Runde startet mit
K1-PR mergen, Deploy-Zeit unter „Live-Stände“ eintragen (ist der Link noch nicht raus: erst danach schicken). Dann
r06 = ZZ 1: Hannes' Testmail sofort, parallel ein Builder für `ingest` (Basis-SHA = K1 auf `main`); ZZ 2 mit den
Absätzen aus der Gatekeeper-Ausgabe r05 an Hannes. Kommt Tobias' Mail vorher: unverändert sichern, dann ZZ 4.
