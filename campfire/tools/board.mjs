#!/usr/bin/env node
// Campfire board (version 2, the quest): builds the talk as a PixiNotes board, through PixiNotes' own MCP server.
//
//   node campfire/tools/board.mjs --mcp <pixinotes-mcp.mjs>
//
// The MCP server (https://hannespix.github.io/pixinotes/pixinotes-mcp.mjs, built from hannespix/pixinotes) creates
// every native card: level headers, notes, Mermaid diagrams, Gantt timelines, idea bubbles, kanban boards, sheets,
// a week planner, a timer and a contact card. Card types the MCP language doesn't speak (embedded tools, images,
// PDFs, the mascot, liquid type) and the exact layout are added afterwards in the same file.
// Content that also appears in decks and modules comes from shared/lore.js, so a fact lives in one place.
// Result: dist/campfire.pixiboard.json. Drop it onto PixiNotes and it arrives as a NEW board next to yours; decks,
// modules and PDFs travel inside the file and run offline.
//
// Presentation order in PixiNotes (lib/kartenFolge.ts): frames in reading order (row by row), inside a frame along
// the arrows. So: one frame per level, two rows of five, arrows only inside a frame.
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
const HUB = 'https://hannespix.github.io/vave-discovery/campfire/';
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

const FW = 2400, FH = 1500, GAP = 160, PER_ROW = 5;    // level frame, five per row
const COLS = Array.from({ length: PER_ROW }, (_, i) => i * (FW + GAP));
const UEB = { w: PER_ROW * FW + (PER_ROW - 1) * GAP, h: 1150 };   // overview frame on top
const TOP = UEB.h + GAP;
const ROWS = [TOP, TOP + FH + GAP];
const SLOT = {                                         // positions inside a frame
  goal: [60, 90],
  main: [640, 90], side: [1800, 90],
  low1: [640, 860], low2: [1240, 860], low3: [1800, 860], save: [60, 1300],
};
const MAIN = { w: 1100, h: 690 }, SIDE = { w: 560, h: 520 }, LOW = { w: 560, h: 400 };

/* ───────────────────────────── Content ───────────────────────────── */

const note = (title, text, color = 'sky', slot = 'goal', w = 520) => ({ mcp: { op: 'note', title, text, color }, slot, w, stil: slot === 'goal' ? { fontSize: 'l' } : undefined });
const save = (text) => note('Save point', `**SAVING GAME …** ${text}`, 'white', 'save', 520);
const op = (mcp, slot, size) => ({ mcp, slot, size });
const app = (file, slot, size, titel) => ({ app: file, slot, size, titel });
const bild = (file, slot, w, titel) => ({ bild: file, slot, w, titel });
const pdf = (file) => ({ pdf: file });
const bullets = (xs) => xs.map((x) => `- ${x}`).join('\n');
// PixiNotes reads "1950" as the number 1.950; a zero-width space in front keeps a year as text
const txt = (s) => `\u200B${s}`;

const LEVELS = [
  {
    nr: '0', name: 'PRESS START', zeit: '0:00',
    cards: [
      note('How to play', 'Ten levels, ninety minutes.\n\n- **Questions are side quests:** drop them as bubbles any time\n- **Campfires are save points:** every level ends with one sentence\n- **Every term is an item, every risk is a boss**\n\n> "Nobody dies, but some bosses hit hard."'),
      bild('title-screen.svg', 'main', 1100, 'Title screen'),
      op({ op: 'bubbles', title: 'Warm-up', question: 'One word: right now, AI makes me feel …', ideas: [] }, 'side', SIDE),
      note('Join the quest', 'Live → invite link (**without account**) → show the QR code. Everyone can add bubbles and vote with dots.', 'mint', 'low3', 560),
      save('The room is a campfire now.'),
    ],
  },
  {
    nr: '1', name: 'CHARACTER SELECT', zeit: '0:05',
    cards: [
      note('Character sheet', '- **Class:** Translator (problem → machine)\n- **Origin:** farm kid · winery · wine engineer · public administration\n- **Special skill:** asks "why?" until the problem gives up\n- **Weakness:** never studied computer science\n- **Inventory:** 41 repositories\n\n> "I\'m not a developer. I\'m a translator between problems and machines."'),
      app('decks/press-start.html', 'main', MAIN, 'Deck · Press start'),
      bild('repo-wall.svg', 'side', 560, 'Repo wall'),
      bild('life-strip.svg', 'low1', 1100, 'Life strip'),
      note('Show one (60 s)', '- [pix-el.de](https://pix-el.de): the brand, the hopping Pix\n- [email-checker](https://hannespix.github.io/email-checker/): a tiny tool (dummy data only)', 'mint', 'low3', 560),
      save('If he can, you can.'),
      pdf('pdf/press-start.pdf'),
    ],
  },
  {
    nr: '2', name: 'THE LORE', zeit: '0:11',
    cards: [
      note('AI history and rumours', 'Hype is old, mistakes are funny, and some myths are true.\n\n- 1956: they planned to crack AI in one summer\n- Two AI winters after big promises\n- 2017: the Transformer, the T in GPT\n- 2024: glue on pizza\n\n**Lesson:** every hype had a winter. Treat "AGI next year" as a rumour until you see it work.'),
      app('decks/lore.html', 'main', MAIN, 'Deck · The lore'),
      app('modules/myth-or-fact.html', 'side', SIDE, 'Myth or Fact?'),
      // 76 years do not fit a day-based timeline; a table reads well on the board and on the slide
      op({ op: 'sheet', title: 'AI history, 1950–2026', rows: [['Year', 'What happened'], ...LORE.HISTORY.map((h) => [txt(h.year), h.title])] }, 'low1', { w: 1100, h: 600 }),
      op({ op: 'bubbles', title: 'Rumour mill', question: 'Which AI rumour have you heard lately?', ideas: [] }, 'low3', LOW),
      save('Hype is old. Glue on pizza is new.'),
      pdf('pdf/lore.pdf'),
    ],
  },
  {
    nr: '3', name: 'THE INVENTORY', zeit: '0:23',
    cards: [
      note('Ten must-have items', bullets(['llm', 'token', 'context', 'temperature', 'hallucination', 'rag', 'embedding', 'agent', 'mcp', 'openweight']
        .map((id) => LORE.ITEMS.find((i) => i.id === id)).map((i) => `**${i.name}:** ${i.fun.split('. ')[0].replace(/\.$/, '')}.`))),
      app('modules/inventory.html', 'main', MAIN, 'Inventory · 30 items'),
      app('decks/inventory.html', 'side', SIDE, 'Deck · Inventory'),
      app('modules/token-oracle.html', 'low1', LOW, 'Token Oracle'),
      app('modules/context-circle.html', 'low2', LOW, 'Context Circle'),
      note('The plan matters more than the logo', '- Business terms, no training on your data\n- Clear retention, a signed data processing agreement\n- The client\'s NDA decides what may go in at all', 'yellow', 'low3', 560),
      save('Inventory full. You now speak AI.'),
      pdf('pdf/inventory.pdf'),
    ],
  },
  {
    nr: '4', name: 'KINDLING', zeit: '0:35 · Beginner',
    cards: [
      note('Your first builds', '- **Vibecoding** (Karpathy, Feb 2025, meant for weekend projects): describe, let it build, judge by looking\n- **Beginner rule:** one HTML file, double-click, offline\n- **Recipe:** Who · Goal · Context · Constraints · Done when · Look & feel'),
      app('decks/kindling.html', 'main', MAIN, 'Deck · Kindling'),
      app('modules/prompt-forge.html', 'side', SIDE, 'Prompt Forge'),
      note('Live mini-build (5 min)', 'Prompt: *"A single HTML file: a top view of a 6 × 4 m booth where I can drag a counter, a lounge and an LED wall, and it shows the walking paths."*\n\nFallback: the Booth Builder in level 9.', 'pink', 'low1', 560),
      note('Tiny to real', '- [email-checker](https://hannespix.github.io/email-checker/): tiny\n- The VAVE survey: one file, made for a CEO\'s phone\n- [pixoodle.de](https://pixoodle.de): real users, own domain', 'mint', 'low2', 520),
      save('A small fire is still a fire.'),
      pdf('pdf/kindling.pdf'),
    ],
  },
  {
    nr: '5', name: 'CRAFTING', zeit: '0:45 · Casual',
    cards: [
      note('The loop', 'The real skill is not prompting, it\'s **iterating with taste**: design work.\n\n- Screenshots beat words\n- **AI forgets, files remember**\n- Give it your CD, it follows it\n\nDeck: *Kindling*, second half.'),
      op({ op: 'mermaid', code: 'flowchart LR\n  A[Describe] --> B[Build]\n  B --> C[Look]\n  C --> D[Feedback]\n  D --> A\n  M[(Memory files:<br/>CLAUDE.md · AGENTS.md<br/>design principles · STATE.md)] -.-> A' }, 'main', { w: 1100, h: 520 }),
      note('Show', '- A clickable prototype in VAVE\'s brand: violet and lime, Readex Pro\n- [Liquid type](https://hannespix.github.io/liquidtype/): type "VAVE", pull, hold to burst. Now picture it on an LED wall that reacts to visitors\n- From phone to production: **19 pull requests merged and live in one session** on the discovery project', 'mint', 'side', 560),
      note('Memory files', '- `CLAUDE.md` / `AGENTS.md`: how we work here (every coding AI reads them)\n- `design-principles.md`: the CD as rules\n- `STATE.md`: where we are, what\'s next', 'yellow', 'low1', 560),
      save('Taste is the real skill.'),
    ],
  },
  {
    nr: '6', name: 'THE GUILD HALL', zeit: '0:55 · Advanced',
    cards: [
      note('GitHub, accounts, many AIs, many repos', '- **One human, one account, many guilds:** you join the VAVE organization; people come and go, the repos stay\n- **Teams and roles:** read · triage · write · maintain · admin\n- **Outside collaborators:** one repo, not the whole house\n- **Bots and AI agents:** own limited keys, work through pull requests\n- **Gates:** main only via pull request + green checks + review; CODEOWNERS for the brand files'),
      app('decks/guild.html', 'main', MAIN, 'Deck · Guild hall'),
      app('modules/git-time-machine.html', 'side', SIDE, 'Git Time Machine'),
      bild('guild-hall.svg', 'low1', 560, 'Guild hall'),
      op({ op: 'mermaid', code: 'flowchart LR\n  PE[pix-el] -- Pix · palette · bubbles --> PN[PixiNotes]\n  LT[liquidtype] -- liquid type --> PN\n  LT -- liquid hero --> PE\n  VS[Vibe Studio] -- slide editor --> PN\n  PE -- live ideas --> VS\n  PL[pixletics] -- flame --> CF[This talk]\n  PE -- palette · font · Pix --> CF\n  PN -- MCP board --> CF\n  VD[discovery] -- survey · prototype --> VL[vave.log]' }, 'low2', { w: 560, h: 400 }),
      note('Many AIs, one workflow', 'Claude Code, Codex, Copilot, Cursor and Jules all propose changes as **pull requests**. Same review, same checks; any AI can take the next shift. That\'s how you beat the lock-in dragon.\n\n**House rules for remixing:** one job per repo · note the origin · same routine everywhere · check the licence.', 'pink', 'low3', 560),
      save('Guilds beat lone heroes.'),
      pdf('pdf/guild.pdf'),
    ],
  },
  {
    nr: '7', name: 'QUEST LOG: VAVE.LOG', zeit: '1:07',
    cards: [
      note('A tool built for VAVE', 'It started with a discovery survey and a clickable prototype. Then vave.log was built on assumptions and public research, on purpose: a **phase-one draft to test with real people**, not in daily use yet.\n\n**105 commits · PRs up to #91 · 68 MCP tools · ~70 test files · EN / DE / ZH**\n\n> "The best feature came from watching one real user for an hour."'),
      app('decks/questlog.html', 'main', MAIN, 'Deck · Quest log'),
      // a timeline card always scrolls to today and would hide October, so the making-of is a table
      op({ op: 'sheet', title: 'Making of vave.log', rows: [['When', 'What happened'],
        ['Start', 'Discovery survey + clickable prototype'],
        ['Day 1', 'Empty repo → app, login, database, MCP'],
        ['Day 2', 'About 30 pull requests'],
        ['Day 3', 'Invoices, quotes → projects, help, WCAG checks'],
        ['Week 2', '8 milestones: leave, capacity, "where is it burning?"'],
        ['Week 2', 'Rights per account'],
        ['Week 5', 'Deck + audit (about 60 findings)'],
        ['Week 6', 'Capacity plan after watching a real user'],
        ['Week 6', 'Group of companies, CN / AE / SG holidays'],
        ['Week 6', 'Polish rounds #87–#91'],
      ] }, 'side', { w: 560, h: 560 }),
      op({ op: 'mermaid', code: 'flowchart LR\n  U[People in the studio] --> A[vave.log app]\n  A <--> D[(Database + login<br/>row-level security)]\n  AI[AI assistant] -- MCP · 68 tools --> S[MCP server]\n  S <--> D\n  G[GitHub: checks · tests · deploy] --> A' }, 'low3', LOW),
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
      ] }, 'low1', { w: 1100, h: 400 }),
      save('Quest log updated. Next quest: your feedback.'),
      pdf('pdf/questlog.pdf'),
    ],
  },
  {
    nr: '8', name: 'BOSS FIGHT', zeit: '1:17',
    cards: [
      note('Seven bosses', bullets(LORE.BOSSES.map((b) => `**${b.name}:** ${b.hp}`)) + '\n\nEvery boss has a weakness, see the sheet.'),
      app('decks/bossfight.html', 'main', MAIN, 'Deck · Boss fight'),
      app('modules/fireplace-check.html', 'side', SIDE, 'Fireplace Check'),
      bild('bosses.svg', 'low1', 560, 'The bosses'),
      op({ op: 'sheet', title: 'Bosses and their weaknesses', rows: [['Boss', 'Weakness'], ...LORE.BOSSES.map((b) => [b.name, b.weakness])] }, 'low2', { w: 560, h: 400 }),
      bild('fireplace-rules.svg', 'low3', 520, 'Fireplace rules'),
      save('Bosses beaten. Rules kept.'),
      pdf('pdf/bossfight.pdf'),
    ],
  },
  {
    nr: '9', name: 'NEW GAME+', zeit: '1:25',
    cards: [
      note('Side quests for VAVE', 'Where should VAVE light the first fire? **Three dots each.**\n\nThen one experiment per person on the kanban, with dummy data.\n\n> "Keep your taste, feed the fire, mind the smoke, and save your game."'),
      app('modules/booth-builder.html', 'main', MAIN, 'Booth Builder'),
      op({ op: 'bubbles', title: 'Side quests in space', question: 'Where should VAVE light the first fire?', ideas: LORE.QUESTS.map((q) => q.title) }, 'side', SIDE),
      op({ op: 'kanban', title: 'Try on Monday', columns: ['Idea', 'Trying', 'Done'], items: [{ text: 'Rebuild one boring spreadsheet as a single HTML file (dummy data)' }, { text: 'Write a CLAUDE.md / AGENTS.md for one project' }] }, 'low1', LOW),
      app('decks/newgame.html', 'low2', LOW, 'Deck · New game+'),
      op({ op: 'bubbles', title: 'Your questions', question: 'What do you want to ask the fire?', ideas: [] }, 'low3', LOW),
      save('Thanks for playing.'),
      pdf('pdf/newgame.pdf'),
    ],
  },
];

/* ───────────────────────────── Build ───────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const b64 = (f) => readFileSync(f).toString('base64');
const svgMass = (f) => { const m = readFileSync(f, 'utf8').match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); return m ? { w: +m[1], h: +m[2] } : { w: 16, h: 9 }; };
const fehlt = [];
const datei_ = (rel) => { const f = join(dist, rel); if (!existsSync(f)) fehlt.push(rel); return f; };

await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'campfire-board', version: '2' } });
srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

const NAME = 'Campfire · Playing with Fire';
await tool('pixinotes_board_anlegen', { name: NAME, bereich: 'Talks', projekt: 'VAVE Campfire' });

const lage = new Map();          // node id → { x, y, w?, h?, stil? }
const ketten = [];               // per frame: ids in presentation order
const extra = [];                // non-MCP nodes added afterwards
const dateien = {};
const handouts = [];
const HANDOUTS = { x: 0, y: ROWS[1] + FH + GAP, w: 2 * FW + GAP, h: 520 };

/** All MCP cards of one frame in ONE call; the ids come back in the order of the operations */
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
    } else if (k.pdf) {
      // Handouts live together in their own frame below the levels — unconnected, so they don't add slides
      const f = datei_(k.pdf);
      const name = k.pdf.split('/').pop();
      extra.push({ id: k.id, type: 'file', position: { x: HANDOUTS.x + 60 + handouts.length * 300, y: HANDOUTS.y + 110 }, width: 240, data: { name, mime: 'application/pdf', size: existsSync(f) ? readFileSync(f).length : 0, titel: `Handout · ${name.replace('.pdf', '')}` } });
      handouts.push(k.id);
      if (existsSync(f)) dateien[k.id] = { name, mime: 'application/pdf', b64: b64(f) };
    } else if (k.raw) {
      extra.push({ id: k.id, ...k.raw, position: ort(k) });
    }
  }
}

// In PixiNotes an arrow is also a data subscription (lib/moduleFeeds, lib/links): a note next to an app shows the
// app's save state, a timeline next to a kanban turns rows into tickets. The presentation path must avoid those pairs.
const typ = (k) => (k.app ? 'htmlapp' : k.bild ? 'image' : k.pdf ? 'file' : k.raw ? k.raw.type : k.mcp?.op);
const KOPPELT = [['note', 'htmlapp'], ['gantt', 'kanban'], ['kanban', 'kanban']];
const koppelt = (a, b) => KOPPELT.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

const frames = [];
for (const [i, lv] of LEVELS.entries()) {
  const fx = COLS[i % PER_ROW], fy = ROWS[Math.floor(i / PER_ROW)];
  // no extra title card: the frame itself becomes the level's title slide in presentation mode
  const karten = [...lv.cards];
  const ort = (k) => ({ x: fx + SLOT[k.slot][0], y: fy + SLOT[k.slot][1] });
  await mcpKarten(karten, ort);
  andereKarten(karten, ort);
  frames.push({ id: uid(), type: 'frame', position: { x: fx, y: fy }, width: FW, height: FH, dragHandle: '.frame-head', data: { name: `LEVEL ${lv.nr} · ${lv.name} · ${lv.zeit}` } });
  ketten.push(karten.filter((k) => !k.pdf).map((k) => ({ id: k.id, typ: typ(k) })));   // presentation path = order of the cards above
}

// Overview on top: liquid title, world map, agenda, how to play, the booth world, a contact card
// Agenda in two rows of five (subgraph → subgraph link, so each row keeps its left-to-right direction)
const agendaKnoten = (i) => `L${i}["${LEVELS[i].nr} ${LEVELS[i].name.replace(/'/g, '’').replace(/:/g, '')}<br/>${LEVELS[i].zeit.split(' ')[0]}"]`;
const agendaReihe = (name, von) => `  subgraph ${name}[" "]\n    direction LR\n    ${[0, 1, 2, 3, 4].map((j) => agendaKnoten(von + j)).join(' --> ')}\n  end`;
const agenda = { mcp: { op: 'mermaid', code: `flowchart TB\n${agendaReihe('R1', 0)}\n${agendaReihe('R2', 5)}\n  R1 --> R2` }, size: { w: 1500, h: 560 } };
const howto = { mcp: { op: 'note', title: 'How to use this board', text: `- **Present:** presentation mode walks the levels row by row, inside a level the arrows\n- **Everything runs offline** inside the cards: decks, modules and PDFs travel in the board file\n- **Join:** Live → invite link (without account) → QR. Side quests go into the bubbles\n- All files: [talk hub](${HUB})`, color: 'yellow' }, w: 640 };
const kontakt = { mcp: { op: 'kontakt', name: 'Hannes', funktion: 'Translator between problems and machines', firma: 'pix·el', web: 'https://pix-el.de', notiz: 'Campfire talk for VAVE · Playing with Fire' } };
{
  const ops = [agenda, howto, kontakt];
  const text = await tool('pixinotes_bearbeiten', { board: NAME, ops: ops.map((k) => k.mcp) });
  const neu = [...(text.match(/Neu: (.*)/)?.[1] ?? '').matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  if (neu.length !== ops.length) throw new Error(`board: Übersicht – ${ops.length} Operationen, aber ${neu.length} neue Karten:\n${text}`);
  [agenda.id, howto.id, kontakt.id] = neu;
  lage.set(agenda.id, { x: 4000, y: 90, w: 2300, h: 560 });
  lage.set(howto.id, { x: 60, y: 560, w: 640 });
  lage.set(kontakt.id, { x: 760, y: 560, w: 420 });
}
srv.kill();

const titel = { id: uid(), type: 'fluessig', position: { x: 60, y: 90 }, width: 1500, height: 380, data: { text: 'PLAYING WITH FIRE', zaeh: 'mittel', farbe: 'akzent', lebendig: true } };
const uebersicht = [];
const ueberBild = (datei, x, y, w, t) => {
  const f = datei_(`art/${datei}`); const m = existsSync(f) ? svgMass(f) : { w: 16, h: 9 };
  const n = { id: uid(), type: 'image', position: { x, y }, width: w, height: Math.round((w * m.h) / m.w), data: { src: existsSync(f) ? `data:image/svg+xml;base64,${b64(f)}` : '', name: datei, titel: t } };
  uebersicht.push(n); return n;
};
const weltkarte = ueberBild('world-map.svg', 1700, 90, 1800, 'World map');
const messe = ueberBild('booth-scene.svg', 6500, 90, 1700, 'The booth world');
const items = ueberBild('items-sheet.svg', 8400, 90, 1700, 'All 30 items');
const pix = { id: uid(), type: 'pixi', position: { x: 10300, y: 760 }, width: 192, height: 192, autoFit: false, data: { name: 'Pix', farbe: '#e3efa8' } };
const pix0 = { id: uid(), type: 'pixi', position: { x: COLS[0] + 1300, y: ROWS[0] + 760 }, width: 192, height: 192, autoFit: false, data: { name: '', farbe: '#e3efa8' } };

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
// An arrow that would couple data is left out; the cards then follow the reading order of the frame (goal note top left,
// save point bottom left), which the presentation check confirms
let ausgelassen = 0;
for (const reihe of ketten) for (let i = 1; i < reihe.length; i++) {
  if (koppelt(reihe[i - 1].typ, reihe[i].typ)) { ausgelassen++; continue; }
  edges.push(kante(reihe[i - 1].id, reihe[i].id));
}
edges.push(kante(titel.id, weltkarte.id), kante(weltkarte.id, agenda.id), kante(agenda.id, messe.id), kante(messe.id, items.id), kante(items.id, howto.id), kante(howto.id, kontakt.id));
const ueberFrame = { id: uid(), type: 'frame', position: { x: 0, y: 0 }, width: UEB.w, height: UEB.h, dragHandle: '.frame-head', data: { name: 'PLAYING WITH FIRE · A CAMPFIRE QUEST THROUGH AI · VAVE · 90 MIN' } };
const handoutFrame = { id: uid(), type: 'frame', position: { x: HANDOUTS.x, y: HANDOUTS.y }, width: HANDOUTS.w, height: HANDOUTS.h, dragHandle: '.frame-head', data: { name: 'HANDOUTS · PDF of every deck' } };

// The trail between the levels: fire-coloured dashes, drawn — drawings don't change the presentation order
const striche = [];
const strich = (a, b) => striche.push({ id: uid(), tool: 'pen', color: '#ff5a36', width: 14, points: [a, b] });
function gestrichelt(punkte, lang = 46, luecke = 34) {
  for (let i = 1; i < punkte.length; i++) {
    const [x0, y0] = punkte[i - 1], [x1, y1] = punkte[i];
    const d = Math.hypot(x1 - x0, y1 - y0); const ux = (x1 - x0) / d, uy = (y1 - y0) / d;
    for (let s = 0; s < d; s += lang + luecke) { const e = Math.min(d, s + lang); strich([x0 + ux * s, y0 + uy * s], [x0 + ux * e, y0 + uy * e]); }
  }
}
const ecke = (i) => ({ x: COLS[i % PER_ROW], y: ROWS[Math.floor(i / PER_ROW)] });
for (let i = 0; i < LEVELS.length - 1; i++) {
  const a = ecke(i), b = ecke(i + 1);
  if (i % PER_ROW !== PER_ROW - 1) gestrichelt([[a.x + FW + 10, a.y + FH / 2], [b.x - 10, b.y + FH / 2]]);
  else { const yz = a.y + FH + GAP / 2; gestrichelt([[a.x + FW / 2, a.y + FH + 10], [a.x + FW / 2, yz], [b.x + FW / 2, yz], [b.x + FW / 2, b.y - 10]]); }
}
gestrichelt([[UEB.w / 2, UEB.h + 10], [UEB.w / 2, UEB.h + GAP / 2], [COLS[0] + FW / 2, UEB.h + GAP / 2], [COLS[0] + FW / 2, ROWS[0] - 10]]);

// Timelines show history, not work: every row is done, so nothing lands in the task list as overdue
for (const n of board.nodes) if (n.type === 'gantt') n.data.rows = n.data.rows.map((r) => ({ ...r, progress: 100 }));
// Narrow first column (year, date, boss name); the second column takes the rest of the card
const SPALTE_A = { 'AI history, 1950–2026': 110, 'Making of vave.log': 110, 'Bosses and their weaknesses': 190 };
for (const n of board.nodes) if (n.type === 'sheet' && SPALTE_A[n.data.title]) n.data.colW = { ...(n.data.colW ?? {}), A: SPALTE_A[n.data.title] };
board.nodes = [ueberFrame, ...frames, handoutFrame, titel, ...uebersicht, pix, pix0, ...board.nodes, ...extra];
board.edges = [...board.edges, ...edges];
board.drawings = striche;

const paket = { app: 'pixinotes-board', version: 2, savedAt: new Date().toISOString(), board, dateien };
const ziel = join(dist, 'campfire.pixiboard.json');
writeFileSync(ziel, JSON.stringify(paket));
rmSync(work, { recursive: true, force: true });
const mb = (Buffer.byteLength(JSON.stringify(paket)) / 1048576).toFixed(1);
console.log(`✔ ${ziel.replace(root + '/', 'campfire/')} · ${board.nodes.length} Karten · ${board.edges.length} Pfeile (${ausgelassen} ausgelassen, sie würden Daten koppeln) · ${striche.length} Striche · ${Object.keys(dateien).length} Dateien · ${mb} MB`);
if (fehlt.length) { console.error(`✘ fehlt in dist/: ${[...new Set(fehlt)].join(', ')}`); process.exit(2); }
