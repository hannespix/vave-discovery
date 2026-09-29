# Umfrage

Ohne Build-Step. `index.html` per Doppelklick öffnen – funktioniert direkt aus
dem Dateisystem, kein Server nötig, keine externen Referenzen (auch keine Web-Fonts).

Zum Entwickeln liegen `index.html` und `modules.js` nebeneinander: die Daten
(Bausteine, Wünsche, Rollen) werden per `<script src="modules.js">` geladen.

**Zum Verschicken:** `npm run bundle` erzeugt `../dist/vave-discovery-umfrage.html` –
eine Datei mit eingebetteten Daten. Nur die wird weitergegeben.

## Bedienung, Station „Sortieren"

- Karte in eine Zone ziehen
- oder Zone antippen (sortiert die aktuelle Karte)
- oder Tasten 1, 2, 3
- Karte in einer Zone antippen holt sie zurück in den Stapel

## Zustand und Export

- Fortschritt liegt im `localStorage` des Browsers unter `vave-discovery-v1`.
  Reload oder späteres Öffnen setzt an derselben Station fort.
  „Von vorn" am Ende löscht alles.
- Am Ende, Block **An Hannes schicken** (Adresse nur in `const HANNES`):
  - mit Maus oder Trackpad: **E-Mail-Entwurf laden** lädt eine `.eml` mit beiden Dateien im Anhang
    (Outlook öffnet sie als Entwurf, Apple Mail über „E-Mail" › „Erneut senden");
  - mit Touch (Handy, Tablet): **Per E-Mail senden** öffnet das Mailprogramm; Brief und Daten stehen
    im Mailtext zwischen `===== DATEN (…) =====` und `===== ENDE DATEN =====` (mailto kann keine Anhänge).
- Daneben: **Daten herunterladen (JSON)** und **Brief herunterladen (Markdown)**.
  Dateinamen `YYYY-MM-DD_tobias.json` / `.md` (Ortsdatum der ersten Ergebnisanzeige) – beide nach
  `../data/results/` legen; kamen die Daten als Mailtext, den Block zwischen den Markierungen unverändert
  als `.json` speichern. Dann `npm run check` und `/brief data/results/YYYY-MM-DD_tobias.json`.
- **Testlauf:** `index.html?test` (auch der Pages-Link) markiert alles als Test – Dateien
  `YYYY-MM-DD_test.*`, Betreff „[Test] …", `respondent` „Tobias (Test)". Testdateien gehören nicht
  nach `../data/results/`. Die Markierung gilt ab dem Start mit `?test` für diesen Stand, auch wenn er
  später ohne `?test` geöffnet wird; ein ohne `?test` begonnener Stand wird nie zum Test. „Von vorn"
  ohne `?test` beendet sie, „Von vorn" mit `?test` beginnt einen neuen Testlauf.

## Anpassen

- Inhalte: nur `modules.js` (Name des Befragten in `respondent`).
- Farben, Abstände, Schrift: `:root`-Tokens am Anfang von `index.html`.
- Hypothese-Logik und Brief: Funktionen `hypothesis()` und `buildBrief()`
  im Inline-Script. Die Schwellen stehen als Zielbild-Regeln in `../ROADMAP.md` (Gate G2)
  und müssen dort und hier identisch bleiben – der `red-team`-Agent prüft das.
- Nach Änderungen: `npm run check` (läuft auch als Hook) und `node --check` auf den Script-Block.
