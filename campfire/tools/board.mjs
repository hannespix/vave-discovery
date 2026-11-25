#!/usr/bin/env node
// Campfire board (version 3, stories around the fire): builds the talk as a PixiNotes board, through PixiNotes' own
// MCP server.
//
//   node campfire/tools/board.mjs --mcp <pixinotes-mcp.mjs>
//
// The board IS the stage: everybody sees it, and presentation mode only steps through cards meant for the audience.
// Eight camps along a fire trail, one per chapter: a square pixel-art chapter card, the chapter's deck, then the live
// tools, the idea bubbles and the kanbans. No notes, no instructions, no frames (a frame would add a title slide),
// no PDFs (they live on the hub). The trail between the camps is drawn, and drawings never become slides.
//
// The MCP server (https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs, built from hannespix/pixinotes) creates the
// native cards (idea bubbles, kanbans). Card types the MCP language doesn't speak (embedded decks and tools, images,
// liquid type) and the exact layout are added afterwards in the same file. Content shared with decks and modules comes
// from shared/lore.js. Result: dist/campfire.pixiboard.json. Drop it onto PixiNotes and it arrives as a NEW board.
//
// Presentation order in PixiNotes (lib/kartenFolge.ts): connected cards are shown together, along the arrows; groups
// follow the reading order. So: one connected chain per camp, camps in reading order, no arrows between camps.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const dist = join(root, 'dist');
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const mcpPath = arg('--mcp') ?? process.env.PIXINOTES_MCP;
if (!mcpPath || !existsSync(mcpPath)) {
  console.error('board: --mcp <pixinotes-mcp.mjs> fehlt (Download: https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs)');
  process.exit(1);
}
vm.runInThisContext(readFileSync(join(root, 'shared', 'lore.js'), 'utf8'));
const LORE = globalThis.LORE;

/* ───────────────────────────── MCP client (stdio, JSON-RPC) ───────────────────────────── */

const work = mkdtempSync(join(tmpdir(), 'campfire-board-'));
const datei = join(work, 'pixinotes-daten.json');
const srv = spawn(process.execPath, [mcpPath, '--datei', datei], { stdio: ['pipe', 'pipe', 'ignore'] });
let puffer = ''; const wartend = new Map(); let naechste = 1;
srv.stdout.on('data', (d) => {
  puffer += d;
  for (let i; (i = puffer.indexOf('\n')) >= 0;) {
    const zeile = puffer.slice(0, i); puffer = puffer.slice(i + 1);
    if (!zeile.trim()) continue;
    const m = JSON.parse(zeile);
    if (m.id && wartend.has(m.id)) { wartend.get(m.id)(m); wartend.delete(m.id); }
  }
});
const rpc = (method, params) => new Promise((ok) => { const id = naechste++; wartend.set(id, ok); srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
async function tool(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  const text = r.result?.content?.map((c) => c.text).join('\n') ?? JSON.stringify(r.error);
  if (r.error || r.result?.isError) throw new Error(`${name}: ${text}`);
  return text;
}

/* ───────────────────────────── Layout ───────────────────────────── */

const CW = 1840, GAP = 200, PER_ROW = 4;                 // one camp per cell, four camps per row
const COLS = Array.from({ length: PER_ROW }, (_, i) => i * (CW + GAP));
const BREITE = PER_ROW * CW + (PER_ROW - 1) * GAP;
const TOP = 720;                                         // the liquid title sits above the camps
const ROW_H = [1500, 2100];                              // the last camp (embers) holds the most cards
const ROWS = [TOP, TOP + ROW_H[0] + GAP];
const SLOT = { card: [60, 90], deck: [640, 90] };        // chapter card left, deck right; a card may also give [x, y]
const DECK = { w: 1100, h: 690 }, TOOL = { w: 560, h: 520 }, LOW = { w: 560, h: 400 };

/* ───────────────────────────── Content ───────────────────────────── */

const op = (mcp, slot, size) => ({ mcp, slot, size });
const app = (file, slot, size, titel) => ({ app: file, slot, size, titel });
const bild = (file, slot, w, titel) => ({ bild: file, slot, w, titel });
const kapitel = (n, titel) => bild(`chapter-${n}.svg`, 'card', 520, titel);
const bubbles = (title, question, ideas, slot, size) => op({ op: 'bubbles', title, question, ideas }, slot, size);

// Eight camps, one per chapter of ROTER-FADEN.md (version 3). The order of the cards is the presentation path.
const CAMPS = [
  { name: 'I · The gathering', cards: [
    kapitel(1, 'I · The gathering'),
    app('decks/gathering.html', 'deck', DECK, 'The gathering'),
    bubbles('One word', 'One word: right now, AI makes me feel …', [], [60, 860], LOW),
  ] },
  { name: 'II · Old fires', cards: [
    kapitel(2, 'II · Old fires'),
    app('decks/old-fires.html', 'deck', DECK, 'Old fires'),
    app('modules/myth-or-fact.html', [60, 860], TOOL, 'Myth or Fact?'),
    bubbles('Rumours', 'Which AI rumour have you heard lately?', [], [680, 860], LOW),
  ] },
  { name: 'III · Words by the fire', cards: [
    kapitel(3, 'III · Words by the fire'),
    app('decks/words.html', 'deck', DECK, 'Words by the fire'),
    app('modules/token-oracle.html', [60, 860], TOOL, 'Token Oracle'),
    app('modules/context-circle.html', [640, 860], TOOL, 'Context Circle'),
    app('modules/inventory.html', [1220, 860], TOOL, 'Words · 30 terms'),
  ] },
  { name: 'IV · Kindling', cards: [
    kapitel(4, 'IV · Kindling'),
    app('decks/kindling.html', 'deck', DECK, 'Kindling'),
    app('modules/prompt-forge.html', [60, 860], TOOL, 'Prompt Forge'),
  ] },
  { name: 'V · Many fires', cards: [
    kapitel(5, 'V · Many fires'),
    app('decks/many-fires.html', 'deck', DECK, 'Many fires'),
    app('modules/git-time-machine.html', [60, 860], TOOL, 'Git Time Machine'),
  ] },
  { name: 'VI · A fire for VAVE', cards: [
    kapitel(6, 'VI · A fire for VAVE'),
    app('decks/vave-fire.html', 'deck', DECK, 'A fire for VAVE'),
    op({ op: 'kanban', title: 'vave.log: proposals, not decisions', columns: ['Now', 'Next', 'Later', 'Built, in test'], items: [
      { text: 'Time tracking, timer, holidays and absences', column: 'Built, in test' },
      { text: 'Capacity plan v1', column: 'Built, in test' },
      { text: 'MCP server: 68 tools for AI assistants', column: 'Built, in test' },
      { text: 'English · Deutsch · 中文', column: 'Built, in test' },
      { text: 'AI time entry live (MCP + consent screen)', column: 'Now' },
      { text: 'Capacity plan v2: rates per service, € per phase', column: 'Now' },
      { text: 'Build-up radar: crews, trucks, hall slots', column: 'Next' },
      { text: 'Fair deadline radar from technical guidelines', column: 'Next' },
      { text: 'Modular inventory: frames, LED tiles, furniture', column: 'Next' },
      { text: 'Site reports from the phone', column: 'Next' },
      { text: 'Client approvals for render variants', column: 'Next' },
      { text: 'Group: cross-company staffing', column: 'Later' },
      { text: 'Multi-currency invoices (with tax advice)', column: 'Later' },
    ] }, [60, 860], { w: 1100, h: 560 }),
  ] },
  { name: 'VII · Smoke', cards: [
    kapitel(7, 'VII · Smoke'),
    app('decks/smoke.html', 'deck', DECK, 'Smoke'),
    app('modules/fireplace-check.html', [60, 860], TOOL, 'Fireplace Check'),
  ] },
  { name: 'VIII · Embers', cards: [
    kapitel(8, 'VIII · Embers'),
    app('decks/embers.html', 'deck', DECK, 'Embers'),
    bubbles('Side quests in space', 'Where should VAVE light the first fire? Three dots each.', LORE.QUESTS.map((q) => q.title), [60, 860], TOOL),
    app('modules/booth-builder.html', [640, 860], DECK, 'Booth Builder'),
    op({ op: 'kanban', title: 'Try on Monday', columns: ['Idea', 'Trying', 'Done'], items: [{ text: 'Rebuild one boring spreadsheet as a single HTML file (dummy data)' }, { text: 'Write a CLAUDE.md / AGENTS.md for one project' }] }, [60, 1620], LOW),
    bubbles('Your questions', 'What do you want to ask the fire?', [], [640, 1620], LOW),
  ] },
];

/* ───────────────────────────── Build ───────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const b64 = (f) => readFileSync(f).toString('base64');
const svgMass = (f) => { const m = readFileSync(f, 'utf8').match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); return m ? { w: +m[1], h: +m[2] } : { w: 16, h: 9 }; };
const fehlt = [];
const datei_ = (rel) => { const f = join(dist, rel); if (!existsSync(f)) fehlt.push(rel); return f; };

await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'campfire-board', version: '3' } });
srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

const NAME = 'Campfire · Playing with Fire';
await tool('pixinotes_board_anlegen', { name: NAME, bereich: 'Talks', projekt: 'VAVE Campfire' });

const lage = new Map();          // node id → { x, y, w?, h?, stil? }
const ketten = [];               // per camp: ids in presentation order
const extra = [];                // non-MCP nodes added afterwards
const dateien = {};

/** All MCP cards of one camp in ONE call; the ids come back in the order of the operations */
async function mcpKarten(karten, ort) {
  const mit = karten.filter((k) => k.mcp);
  if (!mit.length) return;
  const text = await tool('pixinotes_bearbeiten', { board: NAME, ops: mit.map((k) => k.mcp) });
  const neu = [...(text.match(/Neu: (.*)/)?.[1] ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  if (neu.length !== mit.length) throw new Error(`board: ${mit.length} Operationen, aber ${neu.length} neue Karten:\n${text}`);
  mit.forEach((k, i) => { k.id = neu[i]; const p = ort(k); lage.set(k.id, { ...p, w: k.size?.w ?? k.w, h: k.size?.h, stil: k.stil }); });
}

function andereKarten(karten, ort) {
  for (const k of karten.filter((x) => !x.mcp)) {
    k.id = uid();
    if (k.app) {
      const f = datei_(k.app);
      const name = k.app.split('/').pop();
      // The card shows data.name (HtmlAppCard), so the readable title goes there; the file keeps its own name
      extra.push({ id: k.id, type: 'htmlapp', position: ort(k), width: k.size.w, height: k.size.h, autoFit: false, data: { name: k.titel ?? name, size: existsSync(f) ? readFileSync(f).length : 0 } });
      if (existsSync(f)) dateien[k.id] = { name, mime: 'text/html', b64: b64(f) };
    } else if (k.bild) {
      const f = datei_(`art/${k.bild}`);
      const m = existsSync(f) ? svgMass(f) : { w: 16, h: 9 };
      extra.push({ id: k.id, type: 'image', position: ort(k), width: k.w, height: Math.round((k.w * m.h) / m.w), data: { src: existsSync(f) ? `data:image/svg+xml;base64,${b64(f)}` : '', name: k.bild, titel: k.titel } });
    } else if (k.raw) {
      extra.push({ id: k.id, ...k.raw, position: ort(k) });
    }
  }
}

// In PixiNotes an arrow is also a data subscription (lib/moduleFeeds, lib/links): a note next to an app shows the
// app's save state, a timeline next to a kanban turns rows into tickets. The presentation path must avoid those pairs.
const typ = (k) => (k.app ? 'htmlapp' : k.bild ? 'image' : k.raw ? k.raw.type : k.mcp?.op);
const KOPPELT = [['note', 'htmlapp'], ['gantt', 'kanban'], ['kanban', 'kanban']];
const koppelt = (a, b) => KOPPELT.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

const ecke = (i) => ({ x: COLS[i % PER_ROW], y: ROWS[Math.floor(i / PER_ROW)] });
for (const [i, camp] of CAMPS.entries()) {
  const { x: fx, y: fy } = ecke(i);
  const ort = (k) => { const [x, y] = Array.isArray(k.slot) ? k.slot : SLOT[k.slot]; return { x: fx + x, y: fy + y }; };
  await mcpKarten(camp.cards, ort);
  andereKarten(camp.cards, ort);
  ketten.push(camp.cards.map((k) => ({ id: k.id, typ: typ(k) })));   // presentation path = order of the cards above
}
srv.kill();

// The opening card above the camps: liquid type, the one design wow that stays on the board
const TITEL = { w: 1500, h: 380 };
const titel = { id: uid(), type: 'fluessig', position: { x: (BREITE - TITEL.w) / 2, y: 120 }, width: TITEL.w, height: TITEL.h, data: { text: 'PLAYING WITH FIRE', zaeh: 'mittel', farbe: 'schrift', lebendig: true } };

/* ───────────────────────────── Assemble ───────────────────────────── */

const stand = JSON.parse(readFileSync(datei, 'utf8'));
const board = stand.boards.find((b) => b.name === NAME);
for (const n of board.nodes) {
  const l = lage.get(n.id);
  if (!l) continue;
  n.position = { x: l.x, y: l.y };
  if (l.w) n.width = l.w;
  if (l.h) { n.height = l.h; n.autoFit = false; }
  if (l.stil) Object.assign(n, l.stil);
}
const kante = (source, target, kind = 'arrow') => ({ id: `e-${uid()}`, source, target, type: 'labeled', data: { label: '', kind } });
const edges = [];
// An arrow that would couple data is left out; the cards then follow the reading order of the camp, which the
// presentation check confirms
let ausgelassen = 0;
for (const reihe of ketten) for (let i = 1; i < reihe.length; i++) {
  if (koppelt(reihe[i - 1].typ, reihe[i].typ)) { ausgelassen++; continue; }
  edges.push(kante(reihe[i - 1].id, reihe[i].id));
}
// The trail between the camps: fire-coloured dashes, drawn. Drawings never become slides.
const striche = [];
const strich = (a, b) => striche.push({ id: uid(), tool: 'pen', color: '#ff5a36', width: 14, points: [a, b] });
function gestrichelt(punkte, lang = 46, luecke = 34) {
  for (let i = 1; i < punkte.length; i++) {
    const [x0, y0] = punkte[i - 1], [x1, y1] = punkte[i];
    const d = Math.hypot(x1 - x0, y1 - y0); const ux = (x1 - x0) / d, uy = (y1 - y0) / d;
    for (let s = 0; s < d; s += lang + luecke) { const e = Math.min(d, s + lang); strich([x0 + ux * s, y0 + uy * s], [x0 + ux * e, y0 + uy * e]); }
  }
}
const MITTE = SLOT.card[1] + 260;                       // the trail runs at the height of the chapter cards' centre
for (let i = 0; i < CAMPS.length - 1; i++) {
  const a = ecke(i), b = ecke(i + 1);
  if (i % PER_ROW !== PER_ROW - 1) gestrichelt([[a.x + CW + 20, a.y + MITTE], [b.x + 40, b.y + MITTE]]);
  else {
    const yz = a.y + ROW_H[0] + GAP / 2;
    gestrichelt([[a.x + CW / 2, a.y + ROW_H[0] - 40], [a.x + CW / 2, yz], [b.x + 320, yz], [b.x + 320, b.y + 70]]);
  }
}
gestrichelt([[BREITE / 2, 120 + TITEL.h + 30], [BREITE / 2, TOP - GAP / 2], [COLS[0] + 320, TOP - GAP / 2], [COLS[0] + 320, TOP + 70]]);

board.nodes = [titel, ...board.nodes, ...extra];
board.bg = 'gelb';                                       // warm firelight behind the pixel art
board.edges = [...board.edges, ...edges];
board.drawings = striche;

const paket = { app: 'pixinotes-board', version: 2, savedAt: new Date().toISOString(), board, dateien };
const ziel = join(dist, 'campfire.pixiboard.json');
writeFileSync(ziel, JSON.stringify(paket));
rmSync(work, { recursive: true, force: true });
const mb = (Buffer.byteLength(JSON.stringify(paket)) / 1048576).toFixed(1);
console.log(`✔ ${ziel.replace(root + '/', 'campfire/')} · ${board.nodes.length} Karten · ${board.edges.length} Pfeile (${ausgelassen} ausgelassen, sie würden Daten koppeln) · ${striche.length} Striche · ${Object.keys(dateien).length} Dateien · ${mb} MB`);
if (fehlt.length) { console.error(`✘ fehlt in dist/: ${[...new Set(fehlt)].join(', ')}`); process.exit(2); }
