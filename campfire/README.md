# campfire/: der Campfire-Vortrag bei VAVE

90 Minuten Impulsvortrag auf Englisch über KI und Vibecoding, gebaut als Spiel: **PLAYING WITH FIRE – a campfire quest
through AI**. Den Ablauf in zehn Leveln, die Kernsätze und den Sprechtext enthält [`ROTER-FADEN.md`](ROTER-FADEN.md).
Dieser Ordner hängt nicht an der Discovery-Schleife (STATE/ROADMAP) und ändert nichts an Umfrage oder Prototyp.

**Online:** <https://hannespix.github.io/vave-discovery/campfire/>. Das ist die Hub-Seite mit allen Decks, Modulen,
PDFs, Grafiken und der Board-Datei.

## Version 2 in einem Satz

Mehr Fachbegriffe als Spiel-Items erklärt, mehr KI-Geschichte und Gerüchte, weniger Anbieter-Fokus, GitHub als Gildenhalle
für viele Konten und viele KIs, Beispiele aus der Kommunikation im Raum (Showroom, Messestand, Markenraum), das Repo
vave.log als eigenes Quest-Level samt Vorschlägen zur Weiterentwicklung und modulares Arbeiten über viele Repos hinweg.

## Was hier liegt

| Pfad | Inhalt |
|---|---|
| `ROTER-FADEN.md` | Ablauf in zehn Leveln (0 PRESS START … 9 NEW GAME+), Zeiten, Sprechtext, Running Gags, Checkliste |
| `shared/lore.js` | **einzige Inhaltsquelle:** 30 Items (Fachbegriffe), 15 Stationen KI-Geschichte, 14 Mythen und Gerüchte, 7 Bosse (Risiken), 8 Raum-Quests, 7 Hausregeln |
| `index.html` | Hub-Seite (englisch) |
| `decks/*.html` | acht reveal.js-Kurzdecks: press-start, lore, inventory, kindling, guild, questlog, bossfight, newgame |
| `modules/*.html` | acht interaktive Module: myth-or-fact, inventory, token-oracle, context-circle, prompt-forge, git-time-machine, fireplace-check, booth-builder |
| `art/*.svg` · `art/*.png` | Pixel-Art: Titelbild, Weltkarte, Messestand, Item-Bogen, Gildenhalle, Remix-Karte, Quest-Log vave.log, Bosse, Lagerfeuer-Szene u. a. |
| `shared/` | gemeinsames Aussehen: `campfire.css` (Farben, Schrift), `pixel.js` (Sprites und 30 Item-Icons als Textraster, 5×7-Pixelschrift), `deck.css`/`deck.js` (reveal-Thema), Jersey 10 (OFL) |
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
- **Reihenfolge:** art → build → pdf → board. Das Board bettet die gebauten Decks, Module und PDFs ein.
- **Inhalte ändern:** Begriffe, Geschichte, Mythen, Bosse und Quests nur in `shared/lore.js` pflegen. Module, Art und
  Board lesen von dort.
- **MCP-Server:** `pixinotes-mcp.mjs` gibt es unter <https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs>.
  Über ihn legt das Board-Skript alle Textkarten an: Levelköpfe, Notizen, Diagramme, Zeitleisten, Ideen-Bubbles,
  Kanban und Tabellen, samt Pfeilen. Danach ergänzt dasselbe Skript in der Datei, was die MCP-Sprache nicht kennt:
  App-Karten, Bilder, PDFs, Pix, flüssige Schrift, Layout und den gestrichelten Pfad.
- **Deploy:** `dist/` wird mit eingecheckt. `.github/workflows/pages.yml` kopiert es nach `/campfire/`.

## Das Board in PixiNotes

`dist/campfire.pixiboard.json` auf ein beliebiges Board ziehen. Es kommt als **neues** Board dazu, vorhandene Boards
bleiben unberührt.

- **Aufbau:** Oben liegt die Übersicht (Titel, Weltkarte, Agenda, Messestand, Item-Bogen), gold getönt. Darunter
  folgen acht Rahmen für die zehn Level, vier pro Reihe, LCD-grün getönt und durch einen gestrichelten Pfad verbunden.
  Die Decks *Press start* und *Kindling* decken je zwei Level ab (0–1 und 4–5). Ganz unten liegt ein Rahmen mit den PDFs.
- **Ein Ort pro Inhalt:** In jedem Rahmen kommt zuerst das Deck, dann die Live-Karten (Module, Bubbles, Kanban) und
  höchstens eine Übersicht (Tabelle oder Diagramm). Zusammenfassungen und Save Points stehen nur in den Decks.
- **Präsentation:** Der Präsentationsmodus geht die Rahmen zeilenweise durch und folgt in jedem Rahmen den Pfeilen,
  55 Folien. Die PDFs folgen ganz am Ende als Handouts.
- **Pfeile sind in PixiNotes Daten-Abos:** Ein Pfeil zwischen App und Notiz oder zwischen Zeitleiste und Kanban würde
  Daten koppeln. Das Board-Skript lässt solche Pfeile weg, die Lage der Karten trägt dann die Reihenfolge.
- **Theme:** Das Board ist für das helle PixiNotes-Theme gebaut. Vor dem Vortrag in PixiNotes hell einstellen.
- **Mitmachen:** Warm-up, Gerüchteküche, Raum-Quests und Fragen sind Ideen-Bubbles. Über Live → Einladungslink
  (ohne Konto) → QR-Code kann das Publikum mitschreiben.
- **Offline:** Decks, Module und PDFs reisen in der Datei mit und laufen in den Karten ohne Netz.
