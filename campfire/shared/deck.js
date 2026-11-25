/* Campfire decks — draws the pixel art, then starts reveal.js.
   Classic script, loaded last. Needs window.PX (shared/pixel.js), window.Reveal and window.RevealNotes.
   Works offline, from file://, and inside a sandboxed iframe (storage and history are guarded).

   Markup:
     <svg data-px="campfire" data-scale="10"></svg>   scene or sprite name (see SCENES / PX.SPRITES)
     <svg data-px-icon="forge" data-scale="6"></svg>  single-colour station icon, colour = CSS color
   Animated scenes step through frames on one shared ticker; with prefers-reduced-motion they stay on frame 1. */
(function () {
  'use strict';

  var PX = window.PX;
  var doc = document;
  var root = doc.documentElement;
  var TICK_MS = 160; // one art frame, stepped like the CSS steps() animations

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* old browser: animate */ }

  /* ── Storage: sandboxed iframes throw on access, so every call is guarded ── */
  var THEME_KEY = 'campfire-deck-theme';
  function storeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* no storage: setting lasts for this visit */ }
  }

  /* ── Theme: ?theme=light, remembered choice, or key T ── */
  function setTheme(name) {
    if (name === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }
  var queryTheme = null;
  try { queryTheme = new URLSearchParams(window.location.search).get('theme'); } catch (e) { /* ignore */ }
  setTheme(queryTheme || storeGet(THEME_KEY) || root.getAttribute('data-theme') || 'dark');
  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(next);
    storeSet(THEME_KEY, next);
  }

  /* ── Extra sprites for the decks (same text-grid format as pixel.js) ── */
  var EXTRA = {
    /* A single HTML file */
    file: [
      'eeeeeeeee...',
      'e.......ee..',
      'e.......e.e.',
      'e.......eeee',
      'e..........e',
      'e.cc.ccc...e',
      'e..........e',
      'e.ccccc.cc.e',
      'e..........e',
      'e.cc.cccc..e',
      'e..........e',
      'e.ccc.cc...e',
      'e..........e',
      'eeeeeeeeeeee',
    ],
    /* A phone */
    phone: [
      '.eeeeeeee.',
      'e........e',
      'e.cccccc.e',
      'e.c....c.e',
      'e.c.oo.c.e',
      'e.c.oo.c.e',
      'e.c....c.e',
      'e.c....c.e',
      'e.cccccc.e',
      'e........e',
      'e...ee...e',
      '.eeeeeeee.',
    ],
  };

  /* ── Helpers ── */
  function rowsOf(name) { return EXTRA[name] || PX.SPRITES[name]; }
  function size(rows) { return { w: rows[0].length, h: rows.length }; }
  function spr(name, x, y, pal) { return PX.sprite(rowsOf(name), { x: x, y: y, pal: pal }); }

  /** Campfire at (x, y): fire frame over crossed logs, 20×22 */
  function campfireAt(frame, x, y) {
    return spr(frame, x + 2, y) + spr('logs', x, y + 16);
  }
  /** Rising sparks for frame i (positions relative to a campfire at x, y) */
  function sparksAt(i, x, y) {
    var sets = [[[3, 1], [15, 4]], [[5, -1], [14, 2]], [[2, -2], [16, 0]]];
    return sets[i % 3].map(function (p) {
      return '<rect x="' + (x + p[0]) + '" y="' + (y + p[1]) + '" width="1" height="1" fill="' + PX.PAL.M + '"/>';
    }).join('');
  }
  /** Filled ellipse rows: rings = [[rx, ry, char], …] from outside in */
  function ellipseRows(w, h, cx, cy, rings) {
    var rows = [];
    for (var y = 0; y < h; y++) {
      var row = '';
      for (var x = 0; x < w; x++) {
        var ch = '.';
        for (var r = 0; r < rings.length; r++) {
          var dx = (x + 0.5 - cx) / rings[r][0];
          var dy = (y + 0.5 - cy) / rings[r][1];
          if (dx * dx + dy * dy <= 1) ch = rings[r][2];
        }
        row += ch;
      }
      rows.push(row);
    }
    return rows;
  }
  function block(x, y, w, h, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
  }

  var FIRES = ['fire1', 'fire2', 'fire3'];

  /* ── The arc of the evening (version 3): spark → kindling → many fires → smoke → embers ── */
  var SMALL_FLAMES = [
    ['...y...', '...y...', '..yoy..', '..ooy..', '.ooyoo.', '.oyyyo.', '.royor.', 'rroooRr', '.rrrrr.'],
    ['....y..', '...yy..', '..yoy..', '..oyo..', '.ooyoo.', '.oyyyo.', '.royyr.', 'rrooorr', '.rrrrr.'],
    ['..y....', '..yy...', '..yoy..', '.ooyo..', '.ooyoo.', '.oyyyo.', '.ryyor.', 'rrooorr', '.rrrrr.'],
  ];
  /* A teepee of thin twigs (15×8) */
  var TWIGS = [
    '..n.........n..',
    '...n.......n...',
    '....m.....m....',
    '.....m...m.....',
    'WW....m.m....WW',
    '.WWmm..W..mmWW.',
    '...WWmmWmmWW...',
    '.....WWWWW.....',
  ];
  var PUFF = ['.ttt.', 'ttttt', '.ttt.'];
  var PUFF_DIM = ['.sss.', 'sssss', '.sss.'];
  /* A small ghost in the smoke (6×6): every campfire has ghost stories */
  var GHOST = ['.tttt.', 'tttttt', 'tkttkt', 'tttttt', 'tttttt', 't.tt.t'];
  /* Burnt logs for the embers */
  var BURNT = { m: '#3a2414', n: '#6b4226', W: '#1f140b' };
  var GLOW = ['#e8483f', '#ff5a36', '#ffae00', '#ffe06a'];

  /* Scenes: name → { w, h, frames: [svg body…], seq?: [frame index per tick] } */
  var SCENES = {
    fire: function () {
      return { w: 20, h: 22, frames: [campfireAt('fire1', 0, 0)] };
    },
    campfire: function () {
      return {
        w: 24, h: 26,
        frames: FIRES.map(function (f, i) { return campfireAt(f, 2, 4) + sparksAt(i, 2, 0); }),
      };
    },
    pix: function () {
      var seq = []; for (var i = 0; i < 24; i++) seq.push(i === 23 ? 1 : 0);
      return { w: 16, h: 16, frames: [spr('pix', 0, 0), spr('pixBlink', 0, 0)], seq: seq };
    },
    /* Pix sitting by the fire */
    pixfire: function () {
      var frames = [];
      FIRES.forEach(function (f, i) {
        frames.push(spr('pix', 0, 10) + campfireAt(f, 20, 4) + sparksAt(i, 20, 0));
      });
      frames.push(spr('pixBlink', 0, 10) + campfireAt('fire1', 20, 4) + sparksAt(0, 20, 0));
      var seq = []; for (var t = 0; t < 30; t++) seq.push(t === 29 ? 3 : t % 3);
      return { w: 42, h: 26, frames: frames, seq: seq };
    },
    /* Chapter I: a single spark rises over cold logs */
    spark: function () {
      var path = [[11, 12], [10, 8], [12, 4], [11, 1]];
      return {
        w: 24, h: 26,
        frames: path.map(function (p, i) {
          return spr('logs', 2, 20) + block(11, 21, 2, 1, i % 2 ? PX.PAL.o : PX.PAL.r) + spr('spark', p[0], p[1]);
        }),
      };
    },
    /* Chapter IV: a small flame in a teepee of twigs */
    kindling: function () {
      return {
        w: 19, h: 20,
        frames: SMALL_FLAMES.map(function (f, i) {
          var sp = [[5, 1], [12, 0], [8, 2]][i];
          return PX.sprite(TWIGS, { x: 2, y: 12 }) + PX.sprite(f, { x: 6, y: 4 }) + block(sp[0], sp[1], 1, 1, PX.PAL.M);
        }),
      };
    },
    /* Chapter V: many fires make a camp */
    camp: function () {
      var ground = block(0, 30, 100, 2, '#1b2d17');
      var tents = PX.icon('tent', { fill: '#4c7420', x: 22, y: 15 }) + PX.icon('tent', { fill: '#4c7420', x: 61, y: 15 });
      return {
        w: 100, h: 32,
        frames: FIRES.map(function (f, i) {
          return ground + tents +
            campfireAt(FIRES[i], 2, 8) + sparksAt(i, 2, 4) +
            campfireAt(FIRES[(i + 1) % 3], 40, 8) + sparksAt(i + 1, 40, 4) +
            campfireAt(FIRES[(i + 2) % 3], 78, 8) + sparksAt(i + 2, 78, 4);
        }),
      };
    },
    /* Chapter VII: smoke rises, and a ghost lives in it */
    smoke: function () {
      var puffs = [
        [[18, 22, PUFF], [13, 15, PUFF_DIM], [21, 9, PUFF]],
        [[17, 20, PUFF_DIM], [14, 13, PUFF], [20, 7, PUFF_DIM]],
        [[18, 18, PUFF], [12, 11, PUFF_DIM], [21, 5, PUFF]],
      ];
      return {
        w: 40, h: 50,
        frames: FIRES.map(function (f, i) {
          var smoke = puffs[i].map(function (p) { return PX.sprite(p[2], { x: p[0], y: p[1] }); }).join('');
          return smoke + PX.sprite(GHOST, { x: 25, y: 1 + (i % 2) }) + campfireAt(f, 10, 28);
        }),
      };
    },
    /* Chapter VIII and every ember slide: burnt logs, glowing in steps */
    embers: function () {
      var spots = [[6, 6], [9, 7], [12, 8], [14, 7], [10, 6], [16, 6], [8, 8], [12, 6], [5, 7]];
      return {
        w: 24, h: 14,
        frames: [0, 1, 2].map(function (i) {
          var glow = spots.map(function (s, k) { return block(s[0] + 2, s[1] + 2, 1, 1, GLOW[(k + i) % GLOW.length]); }).join('');
          var rise = [[11, 3], [13, 1], [10, 0]][i];
          return PX.sprite('logs', { x: 2, y: 7, pal: BURNT }) + glow + block(rise[0], rise[1], 1, 1, GLOW[(i + 1) % 4]);
        }),
      };
    },
    /* The circle of light: what the model can see. Small blocks are messages; the dim ones are in the dark. */
    circle: function () {
      var pal = { 1: '#12210f', 2: '#1b2d17', 3: '#2a4123', 4: '#306230' };
      var ground = PX.sprite(ellipseRows(60, 40, 30, 27, [[29, 13, '1'], [24, 11, '2'], [18, 8.5, '3'], [11, 5.5, '4']]), { pal: pal });
      var lit = PX.PAL.e;
      var dim = '#2a4123';
      var msgs = block(9, 25, 5, 2, lit) + block(12, 31, 6, 2, lit) + block(45, 24, 6, 2, lit) + block(41, 32, 5, 2, lit) +
        block(27, 36, 6, 2, lit) + block(1, 8, 5, 2, dim) + block(52, 6, 6, 2, dim) + block(4, 2, 4, 2, dim);
      return {
        w: 60, h: 40,
        frames: FIRES.map(function (f, i) { return ground + msgs + campfireAt(f, 20, 10) + sparksAt(i, 20, 6); }),
      };
    },
  };

  function sceneFor(name) {
    if (SCENES[name]) return SCENES[name]();
    var rows = rowsOf(name);
    if (!rows) throw new Error('deck: unknown pixel scene "' + name + '"');
    var s = size(rows);
    return { w: s.w, h: s.h, frames: [spr(name, 0, 0)] };
  }

  /* ── Lore: facts come from window.LORE (shared/lore.js), so every number lives in one place ──
     Filled at load, before the pixel art is drawn and before reveal.js counts the fragments.
     Version 3 tells a story, not a game: no rarity labels, risks are ghost stories with a way to keep them away.
       <div data-lore-word="token"></div>          word card: icon, name, full name, plain sentence, booth world, watch out
                                                   (data-lore-item is the older name and still works)
       <svg data-word-icon="mcp" data-scale="4">    just the icon of a word (PX.ITEMS, generic gem as fallback; also data-item-icon)
       <ol data-lore-history="0-3"></ol>           timeline entries: "3", "0-3", "3,4,7" or "" for all
       <div data-lore-myth="3"></div>              the claim; verdict stamp and why appear as one fragment
       <div data-lore-boss="leaker"></div>         ghost story in the smoke: what it does, how to keep it away;
                                                   an <img> inside is the art, else ../art/boss-<id>.svg if it loads
       <ul data-lore-quests="0-3"></ul>            side quests, same index syntax ("" = all eight)
       <ol data-lore-rules></ol>                   the fireplace rules
       <section data-ember="Sentence." data-next="Next: …">   ember: a small glowing ember, the sentence to take home,
                                                   and a quiet line that leads to the next chapter */
  var LORE = window.LORE;

  /* Small 16×16 icons for the lore (same '#' format as PX.ICONS); only added where pixel.js has no such name */
  var LORE_ICONS = {
    gem: [
      '................', '................', '....########....', '...#..#..#..#...',
      '..#..#....#..#..', '.##############.', '..#...#..#...#..', '...#...##...#...',
      '....#..##..#....', '.....#.##.#.....', '......####......', '.......##.......',
      '................', '................', '................', '................',
    ],
    sun: [
      '.......##.......', '.......##.......', '..#..........#..', '...#..####..#...',
      '.....######.....', '....########....', '....########....', '##..########..##',
      '##..########..##', '....########....', '.....######.....', '...#..####..#...',
      '..#..........#..', '.......##.......', '.......##.......', '................',
    ],
    screen: [
      '................', '.##############.', '.#............#.', '.#.#..........#.',
      '.#..#.........#.', '.#.#..###.....#.', '.#............#.', '.#.###.##.....#.',
      '.#............#.', '.#.##.####....#.', '.#............#.', '.##############.',
      '.......##.......', '.....######.....', '................', '................',
    ],
    snow: [
      '.......#........', '.....#.#.#......', '......###.......', '.#.....#.....#..',
      '..#....#....#...', '...#...#...#....', '....#..#..#.....', '###############.',
      '....#..#..#.....', '...#...#...#....', '..#....#....#...', '.#.....#.....#..',
      '......###.......', '.....#.#.#......', '.......#........', '................',
    ],
    knight: [
      '................', '......#.#.......', '.....######.....', '....########....',
      '...###.######...', '..##########....', '..##########....', '...###..####....',
      '.......#####....', '......######....', '.....#######....', '.....#######....',
      '....#########...', '...###########..', '...###########..', '................',
    ],
    trophy: [
      '................', '...##########...', '.#.##########.#.', '.#.##########.#.',
      '.#..########..#.', '..#.########.#..', '...#.######.#...', '......####......',
      '.......##.......', '.......##.......', '......####......', '.....######.....',
      '....########....', '....########....', '................', '................',
    ],
    cat: [
      '................', '..#.........#...', '..##.......##...', '..###.....###...',
      '..###########...', '.#############..', '.###..###..###..', '.###..###..###..',
      '.#############..', '.######.######..', '..###########...', '...#########....',
      '.....#####......', '................', '................', '................',
    ],
    go: [
      '................', '.#############..', '.#...#...#...#..', '.#..###..#...#..',
      '.#.#####.#...#..', '.#############..', '.#.#####.#...#..', '.#..###.###..#..',
      '.#...#.#####.#..', '.#############..', '.#...#.#####.#..', '.#...#..###..#..',
      '.#...#...#...#..', '.#############..', '................', '................',
    ],
    pizza: [
      '................', '.##############.', '.##############.', '..#..........#..',
      '..#.##....##.#..', '...#.##.....#...', '...#........#...', '....#..##..#....',
      '....#..##..#....', '.....#....#.....', '.....#....#.....', '......#..#......',
      '......#..#......', '.......##.......', '................', '................',
    ],
  };
  if (PX) Object.keys(LORE_ICONS).forEach(function (k) { if (!PX.ICONS[k]) PX.ICONS[k] = LORE_ICONS[k]; });

  /* One small icon per LORE.HISTORY entry, by index (the fire grows from spark to forge, then the camp) */
  var HISTORY_ICONS = ['bubble', 'sun', 'screen', 'snow', 'knight', 'trophy', 'cat', 'go', 'spark', 'kindling', 'fire', 'smoke', 'pizza', 'forge', 'tent'];
  var VERDICTS = { fact: 'Fact', myth: 'Myth', half: 'Half true', rumour: 'Rumour', depends: 'It depends' };
  var KINDS = { ai: 'AI', code: 'Code', github: 'GitHub' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /** "3" | "0-4" | "3,4,7" | "0-2,8" | "" → indices within 0…n-1 */
  function indices(spec, n) {
    var parts = String(spec || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) parts = ['0-' + (n - 1)];
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) return;
      var to = Number(m[2] != null ? m[2] : m[1]);
      for (var i = Number(m[1]); i <= Math.min(to, n - 1); i++) out.push(i);
    });
    return out;
  }
  function svgWrap(body, w, h, scale, cls, label) {
    var a11y = label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"';
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * scale +
      '" height="' + h * scale + '" shape-rendering="crispEdges" focusable="false"' + a11y + '>' + body + '</svg>';
  }
  function monoIcon(name, scale, cls) { return svgWrap(PX.icon(name), 16, 16, scale, cls); }
  /** Item icon from PX.ITEMS (rows of '#', colour rows, { rows, pal } or SVG markup); the generic gem otherwise */
  function itemIcon(id, scale, cls) {
    var art = PX.ITEMS ? PX.ITEMS[id] : null;
    try {
      if (typeof art === 'function') art = art();
      if (typeof art === 'string' && art.trim().charAt(0) === '<') return svgWrap(art, 16, 16, scale, cls);
      var rows = art && (art.rows || art);
      if (rows && rows.length && typeof rows[0] === 'string') {
        var mono = /^[#.]+$/.test(rows.join(''));
        var body = mono ? '<path fill="currentColor" d="' + PX.runPath(rows, '#', 0, 0) + '"/>' : PX.sprite(rows, { pal: art.pal });
        return svgWrap(body, rows[0].length, rows.length, scale, cls);
      }
    } catch (e) { console.warn('deck: item icon "' + id + '" unreadable, using the gem'); }
    return monoIcon('gem', scale, cls);
  }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  /* A word card: no rarity, just the word, a plain sentence and the booth-world picture */
  function renderWord(el) {
    var id = el.getAttribute('data-lore-word') || el.getAttribute('data-lore-item');
    var it = byId(LORE.ITEMS, id);
    if (!it) throw new Error('unknown word "' + id + '"');
    el.classList.add('word-card');
    el.innerHTML =
      '<div class="word-head">' + itemIcon(it.id, 5, 'word-ico') +
        '<div><p class="word-kind">' + esc(KINDS[it.kind] || it.kind) + '</p>' +
        '<h3 class="word-name">' + esc(it.name) + '</h3><p class="word-full">' + esc(it.full) + '</p></div></div>' +
      '<p class="word-fun">' + esc(it.fun) + '</p>' +
      '<p><b class="k">In the booth world:</b> ' + esc(it.space) + '</p>' +
      '<p><b class="k">Watch out:</b> ' + esc(it.watch) + '</p>';
  }
  function renderWordIcon(svg) {
    var scale = Number(svg.getAttribute('data-scale')) || 4;
    var id = svg.getAttribute('data-word-icon') || svg.getAttribute('data-item-icon');
    svg.outerHTML = itemIcon(id, scale, 'lore-ico ' + (svg.getAttribute('class') || ''));
  }
  function renderHistory(el) {
    el.classList.add('lore-timeline');
    el.innerHTML = indices(el.getAttribute('data-lore-history'), LORE.HISTORY.length).map(function (i) {
      var h = LORE.HISTORY[i];
      return '<li><span class="tl-year">' + esc(h.year) + '</span>' + monoIcon(HISTORY_ICONS[i] || 'spark', 3, 'tl-ico') +
        '<div><p class="tl-title">' + esc(h.title) + '</p><p class="tl-text">' + esc(h.text) + '</p></div></li>';
    }).join('');
  }
  function renderMyth(el) {
    var m = LORE.MYTHS[Number(el.getAttribute('data-lore-myth'))];
    if (!m) throw new Error('unknown myth "' + el.getAttribute('data-lore-myth') + '"');
    el.classList.add('myth');
    el.innerHTML = '<p class="myth-claim">' + esc(m.claim) + '</p>' +
      '<div class="myth-reveal fragment"><p class="stamp v-' + esc(m.verdict) + '">' + esc(VERDICTS[m.verdict] || m.verdict) + '</p>' +
      '<p class="myth-why">' + esc(m.why) + '</p></div>';
  }
  function renderBoss(el) {
    var id = el.getAttribute('data-lore-boss');
    var b = byId(LORE.BOSSES, id);
    if (!b) throw new Error('unknown boss "' + id + '"');
    var img = el.querySelector('img');
    el.classList.add('boss-card');
    el.innerHTML = '<div class="boss-body"><p class="boss-tag">In the smoke</p><h3 class="boss-name">' + esc(b.name) + '</h3>' +
      '<p class="boss-k">What it does</p><p class="boss-v">' + esc(b.hp) + '</p>' +
      '<p class="boss-k">How to keep it away</p><p class="boss-v boss-weak">' + esc(b.weakness) + '</p></div>';
    if (!img && el.getAttribute('data-art') !== 'none') {   // no art in the markup: try the file, drop it if missing
      img = doc.createElement('img');
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); el.classList.add('no-art'); };
      img.src = '../art/boss-' + id + '.svg';
    }
    if (img) {
      img.classList.add('boss-art');
      if (!img.getAttribute('alt')) img.setAttribute('alt', b.name);
      el.insertBefore(img, el.firstChild);
    } else el.classList.add('no-art');
  }
  function renderQuests(el) {
    el.classList.add('lore-quests');
    el.innerHTML = indices(el.getAttribute('data-lore-quests'), LORE.QUESTS.length).map(function (i) {
      var q = LORE.QUESTS[i];
      return '<li><p class="q-n">' + (i < 9 ? '0' : '') + (i + 1) + '</p><div><h3>' + esc(q.title) + '</h3><p>' + esc(q.text) + '</p></div></li>';
    }).join('');
  }
  function renderRules(el) {
    el.innerHTML = LORE.RULES.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
  }
  /* Ember: every chapter ends with one sentence worth taking home, by a small glowing ember */
  function renderEmber(sec) {
    var next = sec.getAttribute('data-next');
    sec.classList.add('ember-slide');
    sec.insertAdjacentHTML('afterbegin', '<div class="ember">' +
      '<svg data-px="embers" data-scale="10" class="ember-glow"></svg>' +
      '<p class="kicker">An ember to take home</p>' +
      '<p class="ember-line">' + esc(sec.getAttribute('data-ember')) + '</p>' +
      (next ? '<p class="ember-next">' + esc(next) + '</p>' : '') + '</div>');
  }

  function renderLore() {
    function each(sel, fn) {
      Array.prototype.forEach.call(doc.querySelectorAll(sel), function (el) {
        try { fn(el); } catch (e) { console.warn('deck: ' + e.message); }
      });
    }
    if (!PX) return;
    each('section[data-ember]', renderEmber);
    each('svg[data-word-icon],svg[data-item-icon]', renderWordIcon);
    if (!doc.querySelector('[data-lore-word],[data-lore-item],[data-lore-history],[data-lore-myth],[data-lore-boss],[data-lore-quests],[data-lore-rules]')) return;
    if (!LORE) { console.warn('deck: shared/lore.js missing, lore slides stay empty'); return; }
    each('[data-lore-word],[data-lore-item]', renderWord);
    each('[data-lore-history]', renderHistory);
    each('[data-lore-myth]', renderMyth);
    each('[data-lore-boss]', renderBoss);
    each('[data-lore-quests]', renderQuests);
    each('[data-lore-rules]', renderRules);
  }

  /* ── Render ── */
  var animated = [];

  function setup(svg, w, h) {
    var scale = Number(svg.getAttribute('data-scale')) || 8;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', String(w * scale));
    svg.setAttribute('height', String(h * scale));
    svg.setAttribute('shape-rendering', 'crispEdges');
    if (svg.getAttribute('aria-label')) svg.setAttribute('role', 'img');
    else svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }

  function renderScene(svg) {
    var name = svg.getAttribute('data-px');
    var s;
    try { s = sceneFor(name); } catch (e) { console.warn(e.message); return; }
    setup(svg, s.w, s.h);
    svg.innerHTML = s.frames.map(function (body, i) {
      return '<g data-frame="' + i + '"' + (i ? ' visibility="hidden"' : '') + '>' + body + '</g>';
    }).join('');
    if (s.frames.length > 1 && !reduceMotion) {
      animated.push({ svg: svg, groups: svg.querySelectorAll('g[data-frame]'), seq: s.seq || null, n: s.frames.length, cur: 0 });
    }
  }

  function renderIcon(svg) {
    var name = svg.getAttribute('data-px-icon');
    if (!PX.ICONS[name]) { console.warn('deck: unknown pixel icon "' + name + '"'); return; }
    setup(svg, 16, 16);
    svg.innerHTML = PX.icon(name);
  }

  function renderAll() {
    if (!PX) { console.warn('deck: shared/pixel.js missing, no pixel art'); return; }
    Array.prototype.forEach.call(doc.querySelectorAll('svg[data-px]'), renderScene);
    Array.prototype.forEach.call(doc.querySelectorAll('svg[data-px-icon]'), renderIcon);
  }

  var tick = 0;
  function step() {
    tick++;
    for (var i = 0; i < animated.length; i++) {
      var a = animated[i];
      // hidden slides are display:none, skip them
      if (!a.svg.getClientRects().length) continue;
      var next = a.seq ? a.seq[tick % a.seq.length] : tick % a.n;
      if (next === a.cur) continue;
      a.groups[a.cur].setAttribute('visibility', 'hidden');
      a.groups[next].removeAttribute('visibility');
      a.cur = next;
    }
  }

  renderLore();   // first: lore cards and ember slides contain pixel art that renderAll draws
  renderAll();
  if (animated.length) window.setInterval(step, TICK_MS);

  /* ── Reveal ── */
  if (!window.Reveal) { console.warn('deck: reveal.js missing'); return; }

  // Some sandboxed iframes refuse history writes; then slides simply don't update the URL hash.
  // As a PixiNotes card the deck runs in about:srcdoc: the test write below passes there, but reveal's own hash
  // updates resolve against the host page's address and throw — so no hash at all in that case.
  var hashOk = window.location.protocol !== 'about:';
  if (hashOk) {
    try { window.history.replaceState(window.history.state, '', window.location.href); } catch (e) { hashOk = false; }
  }

  window.Reveal.initialize({
    width: 1280,
    height: 720,
    margin: 0,
    minScale: 0.2,
    maxScale: 2,
    center: true,
    hash: hashOk,
    controls: true,
    controlsTutorial: false,
    progress: true,
    slideNumber: 'c/t',
    transition: 'none',
    backgroundTransition: 'none',
    plugins: window.RevealNotes ? [window.RevealNotes] : [],
  }).then(function () {
    window.Reveal.addKeyBinding({ keyCode: 84, key: 'T', description: 'Toggle light / dark theme' }, toggleTheme);
  });
})();
