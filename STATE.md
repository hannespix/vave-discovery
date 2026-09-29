# STATE — lebender Zustand (max. 150 Zeilen, wird jede Runde fortgeschrieben)

Stand: Runde r05 (Korrekturschleife K1/K2 läuft) · 2026-09-29 · Meilenstein **M1 Umfrage** · **Versand an Tobias: jetzt**

## Aktueller Meilenstein
M1 — Umfrage. **Hannes (Chat, 2026-09-29): „Jetzt mach mal fertig! Ich will es abschicken!“** → r05 (`2354545`) wird
gemergt und deployt, der Link https://hannespix.github.io/vave-discovery/ (ohne `?test`) geht an Tobias. Bewusst vor
B1/D-005, E3, E7, E9: die Auswertung (M2/G2) berücksichtigt sie. K1/K2 folgen als eigener PR. Eintrag in `DECISIONS.md`: Hannes.

## Offene Gates
- **G0** — Kriterien 3/3 erfüllt, Freigabe durch Hannes ausstehend (seit r03, kein Eintrag in `DECISIONS.md`).
  Belege am Stand `2b978e8`: `npm run check` grün (28 Module, 14 Wünsche, 7 Rollen, 1 Export); `survey/modules.js`
  28 Bausteine in 5 Gruppen (alltag 6, projekt 3, finanzen 10, gruppe 4, anbindung 5); Annahme D-002 in `DECISIONS.md`.
- **G1** — 0/4 erfüllt, ein Punkt nicht prüfbar (Stand `2b978e8`).
  - Nachweis `data/results/YYYY-MM-DD_tobias.json`: nicht erfüllt; dort liegen nur `example.json` und `README.md`.
  - ui-critic ≥ 8 in allen 8 Dimensionen: nicht erfüllt. Erste Kritik r04 (`62876c2`) Tempo 8, Bauchbedienung 5,
    Klarheit 7, Bewegung 8, Mobil 7, Zugänglichkeit 7, Vertrauen 8, Freude 7. Nachprüfung (`2b978e8`) nur der sechs
    berührten, je 8; Tempo (8) und Freude (7) vom Vorstand, Station 1 nicht nachgeprüft → zählt laut Kritikerin nicht.
  - red-team ohne Bias-Falle „hoch“: nicht erfüllt. r04 höchstens „mittel“ (E7), aber B1 ist offen
    (`survey/index.html` Z. 1623 und 1631, ROADMAP-konform, nur über D-005 lösbar). Prüfung am eingefrorenen Stand.
  - Testlauf einer unbeteiligten Person < 8 min: nicht erfüllt, nicht durchgeführt; mit `?test` möglich (ZZ 3, 5b).
  - Nicht prüfbar: „Antwort vollständig“ (Verzweigung) ist nicht definiert → Vorschlag unter „Offene Entscheidungen“.

## Blocker
- **B1 · Regel 1 schlägt Zielbild C bei Unwissen vor** (Nr. 1, seit r02). `keptBack` zählt nur `keep`; „Kenne ich
  nicht“ senkt es wie „weg“ (ROADMAP M2, Regel 1: `bb ≥ 70` und `keptBack ≤ 2` von 14 Finanz-/Gruppen-Karten).
  Verschärft durch die Doppeltipp-Falle am Rest-Knopf (ZZ 1): 25 Karten können ungelesen in „Kenne ich nicht“ landen.
  Lösung D-005 (ZZ 2). Hannes verschickt trotzdem (2026-09-29): die Auswertung wendet D-005 an, Rohdaten bleiben.

## Offene Entscheidungen (Hannes; Entwürfe D-004/D-005 in PR #2)
Seit Ende r02 offen, r03 und r04 ohne Eintrag → halbiert. **Vor dem Einfrieren nötig** (legen fest, was gemessen wird):
- **D-005 · Regel 1 (B1)** — „Kenne ich nicht“ zählt weder als behalten noch als weg; Regel 1 greift erst ab einer
  Mindestzahl sortierter („Brauchen wir“/„Brauchen wir nicht“) Finanz-/Gruppen-Karten von 14, Zahl setzt Hannes.
- **E3 · Frust-Skala** — Häufigkeit oder Intensität? Die Frage misst Häufigkeit, die Stufen 1–2 sind keine, „monatlich“
  fehlt: monatliche Backoffice-Prozesse kommen höchstens auf 2, `backPain ≥ 2.5` (Regel 2, 3) wird selten → Richtung A.
- **E7 · Exportstand und Nachsteuern** — (a) Stufenlabel und Katalog-/Textstand in den Export (Schema beschreibt
  `buildBuy` noch stetig; neue Felder optional oder Schema-Version 2, `example.json` bleibt)? (b) neu r04: Nach der
  ersten Ergebnisanzeige lässt sich das Zielbild ohne Spur nachsteuern (A → C in 3 Tipps, A → B über eine Reibung).
  Vorschlag red-team: Zeile in Brief und Mailtext „nach erster Ergebnisanzeige geändert: … (A → C)“, ohne Schemafeld.
- **E8 · Versandweg** (neu r04) — Adresse `hannes@pix-el.de` bestätigen (diktiert „Hannes at pics-el.de“) und annehmen,
  dass an Handy und Tablet Brief und Daten im Mailtext stehen statt im Anhang (mailto kann keine Anhänge).
- **E9 · Vorwort vor der Messung** (neu r05, red-team „mittel“) — Risiko-Absatz rahmt `bb`/`keptBack` vor Station 1–5;
  (a) nur Satz 1 + Pfad vorn, Rest vor „An Hannes schicken“ · (b) Zusatzsatz + Station 5 „egal von wem“ · (c) Text bleibt,
  Brief/G2 werten `bb` ±1 Stufe. Mit dem Versand jetzt gilt faktisch (c). **E10** · Nebentätigkeit öffentlich ok? (noindex kommt mit K2)
- **„Vollständig“ in G1** — Vorschlag: (1) Kaufen-oder-Bauen eingestellt, (2) Mindestzahl aus D-005 an sortierten
  Finanz-/Gruppen-Karten erreicht, (3) ist mindestens eine davon behalten, hat mindestens die Hälfte der behaltenen
  einen Reibungswert, (4) Export besteht `npm run check`. Sonst Zweig „unvollständig“ (Runde „Umfrage kürzen“).
- **Formal, ohne Wirkung auf die Umfrage:** G0-Freigabe · D-004 Basiswechsel (im Chat entschieden, Eintrag fehlt).
- **Vorschlag „bleibt vor dem Versand wie heute“, ein Ja genügt:** E1 fünf Stufen mit „Unentschieden“ (red-team: ja) ·
  E4 Wunsch-Dubletten · E5 Teilaspekte · E6 „Retainer“ · Preise (D-002) · Budget-Neutraloption · Rollen nach Funktion;
  Wünsche, Rollen, Schmerzgrenze speisen keine Zielbild-Regel. **Nach M2:** E2 Konfidenzregel (Auswertung, nicht Messung).

## Nächste Zwischenziele (ZZ; Reihenfolge = Priorität; 2 und 3 laufen parallel bei Hannes)

1. **Station 1 absichern, Zustand und Test-Markierung** (r05) — `survey/index.html` (Station 1: JS, CSS, Zonen-Markup;
   `freshState`, `upgrade()`, Laden, `TEST`), `survey/README.md`. Builder: A Eingabe · B Layout · C Zustand (nimmt den
   r04-Rest „Test-Markierung“ mit, gleicher Code wie `upgrade()`).
   DoD A: Zwei Tipps ≤ 400 ms auf „Rest zu ‚Kenne ich nicht‘“ verschieben keine Karte, zwei Tipps ≤ 400 ms auf eine
   Zone sortieren genau eine (headless 100/200/300 ms). Desktop (1280 × 800) und iPad quer (1180 × 820): ein Tipp irgendwo
   in eine Zone legt die aktuelle Karte ab, holt nie eine einsortierte zurück. Zonen angesagt als Knopf, Name, Anzahl.
   DoD B: Beim Betreten sind Anleitung (eine Zeile genügt), Karte, drei Zonen und Rest-Knopf zugleich sichtbar bei
   360 × 600, 390 × 664, 667 × 320 und 844 × 340; quer liegen Rest-Knopf und „Kenne ich nicht“ ganz über der
   Navigation. Am Desktop zeigen die Zonen alle eingelegten Karten (keine feste Höhe).
   DoD C: Ein Stand ohne `budgetTouched` mit `buildBuy` 35 oder 65 lädt als „nicht eingestellt“, Station 5 fragt neu;
   0 und 100 bleiben; ein offener Stapel landet weiter auf Station 1. Ein unter `?test` begonnener Stand exportiert nie
   als `…_tobias.*` mit `respondent` „Tobias“, auch ohne `?test` wieder geöffnet; ein ohne `?test` begonnener wird nie Test.
   Gesamt: `npm run check`, `node --check`, r04-Tests (Route, Rennen, Tab, Versand) und r03-Regression grün; ui-critic
   bewertet alle 8 Dimensionen über alle 7 Stationen und nennt zu jeder Dimension < 8 den Befund.

2. **Entscheidungen vor dem Einfrieren, halbiert** (Hannes, kein Builder) — `DECISIONS.md`, ggf. `ROADMAP.md`
   (M2 Regel 1, G1). DoD: D-005, E3, E7 (a und b), E8 und „vollständig“ stehen in `DECISIONS.md`, keiner vertagt, jeder
   mit den betroffenen Dateien; G0-Freigabe und D-004 eingetragen; zur Liste „bleibt wie heute“ ein Eintrag
   (angenommen oder einzelne Punkte neu geöffnet); E2 steht bei M2.

3. **Zeit- und Versandprobe auf echten Geräten** (Hannes und eine unbeteiligte Person, gleich nach dem Deploy von
   PR #4; seit r03 offen, eine Runde ohne Fortschritt, bleibt sie in r05 liegen → `/milestone`) — Pages-Link mit
   `?test`; Ergebnis in „Gelernt“, keine Datei in `data/results/`. DoD (a) Zeitprobe: eigenes Handy, ohne Erklärung,
   Stoppuhr vom Öffnen bis zum Tipp auf „Per E-Mail senden“; Zeit, Gerät, Stolperstellen in „Gelernt“; ≥ 8 min →
   „Umfrage kürzen“ vor ZZ 5. (b) Versandprobe (ui-critic r04, mittel): je eine Testmail über iPhone Mail, Gmail
   (Android) und Outlook-App mit 10 000–15 000 Zeichen Mailtext kommt bei hannes@pix-el.de an (bestätigt E8), endet
   mit „===== ENDE DATEN =====“, der Datenblock besteht außerhalb von `data/results/` `npm run check -- <datei>`; die
   `.eml` öffnet am Desktop mit zwei Anhängen. Kappt oder bricht ein Programm den Block → Blocker vor ZZ 5.

4. **Rückweg und Feinschliff** (r06; am Ende von r05 konkretisieren) — `survey/index.html` (Versandblock in
   `renderResult`, Routen-Blase und ihr CSS), `scripts/ingest.mjs` (neu), `package.json`, `survey/README.md`.
   Builder: A Hinweise · B Befunde < 8 aus der vollständigen r05-Kritik · C Einlesen.
   DoD A: Nach dem Tipp auf „Per E-Mail senden“ zeigt und sagt die Seite, was passiert und was zu tun ist, wenn kein
   Mailprogramm aufgeht; „Sonst beide Dateien unten einzeln laden …“ steht bei Desktop, Touch und zu langer Mail. Unter
   641 px nennt die Blase die Station wie die Leiste (Nummer), ohne doppelten Satz; Blase und Fokusring halten bei
   360–640 px ≥ 8 px Abstand zum Rand. Der mailto-Kommentar nennt die Messwerte (Max-Profil 18 373, nur Daten 8 080).
   DoD B: Jeder Befund, mit dem ui-critic in r05 eine Dimension unter 8 begründet (zuletzt Freude 7), ist behoben.
   DoD C: `npm run ingest -- <datei>` liest eine gespeicherte Mail (`.eml` oder Text, auch CRLF, quoted-printable,
   format=flowed) oder JSON, nimmt nur den Datenblock, prüft ihn wie `npm run check`, schreibt ihn byte-gleich mit
   dem JSON-Download nach `data/results/YYYY-MM-DD_<vorname>.json`, überschreibt nie; Testdaten prüft es, schreibt sie nie.
   Headless: `.eml`, mailto „Brief + Daten“ und „nur Daten“ kommen byte-gleich zurück; README nennt das Skript.
   Gesamt: `npm run check` grün; ui-critic alle 8 Dimensionen ≥ 8 (alle 7 Stationen); red-team ohne „hoch“ außer B1.

5. **Umsetzen, einfrieren, abnehmen** (nach ZZ 1, 2, 4) — `survey/modules.js`, `survey/index.html` (Station 2,
   `hypothesis()`, `buildBrief()`, `exportData()`, Mailtext), `docs/survey/results-schema.json`, `scripts/check.mjs`,
   `scripts/ingest.mjs`, `survey/README.md`. Builder: Texte und Station 2 · Regeln und Brief · Export und Schema.
   DoD (a): Station 2 misst, was E3 festlegt (bei Häufigkeit ist jede Stufe eine Häufigkeit, „monatlich“ ist dabei);
   Schema und Brief beschreiben die Skala genauso. `hypothesis()` folgt D-005 und stimmt in ≥ 150 Zufallsprofilen mit
   der ROADMAP überein, davon ≥ 30 mit ≥ 10 Karten in „Kenne ich nicht“. Export, Brief und Mailtext tragen, was E7
   festlegt; `data/results/example.json` bleibt unverändert und grün; `npm run ingest` liest den neuen Export. Texte
   nach ZZ 2, dann eingefroren (Commit in STATE); an genau diesem Stand ui-critic ≥ 8 in allen 8, red-team ohne „hoch“.
   (b) Abnahme (Hannes): eine weitere unbeteiligte Person, eigenes Handy, `?test`, < 8 min bis zum Versand; die Mail
   kommt an, `npm run ingest` prüft sie grün; Zwei-Zeilen-Anleitung für Tobias in `survey/README.md`; dann Versand.

## Erledigt (letzte 5 Runden, älteres → git log)
- r04: Navigation, Einstieg und Abschluss (PR #4; drei Builder, eine Korrekturschleife). Route: erreichte Stationen als
  Knöpfe ≥ 44 px, ein Tab-Stopp, vorwärts bis zur ersten offenen Station, kein Wechsel im Kartenflug, Fokus und Ansage
  auf der Überschrift. Einstieg: alles bleibt auf dem Gerät. Versand an hannes@pix-el.de: Desktop `.eml` mit zwei Anhängen, Touch
  mailto mit Daten im Mailtext (gestuft bis 16 000 Zeichen), kein „Teilen“; eine Uhr `resultTime()`; `?test`. SVG-Finale
  statt Konfetti, Wechsel 240 ms, keine Emojis. Tests grün, `hypothesis()` = ROADMAP in 200 Profilen. ui-critic FIX
  (8/5/7/8/7/7/8/7) → Nachprüfung PASS für den Umfang (6 Dimensionen je 8); red-team FIX → FIX nur wegen E7 („mittel“).
- r03: Handy, Touch und Zugänglichkeit (PR #3 mit r02): B2–B4 behoben (Karte und drei Zonen bei 360–430 px, wischsicher,
  Rest-Knopf fragt nach, Reihenfolge proportional); Reibungslinie ohne Ankerwert; Kaufen-oder-Bauen in 5 Stufen; Ziele
  ≥ 44 px, Schrift ≥ 16 px, Kontrast ≥ 4,5:1; Texte neutral. ui-critic FIX (8/7/7/6/7/7/7/7), red-team FIX („mittel“).
- r02: Korrekturen vor dem Versand (Namen generisch, Budget ohne Vorbelegung, `FRONT` = ROADMAP); beide BLOCK → B2–B4.
- Basiswechsel (Hannes, 2026-09-28): Upload-Fassung übernommen, Pages-Deploy der Einzeldatei (PR #2).
- r01 (alter Katalog, ersetzt): red-team BLOCK. · r00: Skelett, Umfrage, Schema `vave-discovery/1`, Recherche, Skripte.

## Gelernt (kurz, was künftige Runden wissen müssen)
- QuoJob-Kritik ist fast nur UX/Starrheit → Zielbild A ist Arbeitshypothese, entschieden wird in G2. VAVE ist eine
  Gruppe (DE/CN/AE/SG): Mandanten, Währung, Sprache sind Kern.
- Texte und Skalen tragen die Zielbild-Rechnung mit: Frage und Stufen messen dieselbe Dimension, Beschriftungen folgen
  den Regelgrenzen, kein Regler ohne sichtbaren Wert. Vor der Erhebung einfrieren; ein Skalenwechsel zieht Regeln,
  Schema, Brief und gespeicherte Stände nach, alte Werte nie still umdeuten.
- Lücken entscheiden mit: ohne Reibungswert greifen Regel 2 und 3 nie (→ A), ohne `keep` greift Regel 1 leichter (→ C).
  „Vollständig“ an den Regel-Größen festmachen, nicht an der Schema-Gültigkeit.
- Layout gegen „Karte + drei Zonen sichtbar bei 360–430 px“ prüfen, mit Browserleiste und quer, über alle Stationen.
  Die Kopfzeile klebt am Handy nur innerhalb der `body`-Höhe (= Viewport), auf langen Stationen scrollt die Route weg;
  wer das ändert, prüft die klebende Sortier-Einheit von Station 1 mit. Reihum → proportional verteilen.
- Timing: Was nach einem Tipp an derselben Stelle erscheint (Rückfrage, nächste Karte nach 240 ms), trifft den zweiten
  Tipp; ein Stationswechsel im Kartenflug verliert Zustand (`busy` sperrt ihn). Bestätigung nie an die Stelle des
  Auslösers; headless mit Doppeltipps und Sprüngen während Animationen prüfen.
- Versand ohne Server: mailto hat keine Anhänge, eine `.eml` öffnet am Handy und iPad nicht als Entwurf. `canShare`
  prüft keine Dateitypen (Chromium sagt ja, teilt `.json`/`.md` trotzdem nicht). Headless prüft nur die mailto-URL,
  nicht das Mailprogramm → echte Geräte.
- Eine Uhr je Export (`resultTime()`) für Dateiname, Betreff, Brief, `Date:` und `exportedAt`. Markierungen gehören in
  den Zustand, nicht in die URL: `?test` teilt sich den Speicher mit dem Ernstfall (red-team r04).
- Worktrees starten auf `origin/main`, nicht auf dem Rundenstand → Basis-SHA in jeden Builder-Auftrag; der Builder
  prüft sie und setzt vor der ersten Änderung per `git reset --hard <sha>` zurück (r03, r04: jedes Mal nötig).
- Teil-Nachprüfungen zählen nicht für G1 → jede Kritikrunde bewertet alle 8 Dimensionen über alle 7 Stationen.
- Menschen-Aufgaben ohne Termin rutschen: „Frage an Tobias“ gestrichen (G0 über D-002), Testlauf in r03 halbiert,
  Entscheidungen in r04 halbiert (vier Pflicht-Entscheidungen, der Rest mit einem Ja).
- Output-Ordner sind nicht exklusiv: Ergebnisse immer in Git committen.

## Nächste Runde startet mit
K1/K2 (Korrekturschleife r05) mergen, Folge-PR, Deploy; dann gatekeeper: ZZ neu ableiten (Versand läuft → Auswertung M2).
