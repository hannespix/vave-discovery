# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Ende r07 → **r08** (Prototyp in kleinen Deploys) · 2026-09-29 · **M1** · **verschickt, Antwort ausstehend**

## Aktueller Meilenstein
M1 — Umfrage, **live und eingefroren**. Hannes (Chat, 2026-09-29): „Jetzt mach mal fertig! Ich will es abschicken!“
Live auf https://hannespix.github.io/vave-discovery/ (`noindex`); Hannes schickt Tobias den Link per E-Mail (kennt ihn
flüchtig, Kontakt bisher über Matthias). Bewusst vor B1/D-005, E3, E7, E9 verschickt: sie werden Auswertungsregeln.
- **Eingefroren bis zu Tobias' Antwort:** Texte, Skalen, Regeln, Export. Erlaubt sind nur Fehlerkorrekturen ohne
  Messwirkung, jede mit Deploy-Zeit hier. In r05 Beobachtetes bleibt liegen, bis ZZ 3 es einordnet. **Ausnahme E11**
  (Hannes, 2026-09-29): Vorwort kündigt den UI-Entwurf an, der Link erscheint erst nach dem Senden (Station 7).
- **Live-Stände** (Merge auf `main` ≈ Deploy, 2026-09-29, +02:00): #5 Hotfix 06:49 · #6 08:24 · #7 (K2) 09:02 · #8 (K1:
  Station 1, „Halbzeit.“, `.stage` `overflow-x: clip` gegen Zoom-Sprung) 10:03 · #10 (E11) 15:32. Der Export trägt
  keinen Stand, `respondent` ist fest „Tobias“: Fassung und Person zeigen nur `startedAt` und der Absender der Mail.

## Nebenstrang Prototyp (Wunsch Hannes, vor G2; Ausnahme zu D-001, Eintrag fehlt)
- Live `/prototyp/` (#9 15:12 … #13 19:51, r08 Knöpfe), Link erst nach dem Senden (E11). **Seit r07** (Hannes: „öfter merge &
  deploy“): jeder fertige Baustein geht sofort live (PR, Merge, Deploy), Kritik prüft parallel und hält nichts auf.
- **Vorschlag D-006 · Hannes · UI-Entwurf vor G2** — *Entscheidung:* Ein Entwurf mit erfundenen Daten, ohne Backend,
  Rechnungs-, Buchhaltungs- und Mandantenlogik darf vor G2 unter `/prototyp/` live sein, verlinkt erst nach dem Senden.
  *Grund:* Gesprächsgrundlage ohne Zielbild. *Kippt, wenn:* G2 anders wählt oder der Entwurf Antworten nachweislich prägt.
- **Nächste Bausteine** (Vorschlag; je einer = ein Deploy, P3 läuft parallel und ohne Tor):
  - **P2 · Feinschliff** — Knöpfe erledigt (r08, Hannes' Handy-Screenshot): Umschalter, Play, Pfeile, Chips, Punkte. Offen:
    zwei Gewichte (21× `500`), „Projekte filtern“ statt zweitem „Suchen“, „läuft“ violett, Board-Griff auf Touch-Laptops.
  - **P3 · Nachprüfung am Live-Stand** (ui-critic + red-team, nur lesen) — holt das fehlende P1-Urteil nach (≥ 8; vor
    der Korrektur 7/6/7/8/6/9/8/8). DoD: 8 Dimensionen, 390 × 844 und 1280 × 800, hell/dunkel; Befunde als Bausteine.
  - **P4 · Workflow-Tests ins Repo** (`prototype/tests/`, `check.yml`) — die Builder-Suiten liegen nur im Scratchpad.
    DoD: `npm run test:e2e` (Playwright als devDependency): Smoke und je Workflow ein Ablauf, 390/1280, im CI < 3 min.
- **Später:** Recherche 07 §4 (nach Tobias/G2). An Tobias: Stundenzettel-Freigabe? Kalender? Soll je Land (fix 8/40 h)?

## Offene Gates
- **G0** — Kriterien 3/3 erfüllt, Freigabe durch Hannes ausstehend (seit r03; M1 ging ohne Eintrag raus). Belege am
  Stand `f322688`: `npm run check` grün (28 Module, 14 Wünsche, 7 Rollen, 1 Export); `survey/modules.js` 28 Bausteine
  in 5 Gruppen (alltag 6, projekt 3, finanzen 10, gruppe 4, anbindung 5); Annahme D-002 in `DECISIONS.md`.
- **G1** — 0/4 erfüllt, 1 nicht prüfbar. Nachweis `data/results/…_tobias.json` fehlt · ui-critic ≥ 8 nicht erfüllt (r05
  `2354545`: 7/7/8/8/8/8/9/7, K1/K2 ungeprüft) · red-team höchstens „mittel“, aber B1 offen (nur via D-005) und Vorwort
  nach der Prüfung neu (E9) · Testlauf < 8 min nie gemacht. Nicht prüfbar: „vollständig“ undefiniert; ROADMAP regelt
  weder Versand vor den Kriterien noch ausbleibende Antwort, `docs/survey/interview-guide.md` fehlt (→ Entscheidungen).

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
- **E11** Ab #10 kennt jede Antwort die Ankündigung (Entwurf erst nach dem Senden): Einschränkung für `bb` im Brief.
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

3. **Urteil am gemessenen Stand, nur lesen** (ui-critic + red-team, kein Builder) — Live-Link am Deploy-SHA (inkl. E11).
   DoD: alle 8 Dimensionen über 7 Stationen (390 × 844, 1280 × 800), Bias inkl. Vorwort (E9) und E11-Ankündigung; jeder
   Befund und die fünf r05-Beobachtungen (Kopf, Tasten 1/2/3, `.sorted-note`, doppelte Ansage, „Halbzeit“) eingeordnet:
   ohne Messwirkung → Hotfix erlaubt, mit → Einschränkung im Brief und in der G1-Ausnahme. Kein Code in diesem ZZ.

4. **Eingang und Brief** (Auslöser: Tobias' Mail) — `data/results/YYYY-MM-DD_tobias.json` (+ `.md`),
   `docs/brief/<datum>-vibecoding-brief.md`.
   DoD: Mail unverändert gesichert; `npm run ingest` (oder Handweg) legt die Datei ab, `npm run check` grün; Absender =
   Tobias (sonst Zweig „mehr Personen“); Fassung über `startedAt` bestimmt; „vollständig“ nach ZZ 2 geprüft, Zweig
   benannt; `/brief` mit red-team, Abschnitt 12 wörtlich, Budget als Stufenlabel statt „x/100“. Danach `/gate G2`.

5. **Zielbild-Rechnung vorbereiten** (für G2) — `scripts/zielbild.mjs`, `package.json`, `docs/brief/probe-*`, Brief-Agent.
   DoD: `npm run zielbild -- <datei>` rechnet die sieben ROADMAP-Größen, Regel nach ROADMAP und D-005 (N als Parameter),
   Konfidenz (±1 Reibung, ±10 `bb`, ±1 Stufe), Kipppunkt, Abgleich mit `hypothesis.target`; gleich mit `hypothesis()` in
   ≥ 200 Zufallsprofilen und allen Schwellen; Probe an `example.json` mit Kopf „Probe, erfundene Daten“.

**Gestrichen (Versand):** alt 2 → ZZ 2 · 3a · 3b, 4C → ZZ 1 · 4A/4B · 5 → ZZ 2/3/5 · Details `git show 5568d47:STATE.md`.

## Erledigt (letzte 5 Runden, älteres → git log)
- r07 = P1 (Prototyp, #12 19:39, #13 19:51): Recherche `docs/research/07-saas-muster.md`, Vorarbeit Gestaltungssystem,
  `lib/timer.js`, `lib/projects.js`; 4 Builder + B5 „Projekt bearbeiten“ (Hannes). Kritik am Merge `1de6612`: ui-critic
  FIX (7/6/7/8/6/9/8/8), red-team FIX („mittel“). Korrektur Basis + K1–K3: Speicher-Wettlauf, Timer-Regeln (unter 1 min
  keine Buchung, ab 10 h Rückfrage), eine Rundung, Farbrollen, Wochen blättern, Raster mit Rückgängig, Prognose ehrlich.
- r06 (Prototyp, #9–#11): UI-Entwurf in 3 Buildern; Kritik ui-critic FIX (7/6/7/5/8/8/8/5), red-team FIX („mittel“).
  Vorarbeit (Speicher-Abgleich, Prüfer, Budget aus Buchungen) + K1–K3 (Board-Rückmeldung, tiefer Link, Timer über 24 h
  bucht nicht, 3 Farben); CI mit Prüfsumme der Umfrage und `check:prototype`. E11 (#10): Ankündigung, Link nach Senden.
- r05 (#5–#8): Hotfix Reibungslinie (p ∈ [0,1]), Station 1 (Sperre 400 ms, Zonen-Knöpfe, Anleitung sichtbar), Vorwort,
  Test-Merker, `noindex`. Kritik FIX/FIX (7/7/8/8/8/8/9/7). Nachprüfung K1/K2 auf Hannes' Wunsch entfallen (ZZ 3).
- r04 (PR #4): Route als Knöpfe, Versand an `hannes@pix-el.de` (Desktop `.eml` mit Anhängen, Touch mailto bis 16 000
  Zeichen), eine Uhr `resultTime()`, `?test`, SVG-Finale. ui-critic FIX (8/5/7/8/7/7/8/7), red-team FIX („mittel“, E7).
- r03 (PR #3 mit r02): B2–B4 behoben (Karte + drei Zonen bei 360–430 px, wischsicher, Rest-Knopf fragt nach), Reibung
  ohne Anker, Kaufen-oder-Bauen in 5 Stufen, Ziele ≥ 44 px, Schrift ≥ 16 px, Kontrast ≥ 4,5:1. Kritik FIX/FIX.

## Gelernt (kurz, was künftige Runden wissen müssen)
- QuoJob-Kritik ist fast nur UX/Starrheit → A ist Arbeitshypothese, entschieden wird in G2. VAVE ist eine Gruppe
  (DE/CN/AE/SG): Mandanten, Währung, Sprache sind Kern.
- Texte und Skalen tragen die Zielbild-Rechnung mit; alte Werte nie still umdeuten. Lücken entscheiden mit (ohne
  Reibungswert → A, ohne `keep` → C); „vollständig“ an den Regel-Größen festmachen, nicht an der Schema-Gültigkeit.
- r05: Was vor dem Versand entschieden sein sollte, wird danach Auswertungsregel und muss vor dem Öffnen der Daten
  stehen, sonst wird sie am Ergebnis ausgerichtet.
- r05: Erst r05 bewertete alle 8 Dimensionen über alle 7 Stationen (Teil-Nachprüfungen zählen nicht). K1/K2 fielen dem
  Versanddruck zum Opfer, belegt nur durch Builder-Tests; ein Fehler trifft genau die eine Antwort → Urteil (ZZ 3).
- r05: Am Handy liegt der erste rAF-Zeitstempel nach einem Zeiger-Ereignis teils vor t0 (p < 0) → auf [0,1] klemmen,
  zum selben Ziel nicht neu starten (fand nur ein echtes Gerät). Tests paralleler Builder kollidieren über Timing
  (400-ms-Sperre, Scroll nach Reload) → Timings als Konstanten in den Auftrag, nach dem Merge alle Tests gemeinsam.
- r05: Zwei Runden ohne Fortschritt → Zeitprobe gestrichen, Versandprobe halbiert. Entscheidungen fallen im Chat,
  nicht in `DECISIONS.md` → fertige Absätze anbieten, Auslöser nennen.
- r06: Parallele Builder mergen konfliktfrei, wenn der Orchestrator gemeinsame Verträge vorab committet (Speicher,
  Prüfer, Budget) und Dateien strikt verteilt; Kind-Effekte laufen vor dem App-Effekt (Fokus-Vertrag). Headless-Chromium
  vertraut dem Proxy nicht (nicht umgehen) → Designrecherche über Bild-Download mit curl, Bilder nur im Scratchpad.
- r07: Große Runde mit Kritik als Tor → Hannes sah stundenlang nichts Neues. Seitdem ein Baustein = ein Deploy, Kritik
  parallel. Beispieldaten erzeugen Schein-Fakten (Prognose aus erfundenem Verlauf) → kennzeichnen. SHAs per `git rev-parse`.
- r08: Uneinheitliche Knöpfe (Umschalter, Play, Pfeile) fand erst ein Handy-Screenshot → ui-critic zählt Knopfformen je
  Ansicht. Kontrastprüfer sehen keine Pseudo-Elemente → Zustandsfarbe auf den Knopf selbst, Abstand als innerer Schatten.
- UI-Lehren r02–r05 (Layout, Timing, Kopfzeile) für eine zweite Erhebung und den Prototyp: `git show 5568d47:STATE.md`.
- Versand ohne Server: mailto hat keine Anhänge, `.eml` öffnet am Handy nicht als Entwurf, `canShare` prüft keine
  Dateitypen; headless prüft nur die URL → echte Geräte. Eine Uhr je Export; Markierungen in den Zustand, nicht die URL.
- Worktrees starten auf `origin/main` → Basis-SHA in jeden Builder-Auftrag, vor der ersten Änderung `git reset --hard`.
  Menschen-Aufgaben brauchen Datum oder Auslöser. Ergebnisse immer in Git committen.

## Nächste Runde startet mit
r08 läuft: P2-Rest und P4 je ein Deploy, P3 parallel. Umfrage: ZZ 1/ZZ 2 offen; kommt Tobias' Mail: sichern, dann ZZ 4.
