#!/usr/bin/env node
// Campfire board: builds the talk as a PixiNotes board, through PixiNotes' own MCP server.
//
//   node campfire/tools/board.mjs --mcp <pixinotes-mcp.mjs>
//
// The MCP server (https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs, built from hannespix/pixinotes) creates
// every text card: station headers, notes, diagrams, idea bubbles, kanban boards and sheets, plus their arrows.
// Card types the MCP language doesn't speak (embedded tools, images, PDFs, the mascot, liquid type) and the exact
// layout are added afterwards in the same file. Result: dist/campfire.pixiboard.json. Drop it onto PixiNotes and it
// arrives as a NEW board next to yours; the decks, modules and PDFs travel inside the file and run offline.
//
// Presentation order in PixiNotes (lib/kartenFolge.ts): frames in reading order (row by row), inside a frame along
// the arrows. So: one frame per station, the stations in a 3 × 3 grid, arrows only inside a frame.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const dist = join(root, 'dist');
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const mcpPath = arg('--mcp') ?? process.env.PIXINOTES_MCP;
if (!mcpPath || !existsSync(mcpPath)) {
  console.error('board: --mcp <pixinotes-mcp.mjs> fehlt (Download: https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs)');
  process.exit(1);
}
const HUB = 'https://hannespix.github.io/vave-discovery/campfire/';

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

const FW = 2400, FH = 1500, GAP = 160;                 // station frame
const COLS = [0, FW + GAP, 2 * (FW + GAP)];
const TOP = 1150 + GAP;                                // below the overview frame
const ROWS = [TOP, TOP + FH + GAP, TOP + 2 * (FH + GAP)];
const SLOT = {                                         // positions inside a frame
  head: [60, 90], goal: [60, 300], pdf: [60, 880],
  main: [640, 90], side: [1800, 90],
  low1: [640, 860], low2: [1240, 860], low3: [1800, 860], low4: [60, 1300],
};
const MAIN = { w: 1100, h: 690 }, SIDE = { w: 560, h: 520 };

/* ───────────────────────────── Content ───────────────────────────── */

const note = (title, text, color = 'sky', slot = 'goal', w = 520) => ({ mcp: { op: 'note', title, text, color }, slot, w, stil: slot === 'goal' ? { fontSize: 'l' } : undefined });
const app = (file, slot = 'main', size = MAIN, titel) => ({ app: file, slot, size, titel });
const bild = (file, slot, w, titel) => ({ bild: file, slot, w, titel });
const pdf = (file) => ({ pdf: file, slot: 'pdf' });

const STATIONS = [
  {
    nr: '00', name: 'GATHER ROUND', zeit: '0:00–0:05',
    cards: [
      note('Goal', 'Turn the room into a campfire circle before anyone thinks "tech talk".\n\n- Everybody adds **one word** to the bubbles\n- Read three out loud: excited, sceptical, funny\n\n> "No slides that read themselves, no maths. Questions whenever they come up — drop a bubble."'),
      bild('campfire-scene.svg', 'main', 1100, 'Campfire'),
      { mcp: { op: 'bubbles', title: 'Warm-up', question: 'One word: right now, AI makes me feel …', ideas: [] }, slot: 'side', size: SIDE },
      note('Join the board', 'Live → invite link (create it **without account**) → **show the QR code**. Everyone can add bubbles and questions.', 'mint', 'low3', 560),
      note('Bridge', '"Before we talk about fire, let me tell you who\'s holding the matches."', 'white', 'low4', 520),
    ],
  },
  {
    nr: '01', name: "WHO'S BY THE FIRE", zeit: '0:05–0:12',
    cards: [
      note('Goal', 'Credibility through honesty: *if I can do it, you can.*\n\n- Life strip: hippie parents → farm → winery → wine engineer → administration → vibecoder\n- **41 repositories** in a year, the biggest with **323 test files**\n- PixiNotes: v1.0 on day one, **440+ milestones** in four months\n\n> "I\'m not a developer. I\'m a translator between problems and machines."'),
      app('decks/opening.html', 'main', MAIN, 'Deck · Opening'),
      bild('repo-wall.svg', 'side', 560, 'Repo wall'),
      bild('life-strip.svg', 'low1', 1100, 'Life strip'),
      note('Show one (60 s)', '- [pix-el.de](https://pix-el.de) — the brand, the hopping Pix\n- [email-checker](https://hannespix.github.io/email-checker/) — a tiny tool that fixes e-mail typos (dummy data only)', 'mint', 'low3', 560),
      note('Bridge', '"So what *is* this machine I\'m talking to? Let\'s look at the spark."', 'white', 'low4', 520),
      pdf('pdf/opening.pdf'),
    ],
  },
  {
    nr: '02', name: 'THE SPARK', zeit: '0:12–0:25 · Beginner',
    cards: [
      note('Three mental models', '1. **It predicts the next word.** A very well-read autocomplete — it continues, it doesn\'t know.\n2. **It only sees what\'s inside the circle of light.** The context window. Files beat long chats.\n3. **With tools, it can act.** Search, code, GitHub, your whiteboard (MCP) → an *agent*.\n\nFor work, *which plan* matters more than which logo: business terms, no training on your data, clear retention, a signed DPA. The client NDA decides what may go in at all.'),
      app('decks/spark.html', 'main', MAIN, 'Deck · Spark'),
      app('modules/token-oracle.html', 'side', SIDE, 'Token Oracle'),
      app('modules/context-circle.html', 'low1', { w: 560, h: 380 }, 'Context Circle'),
      { mcp: { op: 'mermaid', code: 'flowchart LR\n  A[Chat: it talks] --> B[Tools: search, code, GitHub]\n  B --> C[Agent: plans, acts, checks]\n  C --> D{Human decides}' }, slot: 'low2', size: { w: 520, h: 380 } },
      note('Bridge', '"Enough theory. Let\'s light something."', 'white', 'low4', 520),
      pdf('pdf/spark.pdf'),
    ],
  },
  {
    nr: '03', name: 'KINDLING', zeit: '0:25–0:40 · Beginner',
    cards: [
      note('Your first builds', '- **Vibecoding** (Karpathy, Feb 2025, meant for weekend projects): describe the result, let the AI write the code, judge by looking\n- Beginner rule: **one HTML file** — double-click, works offline\n- The recipe: *Who · Goal · Context · Constraints · Done when · Look & feel*'),
      app('decks/kindling.html', 'main', MAIN, 'Deck · Kindling'),
      app('modules/prompt-forge.html', 'side', SIDE, 'Prompt Forge'),
      note('Live mini-build (5 min)', 'Prompt: *"A single HTML file: a pixel-art campfire that crackles and grows when you click."*\n\nFallback if Wi-Fi fails: the campfire scene in frame 00.', 'pink', 'low1', 560),
      note('Tiny to real', '- [email-checker](https://hannespix.github.io/email-checker/) — tiny, one file\n- The VAVE survey — one file, made for a CEO\'s phone\n- [pixoodle.de](https://pixoodle.de) — a scheduling poll with real users, own domain', 'mint', 'low2', 520),
      note('Bridge', '"The first fire is easy. Keeping it burning is the craft."', 'white', 'low4', 520),
      pdf('pdf/kindling.pdf'),
    ],
  },
  {
    nr: '04', name: 'FEEDING THE FIRE', zeit: '0:40–0:55 · Casual',
    cards: [
      note('The loop', 'The real skill is not prompting, it\'s **iterating with taste** — design work.\n\n- Describe → Build → **Look** → Feedback (screenshots beat words) → Repeat\n- **AI forgets, files remember:** CLAUDE.md, design principles, STATE.md\n- Give it your CD and it follows it\n\nDeck: *Kindling*, second half.'),
      { mcp: { op: 'mermaid', code: 'flowchart LR\n  A[Describe] --> B[Build]\n  B --> C[Look]\n  C --> D[Feedback]\n  D --> A\n  M[(Memory files)] -.-> A' }, slot: 'main', size: { w: 1100, h: 520 } },
      note('Show', '- [VAVE prototype](https://hannespix.github.io/vave-discovery/prototyp/) — ⌘K palette, `t` starts the timer\n- [Liquid type](https://hannespix.github.io/liquidtype/) — type "VAVE", pull, hold to burst\n- From phone to production: **19 PRs merged and live in one day** (29 Sep 2026)', 'mint', 'side', 560),
      note('Memory files', '- `CLAUDE.md` — how we work here\n- `design-principles.md` — the CD as rules\n- `STATE.md` — where we are, what\'s next', 'yellow', 'low1', 560),
      note('Bridge', '"How does a hobby fire become a forge that ships real software?"', 'white', 'low4', 520),
    ],
  },
  {
    nr: '05', name: 'THE FORGE', zeit: '0:55–1:10 · Advanced',
    cards: [
      note('What, how, where', '- **GitHub in six words:** repository, commit, branch, pull request, Actions, Pages\n- **An agent team:** builder, critic, red team, gatekeeper — *agents propose, humans decide*\n- **Trust from checks:** quick robots on every PR, big browser and accessibility suites at night or before a release, a human looks at the live result\n- **Where:** Claude Code (terminal, web, phone), Cursor / VS Code, GitHub, Supabase/Firebase, Pages'),
      app('decks/forge.html', 'main', MAIN, 'Deck · Forge'),
      app('modules/git-time-machine.html', 'side', SIDE, 'Git Time Machine'),
      { mcp: { op: 'sheet', title: 'Scale stories', rows: [['What', 'Number', 'Note'], ['Repositories', '41', 'in about a year'], ['PixiNotes milestones', '440', 'in four months'], ['Largest test suite', '323', 'test files'], ['VAVE discovery', '16', 'PRs live in one day']] }, slot: 'low1', size: { w: 560, h: 260 } },
      note('The reveal', '"This board was built by an AI, through PixiNotes\' own **MCP server**. I described the talk; it laid out the cards."\n\nShow `campfire/tools/board.mjs` for ten seconds.', 'pink', 'low2', 520),
      note('Bridge', '"Every fire makes smoke. Let\'s talk about the smoke signals."', 'white', 'low4', 520),
      pdf('pdf/forge.pdf'),
    ],
  },
  {
    nr: '06', name: 'SMOKE SIGNALS', zeit: '1:10–1:20',
    cards: [
      note('Honest, practical', 'Leave the room with **rules, not worries.**\n\n- A key in a private repository is still a key in a file: let an AI audit your repos for secrets, rotate what it finds\n- The Fireplace Check is a rule of thumb for the studio, **not legal advice** — the client contract and the NDA always win'),
      app('decks/smoke.html', 'main', MAIN, 'Deck · Smoke'),
      app('modules/fireplace-check.html', 'side', SIDE, 'Fireplace Check'),
      { mcp: { op: 'sheet', title: 'Seven smoke signals', rows: [['Smoke', 'What to do'], ['Confidential data', 'Business plan, client NDA decides, anonymise'], ['Secrets', 'Keys in a vault, never in files; rotate'], ['Confident errors', 'Verify, test, ask for sources'], ['Shipped insecurity', 'Row-level security, reviews'], ['Rights', 'Own or license it; check who owns AI output'], ['Orphan tools', 'Every tool has an owner'], ['Lost craft', 'Keep the taste human']] }, slot: 'low1', size: { w: 560, h: 330 } },
      bild('fireplace-rules.svg', 'low2', 520, 'Fireplace rules'),
      note('Bridge', '"So where should VAVE light the first fire?"', 'white', 'low4', 520),
      pdf('pdf/smoke.pdf'),
    ],
  },
  {
    nr: '07', name: 'EMBERS', zeit: '1:20–1:25',
    cards: [
      note('Chances for VAVE', 'Turn the talk into the room\'s ideas — **three dots each.**\n\nThen one small experiment per person on the kanban — with dummy data, no client files.'),
      { mcp: { op: 'bubbles', title: 'First fires', question: 'Where should VAVE light the first fire?', ideas: ['Pitch prototypes clients can click', 'Exhibition interactives in days', 'Internal tools: time, capacity, quotes', 'Research and synthesis across EN / DE / ZH', 'Data stories for clients', 'Generative content inside the brand'] }, slot: 'main', size: { w: 1100, h: 690 } },
      { mcp: { op: 'kanban', title: 'Try on Monday', columns: ['Idea', 'Trying', 'Done'], items: [{ text: 'Rebuild one boring spreadsheet as a single HTML file (dummy data)' }, { text: 'Write a CLAUDE.md for one project' }] }, slot: 'side', size: SIDE },
      { mcp: { op: 'sheet', title: 'Build or buy? Napkin math (example numbers, type your own)', rows: [['Input', 'Value'], ['Seats', '10'], ['Price per seat / month (€)', '25'], ['Buy per year (€)', '=B2*B3*12'], ['Build hours', '80'], ['Hourly rate (€)', '90'], ['Upkeep per year (€)', '2400'], ['Build, first year (€)', '=B5*B6+B7']] }, slot: 'low1', size: { w: 560, h: 330 } },
      note('Bridge', '"Questions? The fire is still burning."', 'white', 'low4', 520),
    ],
  },
  {
    nr: '08', name: 'OPEN FIRE', zeit: '1:25–1:30',
    cards: [
      note('Q&A and goodbye', 'Go through the question bubbles. Answer what you can, park the rest with a name.\n\n> "Fire didn\'t replace cooks. It made cooking possible. Keep your taste, feed the fire, and mind the smoke. Thanks for sitting with me."'),
      app('decks/embers.html', 'main', MAIN, 'Deck · Embers'),
      { mcp: { op: 'bubbles', title: 'Your questions', question: 'What do you want to ask the fire?', ideas: [] }, slot: 'side', size: SIDE },
      { mcp: { op: 'kanban', title: 'Parking lot', columns: ['Asked', 'Answered'], items: [] }, slot: 'low1', size: { w: 560, h: 330 } },
      note('Resources', `- [Talk hub: decks, modules, art](${HUB})\n- [PixiNotes](https://hannespix.github.io/pixinotes/)\n- [Liquid type](https://hannespix.github.io/liquidtype/)`, 'yellow', 'low2', 520),
      bild('pix-wave.svg', 'low3', 320, 'Pix says bye'),
      pdf('pdf/embers.pdf'),
    ],
  },
];

/* ───────────────────────────── Build ───────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const b64 = (f) => readFileSync(f).toString('base64');
const svgMass = (f) => { const m = readFileSync(f, 'utf8').match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); return m ? { w: +m[1], h: +m[2] } : { w: 16, h: 9 }; };
const fehlt = [];
const datei_ = (rel) => { const f = join(dist, rel); if (!existsSync(f)) fehlt.push(rel); return f; };

await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'campfire-board', version: '1' } });
srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

const NAME = 'Campfire · Playing with Fire';
await tool('pixinotes_board_anlegen', { name: NAME, bereich: 'Talks', projekt: 'VAVE Campfire' });

// 1) Every MCP card, station by station — one call per station, ids come back in order
const lage = new Map();          // node id → { x, y, w?, h? }
const ketten = [];               // per frame: ids in presentation order
const extra = [];                // non-MCP nodes added afterwards
const dateien = {};

async function mcpKarten(frameX, frameY, karten) {
  const ops = karten.filter((k) => k.mcp).map((k) => k.mcp);
  if (!ops.length) return;
  const text = await tool('pixinotes_bearbeiten', { board: NAME, ops });
  const neu = [...(text.match(/Neu: (.*)/)?.[1] ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  if (neu.length !== ops.length) throw new Error(`board: ${ops.length} Operationen, aber ${neu.length} neue Karten:\n${text}`);
  karten.filter((k) => k.mcp).forEach((k, i) => { k.id = neu[i]; });
  for (const k of karten.filter((k) => k.mcp)) {
    const [sx, sy] = SLOT[k.slot];
    lage.set(k.id, { x: frameX + sx, y: frameY + sy, w: k.size?.w ?? k.w, h: k.size?.h, stil: k.stil });
  }
}

function andereKarten(frameX, frameY, karten) {
  for (const k of karten.filter((k) => !k.mcp && !k.kopf)) {
    const [sx, sy] = SLOT[k.slot];
    const pos = { x: frameX + sx, y: frameY + sy };
    k.id = uid();
    if (k.app) {
      const f = datei_(k.app);
      const name = k.app.split('/').pop();
      // The card shows data.name (HtmlAppCard), so the readable title goes there; the file keeps its own name
      extra.push({ id: k.id, type: 'htmlapp', position: pos, width: k.size.w, height: k.size.h, autoFit: false, data: { name: k.titel ?? name, size: existsSync(f) ? readFileSync(f).length : 0 } });
      if (existsSync(f)) dateien[k.id] = { name, mime: 'text/html', b64: b64(f) };
    } else if (k.bild) {
      const f = datei_(`art/${k.bild}`);
      const m = existsSync(f) ? svgMass(f) : { w: 16, h: 9 };
      extra.push({ id: k.id, type: 'image', position: pos, width: k.w, height: Math.round((k.w * m.h) / m.w), data: { src: existsSync(f) ? `data:image/svg+xml;base64,${b64(f)}` : '', name: k.bild, titel: k.titel } });
    } else if (k.pdf) {
      const f = datei_(k.pdf);
      const name = k.pdf.split('/').pop();
      // Handouts live together in their own frame below the stations — unconnected, so they don't add slides
      const hp = { x: HANDOUTS.x + 60 + handouts.length * 300, y: HANDOUTS.y + 110 };
      handouts.push(k.id);
      extra.push({ id: k.id, type: 'file', position: hp, width: 240, data: { name, mime: 'application/pdf', size: existsSync(f) ? readFileSync(f).length : 0, titel: `Handout · ${name.replace('.pdf', '')}` } });
      if (existsSync(f)) dateien[k.id] = { name, mime: 'application/pdf', b64: b64(f) };
    }
  }
}

const frames = [];
const HANDOUTS = { x: 0, y: ROWS[2] + FH + GAP, w: FW, h: 520 };
const handouts = [];
for (const [i, st] of STATIONS.entries()) {
  const fx = COLS[i % 3], fy = ROWS[Math.floor(i / 3)];
  // One header shape with the start time — a separate clock shape was an extra slide in presentation mode
  const kopf = { mcp: { op: 'shape', shape: 'terminator', text: `${st.nr} · ${st.name} · ${st.zeit.split('–')[0]}` }, slot: 'head', size: { w: 520, h: 130 }, kopf: true, stil: { fontSize: 'xl', font: 'mono' } };
  const karten = [kopf, ...st.cards];
  await mcpKarten(fx, fy, karten);
  andereKarten(fx, fy, karten);
  frames.push({ id: uid(), type: 'frame', position: { x: fx, y: fy }, width: FW, height: FH, dragHandle: '.frame-head', data: { name: `${st.nr} · ${st.name} · ${st.zeit}` } });
  // Presentation path: header → goal → main → side → lower row → bridge; PDFs hang off the deck with a plain line
  const reihe = karten.filter((k) => !k.pdf);
  const order = ['head', 'goal', 'main', 'side', 'low1', 'low2', 'low3', 'low4'];
  reihe.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));
  ketten.push({ reihe: reihe.map((k) => k.id) });
}

// 2) Overview frame on top: title, scene, trail map, agenda — built the same way
const UEB = { w: 3 * FW + 2 * GAP, h: 1150 };
const agenda = { mcp: { op: 'mermaid', code: `flowchart LR\n${STATIONS.map((s, i) => `  S${i}["${s.nr} ${s.name.replace(/'/g, '’')}<br/>${s.zeit.split(' ')[0]}"]`).join('\n')}\n  ${STATIONS.map((_, i) => `S${i}`).join(' --> ')}` }, slot: 'x', size: { w: 2200, h: 420 } };
const howto = { mcp: { op: 'note', title: 'How to use this board', text: `- **Present:** presentation mode follows the frames row by row, inside a frame the arrows\n- **Tools run offline** inside the cards — decks, modules and PDFs travel in the board file\n- **Join:** Live → invite link → QR. Questions go into the bubbles of frame 08\n- Storyline and all files: [talk hub](${HUB})`, color: 'yellow' }, slot: 'x', w: 640 };
{
  const ops = [agenda.mcp, howto.mcp];
  const text = await tool('pixinotes_bearbeiten', { board: NAME, ops });
  const neu = [...(text.match(/Neu: (.*)/)?.[1] ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  if (neu.length !== 2) throw new Error(`board: Übersicht – 2 Operationen, aber ${neu.length} neue Karten:\n${text}`);
  [agenda.id, howto.id] = neu;
  lage.set(agenda.id, { x: 3640, y: 90, w: 1960, h: 420 });
  lage.set(howto.id, { x: 60, y: 560, w: 640 });
}
const titel = { id: uid(), type: 'fluessig', position: { x: 60, y: 90 }, width: 1500, height: 380, data: { text: 'PLAYING WITH FIRE', zaeh: 'mittel', farbe: 'akzent', lebendig: true } };
const szene = { bild: 'campfire-scene.svg', w: 1600 }; const karte = { bild: 'trail-map.svg', w: 1600 };
const uebersicht = [];
for (const [k, pos] of [[szene, { x: 5700, y: 90 }], [karte, { x: 1700, y: 90 }]]) {
  const f = datei_(`art/${k.bild}`);
  const m = existsSync(f) ? svgMass(f) : { w: 16, h: 9 };
  k.id = uid();
  const w = k === karte ? 1800 : 1700;
  uebersicht.push({ id: k.id, type: 'image', position: pos, width: w, height: Math.round((w * m.h) / m.w), data: { src: existsSync(f) ? `data:image/svg+xml;base64,${b64(f)}` : '', name: k.bild, titel: k === karte ? 'Trail map' : 'Campfire' } });
}
const pix = { id: uid(), type: 'pixi', position: { x: 4300, y: 680 }, width: 192, height: 192, autoFit: false, data: { name: 'Pix', farbe: '#e3efa8' } };
const pix00 = { id: uid(), type: 'pixi', position: { x: COLS[0] + 1300, y: ROWS[0] + 760 }, width: 192, height: 192, autoFit: false, data: { name: '', farbe: '#e3efa8' } };

srv.kill();

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
for (const k of ketten) {
  for (let i = 1; i < k.reihe.length; i++) edges.push(kante(k.reihe[i - 1], k.reihe[i]));
}
edges.push(kante(titel.id, szene.id), kante(szene.id, karte.id), kante(karte.id, agenda.id), kante(agenda.id, howto.id));
const ueberFrame = { id: uid(), type: 'frame', position: { x: 0, y: 0 }, width: UEB.w, height: UEB.h, dragHandle: '.frame-head', data: { name: 'CAMPFIRE · PLAYING WITH FIRE · VAVE · 90 MIN' } };

// The trail between the stations: fire-coloured dashes, drawn — drawings don't change the presentation order
const striche = [];
const strich = (a, b) => striche.push({ id: uid(), tool: 'pen', color: '#ff5a36', width: 14, points: [a, b] });
function gestrichelt(punkte, lang = 46, luecke = 34) {
  for (let i = 1; i < punkte.length; i++) {
    const [x0, y0] = punkte[i - 1], [x1, y1] = punkte[i];
    const d = Math.hypot(x1 - x0, y1 - y0); const ux = (x1 - x0) / d, uy = (y1 - y0) / d;
    for (let s = 0; s < d; s += lang + luecke) { const e = Math.min(d, s + lang); strich([x0 + ux * s, y0 + uy * s], [x0 + ux * e, y0 + uy * e]); }
  }
}
const mitte = (i) => ({ x: COLS[i % 3], y: ROWS[Math.floor(i / 3)] });
for (let i = 0; i < STATIONS.length - 1; i++) {
  const a = mitte(i), b = mitte(i + 1);
  if (i % 3 !== 2) gestrichelt([[a.x + FW + 10, a.y + FH / 2], [b.x - 10, b.y + FH / 2]]);
  else { const yz = a.y + FH + GAP / 2; gestrichelt([[a.x + FW / 2, a.y + FH + 10], [a.x + FW / 2, yz], [b.x + FW / 2, yz], [b.x + FW / 2, b.y - 10]]); }
}
gestrichelt([[UEB.w / 2, UEB.h + 10], [UEB.w / 2, UEB.h + GAP / 2], [COLS[0] + FW / 2, UEB.h + GAP / 2], [COLS[0] + FW / 2, ROWS[0] - 10]]);

const handoutFrame = { id: uid(), type: 'frame', position: { x: HANDOUTS.x, y: HANDOUTS.y }, width: HANDOUTS.w, height: HANDOUTS.h, dragHandle: '.frame-head', data: { name: 'HANDOUTS · PDF of every deck' } };
board.nodes = [ueberFrame, ...frames, handoutFrame, titel, ...uebersicht, pix, pix00, ...board.nodes, ...extra];
board.edges = [...board.edges, ...edges];
board.drawings = striche;

const paket = { app: 'pixinotes-board', version: 2, savedAt: new Date().toISOString(), board, dateien };
const ziel = join(dist, 'campfire.pixiboard.json');
writeFileSync(ziel, JSON.stringify(paket));
rmSync(work, { recursive: true, force: true });
const mb = (Buffer.byteLength(JSON.stringify(paket)) / 1048576).toFixed(1);
console.log(`✔ ${ziel.replace(root + '/', 'campfire/')} · ${board.nodes.length} Karten · ${board.edges.length} Pfeile · ${striche.length} Striche · ${Object.keys(dateien).length} Dateien · ${mb} MB`);
if (fehlt.length) { console.error(`✘ fehlt in dist/: ${[...new Set(fehlt)].join(', ')}`); process.exit(2); }
