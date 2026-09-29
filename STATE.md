# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r03 · 2026-09-29 · Meilenstein **M1 Umfrage** · nächstes Gate **G0** (Freigabe), danach **G1**

## Aktueller Meilenstein
M1 — Umfrage (7 Stationen). PR #3 (r02 + r03) wird im Auftrag von Hannes gemergt; danach zeigt Pages
(https://hannespix.github.io/vave-discovery/) den Stand r03. Link nur an Testpersonen (ZZ 5a), **noch nicht an Tobias**:
B1 und E3 sind offen.

## Offene Gates
- **G0** — Kriterien 3/3 erfüllt, Freigabe durch Hannes ausstehend. `npm run check` grün (28 Module, 14 Wünsche,
  7 Rollen, 1 Export); `survey/modules.js`: 28 Bausteine in 5 Gruppen; gebuchte Module als Annahme D-002 in
  `DECISIONS.md`, die Umfrage zeigt wie dort beschrieben alle 28 mit Preis. (r02 zählte 2/3; das Kriterium lässt die
  Annahme ausdrücklich zu: Liste „liegt vor **oder** ist als Annahme dokumentiert“.)
- **G1** — 0/4 erfüllt.
  - Nachweis `data/results/YYYY-MM-DD_tobias.json`: nicht erfüllt; es gibt nur `example.json`, nichts ist verschickt.
  - ui-critic ≥ 8 in allen 8 Dimensionen: nicht erfüllt, 1/8. Nachprüfung r03: Tempo 8, Bauchbedienung 7, Klarheit 7,
    Bewegung 6, Mobil 7, Zugänglichkeit 7, Vertrauen 7, Freude 7.
  - red-team ohne Bias-Falle „hoch“: nicht erfüllt, solange B1 offen ist (Neutraloption zählt in Regel 1 wie „weg“).
    Die Nachprüfung r03 selbst fand höchstens „mittel“; am Versandstand erneut prüfen.
  - Testlauf durch eine unbeteiligte Person < 8 min: nicht erfüllt, nicht durchgeführt.
  - Nicht prüfbar: „Antwort vollständig“ (Verzweigung) ist nicht definiert. Mit den Neutraloptionen ist jeder bis
    Station 7 geklickte Export schema-gültig, auch ohne Signal für die Regeln → Vorschlag an Hannes (siehe unten).

## Blocker
- **B1 · Regel 1 schlägt Zielbild C bei Unwissen vor.** `keptBack` zählt nur `keep`; „Kenne ich nicht“ senkt es wie
  „weg“ (ROADMAP M2, Regel 1: `bb ≥ 70` und `keptBack ≤ 2`). Verschärft durch die Doppeltipp-Regression (ZZ 2): 25
  Karten können ungelesen in „Kenne ich nicht“ landen. Lösung D-005 (Hannes, ZZ 3), Umsetzung ZZ 4.
  Blockiert den Versand an Tobias, nicht die Runden r04/r05.

## Offene Entscheidungen (Hannes; Entwürfe D-004/D-005 in PR #2)
Vor dem Versand nötig, weil sie festlegen, was die Umfrage misst (danach Texte einfrieren):
- **D-005 · Regel 1 (B1)** — „Kenne ich nicht“ weder behalten noch weg; Mindestzahl bewerteter Finanz-/Gruppen-Karten.
- **E1 · Kaufen-oder-Bauen-Stufen** 0/35/50/65/100 behalten? (red-team: ja) · **E2 · Konfidenzregel** (ROADMAP M2):
  „±1 Stufe“ statt „±10 `bb`“; bei 35, 50 und 65 liegt immer eine Regelgrenze (40, 60, 70) innerhalb ±10.
- **E3 · Frust-Skala** — Häufigkeit oder Intensität? Die Frage misst Häufigkeit, die Stufen 1–2 sind keine, „monatlich“
  fehlt. Monatliche Backoffice-Prozesse kommen höchstens auf 2, `backPain ≥ 2.5` (Regel 2, 3) wird selten → Richtung A.
- **E4 · Wunsch-Dubletten** ki-belege/ocr und offene-api/api · **E5 · weggefallene Teilaspekte** als neue Wünsche
  (neue ids) · **E6 · „Retainer“** als Begriff.
- **E7 · Exportstand** — Stufenlabel und Katalog-/Textstand im Export; Schema beschreibt `buildBuy` noch als stetig.
  `additionalProperties: false` und unveränderliche `example.json` → neue Felder optional oder Schema-Version 2.
- **Preise auf den Karten** (D-002: mit Preis) · **Budget-Neutraloption** für Schmerzgrenze und Regler · **Rollen**
  (Funktion gegen Standort).
- Formal: **D-004 Basiswechsel** (im Chat entschieden, Eintrag fehlt) · **„vollständig“ in G1** (Vorschlag gatekeeper r03).

## Nächste Zwischenziele (ZZ; Reihenfolge = Priorität; jedes mit DoD)

1. **Navigation, Einstieg und Abschluss** (r04) — Wünsche von Hannes und die Fixes derselben Bereiche; nur
   `survey/index.html`, drei Builder in getrennten Bereichen; Zustandsfelder (`freshState`, `upgrade`) nur Builder A.
   - **A · Statusleiste und Navigation** (`#route`, `#roomLabel`, `buildRoute`, `updateRoute`, `goTo`, `updateNav`,
     CSS der Route, `stepIn`). DoD: Jede erreichte Station ist in der Statusleiste per Touch (Trefferfläche
     ≥ 44 × 44 px), Maus und Tastatur anwählbar, vor und zurück, auch nach Reload; vorwärts höchstens bis zur ersten
     Station mit offener „Weiter“-Bedingung (1 oder 5). Der Screenreader hört Knöpfe mit Stationsname und Zustand,
     die Route ist nicht mehr `aria-hidden`. Nach „Weiter“, „Zurück“ und Sprung liegt der Fokus auf der Überschrift
     der neuen Station, angesagt als „Station n von 7: Name“. Die Route zeichnet sich beim Öffnen einmal (≤ 1,5 s);
     kein Dauerpuls; Routen- und Stationswechsel ≤ 300 ms (heute 600 und 450 ms).
   - **B · Einstieg und Versand** (Station 0, Aktionen in `renderResult`, `download`, neue Versandfunktionen).
     DoD: Station 0 sagt in einem Satz, dass alles auf dem Gerät bleibt und am Ende eine Datei für Hannes entsteht,
     und nennt, wo man löscht. „Per E-Mail an Hannes senden“ lädt eine `.eml`: an hannes@pix-el.de, `X-Unsent: 1`,
     `multipart/mixed`, Anhänge `YYYY-MM-DD_tobias.json` und `.md` in Base64, Betreff UTF-8-kodiert. Am Handy
     zusätzlich „Teilen“ mit beiden Dateien, wo `navigator.canShare({ files })` es erlaubt; Adresse zum Kopieren;
     die Einzel-Downloads bleiben als Rückfallweg. Kein Netzwerkzugriff.
   - **C · Bewegung** (`confetti()`, `#confetti`, Keyframes der Stationen, `prefers-reduced-motion`).
     DoD: Finale als animierte SVG statt Konfetti, einmal beim Erreichen des Ergebnisses, ≤ 1,5 s; Canvas und
     `confetti()` entfernt. Jede Interaktionsanimation ≤ 300 ms (neue Karte heute 380 ms), keine Endlosanimation.
     Bei reduzierter Bewegung sind Route, Finale und Übergänge statisch oder ein Fade.
   Gesamt: keine Emojis; `npm run check` grün; Headless 360/390/430 mit Touch und 1280; die `.eml` mit einem
   MIME-Parser geprüft (2 Anhänge, Dateinamen, JSON schema-konform).

2. **Station 1 absichern und `upgrade()`** (r05) — `survey/index.html`: Station 1 (JS, CSS, Zonen-Markup) und
   `upgrade()`; Builder: Eingabe · Layout · `upgrade()`.
   DoD: Zwei Tipps im Abstand ≤ 400 ms auf „Rest zu ‚Kenne ich nicht‘“ verschieben keine Karte; zwei Tipps ≤ 400 ms
   auf eine Zone sortieren genau eine Karte. Beim Betreten ist die Anleitung (eine Zeile genügt) zusammen mit Karte,
   drei Zonen und Rest-Knopf sichtbar, im Hochformat mit Browserleiste (Prüfung 360 × 600 und 390 × 664) und im
   Querformat (667 × 320, 844 × 340); dort liegen Rest-Knopf und „Kenne ich nicht“ ganz über der Navigation. Am
   Desktop (1280 × 800) und iPad quer (1180 × 820) legt ein Tipp irgendwo in eine Zone die aktuelle Karte ab und holt
   nie eine einsortierte zurück; die Zonen zeigen alle eingelegten Karten (keine feste Höhe). Zonen werden als Knopf
   mit Name und Anzahl angesagt, nicht als „Region“. Ein Stand ohne `budgetTouched` mit `buildBuy` 35 oder 65 lädt
   als „nicht eingestellt“, Station 5 fragt neu; 0 und 100 bleiben. `npm run check` grün; Headless mit Doppeltipps
   im Abstand von 100, 200 und 300 ms.

3. **Entscheidungen vor dem Versand** (Hannes, parallel zu r04/r05, kein Builder; Voraussetzung für ZZ 4) —
   `DECISIONS.md`, ggf. `ROADMAP.md`. DoD: D-004 und D-005 eingetragen; E1–E7 und die drei Punkte darunter
   entschieden oder mit Grund vertagt, D-005 und E3 nicht vertagt; „vollständig“ für G1 definiert. Jeder Eintrag
   nennt die betroffenen Dateien.

4. **Entscheidungen umsetzen, Erhebung einfrieren** (nach ZZ 3) — `survey/modules.js`, `survey/index.html`
   (Station 2, `hypothesis()`, `buildBrief()`, `exportData()`), `docs/survey/results-schema.json`, `scripts/check.mjs`;
   Builder: Texte und Station 2 · Regeln und Brief · Export und Schema.
   DoD: Station 2 misst, was E3 festlegt (bei Häufigkeit ist jede Stufe eine Häufigkeit, „monatlich“ ist dabei);
   Schema und Brief beschreiben die Skala genauso. `hypothesis()` folgt D-005 und stimmt in ≥ 150 Zufallsprofilen mit
   der ROADMAP überein, davon ≥ 30 mit ≥ 10 Karten in „Kenne ich nicht“. Der Export trägt, was E7 festlegt;
   `data/results/example.json` bleibt unverändert und besteht `npm run check`. Texte nach E4–E6, danach eingefroren.

5. **Zeitprobe und Abnahme vor dem Versand** — Pages-Link; `survey/README.md` („Zum Verschicken“); `STATE.md`
   DoD (a) Zeitprobe gleich nach dem Deploy von PR #3 (Hannes): eine unbeteiligte Person, eigenes Handy, ohne
   Erklärung; Stoppuhr vom Öffnen bis zum Download; Zeit und Stolperstellen in „Gelernt“. Bei ≥ 8 min kommt „Umfrage
   kürzen“ vor ZZ 4. (b) Abnahme am eingefrorenen Stand (nach ZZ 1, 2, 4): eine weitere unbeteiligte Person, < 8 min
   bis zum Versand; die Mail kommt mit beiden Anhängen bei hannes@pix-el.de an (je einmal iPhone-Safari und
   Android-Chrome); Export schema-konform, nicht als `…_tobias.json` abgelegt; ui-critic ≥ 8 in allen 8 Dimensionen
   und red-team ohne „hoch“ auf genau diesem Stand; Zwei-Zeilen-Anleitung für Tobias steht in `survey/README.md`.

## Erledigt (letzte 5 Runden, älteres → git log)
- r03: Handy, Touch und Zugänglichkeit (PR #3 mit r02). B2–B4 laut beiden Nachprüfungen behoben (Handy, Tablet,
  Desktop): Karte und drei Zonen bei 360–430 px sichtbar, klebende Einheit unter 941 px Breite oder bis 520 px Höhe,
  im Querformat nebeneinander, sichtbares Landen; wischsicher (Tipps ≤ 250 ms nach Scroll setzen nichts); Rest-Knopf
  fragt nach; Reihenfolge proportional (Backoffice im Rest ≤ 50 %). Station 2 ohne Ankerwert, SVG-Reibungslinie,
  Zeilen S2 106 px, S4 97 px; Kaufen-oder-Bauen in 5 Stufen an den Regelgrenzen, `upgrade()` fragt andere Werte neu;
  Ziele ≥ 44 px, Schrift ≥ 16 px, Kontrast ≥ 4,5:1; Texte neutral, 0 Dreiwortfolgen mit dem Herstellertext.
  `hypothesis()` = ROADMAP in 150 Profilen, 158 Exporte schema-konform. Nach einer Korrekturschleife: ui-critic FIX
  (8/7/7/6/7/7/7/7), red-team FIX (höchstens „mittel“).
- r02: Korrekturen vor dem Versand — Namen und Beschreibungen generisch, Karten reihum, Mittwort-Umbrüche 311 → 0,
  Budget ohne Vorbelegung, `FRONT` = ROADMAP. ui-critic BLOCK, red-team BLOCK → B2–B4 (in r03 behoben).
- Basiswechsel (Hannes, 2026-09-28): Upload-Fassung übernommen, Pages-Deploy der gebündelten Einzeldatei (PR #2).
- r01 (alter Katalog, ersetzt): ui-critic FIX, red-team BLOCK (`killCore` auf nicht gebuchten Modulen).
- r00: Repo-Skelett, Umfrage (7 Stationen), Schema `vave-discovery/1`, Recherche 00–06, `check.mjs`, `bundle.mjs`.

## Gelernt (kurz, was künftige Runden wissen müssen)
- Die Kritik an QuoJob ist fast ausschließlich UX/Starrheit → Zielbild A ist Arbeitshypothese, entschieden wird in G2.
- VAVE ist eine Gruppe (DE/CN/AE/SG) → Mandanten/Währung/Sprache sind Kern, nicht Zusatz.
- Kartentexte tragen die Zielbild-Rechnung mit: eine missverständliche Karte verschiebt die Regeln. Texte vor der
  Erhebung einfrieren; neue Namen können messen, was sie vorher nicht maßen.
- Layout immer gegen „Karte + alle drei Zonen sichtbar bei 360–430 px“ prüfen, auch mit sichtbarer Browserleiste und
  im Querformat: Die klebende Sortier-Einheit behob B2 und verdeckte dafür die Anleitung (r03).
- Prüfungen über alle Stationen laufen lassen (r02: geprüft war Station 1, überbreit wurde Station 2).
- Regler ohne sichtbaren Wert plus Pflicht-Tipp machen die Eingabe zufällig; Beschriftungen folgen den Regelgrenzen.
- Reihum über ungleich große Gruppen bündelt die größte Gruppe am Ende → proportional verteilen.
- Tipp-Fallen entstehen durch Timing: Was nach einem Tipp an derselben Stelle erscheint (Rückfrage unter dem
  Rest-Knopf, nächste Karte nach 240 ms Flug), trifft der zweite Tipp eines Doppeltipps. Bestätigung nie an die
  Stelle des Auslösers; headless mit Doppeltipps prüfen.
- Frage und Stufen einer Skala müssen dieselbe Dimension messen. Die gemischte Frust-Skala drückt `backPain` und
  schiebt die Ableitung Richtung A, also Richtung Arbeitshypothese (red-team r03).
- Lücken entscheiden mit: Ohne Reibungswert greifen Regel 2 und 3 nie (`backPain` = null → A), ohne `keep` greift
  Regel 1 leichter (B1 → C). „Vollständig“ an den Regel-Größen festmachen, nicht an der Schema-Gültigkeit.
- Ein Skalenwechsel zieht Regeln, Schema, Brief und gespeicherte Stände nach: 5 Stufen machen „±10 `bb`“ und
  „`buildBuy` 0–100“ ungenau; alte Werte (35/65 hießen „Offen“) nicht still umdeuten.
- Menschen-Aufgaben ohne Termin rutschen: „Frage an Tobias“ stand seit r00 ohne Fortschritt auf der Liste →
  gestrichen (G0 ist über D-002 gedeckt; kommt die Liste doch, kippt D-002). Brief-Probelauf ist kein G1-Kriterium →
  M2. Der Testlauf (seit dem Basiswechsel offen) ist halbiert: Zeitprobe sofort, Abnahme am Versandstand.
- Output-Ordner sind nicht exklusiv: Ergebnisse immer in Git committen.

## Nächste Runde startet mit
`/loop 1` (Navigation, Einstieg und Abschluss) als r04 auf einem neuen Branch von main, sobald PR #3 gemergt ist.
Parallel bei Hannes: G0 freigeben, ZZ 3 (Entscheidungen), ZZ 5a (Zeitprobe auf Pages).
