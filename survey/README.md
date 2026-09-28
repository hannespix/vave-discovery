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
- Am Ende: **Daten herunterladen (JSON)** und **Brief herunterladen (Markdown)**.
  Dateinamen `YYYY-MM-DD_tobias.json` / `.md` – beide nach `../data/results/` legen,
  dann `npm run check` und `/brief data/results/YYYY-MM-DD_tobias.json`.

## Anpassen

- Inhalte: nur `modules.js` (Name des Befragten in `respondent`).
- Farben, Abstände, Schrift: `:root`-Tokens am Anfang von `index.html`.
- Hypothese-Logik und Brief: Funktionen `hypothesis()` und `buildBrief()`
  im Inline-Script. Die Schwellen stehen als Zielbild-Regeln in `../ROADMAP.md` (Gate G2)
  und müssen dort und hier identisch bleiben – der `red-team`-Agent prüft das.
- Nach Änderungen: `npm run check` (läuft auch als Hook) und `node --check` auf den Script-Block.
