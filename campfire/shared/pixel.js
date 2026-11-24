/* Campfire pixel kit — sprites as text grids, rendered to crisp SVG paths.
   Classic script (no modules): in the browser it sets window.PX, in Node tools/*.mjs load it with vm and read
   globalThis.PX. Same idea as pix·el's iconPath(): every run of equal pixels in a row becomes one rect path.
   One character = one colour from PAL; '.' is transparent. */
(function (root) {
  'use strict';

  /* Palette: pix·el LCD night + fire. Same values as shared/campfire.css (standalone SVGs can't read CSS vars). */
  const PAL = {
    k: '#050a05', // night-0, outlines in the dark
    g: '#0f380f', // LCD ink, Pix outline
    a: '#306230', b: '#4c7420', c: '#7a9a1c', d: '#a9c431', e: '#d4ef78', f: '#e3efa8',
    R: '#e8483f', r: '#ff5a36', o: '#ffae00', y: '#ffe06a', w: '#fff6c8',
    W: '#3a2414', m: '#6b4226', n: '#9a6a3c',
    M: '#ffe45e', // marker / spark yellow
    i: '#e2f0c6', // text ink on night
    s: '#56654f', t: '#9fb48f', // smoke / stone greys
    N: '#0c170b', // night-1 background
  };

  /* ── Sprites ─────────────────────────────────────────────────────────────── */
  const SPRITES = {
    /* Pix, the pix·el mascot (hannespix/pix-el site/icons.js MASCOT), as colour rows. 16×16. */
    pix: [
      '.........M......',
      '........g.......',
      '...gggggggggg...',
      '..gffffffffffg..',
      '.gffffffffffffg.',
      '.gffggffffggffg.',
      '.gffggffffggffg.',
      '.gffffffffffffg.',
      '.gffffgffgffffg.',
      '.gfccffggffccfg.',
      '.gffffffffffffg.',
      '..gffffffffffg..',
      '...gggggggggg...',
      '....gg....gg....',
      '...ggg....ggg...',
      '................',
    ],
    /* Pix with closed eyes (blink frame) */
    pixBlink: [
      '.........M......',
      '........g.......',
      '...gggggggggg...',
      '..gffffffffffg..',
      '.gffffffffffffg.',
      '.gffffffffffffg.',
      '.gffggffffggffg.',
      '.gffffffffffffg.',
      '.gffffgffgffffg.',
      '.gfccffggffccfg.',
      '.gffffffffffffg.',
      '..gffffffffffg..',
      '...gggggggggg...',
      '....gg....gg....',
      '...ggg....ggg...',
      '................',
    ],
    /* Flame icon from pixletics (index.html, 12×14) */
    flame: [
      '.....rr.....',
      '....rrrr....',
      '....rror....',
      '...rroorr...',
      '...rooor....',
      '..rrooorr...',
      '..rooooor...',
      '.rroooyoor..',
      '.roooyyoor..',
      '.roooyyyor..',
      '.rroooyoor..',
      '..rooooor...',
      '..rrooorr...',
      '...rrrrr....',
    ],
    /* Campfire flames, three frames (16×16) — cycle with steps() for a crackle */
    fire1: [
      '.......r........',
      '.......r....r...',
      '......rr....r...',
      '..r...ror..rr...',
      '..r..rroor.rr...',
      '..rr.roooorror..',
      '..rrrooyoooorr..',
      '.rrooooyyoooorr.',
      '.rroooyyyyoooor.',
      '.rooooyywyyooor.',
      '.roooyywwyyooor.',
      '.rooyyywwwyyoor.',
      '..rooyywwyyoor..',
      '..rrooyyyyoorr..',
      '...rrooooooor...',
      '....rrrrrrrr....',
    ],
    fire2: [
      '....r...........',
      '....r......r....',
      '...rr.....rr....',
      '...ror...rror...',
      '..rroor..roor...',
      '..roooorrooor...',
      '..rooyooooyor...',
      '.rrooyyooyyorr..',
      '.roooyyyyyyoor..',
      '.rooyyywyyyoorr.',
      '.rooyywwwyyooor.',
      '.rooyywwwwyyoor.',
      '..rooyywwyyoor..',
      '..rrooyyyyoorr..',
      '...rrooooooor...',
      '....rrrrrrrr....',
    ],
    fire3: [
      '..........r.....',
      '...r......r.....',
      '...r.....rr.....',
      '..rr....ror..r..',
      '..ror..rroor.r..',
      '.rroor.roooorr..',
      '.rooooroooyoor..',
      '.roooyyooyyoorr.',
      '.rooyyyyyyyooor.',
      '.rooyywwyyyooor.',
      '.roooyywwwyyoor.',
      '.rooyyywwwyyoor.',
      '..rooyywwyyoor..',
      '..rrooyyyyoorr..',
      '...rrooooooor...',
      '....rrrrrrrr....',
    ],
    /* Crossed logs under the fire (20×6) */
    logs: [
      '..WW............WW..',
      '.WmmWW........WWmmW.',
      '.WnmmmWWW..WWWmmmnW.',
      '..WWmmmmmWWmmmmmWW..',
      '....WWWmmmmmmWWW....',
      '.......WWWWWW.......',
    ],
    /* A single spark / ember (3×3) */
    spark: [
      '.y.',
      'yMy',
      '.y.',
    ],
  };

  /* Single-colour 16×16 icons, '#' = pixel (pix·el icon format). One per station of the talk. */
  const ICONS = {
    tent: [
      '................', '.......##.......', '......#..#......', '.....#....#.....',
      '.....#.##.#.....', '....#..##..#....', '....#.#..#.#....', '...#..#..#..#...',
      '...#.#....#.#...', '..#..#....#..#..', '..#.#......#.#..', '.#..#......#..#.',
      '################', '................', '................', '................',
    ],
    spark: [ // pix·el icons.js "spark"
      '......#.........', '......#.........', '.....###........', '.....###........',
      '....#####.......', '..#########.....', '#############...', '..#########.....',
      '....#####.......', '.....###........', '.....###....#...', '......#.....#...',
      '......#...#####.', '............#...', '............#...', '................',
    ],
    kindling: [
      '................', '.......#........', '......##........', '......#.#.......',
      '.....#..#.......', '.....#.##.......', '......##........', '................',
      '..#..........#..', '...##......##...', '.....##..##.....', '.......##.......',
      '.....##..##.....', '...##......##...', '..#..........#..', '................',
    ],
    fire: [
      '.......#........', '......##........', '......#.#....#..', '.....#...#..##..',
      '....#....#.#.#..', '....#.##..#..#..', '...#.#..#....#..', '...#.#..#...#...',
      '...#..##....#...', '....#......#....', '.....######.....', '................',
      '.##############.', '#..#........#..#', '.##############.', '................',
    ],
    forge: [
      '................', '..........#.....', '.........#.#....', '........#...#...',
      '.........#.#.#..', '..........#...#.', '...........#.#..', '............#...',
      '.##########.....', '#..........###..', '.#.............#', '..#########.###.',
      '.....#....#.....', '....#......#....', '...##########...', '................',
    ],
    smoke: [
      '................', '.........###....', '........#...#...', '.....###.....#..',
      '....#.........#.', '...#..........#.', '....#........#..', '.....##....##...',
      '.......####.....', '......#.........', '.....#..........', '.....#..........',
      '......#.........', '.......#........', '......###.......', '.....#####......',
    ],
    ember: [
      '....#.......#...', '................', '..#....#........', '..........#.....',
      '.....#..........', '................', '....######......', '...#......#.....',
      '..#..##....#....', '.#..#..#....#...', '.#...##.....#...', '.#..........#...',
      '..#........#....', '...########.....', '................', '................',
    ],
    bubble: [ // speech bubble with a question mark — no eyes, so it never reads as an emoji face
      '................', '..############..', '.#............#.', '.#....####....#.',
      '.#...##..##...#.', '.#.......##...#.', '.#......##....#.', '.#.....##.....#.',
      '.#............#.', '.#.....##.....#.', '.#............#.', '..####.#######..',
      '.....#.#........', '.....##.........', '.....#..........', '................',
    ],
  };

  /* ── Rendering ───────────────────────────────────────────────────────────── */

  function check(name, rows) {
    const w = rows[0].length;
    rows.forEach((r, i) => { if (r.length !== w) throw new Error(`PX: sprite "${name}" row ${i} has ${r.length} px, expected ${w}`); });
    return w;
  }

  /** Path data for every pixel equal to `ch` (runs merged), offset by ox/oy */
  function runPath(rows, ch, ox, oy) {
    let d = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== ch) continue;
        let n = 1;
        while (row[x + n] === ch) n++;
        d += `M${ox + x} ${oy + y}h${n}v1h-${n}z`;
        x += n - 1;
      }
    });
    return d;
  }

  /** Sprite → '<path fill=… d=…/>' per colour. opts: { x, y, pal (overrides), cls } */
  function sprite(nameOrRows, opts) {
    const o = opts || {};
    const rows = typeof nameOrRows === 'string' ? SPRITES[nameOrRows] : nameOrRows;
    if (!rows) throw new Error(`PX: unknown sprite "${nameOrRows}"`);
    check(String(nameOrRows), rows);
    const pal = Object.assign({}, PAL, o.pal || {});
    const chars = [...new Set(rows.join(''))].filter((c) => c !== '.');
    const cls = o.cls ? ` class="${o.cls}"` : '';
    return `<g${cls}>${chars.map((c) => `<path fill="${pal[c] || c}" d="${runPath(rows, c, o.x || 0, o.y || 0)}"/>`).join('')}</g>`;
  }

  /** Icon → one path (fill = currentColor unless given) */
  function icon(name, opts) {
    const o = opts || {};
    const rows = ICONS[name];
    if (!rows) throw new Error(`PX: unknown icon "${name}"`);
    check(name, rows);
    return `<path fill="${o.fill || 'currentColor'}" d="${runPath(rows, '#', o.x || 0, o.y || 0)}"/>`;
  }

  /** A complete, self-contained SVG document (for files and <img>) */
  function svgDoc(o) {
    const title = o.title ? `<title>${o.title}</title>` : '';
    const desc = o.desc ? `<desc>${o.desc}</desc>` : '';
    const style = o.css ? `<style>${o.css}</style>` : '';
    const bg = o.bg ? `<rect width="${o.w}" height="${o.h}" fill="${o.bg}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.w} ${o.h}" width="${o.w * (o.scale || 1)}" height="${o.h * (o.scale || 1)}" shape-rendering="crispEdges" role="img">${title}${desc}${style}${bg}${o.body}</svg>`;
  }

  root.PX = { PAL, SPRITES, ICONS, sprite, icon, svgDoc, runPath };

  /* ── Additions (art set): Pix as mono icon, 5×7 pixel font ───────────────── */

  /* Pix as a single-colour icon (outline, eyes, mouth, antenna) — station 01 */
  ICONS.pix = [
    '.........#......', '........#.......', '...##########...', '..#..........#..',
    '.#............#.', '.#..##....##..#.', '.#..##....##..#.', '.#............#.',
    '.#....#..#....#.', '.#.##..##..##.#.', '.#............#.', '..#..........#..',
    '...##########...', '....##....##....', '...###....###...', '................',
  ];

  /* 5×7 pixel font, caps only (lower case is upper-cased). '#' = pixel. Narrow glyphs keep their own width.
     Advance = glyph width + 1. Unknown characters render as '?'. */
  const FONT5x7 = {};
  const F = (chars, rows) => { FONT5x7[chars] = rows; };
  F('A', ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#']);
  F('B', ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.']);
  F('C', ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.']);
  F('D', ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.']);
  F('E', ['#####', '#....', '#....', '####.', '#....', '#....', '#####']);
  F('F', ['#####', '#....', '#....', '####.', '#....', '#....', '#....']);
  F('G', ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####']);
  F('H', ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#']);
  F('I', ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###']);
  F('J', ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..']);
  F('K', ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#']);
  F('L', ['#....', '#....', '#....', '#....', '#....', '#....', '#####']);
  F('M', ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#']);
  F('N', ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#']);
  F('O', ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.']);
  F('P', ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....']);
  F('Q', ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#']);
  F('R', ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#']);
  F('S', ['.####', '#....', '#....', '.###.', '....#', '....#', '####.']);
  F('T', ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..']);
  F('U', ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.']);
  F('V', ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..']);
  F('W', ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.']);
  F('X', ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#']);
  F('Y', ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..']);
  F('Z', ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####']);
  F('0', ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.']);
  F('1', ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###']);
  F('2', ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####']);
  F('3', ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.']);
  F('4', ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.']);
  F('5', ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.']);
  F('6', ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.']);
  F('7', ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...']);
  F('8', ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.']);
  F('9', ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..']);
  F(' ', ['...', '...', '...', '...', '...', '...', '...']);
  F('.', ['.', '.', '.', '.', '.', '.', '#']);
  F(',', ['..', '..', '..', '..', '.#', '.#', '#.']);
  F(':', ['.', '.', '#', '.', '.', '#', '.']);
  F('!', ['#', '#', '#', '#', '#', '.', '#']);
  F('?', ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..']);
  F('-', ['....', '....', '....', '####', '....', '....', '....']);
  F('·', ['..', '..', '..', '##', '##', '..', '..']);
  F('/', ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....']);
  F('&', ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#']);
  F("'", ['#', '#', '.', '.', '.', '.', '.']);

  const glyph = (ch) => FONT5x7[ch] || FONT5x7[ch.toUpperCase()] || FONT5x7['?'];
  const LINE_H = 9; // 7 px glyph + 2 px leading

  /** Width of one line (or the widest line) in px at the given scale (default 1) */
  function textWidth(str, scale) {
    const s = scale || 1;
    return Math.max(...String(str).split('\n').map((line) => {
      const w = [...line].reduce((a, ch) => a + glyph(ch)[0].length + 1, 0);
      return Math.max(0, w - 1) * s;
    }));
  }

  /** Text → one '<path>' of merged pixel runs. opts: { x, y (top edge), fill, scale, align: 'left'|'center'|'right' }.
      '\n' starts a new line (9 px line height × scale). Default fill = PAL.i (ink on night). */
  function text(str, opts) {
    const o = opts || {};
    const s = o.scale || 1;
    let d = '';
    String(str).split('\n').forEach((line, li) => {
      const lw = textWidth(line, s);
      let cx = (o.x || 0) - (o.align === 'center' ? Math.floor(lw / 2) : o.align === 'right' ? lw : 0);
      const cy = (o.y || 0) + li * LINE_H * s;
      for (const ch of line) {
        const rows = glyph(ch);
        rows.forEach((row, ry) => {
          for (let x = 0; x < row.length; x++) {
            if (row[x] !== '#') continue;
            let n = 1;
            while (row[x + n] === '#') n++;
            d += `M${cx + x * s} ${cy + ry * s}h${n * s}v${s}h-${n * s}z`;
            x += n - 1;
          }
        });
        cx += (rows[0].length + 1) * s;
      }
    });
    return `<path fill="${o.fill || PAL.i}" d="${d}"/>`;
  }

  Object.assign(root.PX, { FONT5x7, text, textWidth });
})(typeof window !== 'undefined' ? window : globalThis);
