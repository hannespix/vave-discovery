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
