# campfire/: der Campfire-Vortrag bei VAVE

90 Minuten Impulsvortrag auf Englisch über KI und Vibecoding. Den Ablauf, die Kernsätze und den Sprechtext enthält
[`ROTER-FADEN.md`](ROTER-FADEN.md). Dieser Ordner hängt nicht an der Discovery-Schleife (STATE/ROADMAP) und ändert
nichts an Umfrage oder Prototyp.

**Online:** <https://hannespix.github.io/vave-discovery/campfire/>. Das ist die Hub-Seite mit allen Decks, Modulen,
PDFs, Grafiken und der Board-Datei.

## Was hier liegt

| Pfad | Inhalt |
|---|---|
| `ROTER-FADEN.md` | Ablauf in neun Stationen, Zeiten, Sprechtext, Beispiele mit Ampel, Checkliste für den Vortag |
| `index.html` | Hub-Seite (englisch) |
| `decks/*.html` | sechs reveal.js-Kurzdecks: opening, spark, kindling, forge, smoke, embers |
| `modules/*.html` | fünf interaktive Module: token-oracle, context-circle, prompt-forge, git-time-machine, fireplace-check |
| `art/*.svg` · `art/*.png` | Pixel-Art: Lagerfeuer-Szene, Wanderkarte, Lebenslauf-Streifen, Repo-Wand, Feuerstellen-Regeln, Pix, Stations-Icons |
| `shared/` | gemeinsames Aussehen: `campfire.css` (Farben, Schrift), `pixel.js` (Sprites als Textraster, 5×7-Pixelschrift), `deck.css`/`deck.js` (reveal-Thema), Jersey 10 (OFL) |
| `vendor/reveal/` | reveal.js 5.2 (MIT), lokal, damit alles offline läuft |
| `tools/` | Build-Skripte, siehe unten |
| `dist/` | **gebaute Einzeldateien.** Genau das geht online, und genau das steckt in der Board-Datei |

## Bauen

```bash
node campfire/tools/art.mjs                     # Pixel-Art neu erzeugen (SVG)
node campfire/tools/build.mjs                   # Decks, Module, Hub → dist/ (alles eingebettet, offline)
PLAYWRIGHT_CORE=… CHROMIUM=… node campfire/tools/pdf.mjs     # Decks → dist/pdf/*.pdf
node campfire/tools/board.mjs --mcp pixinotes-mcp.mjs         # PixiNotes-Board → dist/campfire.pixiboard.json
```

- **Reihenfolge:** art → build → pdf → board. Das Board bettet die gebauten Decks, Module und PDFs ein.
- **MCP-Server:** `pixinotes-mcp.mjs` gibt es unter <https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs>.
  Über ihn legt das Board-Skript alle Textkarten an: Stationsköpfe, Notizen, Diagramme, Ideen-Bubbles, Kanban und
  Tabellen, samt Pfeilen. Danach ergänzt dasselbe Skript in der Datei, was die MCP-Sprache nicht kennt: App-Karten,
  Bilder, PDFs, Pix, flüssige Schrift, Layout und den gestrichelten Pfad.
- **Deploy:** `dist/` wird mit eingecheckt. `.github/workflows/pages.yml` kopiert es nach `/campfire/`.

## Das Board in PixiNotes

`dist/campfire.pixiboard.json` auf ein beliebiges Board ziehen. Es kommt als **neues** Board dazu, vorhandene Boards
bleiben unberührt.

- **Aufbau:** Oben liegt die Übersicht (Titel, Szene, Wanderkarte, Agenda). Darunter folgen neun Stations-Rahmen im
  3×3-Raster.
- **Präsentation:** Der Präsentationsmodus geht die Rahmen zeilenweise durch und folgt in jedem Rahmen den Pfeilen.
- **Offline:** Decks, Module und PDFs reisen in der Datei mit und laufen in den Karten ohne Netz.
