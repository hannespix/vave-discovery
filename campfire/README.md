# campfire/: der Campfire-Vortrag bei VAVE

90 Minuten Impulsvortrag auf Englisch über KI und Vibecoding, erzählt wie Geschichten am Lagerfeuer: **PLAYING WITH
FIRE – stories around the fire**. Die acht Kapitel, Kernsätze und Stichworte enthält [`ROTER-FADEN.md`](ROTER-FADEN.md).
Dieser Ordner hängt nicht an der Discovery-Schleife (STATE/ROADMAP) und ändert nichts an Umfrage oder Prototyp.

**Online:** <https://hannespix.github.io/vave-discovery/campfire/>. Das ist die Hub-Seite mit allen Decks, Modulen,
PDFs, Grafiken und der Board-Datei.

## Version 3 in einem Satz

Ein Zwischending aus Version 1 und 2: der Lagerfeuer-Abend aus Version 1 mit den Inhalten aus Version 2 (Begriffe,
KI-Geschichte und Gerüchte, GitHub mit vielen Konten und KIs, Repos als Lego, vave.log, Beispiele aus der
Kommunikation im Raum), ohne Spielmechanik, und ein Board, das selbst die Bühne ist.

## Was hier liegt

| Pfad | Inhalt |
|---|---|
| `ROTER-FADEN.md` | acht Kapitel (I The gathering … VIII Embers), Zeiten, Kernsätze, je Kapitel ein „Ember“ zum Mitnehmen |
| `shared/lore.js` | **einzige Inhaltsquelle:** 30 Begriffe, 15 Stationen KI-Geschichte, 14 Mythen und Gerüchte, 7 Geistergeschichten (Risiken), 8 Ideen für den Raum, 7 Feuerstellen-Regeln |
| `index.html` | Hub-Seite (englisch) |
| `decks/*.html` | acht reveal.js-Decks, eins pro Kapitel: gathering, old-fires, words, kindling, many-fires, vave-fire, smoke, embers |
| `modules/*.html` | acht interaktive Module: myth-or-fact, inventory, token-oracle, context-circle, prompt-forge, git-time-machine, fireplace-check, booth-builder |
| `art/*.svg` · `art/*.png` | Pixel-Art: acht Kapitelkarten, Titel, Pfad, Messestand, alte Feuer, Wörter, das Lager, Remix-Karte, Making-of vave.log, Rauch u. a. |
| `shared/` | gemeinsames Aussehen: `campfire.css` (Farben, Schrift), `pixel.js` (Sprites und 30 Begriffs-Icons als Textraster, 5×7-Pixelschrift), `deck.css`/`deck.js` (reveal-Thema), Jersey 10 (OFL) |
| `vendor/reveal/` | reveal.js 5.2 (MIT), lokal, damit alles offline läuft |
| `tools/` | Build-Skripte, siehe unten |
| `dist/` | **gebaute Einzeldateien.** Genau das geht online, und genau das steckt in der Board-Datei |

## Bauen

```bash
node campfire/tools/art.mjs [jobName …]         # Pixel-Art neu erzeugen (SVG), optional nur einzelne Jobs, z. B. vavelogQuest
node campfire/tools/build.mjs                   # Decks, Module, Hub → dist/ (alles eingebettet, offline)
PLAYWRIGHT_CORE=… CHROMIUM=… node campfire/tools/pdf.mjs     # Decks → dist/pdf/*.pdf
node campfire/tools/board.mjs --mcp pixinotes-mcp.mjs         # PixiNotes-Board → dist/campfire.pixiboard.json
```

- **PNG-Vorschauen** in `art/` sind die SVGs, in Chromium mit 4× gerendert (1280×720); `art.mjs` schreibt nur SVG.
- **Reihenfolge:** art → build → pdf → board. Das Board bettet die gebauten Decks, Module und Kapitelkarten ein.
- **Inhalte ändern:** Begriffe, Geschichte, Mythen, Risiken und Ideen nur in `shared/lore.js` pflegen. Module, Art und
  Board lesen von dort.
- **MCP-Server:** `pixinotes-mcp.mjs` gibt es unter <https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs>.
  Über ihn legt das Board-Skript die nativen Karten an (Ideen-Bubbles, Kanban). Danach ergänzt dasselbe Skript in der
  Datei, was die MCP-Sprache nicht kennt: Decks und Tools als App-Karten, Kapitelkarten, flüssige Schrift, Layout,
  Pfeile und den gezeichneten Pfad.
- **Deploy:** `dist/` wird mit eingecheckt. `.github/workflows/pages.yml` kopiert es nach `/campfire/`.

## Das Board in PixiNotes

`dist/campfire.pixiboard.json` auf ein beliebiges Board ziehen. Es kommt als **neues** Board dazu, vorhandene Boards
bleiben unberührt.

- **Das Board ist die Bühne.** Alle sehen es, und der Präsentationsmodus zeigt nur Karten für das Publikum: 31 Folien.
- **Aufbau:** Oben der flüssige Titel. Darunter acht Lagerplätze an einem gezeichneten Feuerpfad, vier pro Reihe. Jeder
  Lagerplatz hat seine quadratische Pixel-Kapitelkarte, sein Deck und danach die Live-Karten (Tools, Bubbles, Kanban).
  Im letzten Lagerplatz kommt das Deck *Embers* zuletzt: Es schließt den Abend nach den Fragen.
- **Ohne Zwischenkarten:** keine Notizen, keine Anleitungen, keine Zeiten, keine Rahmen (ein Rahmen würde in PixiNotes
  eine eigene Titelfolie erzeugen), keine PDFs (die liegen auf dem Hub). Der Pfad ist gezeichnet, Zeichnungen werden
  keine Folien.
- **Reihenfolge:** In jedem Lagerplatz führen Pfeile von Karte zu Karte, die Lagerplätze folgen der Lesefolge.
- **Pfeile sind in PixiNotes Daten-Abos:** Ein Pfeil zwischen App und Notiz oder zwischen Zeitleiste und Kanban würde
  Daten koppeln. Das Board-Skript lässt solche Pfeile weg.
- **Mitmachen:** Über Live → Einladungslink (ohne Konto) → QR-Code schreibt das Publikum in die Bubbles.
- **Theme:** Im Vortrag PixiNotes **dunkel** stellen: Kapitelkarten, Bubbles und Kanban liegen dann auf Nachtgrund statt
  in einem weißen Rahmen. Auf dem Board selbst ist der Hintergrund warm gelb.
- **Offline:** Decks und Tools reisen in der Datei mit und laufen in den Karten ohne Netz.
