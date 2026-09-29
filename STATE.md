# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Ende r06 → **r07** (Prototyp ausbauen, Wunsch Hannes) · 2026-09-29 · **M1** · **verschickt, Antwort ausstehend**

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
- Live `/prototyp/` (#9 15:12, #11 16:16, r07 #12): Beispieldaten, kein Backend, Budgets nur in Stunden. Die Umfrage
  verlinkt ihn erst nach dem Senden (E11). r07 live: Timer-Pille, Palette ⌘K, Wochenraster, Projekt bearbeiten mit
  Budget-Verlauf; Kritik FIX/FIX, Korrekturen K1/K3 drin, K2 (Projekte) folgt. Hannes: öfter mergen und deployen.
- **Vorschlag D-006 · Hannes · UI-Entwurf vor G2** — *Entscheidung:* Ein UI-Entwurf mit erfundenen Daten, ohne Backend,
  ohne Rechnungs-, Buchhaltungs- und Mandantenlogik darf vor G2 entstehen und unter `/prototyp/` live sein; die Umfrage
  verlinkt ihn erst nach dem Senden. *Grund:* Gesprächsgrundlage, zeigt Stil und Bedienidee, legt das Zielbild nicht
  fest. *Kippt, wenn:* G2 ein anderes Zielbild wählt oder der Entwurf Antworten nachweislich prägt.
- **P1 · r07 Kern-Workflows** (Auswahl aus der Recherche, Abschnitt 3): klares Gestaltungssystem (neutrale Leiste,
  Farbrollen), ein Timer überall + Buchen aus der Aufgabe, Zeiten mit Timer/Nachtragen in einer Leiste und Wochenraster,
  Befehlspalette ⌘K, Projekte als Zeilen mit Burn-up und „reicht bis KW“, Heute als eine Spalte. DoD: je Workflow ein
  Playwright-Test (390/1280, hell/dunkel), ui-critic ≥ 8 in allen Dimensionen, red-team ohne „hoch“, kein Geld.
- Offene Frage an Tobias (nach der Antwort): Freigabe von Stundenzetteln nötig? Kalender-Anbindung?

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

**Gestrichen (durch den Versand überholt):** Alt 2 → ZZ 2 · 3a Zeitprobe (Tobias' Dauer ersetzt sie) · 3b, 4C → ZZ 1 ·
4A/4B (ändern, was Tobias sieht) · 5 → Regeln ZZ 2/5, Abnahme ZZ 3. Details: `git show 5568d47:STATE.md`.

## Erledigt (letzte 5 Runden, älteres → git log)
- r06 (Prototyp, #9–#11): UI-Entwurf in 3 Buildern (Hülle/Heute/Studios, Zeiten, Projekte). Kritik ui-critic FIX
  (7/6/7/5/8/8/8/5), red-team FIX („mittel“: Vorprägung, Budget ohne Buchungen). Vorarbeit (Speicher-Abgleich,
  Prüfer, Budget aus Buchungen, Ampel ungerundet, Wochenende) + Korrektur K1–K3 (Board-Rückmeldung, tiefer Link,
  kurze Wege, Bestätigung am Eintrag, Timer > 24 h bucht nicht, 3 Farben, keine Lade-Animation), CI gehärtet
  (Prüfsumme Umfrage, `check:prototype`). E11: Ankündigung im Vorwort, Link nach dem Senden (#10). Nachprüfung am r07-Stand.
- r05 (#5–#8): Hotfix Reibungslinie (p ∈ [0,1]), Station 1 (Sperre 400 ms, Zonen-Knöpfe, Anleitung sichtbar), Vorwort,
  Test-Merker, `noindex`. Kritik FIX/FIX (7/7/8/8/8/8/9/7). Nachprüfung K1/K2 auf Hannes' Wunsch entfallen (ZZ 3).
- r04 (PR #4): Route als Knöpfe, Versand an `hannes@pix-el.de` (Desktop `.eml` mit Anhängen, Touch mailto bis 16 000
  Zeichen), eine Uhr `resultTime()`, `?test`, SVG-Finale. ui-critic FIX (8/5/7/8/7/7/8/7), red-team FIX („mittel“, E7).
- r03 (PR #3 mit r02): B2–B4 behoben (Karte + drei Zonen bei 360–430 px, wischsicher, Rest-Knopf fragt nach), Reibung
  ohne Anker, Kaufen-oder-Bauen in 5 Stufen, Ziele ≥ 44 px, Schrift ≥ 16 px, Kontrast ≥ 4,5:1. Kritik FIX/FIX.
- r02/r01: Namen generisch, `FRONT` = ROADMAP, BLOCK → B2–B4; Basiswechsel (PR #2); r01 BLOCK (B1 „hoch“).

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
- r05: Export ohne Stand, fester `respondent` → Fassung und Person nur über `startedAt` und Absender (E7a).
- r06: Parallele Builder mergen konfliktfrei, wenn der Orchestrator gemeinsame Verträge vorab committet (Speicher,
  Prüfer, Budget) und Dateien strikt verteilt; Kind-Effekte laufen vor dem App-Effekt (Fokus-Vertrag). Headless-Chromium
  vertraut dem Proxy nicht (nicht umgehen) → Designrecherche über Bild-Download mit curl, Bilder nur im Scratchpad.
- UI-Lehren r02–r05 (Layout, Timing, Kopfzeile) für eine zweite Erhebung und den Prototyp: `git show 5568d47:STATE.md`.
- Versand ohne Server: mailto hat keine Anhänge, `.eml` öffnet am Handy nicht als Entwurf, `canShare` prüft keine
  Dateitypen; headless prüft nur die URL → echte Geräte. Eine Uhr je Export; Markierungen in den Zustand, nicht die URL.
- Worktrees starten auf `origin/main` → Basis-SHA in jeden Builder-Auftrag, vor der ersten Änderung `git reset --hard`.
  Menschen-Aufgaben brauchen Datum oder Auslöser. Ergebnisse immer in Git committen.

## Nächste Runde startet mit
r07 = P1 (Prototyp, Wunsch Hannes): Vorarbeit Gestaltungssystem + `lib/timer.js`, dann 3 Builder (Hülle/Palette/Heute,
Zeiten, Projekte), Kritik, eine Korrektur. Umfrage: ZZ 1 (Testmail, `ingest`) und ZZ 2 bleiben offen; kommt Tobias'
Mail vorher: unverändert sichern, dann ZZ 4.
