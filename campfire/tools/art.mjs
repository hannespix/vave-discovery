#!/usr/bin/env node
/* Campfire art set: writes self-contained, animated pixel-art SVGs into campfire/art/.
   node campfire/tools/art.mjs
   No dependencies. Loads shared/pixel.js (PX) via vm. Everything is drawn on small char canvases (one char = one
   palette colour), then merged into run paths by PX.sprite. Animations: CSS @keyframes with steps(1) only, every file
   honours prefers-reduced-motion and its base (non-animated) frame is a complete picture. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
vm.runInThisContext(readFileSync(join(root, 'shared/pixel.js'), 'utf8'), { filename: 'pixel.js' });
vm.runInThisContext(readFileSync(join(root, 'shared/lore.js'), 'utf8'), { filename: 'lore.js' });
const PX = globalThis.PX;
const LORE = globalThis.LORE;
const OUT = join(root, 'art');
mkdirSync(OUT, { recursive: true });

/* Extra night tones from campfire.css (--night-2/3/4), as palette chars */
const XPAL = { 2: '#12210f', 3: '#1b2d17', 4: '#2a4123' };
const C = { ...PX.PAL, ...XPAL };

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function rng(seed) { // mulberry32, deterministic art
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const pct = (v) => `${+(v * 100).toFixed(3)}%`;
const RM = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';
const anim = (name, dur, delay = 0) => `animation:${name} ${+dur.toFixed(3)}s steps(1) ${delay ? +delay.toFixed(3) + 's ' : ''}infinite`;
/** keyframes from one declaration block per equal time slot (steps(1) holds each slot) */
function seqKF(name, slots) {
  const n = slots.length;
  return `@keyframes ${name}{${slots.map((s, i) => `${pct(i / n)}{${s}}`).join('')}100%{${slots[n - 1]}}}`;
}
/** keyframes from [t (0..1), declarations] pairs */
function kf(name, pts) {
  return `@keyframes ${name}{${pts.map(([t, s]) => `${pct(t)}{${s}}`).join('')}}`;
}

/** Char canvas: '.' = transparent */
class Cv {
  constructor(w, h, bg = '.') { this.w = w; this.h = h; this.a = Array.from({ length: h }, () => Array(w).fill(bg)); }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (c === '.' || x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.a[y][x] = c; return this;
  }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.a[y][x] : '.'; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); return this; }
  spr(rows, x, y, map) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') this.px(x + i, y + j, map && map[ch] !== undefined ? map[ch] : ch); }));
    return this;
  }
  ell(cx, cy, rx, ry, c) { for (const [x, y, w] of ellRows(cx, cy, rx, ry)) this.rect(x, y, w, 1, c); return this; }
  line(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
    return this;
  }
  rows() { return this.a.map((r) => r.join('')); }
  svg(x = 0, y = 0, cls) { return PX.sprite(this.rows(), { x, y, pal: XPAL, cls }); }
}
function ellRows(cx, cy, rx, ry) {
  const out = [];
  for (let j = -ry; j <= ry; j++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / (ry + 0.5)) ** 2)));
    out.push([cx - hw, cy + j, 2 * hw + 1]);
  }
  return out;
}
const ellD = (cx, cy, rx, ry, minY = -1e9) => ellRows(cx, cy, rx, ry).filter((r) => r[1] >= minY).map(([x, y, w]) => `M${x} ${y}h${w}v1h-${w}z`).join('');
const dotD = (pts) => pts.map(([x, y, w = 1, h = 1]) => `M${x} ${y}h${w}v${h}h-${w}z`).join('');

/** Campfire flames fire1→3 as three stacked groups, cycled with steps(1) */
function fireFrames(prefix, x, y, seq = [0, 1, 2, 0, 2, 1], slot = 0.125) {
  let svg = '', css = '';
  ['fire1', 'fire2', 'fire3'].forEach((nm, i) => {
    svg += PX.sprite(nm, { x, y, cls: `${prefix}${i}` });
    css += seqKF(`${prefix}${i}`, seq.map((f) => `opacity:${f === i ? 1 : 0}`));
    css += `.${prefix}${i}{${i ? 'opacity:0;' : ''}${anim(prefix + i, seq.length * slot)}}`;
  });
  return { svg, css };
}

function pine(cv, cx, baseY, h, c, shade) {
  for (let r = 0; r < h; r++) {
    const half = Math.max(0, Math.floor(r * 0.42) - (r % 4 === 0 && r > 3 ? 1 : 0));
    cv.rect(cx - half, baseY - h + r, half * 2 + 1, 1, c);
    if (shade && half > 0) cv.rect(cx + 1, baseY - h + r, half, 1, shade);
  }
}

function write(name, o) {
  const svg = PX.svgDoc({ scale: 4, ...o, title: esc(o.title), desc: esc(o.desc), css: (o.css || '') + RM });
  writeFileSync(join(OUT, name), svg + '\n');
  console.log(`${name.padEnd(24)} ${(svg.length / 1024).toFixed(1)} KB`);
}

/* ── 1 · Campfire scene (hero, 160×90) ────────────────────────────────────── */
function scene() {
  const W = 160, H = 90, HZ = 62, FX = 78; // HZ: top of the clearing, FX: fire centre
  const rnd = rng(11);
  const cv = new Cv(W, H);
  const dith = (x, y, a, b) => ((x + y) % 2 ? a : b);
  const BAYER = [[0, 2], [3, 1]];
  // ordered dither band: from colour a (row y0) to b over three rows at 25/50/75 %
  const band = (x, y, y0, a, b) => ((BAYER[y % 2][x % 2] + 1) / 4 <= (y - y0 + 1) / 4 ? b : a);
  const sky = (x, y) => (y < 13 ? 'k' : y < 16 ? band(x, y, 13, 'k', 'N') : y < 29 ? 'N' : y < 32 ? band(x, y, 29, 'N', '3') : '3');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cv.px(x, y, sky(x, y));

  // crescent moon
  const MX = 128, MY = 13;
  for (let y = MY - 6; y <= MY + 6; y++) for (let x = MX - 6; x <= MX + 6; x++) {
    const d1 = Math.hypot(x - MX, y - MY), d2 = Math.hypot(x - MX - 3, y - MY + 2);
    if (d1 <= 5.4 && d2 > 4.6) cv.px(x, y, d2 < 5.6 ? 'e' : 'f');
  }

  // far mountains, moonlit on the slopes that face the moon
  const peaks = [[-2, 47], [14, 40], [28, 46], [46, 36], [62, 44], [76, 40], [92, 47], [110, 38], [124, 34], [140, 43], [154, 38], [162, 42]];
  const mt = [];
  for (let x = 0; x < W; x++) {
    const k = peaks.findIndex((p) => p[0] > x);
    const [x0, y0] = peaks[k - 1], [x1, y1] = peaks[k];
    mt[x] = Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
  }
  // dim static stars (before mountains so the ridge covers them)
  for (let i = 0; i < 34; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 36);
    if (Math.hypot(x - MX, y - MY) < 9 || y > mt[x] - 3) continue;
    cv.px(x, y, rnd() < 0.5 ? '4' : 'a');
  }
  for (let x = 0; x < W; x++) {
    cv.rect(x, mt[x], 1, HZ - mt[x], 'g');
    const lit = mt[x + 1] !== undefined && mt[x + 1] > mt[x];
    cv.px(x, mt[x], lit ? 'a' : '4');
    if (lit && mt[x + 1] - mt[x] > 0) cv.px(x, mt[x] + 1, 'a');
  }
  // mid hills
  for (let x = 0; x < W; x++) {
    const y = 53 + Math.round(2 * Math.sin(x / 14) + 1.5 * Math.sin(x / 7.3 + 2));
    cv.rect(x, y, 1, HZ - y, '2');
  }
  // treeline, taller at the edges to frame the clearing
  for (let x = -3; x < W + 4; x += 3 + Math.floor(rnd() * 4)) {
    const edge = x < 24 ? (24 - x) / 24 : x > 136 ? (x - 136) / 24 : 0;
    const h = 7 + Math.floor(rnd() * 8) + Math.round(edge * 16);
    pine(cv, x, HZ + 1, h, 'k');
  }
  // ground with a soft bumpy edge, darker towards the bottom
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) cv.px(x, y, y < 84 ? '3' : y < 86 ? dith(x, y, '3', '2') : '2');
  for (let x = 0; x < W; x += 5 + Math.floor(rnd() * 6)) cv.ell(x, HZ, 2 + Math.floor(rnd() * 3), 1, 'k');
  // grass tufts (lit near the fire) and pebbles
  const tuft = ['..a..', 'a.a.a', '.aaa.'];
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * (W - 5)), y = HZ + 4 + Math.floor(rnd() * 22);
    const d = Math.hypot((x + 2 - FX) / 3, y - 75);
    if (d < 9) continue;
    cv.spr(tuft, x, y, { a: d < 15 ? 'c' : d < 22 ? 'b' : 'a' });
  }
  for (let i = 0; i < 10; i++) cv.rect(Math.floor(rnd() * W), HZ + 6 + Math.floor(rnd() * 20), 2, 1, 's');

  let body = cv.svg();
  let css = '';

  // twinkling stars: three rhythms; two big ones flip between dot and cross
  const tw = [[], [], []];
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rnd() * W), y = 2 + Math.floor(rnd() * 30);
    if (Math.hypot(x - MX, y - MY) < 10 || y > mt[x] - 4) continue;
    tw[i % 3].push([x, y]);
  }
  tw.forEach((pts, i) => {
    body += `<path class="tw${i}" d="${dotD(pts)}"/>`;
    css += seqKF(`tw${i}`, ['fill:' + C.i, 'fill:' + C.i, 'fill:' + C.a, 'fill:' + C.e, 'fill:' + C.i].slice(i % 2, 5));
    css += `.tw${i}{fill:${C.i};${anim(`tw${i}`, 1.7 + i * 0.9, -i * 0.4)}}`;
  });
  [[22, 8], [96, 5], [150, 20]].forEach(([x, y], i) => {
    body += `<path class="bs${i} bd" fill="${C.f}" d="${dotD([[x, y]])}"/>`;
    body += `<path class="bs${i} bx" fill="${C.f}" d="${dotD([[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]])}"/>`;
    css += `.bs${i}.bd{opacity:0;${anim(`bsd${i}`, 3.2 + i, -i * 1.3)}}.bs${i}.bx{${anim(`bsx${i}`, 3.2 + i, -i * 1.3)}}`;
    css += kf(`bsd${i}`, [[0, 'opacity:0'], [0.55, 'opacity:1'], [0.8, 'opacity:0']]);
    css += kf(`bsx${i}`, [[0, 'opacity:1'], [0.55, 'opacity:0'], [0.8, 'opacity:1']]);
  });

  // smoke puffs, rarely
  const puff = PX.runPath(['.sss.', 'sssss', 'sssss', '.sss.'], 's', FX - 2, 45);
  [0, 1].forEach((i) => {
    const pts = [];
    const steps = 26;
    for (let s = 0; s <= steps; s++) {
      const op = s < 7 ? 0.5 : s < 14 ? 0.36 : s < 21 ? 0.22 : 0.12;
      pts.push([(s / steps) * 0.62, `transform:translate(${Math.floor(s / 6) + (i ? -1 : 1)}px,${-s}px);opacity:${op}`]);
    }
    pts.push([0.63, 'opacity:0'], [1, 'opacity:0']);
    css += kf(`sm${i}`, pts) + `.sm${i}{transform:translate(2px,-12px);opacity:${i ? 0 : 0.3};${anim(`sm${i}`, 8, -i * 4.1)}}`;
    body += `<path class="sm${i}" fill="${C.s}" d="${puff}"/>`;
  });

  // warm glow on the ground and a faint haze over the fire: three stepped sizes
  const glow = (k) => `<g class="gl${k}">`
    + [[46 + 3 * k, 11 + k], [32 + 2 * k, 8 + k], [19 + 2 * k, 5 + k]].map(([rx, ry]) => `<path fill="${C.o}" fill-opacity=".09" d="${ellD(FX, 75, rx, ry, HZ)}"/>`).join('')
    + '</g>';
  body += glow(0) + glow(1) + glow(2);
  const gseq = [1, 2, 1, 0, 1, 2, 2, 1, 0, 0];
  [0, 1, 2].forEach((k) => {
    css += seqKF(`gl${k}`, gseq.map((s) => `opacity:${s === k ? 1 : 0}`)) + `.gl${k}{${k === 1 ? '' : 'opacity:0;'}${anim(`gl${k}`, gseq.length * 0.25)}}`;
  });

  // back stones, empty log bench (a seat for the audience), Pix's shadow
  const STONE = ['.ttt.', 'tssss', '.s33.'];
  const stones = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    stones.push([Math.round(FX + 15 * Math.cos(a)) - 2, Math.round(75 + 3.4 * Math.sin(a)) - 1, Math.sin(a) > 0]);
  }
  const back = new Cv(W, H);
  stones.filter((s) => !s[2]).forEach(([x, y]) => back.spr(STONE, x, y, { s: 'n', t: 't' }));
  // bench log, end grain on the left
  const bx = 42, by = 70;
  back.rect(bx + 2, by, 15, 1, 'W').rect(bx + 2, by + 1, 15, 1, 'n').rect(bx + 2, by + 2, 15, 2, 'm').rect(bx + 2, by + 4, 15, 1, 'W');
  back.rect(bx + 17, by + 1, 1, 3, 'W').rect(bx + 16, by + 1, 1, 3, 'o');
  [[6, 2], [9, 3], [12, 2], [14, 3]].forEach(([x, y]) => back.px(bx + x, by + y, 'W'));
  back.spr(['.WWW.', 'WnnnW', 'WnWnW', 'WnnnW', '.WWW.'], bx, by);
  body += back.svg();
  body += `<path fill="${C.k}" fill-opacity=".55" d="${ellD(112, 75, 9, 1)}"/>`;

  // fire, logs, embers, front stones
  const fire = fireFrames('fi', FX - 8, 57);
  body += fire.svg; css += fire.css;
  const front = new Cv(W, H);
  front.spr(PX.SPRITES.logs, FX - 10, 70);
  [[FX - 3, 74, 'r'], [FX + 2, 74, 'R'], [FX, 75, 'o'], [FX - 1, 74, 'y']].forEach(([x, y, c]) => front.px(x, y, c));
  stones.filter((s) => s[2]).forEach(([x, y]) => front.spr(STONE, x, y, { t: 'n' }));
  body += front.svg();

  // Pix by the fire: warm on the fire side, cooler on the far side, blinking
  const PXX = 94, PXY = 59;
  const litPts = [];
  const pixRows = PX.SPRITES.pix.map((row, j) => {
    const a = [...row];
    const L = a.indexOf('g'), R = a.lastIndexOf('g');
    if (L >= 0 && a[L + 1] === 'f') { a[L + 1] = '.'; litPts.push([PXX + L + 1, PXY + j]); if (a[L + 2] === 'f' && j > 3 && j < 11) a[L + 2] = 'e'; }
    if (R > L + 2 && a[R - 1] === 'f') a[R - 1] = 'd';
    return a.join('');
  });
  // the left outline gets a hot rim where the body is lit
  const pixCv = new Cv(16, 16).spr(pixRows, 0, 0);
  litPts.forEach(([x, y]) => { if (y - PXY > 3 && y - PXY < 11) pixCv.px(x - PXX - 1, y - PXY, 'o'); });
  body += pixCv.svg(PXX, PXY);
  body += `<path class="lit" d="${dotD(litPts)}"/>`;
  css += seqKF('lit', ['y', 'o', 'y', 'y', 'o', 'y'].map((c) => `fill:${C[c]}`)) + `.lit{fill:${C.y};${anim('lit', 0.75)}}`;
  body += `<path class="bl" fill="${C.f}" d="${dotD([[PXX + 4, PXY + 5, 2, 1], [PXX + 10, PXY + 5, 2, 1]])}"/>`;
  css += kf('bl', [[0, 'opacity:0'], [0.86, 'opacity:1'], [0.89, 'opacity:0'], [0.92, 'opacity:1'], [0.95, 'opacity:0']]) + `.bl{opacity:0;${anim('bl', 5)}}`;

  // sparks: rise pixel by pixel, cool down w → y → o → r, vanish
  for (let i = 0; i < 9; i++) {
    const x0 = FX - 3 + Math.floor(rnd() * 7), y0 = 57 - Math.floor(rnd() * 3);
    const rise = 18 + Math.floor(rnd() * 18), life = 0.55 + rnd() * 0.25, dur = 1.6 + rnd() * 1.4;
    let x = 0; const pts = []; let mid = '';
    for (let s = 0; s <= rise; s++) {
      if (s % 4 === 3) x += rnd() < 0.5 ? -1 : 1;
      const f = s / rise, c = f < 0.2 ? C.w : f < 0.45 ? C.y : f < 0.75 ? C.o : C.r;
      const decl = `transform:translate(${x}px,${-s}px);fill:${c}`;
      pts.push([(s / rise) * life, decl + (s === 0 ? ';opacity:1' : '')]);
      if (s === Math.round(rise * (0.15 + (i % 4) * 0.2))) mid = decl;
    }
    pts.push([life, 'opacity:0'], [1, 'opacity:0']);
    css += kf(`sp${i}`, pts) + `.sp${i}{${mid};${i > 5 ? 'opacity:0;' : ''}${anim(`sp${i}`, dur, -rnd() * dur)}}`;
    body += `<rect class="sp${i}" x="${x0}" y="${y0}" width="1" height="1"/>`;
  }

  write('campfire-scene.svg', {
    w: W, h: H, bg: C.k, css, body,
    title: 'Gather round: Pix by the campfire',
    desc: 'Pixel-art night scene: a starry sky with a crescent moon, mountains and a pine treeline. In the clearing a campfire crackles inside a stone ring, sparks rise and smoke drifts up. An empty log bench waits on the left; Pix, the little pixel mascot, sits on the right, lit warm by the fire, and blinks.',
  });
}

/* ── 2 · Life strip: six panels ───────────────────────────────────────────── */
function lifeStrip() {
  const PW = 48, GAP = 8, M = 6, OUTER = PW + 4;
  const W = M * 2 + 6 * OUTER + 5 * GAP, H = M + OUTER + 5 + 16 + M - 1;
  const bg = new Cv(W, H, 'N');
  let body = '', css = '';

  const panels = [
    () => { // hippie parents: camper van with a flower, bobbing on the road
      const p = new Cv(PW, PW, 'e');
      p.ell(11, 8, 5, 1, 'f').ell(35, 5, 6, 1, 'f').ell(31, 6, 3, 1, 'f');
      for (let x = 0; x < PW; x++) p.rect(x, 25 + Math.round(2 * Math.sin(x / 7 + 1)), 1, 12, 'd');
      p.rect(0, 33, PW, 15, 'c').rect(0, 37, PW, 7, 'a');
      for (let x = 1; x < PW; x += 7) p.rect(x, 40, 3, 1, 'd');
      p.ell(14, 37, 3, 2, 'g').ell(32, 37, 3, 2, 'g').px(14, 37, 't').px(32, 37, 't');
      const v = new Cv(PW, PW);
      v.rect(8, 20, 30, 16, 'g').rect(9, 21, 28, 7, 'f').rect(9, 28, 28, 7, 'b');
      v.px(8, 20, '.').px(37, 20, '.').px(36, 20, '.').px(37, 21, '.').px(8, 35, '.').px(37, 35, '.');
      v.rect(9, 27, 28, 1, 'g');
      [11, 17, 23].forEach((x) => v.rect(x, 22, 5, 4, 'a').px(x, 22, 'd'));
      v.rect(30, 22, 6, 4, 'a').px(35, 22, '.').px(35, 22, 'f').px(30, 22, 'd');
      v.rect(29, 21, 1, 14, 'g').px(36, 30, 'f').rect(7, 34, 32, 2, 'g');
      v.spr(['..f.f..', '.fffff.', 'ffMMMff', '.fMMMf.', 'ffMMMff', '.fffff.', '..f.f..'], 13, 28);
      v.rect(12, 18, 14, 2, 'g').rect(13, 17, 12, 1, 'd');
      p.ell(14, 37, 3, 2, 'g');
      const out = { base: p, anim: v.svg(0, 0, 'vb'), css: seqKF('vb', ['transform:translate(0,0)', 'transform:translate(0,-1px)']) + `.vb{${anim('vb', 0.5)}}` };
      const wheels = new Cv(PW, PW).ell(14, 37, 3, 2, 'g').ell(32, 37, 3, 2, 'g').px(14, 37, 't').px(32, 37, 't');
      out.anim += wheels.svg();
      return out;
    },
    () => { // farm kid: barn, fence, a pecking chicken
      const p = new Cv(PW, PW, 'f');
      p.ell(38, 7, 4, 1, 'e');
      p.rect(0, 30, PW, 18, 'd');
      for (let j = 0; j < 10; j++) { const hw = j < 4 ? 2 + j * 2 : 9 + Math.floor((j - 4) / 2); p.rect(14 - hw, 11 + j, hw * 2 + 1, 1, 'W'); }
      p.rect(5, 21, 19, 16, 'm').rect(5, 21, 19, 1, 'W');
      for (let x = 7; x < 24; x += 3) p.rect(x, 22, 1, 15, 'n');
      p.rect(10, 26, 9, 11, 'W').rect(11, 27, 7, 10, 'm').line(11, 27, 17, 36, 'f').line(17, 27, 11, 36, 'f').rect(11, 27, 7, 1, 'f');
      p.rect(12, 15, 5, 4, 'k').rect(12, 15, 5, 1, 'f');
      [27, 33, 39, 45].forEach((x) => p.rect(x, 28, 2, 9, 'n').px(x + 1, 28, 'W'));
      p.rect(26, 30, PW - 26, 1, 'n').rect(26, 33, PW - 26, 1, 'n');
      p.rect(0, 37, PW, 11, 'c');
      [[2, 41], [22, 44], [42, 40], [7, 45]].forEach(([x, y]) => p.spr(['a.a', '.a.'], x, y));
      // hen body
      p.ell(33, 40, 5, 3, 'g').ell(33, 40, 4, 2, 'f').spr(['..g', '.gf', 'gff', 'gff'], 37, 35).rect(31, 40, 4, 1, 'e').rect(32, 41, 3, 1, 'e');
      p.rect(32, 44, 1, 2, 'M').rect(34, 44, 1, 2, 'M');
      [[22, 46], [24, 45], [21, 44]].forEach(([x, y]) => p.px(x, y, 'M'));
      const head = ['.MM.', 'gffg', 'Mgfg', '.gfg'];
      const a = new Cv(PW, PW).spr(head, 27, 34), b = new Cv(PW, PW).spr(['....', '.MM.', 'gffg', 'Mgff', '.ggf'], 25, 39).px(29, 38, 'g');
      return {
        base: p, anim: a.svg(0, 0, 'hu') + b.svg(0, 0, 'hd'),
        css: seqKF('hu', ['opacity:1', 'opacity:0', 'opacity:1', 'opacity:1', 'opacity:0', 'opacity:1', 'opacity:1', 'opacity:1'])
          + seqKF('hd', ['opacity:0', 'opacity:1', 'opacity:0', 'opacity:0', 'opacity:1', 'opacity:0', 'opacity:0', 'opacity:0'])
          + `.hu{${anim('hu', 2)}}.hd{opacity:0;${anim('hd', 2)}}`,
      };
    },
    () => { // winery: vine rows on a slope, a barrel; leaves sway
      const p = new Cv(PW, PW, 'f');
      p.ell(9, 6, 5, 1, 'e');
      const hill = (x) => 22 + Math.round(x / 5);
      for (let x = 0; x < PW; x++) p.rect(x, hill(x), 1, PW, 'd');
      for (let x = 2; x < PW; x += 9) p.rect(x, hill(x) - 7, 1, 8, 'm');
      for (let x = 0; x < PW; x++) p.px(x, hill(x) - 6, 'n');
      p.rect(0, 40, PW, 8, 'c');
      const vine = new Cv(PW, PW);
      for (let x = 5; x < PW; x += 9) {
        const y = hill(x) - 8;
        vine.ell(x + 1, y, 4, 2, 'a').ell(x, y - 1, 3, 1, 'b').px(x - 2, y - 2, 'c');
        vine.spr(['gag', 'ggg', '.g.'], x - 1, y + 2).spr(['gg', 'g.'], x + 3, y + 2);
      }
      // barrel
      for (let j = 0; j < 15; j++) {
        const hw = 6 + Math.round(1.3 * Math.sin((Math.PI * j) / 14));
        p.rect(33 - hw, 29 + j, hw * 2, 1, 'm').px(33 - hw, 29 + j, 'W').px(32 + hw, 29 + j, 'W').px(34 - hw + 1, 29 + j, 'n');
      }
      p.rect(27, 29, 12, 1, 'W');
      [31, 39].forEach((y) => { for (let x = 25; x < 42; x++) if (p.get(x, y) !== 'f' && p.get(x, y) !== 'd' && p.get(x, y) !== 'c') p.px(x, y, 's'); });
      p.rect(32, 35, 2, 2, 'W').rect(24, 44, 18, 1, 'W');
      return {
        base: p, anim: vine.svg(0, 0, 'vs'),
        css: seqKF('vs', ['transform:translate(0,0)', 'transform:translate(1px,0)', 'transform:translate(0,0)', 'transform:translate(-1px,0)']) + `.vs{${anim('vs', 1.6)}}`,
      };
    },
    () => { // wine engineer: a grape graduate with mortarboard and diploma; the tassel swings
      const p = new Cv(PW, PW, 'e');
      p.rect(0, 38, PW, 10, 'd');
      const berry = ['.gg.', 'gcdg', 'gccg', '.gg.'];
      [[4, 0], [3, 1], [2, 2], [1, 3]].forEach(([n, r]) => { for (let i = 0; i < n; i++) p.spr(berry, 17 + r * 2 + i * 4 - (r ? 0 : 0) + (4 - n) * 0, 18 + r * 4); });
      p.rect(25, 13, 1, 4, 'W').spr(['.bb', 'bba', '.b.'], 26, 13);
      // mortarboard
      p.rect(19, 14, 14, 2, 'g').rect(17, 13, 18, 1, 'g').rect(22, 16, 8, 3, 'a').rect(25, 12, 2, 1, 'M');
      // diploma scroll with ribbon
      p.rect(4, 36, 14, 5, 'g').rect(5, 37, 12, 3, 'f').rect(3, 37, 2, 3, 'g').rect(17, 37, 2, 3, 'g').rect(10, 36, 2, 5, 'M').rect(9, 41, 1, 2, 'M').rect(12, 41, 1, 2, 'M');
      const t = (dx) => new Cv(PW, PW).rect(34, 13, 1, 1, 'M').rect(34 + dx, 14, 1, 4, 'M').rect(33 + dx, 18, 3, 1, 'M');
      return {
        base: p, anim: t(0).svg(0, 0, 't0') + t(1).svg(0, 0, 't1'),
        css: seqKF('t0', ['opacity:1', 'opacity:0', 'opacity:1', 'opacity:1']) + seqKF('t1', ['opacity:0', 'opacity:1', 'opacity:0', 'opacity:0'])
          + `.t0{${anim('t0', 1.2)}}.t1{opacity:0;${anim('t1', 1.2)}}`,
      };
    },
    () => { // public admin: desk, file stacks, a stamp coming down
      const p = new Cv(PW, PW, 'e');
      p.rect(30, 4, 14, 10, 'a').rect(31, 5, 12, 8, 'f').rect(36, 5, 1, 8, 'a').rect(31, 9, 12, 1, 'a');
      [[33, 6], [39, 7], [34, 10], [41, 11]].forEach(([x, y]) => p.rect(x, y, 1, 2, 'c'));
      p.rect(0, 27, PW, 9, 'n').rect(0, 27, PW, 1, 'W').rect(0, 36, PW, 12, 'm').rect(0, 36, PW, 1, 'W');
      p.rect(6, 40, 14, 5, 'W').rect(7, 41, 12, 3, 'm').rect(12, 42, 3, 1, 'n');
      p.rect(28, 40, 14, 5, 'W').rect(29, 41, 12, 3, 'm').rect(34, 42, 3, 1, 'n');
      for (let j = 0; j < 7; j++) p.rect(2 + (j % 2), 13 + j * 2, 12, 2, j % 3 === 2 ? 'c' : 'f').rect(2 + (j % 2), 14 + j * 2, 12, 1, 'a');
      for (let j = 0; j < 4; j++) p.rect(35 + (j % 2), 19 + j * 2, 11, 2, j % 2 ? 'c' : 'f').rect(35 + (j % 2), 20 + j * 2, 11, 1, 'a');
      p.rect(17, 29, 14, 6, 'f').rect(18, 30, 6, 1, 'a').rect(18, 32, 4, 1, 'a');
      const mark = new Cv(PW, PW).rect(25, 30, 5, 4, 'a').rect(26, 31, 3, 2, 'f').px(27, 31, 'a');
      const stamp = (dy) => new Cv(PW, PW).ell(27, 18 + dy, 2, 1, 'W').rect(26, 20 + dy, 3, 5, 'm').rect(24, 25 + dy, 7, 2, 'g').rect(25, 27 + dy, 5, 1, 'a');
      return {
        base: p, anim: mark.svg(0, 0, 'mk') + stamp(-6).svg(0, 0, 'su') + stamp(3).svg(0, 0, 'sd'),
        css: seqKF('su', ['opacity:1', 'opacity:1', 'opacity:1', 'opacity:0', 'opacity:1', 'opacity:1'])
          + seqKF('sd', ['opacity:0', 'opacity:0', 'opacity:0', 'opacity:1', 'opacity:0', 'opacity:0'])
          + seqKF('mk', ['opacity:0', 'opacity:0', 'opacity:0', 'opacity:0', 'opacity:1', 'opacity:1'])
          + `.su{${anim('su', 2.4)}}.sd{opacity:0;${anim('sd', 2.4)}}.mk{${anim('mk', 2.4)}}`,
      };
    },
    () => { // vibecoder: night, Pix with a laptop by a small campfire
      const p = new Cv(PW, PW, 'N');
      for (let y = 0; y < 8; y++) p.rect(0, y, PW, 1, 'k');
      [[4, 4], [13, 9], [22, 3], [37, 6], [44, 12], [30, 13], [8, 16]].forEach(([x, y], i) => p.px(x, y, i % 2 ? 'a' : 'i'));
      p.ell(40, 3, 2, 2, 'f').ell(41, 2, 2, 2, 'k').px(39, 5, 'f');
      for (let x = 0; x < PW; x += 4) pine(p, x + (x % 8 ? 1 : 0), 31, 6 + ((x * 7) % 5), 'k');
      p.rect(0, 30, PW, 18, '3');
      const glowD = ellD(34, 41, 15, 4, 30) ;
      p.spr(PX.SPRITES.logs, 25, 38);
      p.spr(PX.SPRITES.pix, 2, 22);
      // laptop in front of Pix, screen glowing toward Pix
      p.rect(4, 32, 13, 7, 'g').rect(5, 33, 11, 5, 'e').rect(6, 34, 4, 1, 'a').rect(7, 36, 5, 1, 'c').rect(3, 39, 15, 2, 't').rect(3, 40, 15, 1, 's');
      const fire = fireFrames('pf', 27, 24);
      const cur = new Cv(PW, PW).rect(13, 36, 1, 1, 'g');
      return {
        base: p, glow: `<path fill="${C.o}" fill-opacity=".12" d="${glowD}"/>`,
        anim: fire.svg + cur.svg(0, 0, 'cu'),
        css: fire.css + seqKF('cu', ['opacity:1', 'opacity:0']) + `.cu{${anim('cu', 1)}}`,
      };
    },
  ];
  const caps = [['HIPPIE', 'PARENTS'], ['FARM KID'], ['WINERY'], ['WINE', 'ENGINEER'], ['PUBLIC', 'ADMIN'], ['VIBECODER']];

  panels.forEach((fn, i) => {
    const fx = M + i * (OUTER + GAP), fy = M;
    bg.rect(fx, fy, OUTER, OUTER, i === 5 ? 'o' : 'a').rect(fx + 1, fy + 1, OUTER - 2, OUTER - 2, 'k');
    if (i < 5) bg.spr(['#..', '.#.', '..#', '.#.', '#..'], fx + OUTER + 3, fy + OUTER / 2 - 2, { '#': 'c' });
    const r = fn();
    body += `<g transform="translate(${fx + 2} ${fy + 2})">${r.base.svg()}${r.glow || ''}${r.anim}</g>`;
    css += r.css;
    caps[i].forEach((line, li) => {
      body += PX.text(line, { x: fx + OUTER / 2, y: fy + OUTER + 5 + li * 9, fill: i === 5 ? C.M : C.i, align: 'center' });
    });
  });

  write('life-strip.svg', {
    w: W, h: H, css, body: bg.svg() + body,
    title: 'Who is by the fire: a life in six pixel frames',
    desc: 'Six framed pixel-art panels, left to right: hippie parents (a camper van with a flower), a childhood on a farm (barn and a pecking chicken), the farm becomes a winery (vines and a barrel), wine engineer (a grape wearing a graduation cap, with a diploma), wine crisis into public administration (desk, file stacks, a stamp), and today: vibecoder (Pix with a laptop by a small campfire at night).',
  });
}

/* ── 3 · Repo wall ────────────────────────────────────────────────────────── */
function repoWall() {
  const W = 240, H = 135;
  const cats = [
    [17, 'b', 'EVERYDAY TOOLS'], [6, 'o', 'FAMILY WINERY'], [9, 'r', 'PERSONAL & PLAY'],
    [4, 'd', 'BRAND & TALKS'], [3, 'M', 'VAVE'], [2, 't', 'SYSTEM CONFIG'],
  ];
  const total = cats.reduce((a, c) => a + c[0], 0);
  const cv = new Cv(W, H, 'N');
  const mix = (hex, t, to) => '#' + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16), w = to === 'w' ? 255 : 0;
    return Math.round(v + (w - v) * t).toString(16).padStart(2, '0');
  }).join('');
  const COLS = 7, T = 11, P = 14, GX = 12, GY = 44;
  let tiles = '', css = '';
  const fills = {};
  let n = 0;
  cats.forEach(([count, c]) => {
    for (let k = 0; k < count; k++, n++) {
      const col = n % COLS, row = Math.floor(n / COLS), x = GX + col * P, y = GY + row * P;
      (fills[C[c]] ||= []).push([x + 1, y + 1, T - 2, T - 2]);
      (fills[mix(C[c], 0.45, 'w')] ||= []).push([x, y, T - 1, 1], [x, y + 1, 1, T - 2]);
      (fills[mix(C[c], 0.5, 'k')] ||= []).push([x + 1, y + T - 1, T - 1, 1], [x + T - 1, y, 1, T - 1]);
      tiles += `<rect class="w w${col + row}" x="${x}" y="${y}" width="${T}" height="${T}"/>`;
    }
  });
  // slot 42: the next one, dotted outline
  { const x = GX + (n % COLS) * P, y = GY + Math.floor(n / COLS) * P;
    for (let i = 0; i < T; i += 2) cv.px(x + i, y, '4').px(x + i, y + T - 1, '4').px(x, y + i, '4').px(x + T - 1, y + i, '4'); }
  let body = cv.svg();
  body += Object.entries(fills).map(([f, r]) => `<path fill="${f}" d="${dotD(r)}"/>`).join('');
  body += tiles;
  const diag = COLS + Math.ceil(total / COLS) - 1;
  css += kf('wv', [[0, 'opacity:0'], [0.015, 'opacity:.8'], [0.03, 'opacity:.45'], [0.045, 'opacity:0'], [1, 'opacity:0']]);
  css += `.w{fill:${C.f};opacity:0;${anim('wv', 5)}}`;
  for (let d = 0; d <= diag; d++) css += `.w${d}{animation-delay:${(d * 0.08).toFixed(2)}s}`;

  body += PX.text('41 REPOS', { x: GX, y: 10, scale: 2, fill: C.i });
  body += PX.text('ONE TILE PER REPOSITORY', { x: GX, y: 30, fill: C.t });
  const LX = 118;
  cats.forEach(([count, c, label], i) => {
    const y = GY + 4 + i * 13;
    body += `<path fill="${C[c]}" d="${dotD([[LX, y, 7, 7]])}"/>`;
    body += PX.text(String(count), { x: LX + 23, y, fill: C.i, align: 'right' });
    body += PX.text(label, { x: LX + 27, y, fill: C.i });
  });
  write('repo-wall.svg', {
    w: W, h: H, css, body,
    title: '41 repos',
    desc: 'A wall of 41 pixel tiles, one per repository, coloured by kind: 17 everyday tools, 6 family business and winery, 9 personal and play, 4 brand and presentation, 3 for VAVE, 2 system configuration. A light wave runs across the tiles.',
  });
}

/* ── 4 · Trail map ────────────────────────────────────────────────────────── */
function trailMap() {
  const W = 320, H = 180;
  const rnd = rng(5);
  const cv = new Cv(W, H, '2');
  const ST = [
    ['00', 'GATHER', 'tent', 36, 136], ['01', 'WHO', 'pix', 96, 136], ['02', 'SPARK', 'spark', 156, 136],
    ['03', 'KINDLING', 'kindling', 216, 136], ['04', 'FEED', 'fire', 276, 136],
    ['05', 'FORGE', 'forge', 264, 66], ['06', 'SMOKE', 'smoke', 204, 66], ['07', 'EMBERS', 'ember', 144, 66],
    ['08', 'OPEN FIRE', 'bubble', 84, 66],
  ];
  const CAMP = [30, 66];
  // texture: sparse grass dots
  for (let i = 0; i < 260; i++) cv.px(Math.floor(rnd() * W), Math.floor(rnd() * H), rnd() < 0.5 ? '3' : 'N');
  // river across the map, between the two rows
  const ry = (x) => 99 + Math.round(4 * Math.sin(x / 23) + 2 * Math.sin(x / 9 + 1));
  for (let x = 0; x < W; x++) { const y = ry(x); cv.rect(x, y - 4, 1, 9, 'g').px(x, y - 5, 'k').px(x, y + 5, 'k'); }
  // mountains top right with snow
  [[266, 46, 18], [292, 46, 24], [312, 46, 16], [244, 46, 12]].forEach(([cx, base, h]) => {
    for (let j = 0; j < h; j++) {
      const hw = Math.floor(j * 0.9);
      cv.rect(cx - hw, base - h + j, hw * 2 + 1, 1, j < h * 0.3 ? 'f' : '4').rect(cx + 1, base - h + j, hw, 1, j < h * 0.3 ? 'e' : '3');
    }
  });
  // hills
  [[120, 40, 16, 6], [196, 44, 12, 5], [60, 36, 14, 6], [300, 172, 18, 7], [16, 176, 16, 6], [180, 176, 22, 6]].forEach(([x, y, rx, r2]) => {
    for (const [x0, yy, w] of ellRows(x, y, rx, r2)) if (yy <= y) cv.rect(x0, yy, w, 1, yy === y - r2 ? '4' : '3');
  });
  // forests
  const tree = ['..a..', '.aag.', '.aag.', 'aaagg', '.aag.', 'aaagg', '..m..'];
  const forest = (x0, y0, w, h, n) => { for (let i = 0; i < n; i++) cv.spr(tree, x0 + Math.floor(rnd() * w), y0 + Math.floor(rnd() * h)); };
  forest(4, 24, 50, 14, 9); forest(110, 108, 30, 6, 4); forest(228, 108, 40, 6, 5); forest(46, 156, 30, 14, 5);
  forest(120, 156, 28, 14, 5); forest(236, 156, 40, 14, 6); forest(296, 60, 20, 22, 5); forest(170, 26, 30, 10, 4);
  forest(4, 112, 16, 4, 2);

  // trail: dotted polyline
  const way = [];
  ST.slice(0, 5).forEach(([, , , x, y], i) => { way.push([x, y]); if (i < 4) way.push([x + 30, y + (i % 2 ? -5 : 5)]); });
  way.push([298, 128], [304, 112], [304, 92], [292, 74]);
  ST.slice(5).forEach(([, , , x, y], i) => { way.push([x, y]); way.push([x - 30, y + (i % 2 ? 5 : -5)]); });
  way.pop(); way.push([56, 70], CAMP);
  let carry = 0;
  for (let i = 1; i < way.length; i++) {
    const [x0, y0] = way[i - 1], [x1, y1] = way[i], len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = carry; s < len; s += 5) {
      const x = Math.round(x0 + ((x1 - x0) * s) / len), y = Math.round(y0 + ((y1 - y0) * s) / len);
      cv.rect(x, y, 2, 2, 'd');
      carry = s + 5 - len;
    }
  }
  // bridge where the trail crosses the river
  { const by = ry(304); cv.rect(299, by - 7, 12, 15, 'W'); for (let j = by - 6; j < by + 7; j += 2) cv.rect(300, j, 10, 1, 'n'); cv.rect(299, by - 7, 1, 15, 'm').rect(310, by - 7, 1, 15, 'm'); }

  // stations: plate, icon, number badge, label
  let top = '';
  ST.forEach(([num, label, ic, x, y], i) => {
    cv.rect(x - 11, y - 11, 22, 22, i === 0 ? 'M' : 'a').rect(x - 10, y - 10, 20, 20, 'k');
    [[-11, -11], [10, -11], [-11, 10], [10, 10]].forEach(([dx, dy]) => cv.px(x + dx, y + dy, '2'));
    if (ic === 'pix') cv.spr(PX.SPRITES.pix, x - 8, y - 8);
    else cv.spr(PX.ICONS[ic], x - 8, y - 8, { '#': 'o' });
    cv.rect(x - 17, y - 18, 15, 11, 'k').rect(x - 16, y - 17, 13, 9, 'M');
    top += PX.text(num, { x: x - 15, y: y - 16, fill: C.k });
    top += PX.text(label, { x, y: y + 15, fill: C.i, align: 'center' });
  });

  // campfire at the end of the trail
  const camp = new Cv(W, H);
  camp.spr(PX.SPRITES.logs, CAMP[0] - 10, CAMP[1] + 4);
  [[-15, 9], [-12, 6], [11, 6], [13, 9], [-6, 10], [6, 10]].forEach(([dx, dy]) => camp.spr(['.tt.', 'tsss', '.ss.'], CAMP[0] + dx - 2, CAMP[1] + dy));
  const fire = fireFrames('cf', CAMP[0] - 8, CAMP[1] - 9);
  let body = cv.svg();
  body += `<path fill="${C.o}" fill-opacity=".1" d="${ellD(CAMP[0], CAMP[1] + 6, 22, 9)}"/><path fill="${C.o}" fill-opacity=".1" d="${ellD(CAMP[0], CAMP[1] + 6, 14, 6)}"/>`;
  body += fire.svg + camp.svg();
  let css = fire.css;
  // river shimmer
  const rip = [[], []];
  for (let x = 2; x < W - 2; x += 6) rip[(x / 6) % 2 | 0].push([x, ry(x) - 1 + ((x / 6) % 3 | 0), 3, 1]);
  rip.forEach((r, i) => { body += `<path class="rp${i}" fill="${C.b}" d="${dotD(r)}"/>`; css += seqKF(`rp${i}`, i ? ['opacity:0', 'opacity:1'] : ['opacity:1', 'opacity:0']) + `.rp${i}{${i ? 'opacity:0;' : ''}${anim(`rp${i}`, 1.6)}}`; });
  body += top;
  // title
  body += `<path fill="${C.k}" d="${dotD([[66, 6, 188, 21]])}"/>`;
  body += PX.text('PLAYING WITH FIRE', { x: 160, y: 10, scale: 2, fill: C.i, align: 'center' });
  // you are here, blinking at 00
  const yah = PX.text('YOU ARE HERE', { x: 46, y: 111, fill: C.M }) + `<path fill="${C.M}" d="${dotD([[33, 109, 7, 1], [34, 110, 5, 1], [35, 111, 3, 1], [36, 112, 1, 1]])}"/>`;
  body += `<g class="yah">${yah}</g>`;
  css += seqKF('yah', ['opacity:1', 'opacity:1', 'opacity:0']) + `.yah{${anim('yah', 1.2)}}`;
  // frame
  const fr = new Cv(W, H);
  fr.rect(0, 0, W, 2, 'k').rect(0, H - 2, W, 2, 'k').rect(0, 0, 2, H, 'k').rect(W - 2, 0, 2, H, 'k');
  fr.rect(3, 3, W - 6, 1, '4').rect(3, H - 4, W - 6, 1, '4').rect(3, 3, 1, H - 6, '4').rect(W - 4, 3, 1, H - 6, '4');
  body += fr.svg();
  write('trail-map.svg', {
    w: W, h: H, css, body,
    title: 'Playing with Fire: the trail map',
    desc: 'The talk as a pixel game map at night: a dotted trail leads past nine stations, 00 Gather, 01 Who, 02 Spark, 03 Kindling, 04 Feed, then over a bridge across the river to 05 Forge, 06 Smoke, 07 Embers and 08 Open fire, and ends at a crackling campfire. Hills, forests and snowy mountains around. A blinking marker says: you are here, at station 00.',
  });
}

/* ── 5 · Fireplace rules ──────────────────────────────────────────────────── */
function fireplaceRules() {
  const rules = ['NO CLIENT SECRETS OR\nPERSONAL DATA IN\nCONSUMER CHATS', 'KEYS NEVER LIVE IN CODE', 'EVERY TOOL HAS AN OWNER',
    'SHIP SMALL, REVIEW ALWAYS', 'TEST WHAT MATTERS', 'RESPECT LICENCES AND PEOPLE', 'HUMANS DECIDE'];
  const W = 216, BX = 8, BW = W - 16, TX = BX + 20, MAXW = BX + BW - 12 - TX;
  // explicit '\n' wins; otherwise greedy word wrap to MAXW
  const wrap = (s) => s.includes('\n') ? s.split('\n') : s.split(' ').reduce((ls, w) => {
    const cand = ls.length ? ls[ls.length - 1] + ' ' + w : w;
    if (ls.length && PX.textWidth(cand) <= MAXW) ls[ls.length - 1] = cand; else ls.push(w);
    return ls;
  }, []);
  const blocks = rules.map(wrap);
  const TITLE_H = 30;
  const plankH = blocks.map((b) => b.length * 9 + 7);
  const BY = 8, BH = TITLE_H + plankH.reduce((a, b) => a + b, 0) + 6;
  const H = BY + BH + 14;
  const cv = new Cv(W, H, 'N');
  // posts and ground
  [BX + 18, BX + BW - 22].forEach((x) => cv.rect(x, BY + BH - 2, 4, H - BY - BH + 2, 'W').rect(x + 1, BY + BH - 2, 1, H - BY - BH + 2, 'm'));
  cv.rect(0, H - 4, W, 4, '3');
  [[12, H - 6], [40, H - 6], [150, H - 6], [176, H - 6], [96, H - 6]].forEach(([x, y]) => cv.spr(['a.a', '.a.'], x, y));
  // board: outline, title plank, one plank per rule
  cv.rect(BX, BY, BW, BH, 'W').rect(BX + 2, BY + 2, BW - 4, BH - 4, 'm');
  let y = BY + 2;
  const planks = [TITLE_H - 2, ...plankH];
  const textY = [];
  planks.forEach((h, i) => {
    cv.rect(BX + 2, y, BW - 4, 1, 'n');
    if (i) cv.rect(BX + 2, y - 1, BW - 4, 1, 'W');
    textY.push(y);
    y += h;
  });
  [[BX + 4, BY + 4], [BX + BW - 6, BY + 4], [BX + 4, BY + BH - 6], [BX + BW - 6, BY + BH - 6]].forEach(([x, yy]) => cv.rect(x, yy, 2, 2, 't').px(x + 1, yy + 1, 's'));
  let body = cv.svg(), css = '';
  body += PX.text('FIREPLACE RULES', { x: W / 2, y: textY[0] + 8, scale: 2, fill: C.y, align: 'center' });
  const FA = ['..r..', '..rr.', '.ror.', '.roor', 'royyr', 'roywr', '.rrr.'];
  const FB = ['..r..', '.rr..', '.ror.', 'roor.', 'ryyor', 'rwyor', '.rrr.'];
  let fa = '', fb = '';
  blocks.forEach((lines, i) => {
    const ty = textY[i + 1] + 4;
    fa += PX.sprite(FA, { x: BX + 9, y: ty }); fb += PX.sprite(FB, { x: BX + 9, y: ty });
    body += PX.text(lines.join('\n'), { x: TX, y: ty, fill: C.f });
  });
  body += `<g class="fa">${fa}</g><g class="fb">${fb}</g>`;
  css += seqKF('fa', ['opacity:1', 'opacity:0', 'opacity:1', 'opacity:0', 'opacity:0']) + seqKF('fb', ['opacity:0', 'opacity:1', 'opacity:0', 'opacity:1', 'opacity:1']);
  css += `.fa{${anim('fa', 0.75)}}.fb{opacity:0;${anim('fb', 0.75)}}`;
  write('fireplace-rules.svg', {
    w: W, h: H, css, body,
    title: 'Fireplace rules',
    desc: `A wooden sign titled Fireplace rules, with seven rules, each marked by a small flickering flame: ${rules.map((r) => r.charAt(0) + r.slice(1).toLowerCase().replace('\n', ' ')).join('. ')}.`,
  });
}

/* ── 6 · Pix hops and waves ───────────────────────────────────────────────── */
function pixWave() {
  const W = 26, H = 26, X0 = 4, Y0 = 9;
  const armA = ['..gg', '..gg', '.gg.', '.g..', 'gg..', 'g...'];
  const armB = ['.gg.', 'gg..', 'g...', 'g...', 'g...', 'g...'];
  const pix = PX.sprite('pix', { x: X0, y: Y0 });
  let body = '';
  body += [7, 5, 3].map((rx, i) => `<path class="sh${i}" fill="${C.k}" fill-opacity=".45" d="${ellD(X0 + 8, Y0 + 15, rx, 0)}"/>`).join('');
  body += `<g class="hop">${pix}${PX.sprite(armA, { x: X0 + 15, y: Y0 + 2, cls: 'aa' })}${PX.sprite(armB, { x: X0 + 15, y: Y0 + 2, cls: 'ab' })}</g>`;
  const hop = [0, 0, -2, -4, -5, -4, -2, 0, 0, 0, 0, 0];
  const shadow = hop.map((h) => (h === 0 ? 0 : h > -3 ? 1 : 2));
  let css = seqKF('hop', hop.map((h) => `transform:translate(0,${h}px)`)) + `.hop{${anim('hop', hop.length * 0.1)}}`;
  [0, 1, 2].forEach((i) => { css += seqKF(`sh${i}`, shadow.map((s) => `opacity:${s === i ? 1 : 0}`)) + `.sh${i}{${i ? 'opacity:0;' : ''}${anim(`sh${i}`, hop.length * 0.1)}}`; });
  css += seqKF('aa', ['opacity:1', 'opacity:0']) + seqKF('ab', ['opacity:0', 'opacity:1']) + `.aa{${anim('aa', 0.4)}}.ab{opacity:0;${anim('ab', 0.4)}}`;
  write('pix-wave.svg', {
    w: W, h: H, css, body,
    title: 'Pix says hi',
    desc: 'Pix, the little pixel mascot with its yellow antenna light, hops and waves. Transparent background.',
  });
}

/* ── 7 · Station icons ────────────────────────────────────────────────────── */
function icons() {
  const list = [['00', 'tent'], ['01', 'pix'], ['02', 'spark'], ['03', 'kindling'], ['04', 'fire'], ['05', 'forge'], ['06', 'smoke'], ['07', 'ember'], ['08', 'bubble']];
  const names = { tent: 'Gather round', pix: "Who's by the fire", spark: 'The spark', kindling: 'Kindling', fire: 'Feeding the fire', forge: 'The forge', smoke: 'Smoke signals', ember: 'Embers', bubble: 'Open fire' };
  for (const [n, ic] of list) {
    write(`icon-${n}-${ic}.svg`, {
      w: 24, h: 24, body: PX.icon(ic, { x: 4, y: 4, fill: C.o }),
      title: `Station ${n}: ${names[ic]}`,
      desc: `Pixel icon "${ic}" in fire orange on a transparent background, station ${n} of the Campfire talk.`,
    });
  }
}

/* ══ Version 2: the pixel RPG quest ══════════════════════════════════════════ */
/* Shared bits for the v2 screens. All scenes are 320×180 (16:9) unless noted. */
/* Rarity frame colours, the same mapping as --rar-* in shared/campfire.css:
   common muted (t) · rare lime (d, --lcd-d) · epic orange (o, --fire-2) · legendary gold (y, --fire-3) */
const RAR = { common: 't', rare: 'd', epic: 'o', legendary: 'y' };
/** Double frame like the trail map */
function frame2(W, H) {
  const fr = new Cv(W, H);
  fr.rect(0, 0, W, 2, 'k').rect(0, H - 2, W, 2, 'k').rect(0, 0, 2, H, 'k').rect(W - 2, 0, 2, H, 'k');
  fr.rect(3, 3, W - 6, 1, '4').rect(3, H - 4, W - 6, 1, '4').rect(3, 3, 1, H - 6, '4').rect(W - 4, 3, 1, H - 6, '4');
  return fr.svg();
}
/** Static dim stars + three groups of twinkling stars; skip(x, y) keeps areas clear */
function stars(cv, W, yMax, seed, n, skip = () => false) {
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * yMax);
    if (!skip(x, y) && cv.get(x, y) !== '.') cv.px(x, y, rnd() < 0.5 ? '4' : 'a');
  }
  const tw = [[], [], []];
  for (let i = 0; i < Math.round(n / 3); i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * yMax);
    if (!skip(x, y)) tw[i % 3].push([x, y]);
  }
  let svg = '', css = '';
  tw.forEach((pts, i) => {
    svg += `<path class="tw${i}" d="${dotD(pts)}"/>`;
    css += seqKF(`tw${i}`, ['fill:' + C.i, 'fill:' + C.i, 'fill:' + C.a, 'fill:' + C.e, 'fill:' + C.i].slice(i % 2, 5));
    css += `.tw${i}{fill:${C.i};${anim(`tw${i}`, 1.7 + i * 0.9, -i * 0.4)}}`;
  });
  return { svg, css };
}
/** Two-frame toggle: a visible first, b hidden; period in s */
function flip(cls, a, b, period, delay = 0) {
  const svg = `<g class="${cls}a">${a}</g><g class="${cls}b">${b}</g>`;
  const css = seqKF(`${cls}a`, ['opacity:1', 'opacity:0']) + seqKF(`${cls}b`, ['opacity:0', 'opacity:1'])
    + `.${cls}a{${anim(cls + 'a', period, delay)}}.${cls}b{opacity:0;${anim(cls + 'b', period, delay)}}`;
  return { svg, css };
}
/** Blink: on 2/3 of the time */
function blinkCss(cls, period = 1.2) { return seqKF(cls, ['opacity:1', 'opacity:1', 'opacity:0']) + `.${cls}{${anim(cls, period)}}`; }
/** Pix with a blink every few seconds */
function pixBlinking(cls, x, y, period = 4, delay = 0) {
  const svg = `<g class="${cls}o">${PX.sprite('pix', { x, y })}</g><g class="${cls}c">${PX.sprite('pixBlink', { x, y })}</g>`;
  const slots = Array(16).fill(0); slots[11] = 1;
  const css = seqKF(`${cls}o`, slots.map((s) => `opacity:${s ? 0 : 1}`)) + seqKF(`${cls}c`, slots.map((s) => `opacity:${s}`))
    + `.${cls}o{${anim(cls + 'o', period, delay)}}.${cls}c{opacity:0;${anim(cls + 'c', period, delay)}}`;
  return { svg, css };
}
/** Plate behind text: dark box with a 1px border */
function plate(cv, x, y, w, h, border = '4', fill = 'k') { cv.rect(x, y, w, h, border).rect(x + 1, y + 1, w - 2, h - 2, fill); }

/* ── v2 · 1 · Inventory sheet: all items, labelled ────────────────────────── */
function itemsSheet() {
  const ids = LORE.ITEMS.map((it) => it.id);
  const missing = ids.filter((id) => !PX.ITEMS[id]);
  if (missing.length) throw new Error('PX.ITEMS missing: ' + missing.join(', '));
  ids.forEach((id) => { const r = PX.ITEMS[id]; if (r.length !== 16 || r.some((l) => l.length !== 16)) throw new Error(`item ${id} is not 16×16`); });
  const COLS = 6, CW = 88, CH = 60, M = 8, TOP = 30;
  const W = M * 2 + COLS * CW, NR = Math.ceil(ids.length / COLS), H = TOP + NR * CH + 18;
  const cv = new Cv(W, H, 'N');
  let ink = '';
  LORE.ITEMS.forEach((it, i) => {
    const cx = M + (i % COLS) * CW + CW / 2, y = TOP + Math.floor(i / COLS) * CH, tx = cx - 19;
    cv.rect(tx, y, 38, 38, RAR[it.rarity]).rect(tx + 1, y + 1, 36, 36, 'k');
    [[0, 0], [37, 0], [0, 37], [37, 37]].forEach(([dx, dy]) => cv.px(tx + dx, y + dy, 'N'));
    ink += `<g transform="translate(${tx + 3} ${y + 3}) scale(2)">${PX.item(it.id, { fill: C.o })}</g>`;
    ink += PX.text(it.name, { x: cx, y: y + 43, fill: C.i, align: 'center' });
  });
  ink += PX.text('WORDS BY THE FIRE', { x: M + 4, y: 8, scale: 2, fill: C.i });
  // neutral legend: what the words are about (the frame colours are decoration only)
  ink += PX.text(`${ids.length} WORDS · AI · CODE · GITHUB`, { x: M + 4, y: H - 13, fill: C.t });
  write('items-sheet.svg', {
    w: W, h: H, body: cv.svg() + ink,
    title: 'Words by the fire: AI, code and GitHub terms as pixel icons',
    desc: `A grid of ${ids.length} single-colour pixel icons in fire orange on night green, each in a coloured frame and labelled with its word: ${LORE.ITEMS.map((it) => it.name).join(', ')}.`,
  });
}

/** 5×7 text drawn onto a char canvas; col(row 0..7*s-1) → palette char. Returns width. */
function textCv(cv, str, x, y, s, col) {
  let cx = x;
  for (const ch of String(str)) {
    const rows = PX.FONT5x7[ch] || PX.FONT5x7[ch.toUpperCase()] || PX.FONT5x7['?'];
    rows.forEach((r, ry) => [...r].forEach((p, rx) => { if (p === '#') cv.rect(cx + rx * s, y + ry * s, s, s, col(ry * s)); }));
    cx += (rows[0].length + 1) * s;
  }
  return cx - x - s;
}
/** Outline every non-transparent pixel of `src` with colour c into `dst` (8-neighbourhood), then copy src on top */
function outlined(src, dst, c) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    if (src.get(x, y) !== '.') continue;
    let n = false;
    for (let j = -1; j <= 1 && !n; j++) for (let i = -1; i <= 1; i++) if ((i || j) && src.get(x + i, y + j) !== '.') { n = true; break; }
    if (n) dst.px(x, y, c);
  }
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.get(x, y) !== '.') dst.px(x, y, src.get(x, y));
}
/* Small extra mono icons for the map (16×16, '#') */
const MAPICON = {
  start: [
    '................', '................', '..############..', '.#............#.', '.#....#.......#.', '.#....##......#.', '.#....###.....#.', '.#....####....#.',
    '.#....####....#.', '.#....###.....#.', '.#....##......#.', '.#....#.......#.', '.#............#.', '..############..', '................', '................',
  ],
  sword: [
    '.............###', '............#..#', '...........#..#.', '..........#..#..', '.........#..#...', '..#.....#..#....', '..##...#..#.....', '...##.#..#......',
    '....##..#.......', '.....##.........', '....#.##........', '...#...##.......', '..#.....#.......', '.##.............', '##..............', '#...............',
  ],
};
const monoRows = (id) => MAPICON[id] || PX.ITEMS[id] || PX.ICONS[id];

/* ── v2 · 2 · World map: ten levels, overworld and cave ───────────────────── */
function worldMap() {
  const W = 320, H = 180, rnd = rng(21);
  const TOPY = 70, LOWY = 130, GROUND1 = 82, GROUND2 = 142, XS = [54, 108, 162, 216, 270];
  const LV = [
    ['PRESS\nSTART', 'start'], ['CHARACTER', 'pix'], ['LORE', 'llm'], ['INVENTORY', 'repo'], ['KINDLING', 'kindling'],
    ['CRAFTING', 'forge'], ['GUILD\nHALL', 'org'], ['QUEST\nLOG', 'system'], ['BOSS\nFIGHT', 'sword'], ['NEW\nGAME+', 'spark'],
  ].map(([label, ic], i) => ({ label, ic, x: i < 5 ? XS[i] : XS[9 - i], y: i < 5 ? TOPY : LOWY }));
  const cv = new Cv(W, H, 'N');
  // sky
  for (let y = 0; y < 14; y++) cv.rect(0, y, W, 1, 'k');
  for (let x = 0; x < W; x++) for (let y = 14; y < 17; y++) if ((x + y) % (y - 12) === 0) cv.px(x, y, 'k');
  // moon
  for (let y = 4; y < 26; y++) for (let x = 280; x < 304; x++) {
    const d1 = Math.hypot(x - 292, y - 14), d2 = Math.hypot(x - 295, y - 12);
    if (d1 <= 6.4 && d2 > 5.6) cv.px(x, y, d2 < 6.6 ? 'e' : 'f');
  }
  // far mountains
  const mt = (x) => 46 + Math.round(8 * Math.sin(x / 31) + 5 * Math.sin(x / 13 + 1) + 3 * Math.sin(x / 5.3));
  for (let x = 0; x < W; x++) { cv.rect(x, mt(x), 1, GROUND1 - mt(x), 'g'); if (mt(x + 1) > mt(x)) cv.px(x, mt(x), 'a'); }
  for (let x = -2; x < W + 3; x += 4 + Math.floor(rnd() * 5)) pine(cv, x, GROUND1, 6 + Math.floor(rnd() * 7), 'k');
  // overworld plateau: grass edge, earth with stones
  cv.rect(0, GROUND1, W, 26, '3').rect(0, GROUND1, W, 1, 'c').rect(0, GROUND1 + 1, W, 1, 'b');
  for (let x = 0; x < W; x += 3) if (rnd() < 0.5) cv.px(x, GROUND1 - 1, 'b');
  for (let i = 0; i < 40; i++) cv.rect(Math.floor(rnd() * W), GROUND1 + 4 + Math.floor(rnd() * 20), 2, 1, rnd() < 0.5 ? '4' : '2');
  // cave below: back wall bricks, stalactites, floor
  cv.rect(0, 108, W, GROUND2 - 108, '2');
  for (let y = 112; y < GROUND2; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < W; x += 12) cv.rect(x, y, 11, 1, 'N').rect(x, y, 1, 5, 'N');
  for (let x = 2; x < W; x += 7 + Math.floor(rnd() * 6)) { const h = 2 + Math.floor(rnd() * 4); for (let j = 0; j < h; j++) cv.rect(x + (j > h / 2 ? 1 : 0), 108 + j, j > h / 2 ? 1 : 2, 1, '3'); }
  cv.rect(0, GROUND2, W, H - GROUND2, 'g').rect(0, GROUND2, W, 1, '4');
  for (let i = 0; i < 30; i++) cv.rect(Math.floor(rnd() * W), GROUND2 + 3 + Math.floor(rnd() * 30), 2, 1, '3');
  // ladder down on the right
  const LX = 304;
  cv.rect(LX - 4, GROUND1 - 2, 1, GROUND2 - GROUND1 + 2, 'm').rect(LX + 4, GROUND1 - 2, 1, GROUND2 - GROUND1 + 2, 'm');
  for (let y = GROUND1; y < GROUND2; y += 4) cv.rect(LX - 3, y, 7, 1, 'n');
  // dotted path
  const way = [[30, TOPY], ...XS.map((x) => [x, TOPY]), [LX, TOPY], [LX, LOWY], ...[...XS].reverse().map((x) => [x, LOWY]), [24, LOWY]];
  for (let i = 1; i < way.length; i++) {
    const [x0, y0] = way[i - 1], [x1, y1] = way[i], len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < len; s += 5) cv.rect(Math.round(x0 + ((x1 - x0) * s) / len), Math.round(y0 + ((y1 - y0) * s) / len), 2, 2, 'd');
  }
  // torches in the cave (between levels), two-frame flicker
  const torchA = ['.r.', 'ror', 'oyo', '.W.', '.W.', '.W.'], torchB = ['r..', '.ro', 'roy', '.W.', '.W.', '.W.'];
  let tA = '', tB = '';
  [81, 135, 189, 243].forEach((x) => { tA += PX.sprite(torchA, { x: x - 1, y: 114 }); tB += PX.sprite(torchB, { x: x - 1, y: 114 }); });
  // level plates
  let top = '';
  LV.forEach(({ label, ic, x, y }, i) => {
    const edge = i === 0 ? 'M' : i === 8 ? 'R' : 'a';
    cv.rect(x - 11, y - 11, 22, 22, edge).rect(x - 10, y - 10, 20, 20, 'k');
    [[-11, -11], [10, -11], [-11, 10], [10, 10]].forEach(([dx, dy]) => cv.px(x + dx, y + dy, y === TOPY ? '3' : '2'));
    if (ic === 'pix') cv.spr(PX.SPRITES.pix, x - 8, y - 8);
    else cv.spr(monoRows(ic), x - 8, y - 8, { '#': i === 8 ? 'r' : 'o' });
    cv.rect(x - 17, y - 18, 15, 11, 'k').rect(x - 16, y - 17, 13, 9, 'M');
    top += PX.text(String(i).padStart(2, '0'), { x: x - 15, y: y - 16, fill: C.k });
    top += PX.text(label, { x, y: y + 15, fill: C.i, align: 'center' });
  });
  // save point: campfire at the end of the cave
  const SX = 22, camp = new Cv(W, H);
  camp.spr(PX.SPRITES.logs, SX - 10, GROUND2 - 6);
  const fire = fireFrames('wf', SX - 8, GROUND2 - 19);
  let body = cv.svg();
  body += `<path fill="${C.o}" fill-opacity=".12" d="${ellD(SX, GROUND2 - 6, 18, 12)}"/><path fill="${C.o}" fill-opacity=".1" d="${ellD(SX, GROUND2 - 6, 10, 7)}"/>`;
  body += fire.svg + camp.svg();
  top += PX.text('SAVE', { x: SX, y: GROUND2 + 4, fill: C.y, align: 'center' });
  let css = fire.css;
  const tor = flip('tc', tA, tB, 0.5);
  body += tor.svg; css += tor.css;
  // stars
  { const sk = new Cv(W, 44); for (let i = 0; i < 40; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 40); if (y < mt(x) - 3 && Math.hypot(x - 292, y - 14) > 9) sk.px(x, y, rnd() < 0.4 ? 'a' : '4'); } body += sk.svg(); }
  const tw = [[], [], []];
  for (let i = 0; i < 15; i++) { const x = Math.floor(rnd() * W), y = 2 + Math.floor(rnd() * 34); if (y < mt(x) - 4 && Math.hypot(x - 292, y - 14) > 10 && !(x > 60 && x < 260 && y < 30)) tw[i % 3].push([x, y]); }
  tw.forEach((pts, i) => {
    body += `<path class="tw${i}" d="${dotD(pts)}"/>`;
    css += seqKF(`tw${i}`, ['fill:' + C.i, 'fill:' + C.a, 'fill:' + C.e, 'fill:' + C.i].slice(i % 2)) + `.tw${i}{fill:${C.i};${anim(`tw${i}`, 1.7 + i * 0.9, -i * 0.4)}}`;
  });
  body += top;
  // Pix waiting at the start
  const pix = pixBlinking('wp', 18, TOPY - 4);
  body += pix.svg; css += pix.css;
  // blinking cursor over level 00
  const cur = `<path fill="${C.M}" d="${dotD([[XS[0] - 4, 44, 9, 1], [XS[0] - 3, 45, 7, 1], [XS[0] - 2, 46, 5, 1], [XS[0] - 1, 47, 3, 1], [XS[0], 48, 1, 1]])}"/>`;
  body += `<g class="cur">${cur}</g>`;
  css += blinkCss('cur', 1);
  // title
  body += `<path fill="${C.k}" d="${dotD([[66, 6, 188, 21]])}"/>`;
  body += PX.text('PLAYING WITH FIRE', { x: 160, y: 10, scale: 2, fill: C.i, align: 'center' });
  body += frame2(W, H);
  write('world-map.svg', {
    w: W, h: H, css, body,
    title: 'Playing with Fire: the world map',
    desc: 'A pixel game world map at night in side view. On the grassy overworld a dotted path runs past levels 00 Press start, 01 Character, 02 Lore, 03 Inventory and 04 Kindling; a ladder leads down into a torch-lit cave with 05 Crafting, 06 Guild hall, 07 Quest log, 08 Boss fight and 09 New game plus, ending at a campfire save point. Pix waits at the start, a yellow cursor blinks over level 00.',
  });
}

/* ── v2 · 3 · Title screen ────────────────────────────────────────────────── */
function titleScreen() {
  const W = 320, H = 180, HZ = 132, rnd = rng(33);
  const cv = new Cv(W, H, 'k');
  for (let y = 60; y < HZ; y++) for (let x = 0; x < W; x++) if (y > 96 || (x * 7 + y * 3) % (100 - y) === 0) cv.px(x, y, y > 112 ? '3' : 'N');
  for (let y = 96; y < 100; y++) for (let x = 0; x < W; x++) if ((x + y) % 2) cv.px(x, y, 'k');
  // hills and treeline
  for (let x = 0; x < W; x++) { const y = 112 + Math.round(4 * Math.sin(x / 19) + 3 * Math.sin(x / 7 + 1)); cv.rect(x, y, 1, HZ - y, '2'); }
  for (let x = -2; x < W + 3; x += 3 + Math.floor(rnd() * 5)) { const e = x < 70 ? (70 - x) / 70 : x > 250 ? (x - 250) / 70 : 0; pine(cv, x, HZ + 1, 6 + Math.floor(rnd() * 6) + Math.round(e * 14), 'k'); }
  cv.rect(0, HZ, W, H - HZ, '3');
  for (let y = HZ + 30; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) % 2 || y > HZ + 33) cv.px(x, y, '2');
  // static stars, away from the logo
  for (let i = 0; i < 70; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 100); if (cv.get(x, y) === 'k') cv.px(x, y, rnd() < 0.5 ? '4' : 'a'); }
  // logo: PLAYING / WITH (LCD greens) and FIRE in flame colours, dark outline + drop shadow
  const S = 4;
  const logo = new Cv(W, H);
  const green = (r) => (r < 8 ? 'f' : r < 16 ? 'e' : r < 24 ? 'd' : 'c');
  const flame = (r) => (r < 6 ? 'w' : r < 12 ? 'y' : r < 20 ? 'o' : 'r');
  const w1 = PX.textWidth('PLAYING', S), w2 = PX.textWidth('WITH FIRE', S), wWith = PX.textWidth('WITH ', S);
  const L1X = Math.floor((W - w1) / 2), L2X = Math.floor((W - w2) / 2);
  textCv(logo, 'PLAYING', L1X, 14, S, green);
  textCv(logo, 'WITH', L2X, 50, S, green);
  textCv(logo, 'FIRE', L2X + wWith, 50, S, flame);
  const shadow = new Cv(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (logo.get(x, y) !== '.') shadow.rect(x + 2, y + 2, 1, 1, 'g');
  const lg = new Cv(W, H);
  outlined(shadow, lg, 'k');
  outlined(logo, lg, 'k');
  // campfire + Pix
  const FX = 150, camp = new Cv(W, H);
  [[-15, 9], [-12, 6], [11, 6], [13, 9], [-6, 10], [6, 10]].forEach(([dx, dy]) => camp.spr(['.tt.', 'tsss', '.ss.'], FX + dx - 2, HZ + 4 + dy));
  camp.spr(PX.SPRITES.logs, FX - 10, HZ + 8);
  const fire = fireFrames('tf', FX - 8, HZ - 5);
  let body = cv.svg();
  body += [[40, 12], [26, 8], [14, 5]].map(([rx, ry]) => `<path fill="${C.o}" fill-opacity=".09" d="${ellD(FX, HZ + 12, rx, ry, HZ)}"/>`).join('');
  body += lg.svg();
  let css = fire.css;
  const tw = [[], [], []];
  for (let i = 0; i < 24; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 100); if (lg.get(x, y) === '.' && lg.get(x + 2, y) === '.' && lg.get(x - 2, y) === '.') tw[i % 3].push([x, y]); }
  tw.forEach((pts, i) => {
    body += `<path class="tw${i}" d="${dotD(pts)}"/>`;
    css += seqKF(`tw${i}`, ['fill:' + C.i, 'fill:' + C.a, 'fill:' + C.e, 'fill:' + C.i].slice(i % 2)) + `.tw${i}{fill:${C.i};${anim(`tw${i}`, 1.7 + i * 0.9, -i * 0.4)}}`;
  });
  body += fire.svg + camp.svg();
  const pix = pixBlinking('tp', FX + 16, HZ - 2);
  body += pix.svg; css += pix.css;
  body += PX.text('A CAMPFIRE QUEST THROUGH AI', { x: W / 2, y: 88, fill: C.t, align: 'center' });
  // PRESS START, blinking, with a cursor
  const ps = PX.text('PRESS START', { x: W / 2 + 4, y: 104, scale: 1, fill: C.y, align: 'center' })
    + `<path fill="${C.y}" d="${dotD([[W / 2 - 37, 104, 1, 7], [W / 2 - 36, 105, 1, 5], [W / 2 - 35, 106, 1, 3], [W / 2 - 34, 107, 1, 1]])}"/>`;
  body += `<g class="ps">${ps}</g>`;
  css += seqKF('ps', ['opacity:1', 'opacity:1', 'opacity:0']) + `.ps{${anim('ps', 1)}}`;
  body += PX.text('1 PLAYER  ·  90 MIN  ·  FOR VAVE', { x: W / 2, y: H - 10, fill: C.a, align: 'center' });
  write('title-screen.svg', {
    w: W, h: H, bg: C.k, css, body,
    title: 'Playing with Fire: title screen',
    desc: 'A pixel game title screen at night. Big pixel letters read Playing with fire, with the word fire in flame colours. Below: a campfire quest through AI, and a blinking press start. A starry sky, a dark treeline, and Pix sitting by a crackling campfire. Bottom line: 1 player, 90 minutes, for VAVE.',
  });
}

/* Tiny people (5×14): H hair, h skin, U top, L legs; two leg frames for walking. No faces. */
const PERSON = ['.HHH.', 'HhhhH', '.hhh.', '.UUU.', 'UUUUU', 'UUUUU', 'hUUUh', '.UUU.', '.UUU.', '.LLL.'];
const LEGS = [['.L.L.', '.L.L.', '.L.L.', '.k.k.'], ['.L.L.', 'L...L', 'L...L', 'k...k']];
const person = (frame, map) => [...PERSON, ...LEGS[frame]].map((r) => [...r].map((c) => map[c] || c).join(''));
const LOOKS = [
  { H: 'W', h: 'p', U: 'u', L: 'z' }, { H: 'k', h: 'q', U: 'v', L: 'g' }, { H: 's', h: 'p', U: 'x', L: 'z' },
  { H: 'm', h: 'p', U: 'b', L: 'k' }, { H: 'k', h: 'q', U: 'x', L: 'u' }, { H: 'W', h: 'q', U: 'u', L: 'g' },
];
/** A walker: group translated in pixel steps along x, legs flipping. dir 1 = right. */
function walker(cls, rowsA, rowsB, x0, y, dir, xFrom, xTo, dur, delay) {
  const flipRows = (r) => (dir < 0 ? r.map((l) => [...l].reverse().join('')) : r);
  const dist = Math.abs(xTo - xFrom), n = Math.round(dist / 2), stepT = dur / n;
  const a = PX.sprite(flipRows(rowsA), { x: x0, y }), b = PX.sprite(flipRows(rowsB), { x: x0, y });
  const svg = `<g class="${cls}"><g class="${cls}a">${a}</g><g class="${cls}b">${b}</g></g>`;
  const css = `@keyframes ${cls}{from{transform:translate(${xFrom - x0}px,0)}to{transform:translate(${xTo - x0}px,0)}}`
    + `.${cls}{animation:${cls} ${+dur.toFixed(3)}s steps(${n}) ${(-delay).toFixed(3)}s infinite}`
    + seqKF(`${cls}a`, ['opacity:1', 'opacity:0']) + seqKF(`${cls}b`, ['opacity:0', 'opacity:1'])
    + `.${cls}a{${anim(cls + 'a', stepT * 2)}}.${cls}b{opacity:0;${anim(cls + 'b', stepT * 2)}}`;
  return { svg, css };
}

/* ── v2 · 4 · Booth scene: VAVE's world, a stand at night ─────────────────── */
function boothScene() {
  const W = 320, H = 180, rnd = rng(44);
  const FLOOR = 136, CARPET = 118, BX0 = 56, BX1 = 264;
  const cv = new Cv(W, H, 'k');
  // hall: roof beams, hall lamps, back wall
  cv.rect(0, 12, W, FLOOR - 12, 'N');
  for (let x = -40; x < W + 40; x += 40) { cv.line(x, 0, x + 20, 12, '2'); cv.line(x + 40, 0, x + 20, 12, '2'); }
  cv.rect(0, 12, W, 1, '2');
  for (let x = 12; x < W; x += 24) cv.rect(x, 4, 3, 1, 'a');
  for (let y = 44; y < FLOOR; y += 8) for (let x = 0; x < W; x += 2) if (y % 16 === 4) cv.px(x, y, '2');
  // neighbour stands, dim
  cv.rect(4, 64, 44, FLOOR - 64, 'g').rect(4, 64, 44, 1, '4').rect(12, 72, 26, 10, '2').rect(14, 74, 22, 1, '4').rect(14, 77, 16, 1, '4');
  cv.rect(276, 58, 40, FLOOR - 58, 'g').rect(276, 58, 40, 1, '4').rect(284, 66, 24, 18, '3').rect(286, 68, 20, 14, '4');
  // hall floor with aisle stripes
  cv.rect(0, FLOOR, W, H - FLOOR, '3');
  for (let y = FLOOR + 1; y < H; y++) for (let x = 0; x < W; x++) if ((x * 3 + y * 7) % 23 === 0) cv.px(x, y, '2');
  cv.rect(0, H - 8, W, 1, '4');
  for (let x = 0; x < W; x += 12) cv.rect(x, H - 7, 6, 1, '2');
  // booth: back wall, side returns, carpet, platform edge
  cv.rect(BX0 + 4, 42, BX1 - BX0 - 8, CARPET - 42, 'b').rect(BX0 + 4, 42, BX1 - BX0 - 8, 2, 'c');
  cv.rect(BX0, 46, 4, CARPET - 46, 'a').rect(BX1 - 4, 46, 4, CARPET - 46, 'a');
  for (let x = BX0 + 4; x < BX1 - 4; x += 26) cv.rect(x, 44, 1, CARPET - 44, 'a');
  cv.rect(BX0, CARPET, BX1 - BX0, FLOOR - CARPET - 2, 'a');
  for (let y = CARPET; y < FLOOR - 2; y++) for (let x = BX0; x < BX1; x++) if ((x + 2 * y) % 5 === 0) cv.px(x, y, 'b');
  cv.rect(BX0, FLOOR - 2, BX1 - BX0, 1, 't').rect(BX0, FLOOR - 1, BX1 - BX0, 1, 's');
  // LED wall: frame and dark modules
  const LX = 108, LY = 50, LW = 100, LH = 52;
  cv.rect(LX - 2, LY - 2, LW + 4, LH + 4, 's').rect(LX, LY, LW, LH, 'k');
  for (let y = LY; y < LY + LH; y += 13) for (let x = LX; x < LX + LW; x += 2) cv.px(x, y, 'N');
  for (let x = LX + 25; x < LX + LW; x += 25) for (let y = LY; y < LY + LH; y += 2) cv.px(x, y, 'N');
  // truss with chains, spot cans; banner below
  const TY = 14;
  for (let x = 64; x <= 256; x += 192) for (let y = 0; y < TY; y += 2) cv.px(x, y, 's');
  cv.rect(48, TY, 224, 1, 't').rect(48, TY + 7, 224, 1, 't');
  for (let x = 48; x < 272; x += 8) { cv.line(x, TY + 1, x + 4, TY + 6, 's'); cv.line(x + 4, TY + 6, x + 8, TY + 1, 's'); }
  cv.rect(48, TY, 1, 8, 't').rect(271, TY, 1, 8, 't');
  const SPOTS = [84, 150, 202, 240];
  SPOTS.forEach((x) => cv.rect(x - 1, TY + 8, 3, 3, 's').rect(x - 1, TY + 11, 3, 1, 'f'));
  cv.rect(124, TY + 8, 1, 2, 't').rect(195, TY + 8, 1, 2, 't');
  cv.rect(122, TY + 10, 76, 15, 'f').rect(122, TY + 24, 76, 1, 't');
  // counter with a host behind it and a tablet
  cv.spr(person(0, LOOKS[1]), 84, 88);
  cv.rect(68, 98, 42, 2, 't').rect(70, 100, 38, 22, 'f').rect(70, 120, 38, 2, 'e').rect(104, 100, 4, 20, 'i');
  cv.rect(74, 104, 22, 1, 'i').rect(96, 96, 5, 2, 'k');
  // tall plant
  cv.rect(114, 112, 7, 8, 'W').rect(115, 112, 5, 1, 'm');
  [[117, 92, 'c'], [114, 98, 'b'], [119, 100, 'b'], [116, 104, 'c'], [113, 106, 'b'], [120, 106, 'c']].forEach(([x, y, c]) => cv.ell(x, y, 2, 3, c));
  cv.rect(117, 96, 1, 16, 'a');
  // plinth with product, lit by a spot
  cv.rect(196, 96, 14, 24, 'f').rect(206, 96, 4, 24, 't').rect(195, 95, 16, 1, 'i');
  cv.rect(199, 86, 8, 9, 'd').rect(199, 86, 8, 2, 'e').rect(205, 88, 2, 7, 'c');
  // lounge: two chairs and a round table
  const chair = (x, flip) => {
    const bx = flip ? x + 10 : x;
    cv.rect(bx, 104, 2, 16, 'a').rect(x, 112, 12, 4, 'a').rect(x, 112, 12, 1, 'c').rect(x + 1, 116, 1, 4, 's').rect(x + 10, 116, 1, 4, 's');
    cv.rect(flip ? x : x + 9, 109, 3, 3, 'b');
  };
  chair(220, false); chair(248, true);
  cv.rect(236, 110, 10, 2, 'f').rect(240, 112, 2, 7, 's').rect(237, 119, 8, 1, 's');
  cv.rect(238, 108, 2, 2, 'i');
  // booth number
  cv.rect(BX1 - 26, 48, 18, 9, 'e');
  // a visitor looking at the LED wall, a second one in the lounge
  cv.spr(person(0, LOOKS[2]), 156, 112);
  { const L = LOOKS[4], up = person(0, L).slice(0, 9); cv.spr(up, 251, 102); cv.rect(246, 110, 7, 2, L.L).rect(246, 112, 2, 6, L.L).rect(245, 118, 3, 1, 'k'); }
  let body = cv.svg(), css = '';
  body += PX.text('B12', { x: BX1 - 17, y: 49, fill: C.g, align: 'center' });
  body += PX.text('BRAND SPACE', { x: 160, y: TY + 14, fill: C.g, align: 'center' });
  // spot beam on the plinth and a light pool on the carpet
  const beam = [];
  for (let y = TY + 12; y < 96; y++) { const hw = 1 + Math.floor((y - TY - 12) / 9); beam.push([203 - hw, y, hw * 2 + 1, 1]); }
  body += `<path fill="${C.f}" fill-opacity=".1" d="${dotD(beam)}"/><path fill="${C.f}" fill-opacity=".12" d="${ellD(203, 126, 16, 3)}"/>`;
  [84, 150].forEach((x) => { const b = []; for (let y = TY + 12; y < 44; y++) { const hw = 1 + Math.floor((y - TY - 12) / 6); b.push([x - hw, y, hw * 2 + 1, 1]); } body += `<path fill="${C.f}" fill-opacity=".07" d="${dotD(b)}"/>`; });
  // LED wall: two lines of type flowing in pixel steps, clipped to the wall.
  // The still (frame 0, reduced motion, PNG) shows only whole words: each loop is shifted so that one phrase
  // that fits the wall sits centred in it and its neighbours fall outside the clip.
  const T1 = 'COMMUNICATION IN SPACE  ·  ', T2 = 'BRAND · SPACE · STORY · PEOPLE · ';
  const S1 = 'IN SPACE', S2 = 'STORY · PEOPLE';
  const w1 = PX.textWidth(T1, 2) + 6, w2 = PX.textWidth(T2) + 4;
  const at = (t, sub, s) => { const i = t.indexOf(sub); return i ? PX.textWidth(t.slice(0, i), s) + s : 0; };
  const x1 = LX + Math.floor((LW - PX.textWidth(S1, 2)) / 2) - at(T1, S1, 2);
  const x2 = LX + Math.floor((LW - PX.textWidth(S2)) / 2) - at(T2, S2, 1);
  body += `<clipPath id="boothLed"><rect x="${LX}" y="${LY}" width="${LW}" height="${LH}"/></clipPath><g clip-path="url(#boothLed)">`;
  body += `<g class="ld1">${[0, 1, 2].map((k) => PX.text(T1, { x: x1 + k * w1, y: LY + 10, scale: 2, fill: C.e })).join('')}</g>`;
  body += `<g class="ld2">${[-1, 0, 1, 2].map((k) => PX.text(T2, { x: x2 + k * w2, y: LY + 34, fill: C.c })).join('')}</g>`;
  body += `<g class="ld3"><path fill="${C.a}" d="${dotD(Array.from({ length: 24 }, (_, i) => [LX + 2 + i * 4, LY + 46 - (i * 7 % 5), 2, 1 + (i * 7 % 5)]))}"/></g></g>`;
  css += `@keyframes ld1{to{transform:translate(-${w1}px,0)}}.ld1{animation:ld1 ${(w1 / 18).toFixed(2)}s steps(${w1}) infinite}`;
  css += `@keyframes ld2{to{transform:translate(${w2}px,0)}}.ld2{animation:ld2 ${(w2 / 12).toFixed(2)}s steps(${w2}) infinite}`;
  css += seqKF('ld3', ['opacity:1', 'opacity:.5', 'opacity:1', 'opacity:.7']) + `.ld3{${anim('ld3', 1.2)}}`;
  // visitors and Pix walking the aisle
  const walkers = [
    [0, 150, 1, 14, 0], [1, 158, -1, 18, 5], [3, 166, 1, 11, 7], [5, 150, -1, 16, 9], [2, 162, -1, 21, 2],
  ];
  walkers.forEach(([look, y, dir, dur, delay], i) => {
    const w = walker(`vw${i}`, person(0, LOOKS[look]), person(1, LOOKS[look]), 30 + i * 60, y - 14, dir, dir > 0 ? -10 : W + 4, dir > 0 ? W + 4 : -10, dur, delay);
    body += w.svg; css += w.css;
  });
  const pixA = PX.SPRITES.pix, pixB = [...pixA.slice(0, 13), '...ggg....gg....', '....gg....ggg...', '................'];
  const pw = walker('pw', pixA, pixB, 120, 154, 1, -18, W + 4, 24, 13);
  body += pw.svg; css += pw.css;
  body += frame2(W, H);
  write('booth-scene.svg', {
    w: W, h: H, bg: C.k, css, body,
    title: 'A stand at the fair, at night',
    desc: 'Pixel art of a trade-fair hall at night with an open stand: a rigging truss with spotlights and a hanging banner reading Brand space, an LED wall where pixel type flows (Communication in space), a white reception counter with a host, a tall plant, a lit product plinth, two lounge chairs with a small table, and carpet on a raised floor. Tiny visitors walk along the aisle, and Pix walks among them.',
  });
}

/** Two frames of the same small canvas drawing → svg + css (frame b shown `share` of the time) */
function frames2(cls, draw, w, h, x, y, scale, period, share = 0.5, delay = 0) {
  const g = (f) => { const c = new Cv(w, h); draw(c, f); return c.svg(); };
  const tr = (s) => (scale === 1 ? `<g transform="translate(${x} ${y})">${s}</g>` : `<g transform="translate(${x} ${y}) scale(${scale})">${s}</g>`);
  const n = Math.max(2, Math.round(1 / share)), slots = Array(n).fill(0); slots[n - 1] = 1;
  const svg = `<g class="${cls}a">${tr(g(0))}</g><g class="${cls}b">${tr(g(1))}</g>`;
  const css = seqKF(`${cls}a`, slots.map((s) => `opacity:${s ? 0 : 1}`)) + seqKF(`${cls}b`, slots.map((s) => `opacity:${s}`))
    + `.${cls}a{${anim(cls + 'a', period, delay)}}.${cls}b{opacity:0;${anim(cls + 'b', period, delay)}}`;
  return { svg, css };
}

/* ── v2 · 5 · Lore strip: AI history in twelve pixel icons ────────────────── */
const LORE_ICONS = {
  teletype: (c) => c.spr(['................', '.....ffffff.....', '.....faaaaf.....', '.....ffffff.....', '.....faaaff.....', '..tttttttttttt..',
    '.tsssssssssssst.', '.tsksksksksksst.', '.tsskskskskssst.', '.tsksksksksksst.', '.tsssssssssssst.', '..tttttttttttt..', '..k..........k..'], 0, 1),
  sun: (c) => { [[7, 0, 7, 2], [7, 13, 7, 15], [0, 7, 2, 7], [13, 7, 15, 7], [2, 2, 3, 3], [12, 2, 11, 3], [2, 12, 3, 11], [12, 12, 11, 11]].forEach(([a, b, d, e]) => c.line(a, b, d, e, 'd')); c.ell(7, 7, 4, 4, 'e'); c.ell(7, 7, 2, 2, 'f'); },
  eliza: (c, f) => {
    c.rect(1, 1, 14, 11, 't').rect(2, 2, 12, 8, 'k').rect(1, 11, 14, 1, 's').rect(6, 12, 4, 1, 's').rect(4, 13, 8, 2, 't');
    c.px(3, 3, 'd').px(4, 4, 'd').px(3, 5, 'd').rect(6, 3, 6, 1, 'c').rect(6, 5, 4, 1, 'c').rect(3, 7, 7, 1, 'c');
    if (!f) c.rect(11, 7, 2, 1, 'e');
  },
  winter: (c, f) => {
    c.line(7, 0, 7, 14, 'f').line(0, 7, 14, 7, 'f').line(2, 2, 12, 12, 'i').line(12, 2, 2, 12, 'i');
    [[6, 1], [8, 1], [6, 13], [8, 13], [1, 6], [1, 8], [13, 6], [13, 8]].forEach(([x, y]) => c.px(x, y, 'f'));
    c.rect(6, 6, 3, 3, 'e');
    if (f) [[2, 0], [14, 3], [0, 13], [12, 14]].forEach(([x, y]) => c.px(x, y, 'i'));
  },
  knight: (c) => c.spr(['......ee........', '.....eeee.......', '....eeeeee......', '...eeeekeee.....', '..eeeeeeeeee....', '..eeeeeeeeeee...', '..eee...eeeee...',
    '........eeeee...', '.......eeeeee...', '......eeeeeee...', '.....eeeeeeee...', '....eeeeeeeeee..', '...dddddddddddd.', '...eeeeeeeeeeee.'], 0, 1),
  cat: (c, f) => c.spr(['..t.t...........', '..tttt..........', '..tktt..........', '..tttt..........', '...tt...........', '..ttttt.........', '..tttttt........', '..ttttttt.......',
    '..tttttttt......', '..tttttttt....' + (f ? '.t' : 't.'), '..tttttttt....t.', '..ttttttttt..t..', '..tt.tt.tttttt..'], 0, 1),
  go: (c) => {
    c.rect(0, 0, 16, 16, 'n');
    for (let k = 2; k < 16; k += 4) { c.rect(k, 1, 1, 14, 'W'); c.rect(1, k, 14, 1, 'W'); }
    [[2, 2, 'k'], [6, 6, 'f'], [10, 6, 'k'], [6, 10, 'k'], [10, 10, 'f'], [14, 2, 'f'], [2, 14, 'f'], [14, 10, 'k']].forEach(([x, y, s]) => c.rect(x - 1, y, 3, 1, s).rect(x, y - 1, 1, 3, s));
  },
  eye: (c, f) => {
    if (f) { c.rect(1, 7, 14, 1, 'e').rect(3, 8, 10, 1, 'e'); return; }
    for (let x = 0; x < 16; x++) { const hh = Math.round(4.6 * Math.sin((Math.PI * (x + 0.5)) / 16)); if (hh) c.rect(x, 7 - hh + 1, 1, hh * 2 - 1, 'f').px(x, 7 - hh, 'e').px(x, 7 + hh, 'e'); }
    c.ell(7, 7, 3, 3, 'c'); c.rect(7, 6, 2, 3, 'k'); c.px(6, 5, 'i');
  },
  chat: (c, f) => {
    c.rect(1, 2, 14, 9, 'f').px(1, 2, '.').px(14, 2, '.').px(1, 10, '.').px(14, 10, '.').rect(3, 11, 3, 1, 'f').rect(3, 12, 2, 1, 'f').px(3, 13, 'f');
    [4, 7, 10].forEach((x, i) => c.rect(x, (f + i) % 2 ? 5 : 6, 2, 2, 'a'));
  },
  pizza: (c, f) => {
    c.rect(1, 1, 14, 2, 'n').rect(1, 3, 14, 1, 'm');
    for (let y = 4; y < 13; y++) { const hw = Math.round(6.5 * (1 - (y - 4) / 9)); c.rect(8 - hw - 1, y, hw * 2 + 1, 1, 'e'); }
    [[4, 5], [9, 6], [6, 8]].forEach(([x, y]) => c.rect(x, y, 2, 2, 'm'));
    c.rect(10, 4, 1, 3, 'i').rect(7, 12, 1, f ? 3 : 2, 'i');
    if (f) c.px(7, 15, 'i');
  },
  vibes: (c, f) => {
    c.rect(4, 2, 8, 1, 't').px(3, 3, 't').px(12, 3, 't').rect(2, 4, 1, 4, 't').rect(13, 4, 1, 4, 't');
    c.rect(1, 8, 4, 6, 'c').rect(11, 8, 4, 6, 'c').rect(2, 9, 2, 4, 'b').rect(12, 9, 2, 4, 'b');
    const y = f ? 4 : 6;
    c.rect(7, y, 1, 5, 'e').rect(8, y, 2, 1, 'e').rect(6, y + 4, 2, 2, 'e');
  },
  pix: (c, f) => c.spr(f ? PX.SPRITES.pixBlink : PX.SPRITES.pix, 0, 0),
};
function loreStrip() {
  const E = [
    ['1950', 'TURING', 'teletype'], ['1956', 'ONE\nSUMMER', 'sun'], ['1966', 'ELIZA', 'eliza', 1.1], ['1974', 'AI\nWINTER', 'winter', 1.6],
    ['1997', 'DEEP\nBLUE', 'knight'], ['2012', 'CAT\nPAPER', 'cat', 1.4], ['2016', 'MOVE 37', 'go'], ['2017', 'ATTENTION', 'eye', 3.6, 0.15],
    ['2022', 'CHAT', 'chat', 1], ['2024', 'GLUE\nPIZZA', 'pizza', 1.8], ['2025', 'VIBES', 'vibes', 0.6], ['2026', 'YOU ARE\nHERE', 'pix', 4, 0.1],
  ];
  const CW = 54, M = 8, TY = 16, LINE = 59, W = M * 2 + E.length * CW, H = 90;
  const cv = new Cv(W, H, 'N');
  for (let x = M; x < W - M; x += 3) cv.rect(x, LINE, 2, 1, 'a');
  let body = '', css = '', ink = '';
  E.forEach(([year, cap, ic, period, share], i) => {
    const cx = M + i * CW + CW / 2, tx = cx - 18, now = i === E.length - 1;
    cv.rect(tx, TY, 36, 36, now ? 'M' : 'a').rect(tx + 1, TY + 1, 34, 34, 'k');
    [[0, 0], [35, 0], [0, 35], [35, 35]].forEach(([dx, dy]) => cv.px(tx + dx, TY + dy, 'N'));
    cv.rect(cx - 1, TY + 36, 2, LINE - TY - 37, '4').rect(cx - 2, LINE - 1, 4, 3, now ? 'M' : 'd');
    if (period) { const r = frames2(`ls${i}`, LORE_ICONS[ic], 16, 16, tx + 2, TY + 2, 2, period, share || 0.5); body += r.svg; css += r.css; }
    else { const c = new Cv(16, 16); LORE_ICONS[ic](c, 0); body += `<g transform="translate(${tx + 2} ${TY + 2}) scale(2)">${c.svg()}</g>`; }
    ink += PX.text(year, { x: cx, y: 5, fill: now ? C.M : C.t, align: 'center' });
    ink += PX.text(cap, { x: cx, y: LINE + 6, fill: now ? C.M : C.i, align: 'center' });
  });
  body = cv.svg() + body + ink;
  write('lore-strip.svg', {
    w: W, h: H, css, body,
    title: 'The lore: AI history in twelve pixel icons',
    desc: 'A timeline of framed pixel icons with years: 1950 a teletype (Turing), 1956 a sun (one summer), 1966 a terminal (ELIZA), 1974 a snowflake (AI winter), 1997 a chess knight (Deep Blue), 2012 a cat (the cat paper), 2016 go stones (move 37), 2017 an eye (attention), 2022 a chat bubble, 2024 a pizza slice dripping glue, 2025 headphones (vibes), and 2026 Pix: you are here.',
  });
}

/* ── v2 · 6 · Bosses: the risks as friendly monsters, 2-frame idle ────────── */
const BOSS_DRAW = {
  hallucinator: (c, f) => {
    const y = 13 + f;
    c.ell(17, 33, f ? 5 : 7, 1, '2');
    [[5, y - 2], [26, y - 2]].forEach(([x, yy], k) => c.rect(x, yy + (f ^ k ? 1 : 0), 5, 2, 'a').rect(x + (k ? 3 : 0), yy + 2, 2, 2, 'a'));
    c.ell(17, y, 9, 9, 'g'); c.ell(17, y, 8, 8, 'f'); c.ell(17, y, 4, 4, 'c');
    const sw = f ? [[15, y - 2], [19, y - 2], [20, y + 1], [14, y + 2]] : [[17, y - 3], [20, y], [17, y + 3], [14, y]];
    sw.forEach(([x, yy]) => c.rect(x, yy, 1, 1, 'e'));
    c.rect(16, y - 1, 3, 3, 'k').px(13, y - 5, 'i').px(14, y - 5, 'i');
    const cube = (x, yy) => c.rect(x, yy, 4, 1, 'e').rect(x, yy + 1, 4, 3, 'd').rect(x + 3, yy + 1, 1, 3, 'c');
    cube(5, 26 - f); cube(27, 24 + f);
  },
  leaker: (c, f) => {
    c.ell(17, 33, 9, 1, 'a');
    c.line(8, 11, 12, 5, 's').line(12, 5, 22, 5, 's').line(22, 5, 27, 11, 's');
    c.rect(13, 3 + f, 9, 9, 'f'); [5, 7, 9].forEach((yy) => c.rect(14, yy + f, 6, 1, 'a'));
    for (let y = 10; y < 30; y++) { const i = Math.floor((y - 10) / 5); c.rect(8 + i, y, 20 - 2 * i, 1, y % 5 === 4 ? 's' : 't'); }
    c.rect(7, 10, 22, 1, 'i');
    c.rect(13, 15, 2, 2, 'g').rect(21, 15, 2, 2, 'g');
    [[11, 21], [18, 24], [24, 20]].forEach(([x, y], k) => { c.px(x, y, 'k'); const d = (f + k) % 2 ? 3 : 6; c.rect(x, y + d, 1, 2, 'e'); });
  },
  goblin: (c, f) => {
    c.ell(17, 33, 9, 1, '2');
    c.rect(11, 28, 4, 4, 'b').rect(20, 28, 4, 4, 'b');
    c.ell(17, 22, 8, 7, 'b');
    c.ell(17, 10, 6, 5, 'c');
    c.spr(f ? ['ccc..', '.ccc.', '..cc.'] : ['cc...', '.ccc.', '..cc.'], 6, 7 - f);
    c.spr(f ? ['..ccc', '.ccc.', '.cc..'] : ['...cc', '.ccc.', '.cc..'], 24, 7 - f);
    c.rect(14, 9, 2, 2, 'k').rect(19, 9, 2, 2, 'k').px(14, 9, 'e').px(19, 9, 'e');
    c.ell(17, 21, 4, 4, 'f'); c.ell(17, 21, 2, 2, 'b');
    // keys: ring + shaft + bit, pointing outwards, jingling
    [[10, 18, -1], [24, 17, 1], [11, 25, -1], [23, 25, 1]].forEach(([x, y, d], k) => {
      const yy = y + ((f + k) % 2);
      c.rect(x - 1, yy - 1, 3, 3, 'f').px(x, yy, 'k');
      const sx = d > 0 ? x + 2 : x - 5;
      c.rect(sx, yy, 4, 1, 't').px(d > 0 ? x + 5 : x - 5, yy + 1, 't').px(d > 0 ? x + 4 : x - 4, yy + 1, 't');
    });
    c.rect(7, 18, 4, 3, 'c').rect(24, 18, 4, 3, 'c');
  },
  lich: (c, f) => {
    const y = f ? 1 : 0;
    c.ell(17, 34, 8, 1, '2');
    for (let r = 0; r < 18; r++) { const hw = 5 + Math.floor(r / 2.4); c.rect(17 - hw, 14 + r - y, hw * 2 + 1, 1, r % 6 === 5 ? 'q' : 'v'); }
    for (let x = 8; x < 27; x += 3) c.px(x + (f ? 1 : 0), 32 - y, '.');
    c.ell(17, 9 - y, 6, 6, 'v'); c.ell(17, 9 - y, 4, 4, 'f'); c.rect(15, 8 - y, 2, 2, 'k').rect(19, 8 - y, 2, 2, 'k').rect(16, 12 - y, 3, 1, 'g');
    c.rect(22, 16 - y, 11, 9, 'f').rect(22, 16 - y, 11, 1, 't').rect(22, 24 - y, 11, 1, 't').rect(21, 15 - y, 1, 11, 'n').rect(33, 15 - y, 1, 11, 'n');
    c.spr(['.ggggg.', 'g.....g', 'g.ggg.g', 'g.g...g', 'g.ggg.g', 'g.....g', '.ggggg.'], 24, 17 - y);
    c.rect(19, 18 - y, 4, 2, 'f');
  },
  golem: (c, f) => {
    c.ell(17, 33, 10, 1, '2');
    c.rect(12, 28, 4, 5, 's').rect(19, 28, 4, 5, 's');
    c.rect(9, 13, 17, 15, 's').rect(10, 14, 15, 13, 't').rect(13, 17, 9, 6, 's').rect(14, 18, 2, 2, 'm').rect(18, 20, 3, 1, 'm');
    c.rect(5, 14, 4, 11, 's').rect(26, 14, 4, 11, 's').rect(5, 25, 4, 2, 't').rect(26, 25, 4, 2, 't');
    c.rect(11, 3, 13, 9, 't').rect(11, 11, 13, 1, 's').rect(14, 6, 3, 2, f ? 'e' : 'a').rect(19, 6, 3, 2, 'a').px(12, 4, 'm');
    c.line(17, 2, 17, 1, 's').line(17, 1, 20, 0, 's');
    // cobwebs
    c.line(9, 3, 11, 5, 'i').line(9, 3, 9, 8, 'i').line(9, 5, 11, 4, 'i');
    c.line(26, 13, 29, 13, 'i').line(26, 13, 26, 16, 'i').line(26, 15, 28, 13, 'i');
    c.px(28 + f, 18 + f, 'k').px(28 + f, 17 + f, 'i');
  },
  dragon: (c, f) => {
    c.ell(17, 33, 11, 1, '2');
    c.line(11, 16, 11, 9, 's').line(11, 9, 14, 6, 's').line(14, 6, 20, 6, 's').line(20, 6, 23, 9, 's').line(23, 9, 23, 16, 's');
    c.line(12, 16, 12, 10, 't').line(22, 16, 22, 10, 't');
    c.rect(9, 16, 17, 13, 't').rect(9, 16, 17, 1, 'i').rect(16, 20, 3, 3, 'k').rect(17, 23, 1, 3, 'k');
    c.rect(4, 26, 27, 5, 'b').rect(4, 26, 27, 1, 'c');
    for (let x = 6; x < 30; x += 4) c.px(x, 28, 'a');
    c.rect(28, 12, 4, 15, 'b').rect(28, 12, 1, 15, 'c');
    c.rect(24, 6, 10, 7, 'b').rect(24, 6, 10, 1, 'c').rect(31, 9, 3, 1, 'k').px(30, 8, 'k').px(30, 7, 'e');
    c.px(25, 4, 'c').px(26, 5, 'c').px(29, 4, 'c').px(29, 5, 'c');
    c.rect(1 + f, 22, 4, 4, 'b').px(0 + f, 21, 'c').px(f ? 2 : 1, 20, 'c');
    c.spr(['.aaa.', 'aaaaa', '.a.a.'], 3, 12 + f);
    if (f) c.spr(['..y', '.yo', 'yor', '.r.'], 33, 9);
  },
  drain: (c, f) => {
    c.rect(30, 6, 2, 10, 's').rect(24, 5, 8, 2, 's').rect(24, 7, 2, 2, 't').px(24, 9 + f, 'e');
    c.ell(17, 21 + f, 8, 6, 'f');
    [[12, 17], [16, 16], [20, 18], [14, 21], [19, 22], [11, 22]].forEach(([x, y]) => c.rect(x, y + f, 3, 1, 'c').px(x + 1, y + 1 + f, 'c'));
    c.rect(17, 15 + f, 1, 10, 'c');
    for (let y = 22; y < 32; y++) { const i = Math.floor((y - 22) / 3); c.rect(4 + i, y, 27 - 2 * i, 1, y === 22 ? 'i' : 't'); }
    c.rect(3, 22, 29, 1, 'i').rect(3, 23, 29, 1, 's');
    c.rect(8, 24, 19, 3, 'u');
    const sw = f ? [[10, 24], [15, 25], [21, 24], [24, 26]] : [[12, 25], [17, 24], [22, 25], [9, 26]];
    sw.forEach(([x, y]) => c.rect(x, y, 3, 1, 'a'));
    c.rect(16, 26, 3, 1, 'k');
    [[9, 12 - f * 2], [26, 15 - f]].forEach(([x, y]) => c.px(x, y, 'i'));
  },
};
const BCW = 120, BCH = 98;
/* The cure in a few words, under each name (the full sentence lives in LORE.BOSSES[].weakness) */
const CURE = {
  hallucinator: 'VERIFY IT', leaker: 'NDA FIRST', goblin: 'USE A VAULT', lich: 'CHECK LICENCES',
  golem: 'GIVE IT AN OWNER', dragon: 'OPEN FORMATS', drain: 'KEEP TASTE HUMAN',
};
function bossCard(b, x, y, cls) {
  const cv = new Cv(BCW, BCH);
  cv.rect(0, 0, BCW, BCH, 'a').rect(1, 1, BCW - 2, BCH - 2, 'k').px(0, 0, '.').px(BCW - 1, 0, '.').px(0, BCH - 1, '.').px(BCW - 1, BCH - 1, '.');
  const name = b.name.toUpperCase();
  const fr = frames2(cls, BOSS_DRAW[b.id], 36, 36, x + 24, y + 2, 2, 0.9);
  return { svg: `<g transform="translate(${x} ${y})">${cv.svg()}${PX.text(name, { x: BCW / 2, y: BCH - 21, fill: C.i, align: 'center' })}${PX.text(CURE[b.id], { x: BCW / 2, y: BCH - 11, fill: C.d, align: 'center' })}</g>` + fr.svg, css: fr.css };
}
function bosses() {
  const all = LORE.BOSSES;
  const missing = all.filter((b) => !BOSS_DRAW[b.id]);
  if (missing.length) throw new Error('boss art missing: ' + missing.map((b) => b.id).join(', '));
  const descs = {
    hallucinator: 'a floating eyeball with a swirly iris and little wings, two impossible cubes drift beside it',
    leaker: 'a dripping bucket with a document sticking out, drops leaking from its holes',
    goblin: 'a green goblin hugging a bundle of keys',
    lich: 'a skeleton in a plum robe holding a scroll marked with a copyright sign',
    golem: 'an abandoned grey robot covered in cobwebs, one eye flickering, a spider dangling',
    dragon: 'a green dragon coiled around a big padlock, puffing a tiny flame',
    drain: 'a brain sinking into a sink while the drain swirls',
  };
  let gbody = '', gcss = '';
  all.forEach((b, i) => {
    const one = bossCard(b, 0, 0, 'bo');
    write(`boss-${b.id}.svg`, {
      w: BCW, h: BCH, css: one.css, body: one.svg,
      title: `In the smoke: ${b.name}`,
      desc: `A friendly pixel monster from a true ghost story, on a name plate with its cure in short (${CURE[b.id].toLowerCase()}): ${descs[b.id]}. The risk: ${b.hp}. How to keep it away: ${b.weakness}`,
    });
    const col = i % 4, row = Math.floor(i / 4);
    const x = 8 + col * (BCW + 8) + (row ? (BCW + 8) / 2 : 0), y = 26 + row * (BCH + 8);
    const r = bossCard(b, x, y, `b${i}`);
    gbody += r.svg; gcss += r.css.replace(/(steps\(1\) )/g, `$1${(-i * 0.13).toFixed(2)}s `);
  });
  const W = 8 + 4 * (BCW + 8), H = 26 + 2 * (BCH + 8) + 2;
  const bg = new Cv(W, H, 'N');
  write('bosses.svg', {
    w: W, h: H, css: gcss, body: bg.svg() + PX.text('IN THE SMOKE', { x: 10, y: 7, scale: 2, fill: C.i }) + PX.text('SEVEN GHOST STORIES · EACH WITH A CURE', { x: W - 10, y: 11, fill: C.t, align: 'right' }) + gbody,
    title: 'In the smoke: seven ghost stories, each with a cure',
    desc: `Seven friendly pixel monsters on name plates, each with its cure in short: ${all.map((b) => `${b.name}, ${descs[b.id]} (${CURE[b.id].toLowerCase()})`).join('; ')}.`,
  });
}

/** Text label on a dark plate (for scenes); returns svg. */
function tag(cv, str, x, y, { fill = C.i, border = '4', align = 'center' } = {}) {
  const lines = String(str).split('\n'), w = PX.textWidth(str) + 6, h = lines.length * 9 + 3;
  const x0 = align === 'center' ? x - Math.floor(w / 2) : align === 'right' ? x - w : x;
  plate(cv, x0, y, w, h, border);
  return PX.text(str, { x: x0 + 3, y: y + 2, fill });
}
const ROBOT = ['....e....', '....s....', '..sssss..', '.sttttts.', '.stdtdts.', '.sttttts.', '..sssss..', '...sss...', '.ttttttt.',
  't.tsdst.t', 't.ttttt.t', 't.ttttt.t', '..ss.ss..', '..ss.ss..', '.sss.sss.'];

/* ── v2 · 7 · Guild hall: the team's place for repos ──────────────────────── */
function guildHall() {
  const W = 320, H = 180, FL = 108, rnd = rng(77);
  const cv = new Cv(W, H, 'k');
  // back wall: stone blocks; ceiling beams; wooden floor
  cv.rect(0, 14, W, FL - 14, 'g');
  for (let y = 16; y < FL; y += 6) for (let x = (y / 6) % 2 ? 0 : 7; x < W; x += 14) cv.rect(x, y, 13, 5, rnd() < 0.3 ? '4' : 'g').rect(x, y + 5, 14, 1, '2');
  cv.rect(0, 10, W, 4, 'W').rect(0, 10, W, 1, 'm');
  for (let x = 20; x < W; x += 60) cv.rect(x, 0, 4, 10, 'W');
  cv.rect(0, FL, W, H - FL, 'm');
  for (let y = FL; y < H; y += 5) { cv.rect(0, y, W, 1, 'W'); for (let x = (y * 7) % 23; x < W; x += 31) cv.rect(x, y + 1, 1, 4, 'W'); }
  cv.rect(0, FL, W, 1, 'n');
  // quest board: ISSUES
  cv.rect(14, 38, 2, FL - 38, 'W').rect(66, 38, 2, FL - 38, 'W');
  cv.rect(10, 32, 62, 56, 'W').rect(12, 34, 58, 52, 'n').rect(12, 34, 58, 9, 'm');
  const notes = [[15, 46, 'f'], [27, 48, 'e'], [39, 45, 'f'], [52, 47, 'd'], [17, 62, 'e'], [30, 64, 'f'], [44, 61, 'f'], [56, 65, 'e'], [22, 76, 'd'], [41, 76, 'f']];
  notes.forEach(([x, y, c]) => { cv.rect(x, y, 10, 9, c).rect(x + 2, y + 3, 6, 1, 'a').rect(x + 2, y + 5, 4, 1, 'a').px(x + 4, y, 'k'); });
  // shop window: PAGES
  cv.rect(80, 46, 44, 40, 'W').rect(82, 48, 40, 34, '2').rect(80, 84, 44, 3, 'n');
  for (let x = 78; x < 126; x += 6) cv.rect(x, 40, 3, 6, 'c').rect(x + 3, 40, 3, 6, 'f');
  cv.rect(78, 39, 48, 1, 'a');
  [[86, 58], [98, 54], [110, 60]].forEach(([x, y]) => cv.rect(x, y, 8, 11, 'f').rect(x + 1, y + 2, 6, 1, 'a').rect(x + 1, y + 4, 5, 1, 'a').rect(x + 1, y + 6, 6, 1, 'a').rect(x, y + 20 - (y - 54), 8, 1, '4'));
  cv.rect(84, 74, 36, 1, '4');
  // castle gate with portcullis: CHECKS
  cv.rect(136, 28, 52, FL - 28, 's');
  for (let y = 30; y < FL; y += 5) for (let x = (y / 5) % 2 ? 136 : 140; x < 188; x += 8) cv.rect(x, y, 7, 4, 't');
  cv.ell(162, 54, 16, 16, 'k'); cv.rect(146, 54, 33, FL - 54, 'k');
  for (let x = 149; x < 178; x += 5) cv.rect(x, 40, 1, 44, 'a');
  for (let y = 46; y < 86; y += 6) cv.rect(146, y, 33, 1, 'a');
  for (let x = 149; x < 178; x += 5) cv.px(x, 84, 'f');
  // robot guard with a check shield
  cv.spr(ROBOT, 190, FL - 15);
  cv.rect(197, FL - 10, 7, 8, 'f').rect(198, FL - 3, 5, 1, 'f').rect(199, FL - 2, 3, 1, 'f');
  [[198, FL - 6], [199, FL - 5], [200, FL - 6], [201, FL - 7], [202, FL - 8]].forEach(([x, y]) => cv.px(x, y, 'b'));
  // vault: SECRETS
  cv.rect(252, 34, 56, 60, 's').rect(254, 36, 52, 56, 't');
  cv.ell(280, 64, 21, 21, 's'); cv.ell(280, 64, 19, 19, 'i'); cv.ell(280, 64, 17, 17, 't');
  for (let a = 0; a < 6; a++) cv.line(280, 64, 280 + Math.round(9 * Math.cos(a * Math.PI / 3)), 64 + Math.round(9 * Math.sin(a * Math.PI / 3)), 's');
  cv.ell(280, 64, 3, 3, 'k'); cv.rect(296, 60, 4, 9, 's');
  for (let x = 258; x < 304; x += 8) cv.rect(x, 92, 4, FL - 92, 's');
  // torches between (fire)
  const torchA = ['.r.', 'ror', 'oyo', '.W.', 'WWW', '.W.'], torchB = ['r..', '.ro', 'roy', '.W.', 'WWW', '.W.'];
  // humans around the round table (behind it first)
  const TX = 162, TY = 132;
  cv.spr(person(0, LOOKS[0]), TX - 24, TY - 16);
  cv.spr(person(0, LOOKS[1]), TX + 18, TY - 16);
  cv.ell(TX, TY + 4, 40, 3, 'W'); cv.rect(TX - 3, TY + 4, 6, 14, 'W').rect(TX - 10, TY + 18, 20, 2, 'W');
  cv.ell(TX, TY, 40, 6, 'n'); cv.ell(TX, TY - 1, 38, 4, 'm');
  cv.rect(TX - 14, TY - 3, 16, 5, 'f').rect(TX - 12, TY - 2, 5, 1, 'a').rect(TX - 5, TY, 6, 1, 'a').rect(TX + 8, TY - 2, 6, 4, 'e').line(TX + 8, TY - 2, TX + 11, TY, 'a').line(TX + 14, TY - 2, TX + 11, TY, 'a');
  cv.spr(person(1, LOOKS[3]), TX - 52, TY + 6);
  cv.spr(person(0, LOOKS[5]), TX + 46, TY + 6);
  // AI agent robots: one reading the quest board, one at the table with a pull request
  cv.spr(ROBOT, 70, FL + 8);
  cv.spr(ROBOT, TX + 64, TY + 4).rect(TX + 72, TY + 10, 7, 5, 'f').line(TX + 72, TY + 10, TX + 75, TY + 12, 'a').line(TX + 78, TY + 10, TX + 75, TY + 12, 'a');
  // chandelier with candles
  cv.rect(TX - 1, 0, 1, 16, 's').rect(TX - 22, 16, 44, 2, 'W').rect(TX - 22, 14, 2, 2, 'W').rect(TX + 20, 14, 2, 2, 'W');
  [-20, -8, 4, 16].forEach((dx) => cv.rect(TX + dx, 12, 2, 4, 'f'));
  let body = cv.svg(), css = '';
  const cA = [-20, -8, 4, 16].map((dx) => PX.sprite(['.o', 'oy'], { x: TX + dx, y: 10 })).join(''), cB = [-20, -8, 4, 16].map((dx) => PX.sprite(['o.', 'yo'], { x: TX + dx, y: 10 })).join('');
  const ch = flip('gc', cA, cB, 0.6); body += ch.svg; css += ch.css;
  const tA = [128, 238].map((x) => PX.sprite(torchA, { x, y: 50 })).join(''), tB = [128, 238].map((x) => PX.sprite(torchB, { x, y: 50 })).join('');
  const to = flip('gt', tA, tB, 0.5, -0.2); body += to.svg; css += to.css;
  body += `<path fill="${C.o}" fill-opacity=".1" d="${ellD(TX, 22, 30, 8)}"/>`;
  // labels
  const lab = new Cv(W, H);
  let ink = '';
  ink += PX.text('ISSUES', { x: 41, y: 35, fill: C.f, align: 'center' });
  ink += tag(lab, 'PAGES', 102, 26, { fill: C.f });
  ink += tag(lab, 'CHECKS', 162, 17, { fill: C.f });
  ink += tag(lab, 'SECRETS', 280, 22, { fill: C.f });
  ink += tag(lab, 'OWNER', TX - 22, TY - 30, { fill: C.M, border: 'M' });
  ink += tag(lab, 'DESIGN', TX + 20, TY - 30, { fill: C.M, border: 'M' });
  ink += tag(lab, 'BUILD', TX - 50, TY - 8, { fill: C.M, border: 'M' });
  ink += tag(lab, 'GUEST', TX + 48, TY - 8, { fill: C.M, border: 'M' });
  ink += tag(lab, 'AI AGENT', 74, FL - 6, { fill: C.e, border: 'c' });
  ink += tag(lab, 'AI AGENT', TX + 70, TY + 22, { fill: C.e, border: 'c' });
  body += lab.svg() + ink;
  // the guard's eye light blinks
  const eyes = flip('ge', `<path fill="${C.d}" d="${dotD([[193, FL - 11, 1, 1], [195, FL - 11, 1, 1]])}"/>`, `<path fill="${C.f}" d="${dotD([[193, FL - 11, 1, 1], [195, FL - 11, 1, 1]])}"/>`, 1.4);
  body += eyes.svg; css += eyes.css;
  body += frame2(W, H);
  write('guild-hall.svg', {
    w: W, h: H, bg: C.k, css, body,
    title: 'The guild hall: a team account for repos',
    desc: 'Pixel art of a medieval guild hall at night, lit by candles and torches. Left, a quest board titled Issues full of sticky notes, with an AI agent robot reading it. A shop window labelled Pages. In the middle a castle gate with a portcullis labelled Checks, guarded by a robot with a check-mark shield. Right, a round vault door labelled Secrets. In front, four people at a round table with role badges: owner, design, build, guest, and a second AI agent robot bringing a pull request envelope.',
  });
}

/* ── v2 · 8 · Remix map: what moved between repos ─────────────────────────── */
function remixMap() {
  const W = 320, H = 180, rnd = rng(88);
  const N = {
    LIQUIDTYPE: [44, 44], 'PIX-EL': [160, 44], PIXLETICS: [276, 44],
    VIBESTUDIO: [44, 102], PIXINOTES: [160, 102], CAMPFIRE: [276, 102],
    DISCOVERY: [44, 154], 'VAVE.LOG': [276, 154],
  };
  // [from, to, label, label x, label y, align]
  const EDGES = [
    ['LIQUIDTYPE', 'PIX-EL', 'LIQUID\nHERO', 102, 24, 'center'],
    ['LIQUIDTYPE', 'PIXINOTES', 'LIQUID\nTYPE', 94, 61, 'center'],
    ['VIBESTUDIO', 'PIXINOTES', 'SLIDES', 102, 91, 'center'],
    ['PIX-EL', 'PIXINOTES', 'PIX\nMASCOT', 165, 63, 'left'],
    ['PIX-EL', 'CAMPFIRE', 'PALETTE\n+ FONT', 232, 66, 'center'],
    ['PIXLETICS', 'CAMPFIRE', 'FLAME', 276, 59, 'center'],
    ['PIXINOTES', 'CAMPFIRE', 'MCP\nBOARD', 218, 106, 'center'],
    ['DISCOVERY', 'VAVE.LOG', 'SURVEY + PROTOTYPE', 160, 143, 'center'],
  ];
  const BW = 64, BH = 22;
  const cv = new Cv(W, H, 'N');
  for (let i = 0; i < 160; i++) { const x = Math.floor(rnd() * (W - 4)), y = Math.floor(rnd() * H); cv.rect(x, y, 3, 1, rnd() < 0.5 ? '2' : '3'); }
  // edge endpoints on the block borders
  const clip = ([cx, cy], [dx, dy]) => { const tx = dx ? (BW / 2 + 1) / Math.abs(dx) : 1e9, ty = dy ? (BH / 2 + 2) / Math.abs(dy) : 1e9, t = Math.min(tx, ty); return [cx + dx * t, cy + dy * t]; };
  let css = '', moving = '';
  EDGES.forEach(([a, b], i) => {
    const A = N[a], B = N[b], len0 = Math.hypot(B[0] - A[0], B[1] - A[1]), u = [(B[0] - A[0]) / len0, (B[1] - A[1]) / len0];
    const [x0, y0] = clip(A, u), [x1, y1] = clip(B, [-u[0], -u[1]]);
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < len - 5; s += 4) cv.rect(Math.round(x0 + u[0] * s), Math.round(y0 + u[1] * s), 2, 2, 'd');
    // arrowhead
    const px = -u[1], py = u[0];
    for (let k = 0; k < 5; k++) { const bx = x1 - u[0] * k, by = y1 - u[1] * k; cv.line(Math.round(bx + px * k * 0.8), Math.round(by + py * k * 0.8), Math.round(bx - px * k * 0.8), Math.round(by - py * k * 0.8), 'e'); }
    // a packet travelling along the edge in pixel steps
    const n = Math.round(len / 3), dur = len / 14;
    moving += `<rect class="mv${i}" x="${Math.round(x0) - 1}" y="${Math.round(y0) - 1}" width="3" height="3" fill="${C.M}"/>`;
    css += `@keyframes mv${i}{from{transform:translate(0,0)}to{transform:translate(${Math.round(x1 - x0)}px,${Math.round(y1 - y0)}px)}}.mv${i}{animation:mv${i} ${dur.toFixed(2)}s steps(${n}) ${(-i * 0.37).toFixed(2)}s infinite}`;
  });
  // repo blocks: grass top, earth body, name; little props
  let ink = '';
  for (const [name, [cx, cy]] of Object.entries(N)) {
    const x = cx - BW / 2, y = cy - BH / 2, hot = name === 'VAVE.LOG';
    cv.rect(x + 2, y + BH, BW - 2, 2, 'k');
    cv.rect(x, y, BW, BH, 'a').rect(x, y, BW, 4, hot ? 'M' : 'c').rect(x, y + 4, BW, 1, hot ? 'y' : 'b').rect(x, y + BH - 2, BW, 2, 'g');
    for (let k = 0; k < 6; k++) cv.px(x + 3 + Math.floor(rnd() * (BW - 6)), y + 7 + Math.floor(rnd() * 10), '4');
    ink += PX.text(name, { x: cx, y: y + 9, fill: C.f, align: 'center' });
  }
  cv.spr(PX.SPRITES.pix, 160 + 14, 44 - 11 - 15);
  let body = cv.svg() + ink;
  const fire = fireFrames('rf', 276 - 8 + 20, 102 - 11 - 15);
  body += PX.sprite(['..WW....WW..', '...WWmmWW...', '....WWWW....'], { x: 276 + 14, y: 102 - 11 - 2 });
  body += fire.svg; css += fire.css;
  body += `<path fill="${C.M}" d="${dotD([[276 + 22, 154 - 11 - 12, 1, 12], [276 + 23, 154 - 11 - 12, 6, 4]])}"/>`;
  const lab = new Cv(W, H);
  let labels = '';
  EDGES.forEach(([, , text, lx, ly, align]) => { labels += tag(lab, text, lx, ly, { fill: C.i, align }); });
  body += lab.svg() + labels + moving;
  body += PX.text('WHAT MOVED BETWEEN REPOS', { x: 8, y: 6, fill: C.t });
  body += frame2(W, H);
  write('remix-map.svg', {
    w: W, h: H, css, body,
    title: 'Remix map: what moved between repos',
    desc: `Repositories as pixel islands on a dark sea, linked by dotted arrows that say what moved, with small yellow packets travelling along them: ${EDGES.map(([a, b, l]) => `${a} to ${b}: ${l.replace('\n', ' ').toLowerCase()}`).join('; ')}. Pix stands on PIX-EL, a little fire burns on CAMPFIRE, and VAVE.LOG flies a flag.`,
  });
}

/* ── v2 · 9 · Quest log: the making of vave.log ───────────────────────────── */
function vavelogQuest() {
  const W = 320, H = 180, ROAD = 112, rnd = rng(99);
  const STOPS = [
    ['START', 'SURVEY +\nPROTOTYPE'], ['DAY 1', 'EMPTY REPO'], ['DAY 2', '~30 PRS'],
    ['WEEK 2', '8 MILESTONES'], ['WEEK 6', 'PR #91'], ['NEXT', '?'],
  ];
  const XS = [34, 86, 138, 190, 242, 290];
  const cv = new Cv(W, H, 'k');
  for (let y = 40; y < ROAD; y++) for (let x = 0; x < W; x++) if (y > 60 || (x * 5 + y * 11) % (64 - y) === 0) cv.px(x, y, 'N');
  for (let i = 0; i < 50; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 56); cv.px(x, y, rnd() < 0.5 ? '4' : 'a'); }
  for (let x = 0; x < W; x++) { const y = 80 + Math.round(6 * Math.sin(x / 26) + 3 * Math.sin(x / 9 + 2)); cv.rect(x, y, 1, ROAD - y, 'g'); if (Math.sin((x + 1) / 26) * 6 + 3 * Math.sin((x + 1) / 9 + 2) > Math.sin(x / 26) * 6 + 3 * Math.sin(x / 9 + 2)) cv.px(x, y, 'a'); }
  for (let x = -2; x < W + 3; x += 4 + Math.floor(rnd() * 5)) pine(cv, x, ROAD - 4, 5 + Math.floor(rnd() * 6), '2');
  cv.rect(0, ROAD - 4, W, H - ROAD + 4, '3');
  // road: cobbles
  cv.rect(0, ROAD, W, 10, 's').rect(0, ROAD, W, 1, 't').rect(0, ROAD + 9, W, 1, 'k');
  for (let y = ROAD + 2; y < ROAD + 9; y += 3) for (let x = (y % 2) * 3; x < W; x += 6) cv.rect(x, y, 4, 2, 't');
  for (let i = 0; i < 30; i++) cv.spr(['a.a', '.a.'], Math.floor(rnd() * W), ROAD + 14 + Math.floor(rnd() * 40));
  let ink = '';
  const lab = new Cv(W, H);
  STOPS.forEach(([date, label], i) => {
    const x = XS[i], last = i === STOPS.length - 1;
    if (!last) {
      cv.rect(x, ROAD - 22, 1, 22, 'W').rect(x + 1, ROAD - 22, 8, 5, 'c').rect(x + 1, ROAD - 17, 5, 1, 'c').rect(x + 1, ROAD - 22, 8, 1, 'd');
      cv.rect(x - 2, ROAD - 1, 5, 1, 'W');
    } else {
      cv.rect(x - 9, ROAD - 14, 18, 6, 'n').rect(x - 9, ROAD - 14, 18, 1, 'W').rect(x - 9, ROAD - 8, 18, 8, 'm').rect(x - 9, ROAD - 9, 18, 1, 't').rect(x - 1, ROAD - 10, 3, 4, 't').px(x, ROAD - 8, 'k');
      cv.rect(x - 9, ROAD - 14, 1, 14, 't').rect(x + 8, ROAD - 14, 1, 14, 't');
    }
    const below = i % 2 === 1;
    const ly = below ? ROAD + 16 : ROAD - 58;
    ink += tag(lab, date, x, ly, { fill: C.M, border: last ? 'M' : '4' });
    ink += PX.text(label, { x, y: ly + 14, fill: C.i, align: 'center' });
  });
  let body = cv.svg() + lab.svg() + ink, css = '';
  // sparkle over the chest
  const sp = flip('qs', `<path fill="${C.M}" d="${dotD([[XS[5] - 6, ROAD - 20, 1, 1], [XS[5] + 6, ROAD - 24, 1, 1]])}"/>`,
    `<path fill="${C.M}" d="${dotD([[XS[5] - 7, ROAD - 20, 3, 1], [XS[5] - 6, ROAD - 21, 1, 3], [XS[5] + 5, ROAD - 24, 3, 1], [XS[5] + 6, ROAD - 25, 1, 3]])}"/>`, 0.8);
  body += sp.svg; css += sp.css;
  // Pix walks the road
  const pixA = PX.SPRITES.pix, pixB = [...pixA.slice(0, 13), '...ggg....gg....', '....gg....ggg...', '................'];
  const pw = walker('qw', pixA, pixB, XS[0] + 4, ROAD - 15, 1, 0, XS[5] - 24, 16, 0);
  body += pw.svg; css += pw.css;
  body += PX.text('THE MAKING OF', { x: 10, y: 8, scale: 2, fill: C.i });
  body += PX.text('VAVE.LOG', { x: W - 10, y: 12, fill: C.t, align: 'right' });
  body += frame2(W, H);
  write('vavelog-quest.svg', {
    w: W, h: H, bg: C.k, css, body,
    title: 'The making of vave.log',
    desc: 'A pixel road at night with milestone flags: start, survey and prototype; day 1, an empty repository; day 2, about 30 pull requests; week 2, 8 milestones; week 6, pull request number 91; next: a treasure chest with a question mark that sparkles. Pix walks along the road.',
  });
}

/* ══ Version 3: stories around the fire ══════════════════════════════════════ */
/* Eight chapter cards (160×160) as one series: same frame, same horizon, same ring of stumps, same 2× title in the
   night sky. Only the fire in the middle changes through the evening: spark → big → many → smoke → embers.
   One animation per card: the fire (frames cycled with steps(1)); frame 0 is the still for reduced motion. */
const V3 = { W: 160, H: 160, HZ: 106, FX: 80, FY: 132 }; // HZ: horizon, FX/FY: fire centre / top of the logs
const BAY = [[0, 2], [3, 1]];
const dband = (x, y, y0, a, b) => ((BAY[y % 2][x % 2] + 1) / 4 <= (y - y0 + 1) / 4 ? b : a);

/** N stacked frames, cycled by opacity with steps(1); frame 0 is the still */
function frameSet(cls, n, render, seq, slot) {
  let svg = '', css = '';
  for (let f = 0; f < n; f++) {
    svg += `<g class="${cls}${f}">${render(f)}</g>`;
    css += seqKF(`${cls}${f}`, seq.map((s) => `opacity:${s === f ? 1 : 0}`)) + `.${cls}${f}{${f ? 'opacity:0;' : ''}${anim(cls + f, seq.length * slot)}}`;
  }
  return { svg, css };
}

/** Procedural pixel flame: teardrop layers r → o → y → w, side tongues for bigger fires. f = frame 0..2 */
function flameV3(cv, cx, by, h, hw, f) {
  const ph = [0, 2.1, 4.2][f % 3];
  const tg = h >= 10 ? [[-0.62, 0.5 + 0.1 * ((f + 1) % 3)], [0.62, 0.46 + 0.1 * ((f + 2) % 3)]] : [];
  const inside = (x, y, H, Wd, ox) => {
    const v = (by - y) / H;
    if (v < 0 || v > 1) return false;
    const prof = v < 0.3 ? Math.sqrt(Math.max(0, 1 - ((0.3 - v) / 0.3) ** 2)) : ((1 - v) / 0.7) ** 1.2;
    const sway = Math.sin(v * 3.4 + ph) * v * Math.max(1, Wd * 0.5);
    return Math.abs(x + 0.5 - (ox + sway)) <= prof * Wd + 0.3;
  };
  [['r', 1, 1], ['o', 0.78, 0.7], ['y', 0.52, 0.44], ['w', 0.26, 0.22]].forEach(([c, sh, sw]) => {
    for (let y = by - h - 1; y <= by; y++) for (let x = cx - hw - 4; x <= cx + hw + 4; x++) {
      let hit = inside(x, y, h * sh, hw * sw, cx);
      if (!hit && sh > 0.6) hit = tg.some(([dx, th]) => inside(x, y, h * th * sh, hw * 0.45 * sw, cx + dx * hw));
      if (hit) cv.px(x, y, c);
    }
  });
  if (h >= 8) cv.px(cx + [0, 1, -1][f % 3], by - h - 2 - (f % 2), 'r');
}
/** Warm light on the ground (clipped to minY) and a faint haze around the flame */
function glowV3(cx, cy, k, minY, haze = 0) {
  let s = [[4.2, 1.1], [2.9, 0.8], [1.8, 0.55]].map(([a, b]) => `<path fill="${C.o}" fill-opacity=".09" d="${ellD(cx, cy, Math.round(k * a), Math.max(1, Math.round(k * b)), minY)}"/>`).join('');
  if (haze) s += `<path fill="${C.o}" fill-opacity=".05" d="${ellD(cx, cy - Math.round(haze * 0.6), Math.round(haze), Math.round(haze))}"/>`;
  return s;
}
/** A whole campfire as three frames: ground glow, haze, flame */
function fireV3(cls, cx, by, h, hw, minY = V3.HZ) {
  return frameSet(cls, 3, (f) => {
    const c = new Cv(V3.W, V3.H);
    flameV3(c, cx, by, h, hw, f);
    return glowV3(cx, by + 3, hw + 3 + (f === 1 ? 1 : f === 2 ? -1 : 0), minY, h * 0.9) + c.svg();
  }, [0, 1, 2, 0, 2, 1], 0.125);
}

const STUMP = ['.nnnnnn.', 'nnmmmmnn', 'nmnmmnmn', 'nnmmmmnn', 'WnnnnnnW', 'WmWmWWmW', 'WmWmWWmW', 'WWmWWmWW'];
/* Ring of stumps around the fire (top-left of the 8×8 sprite); the same seats in every chapter */
const SEATS = [[42, 122], [110, 122], [26, 135], [126, 135], [44, 146], [108, 146]];
const STONE3 = ['.ttt.', 'tssss', '.s33.'];
function stonesV3(back, front, cx = V3.FX, cy = V3.FY + 7, rx = 13, ry = 3.4, n = 9) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3, x = Math.round(cx + rx * Math.cos(a)) - 2, y = Math.round(cy + ry * Math.sin(a)) - 1;
    if (Math.sin(a) > 0) front.spr(STONE3, x, y, { t: 'n' }); else back.spr(STONE3, x, y, { s: 'n', t: 't' });
  }
}
/** Pix with a warm rim on the side that faces the fire ('l' = fire on the left) */
function pixLit(cv, x, y, side = 'l') {
  const rows = PX.SPRITES.pix.map((row, j) => {
    const a = [...row];
    const L = a.indexOf('g'), R = a.lastIndexOf('g');
    if (L < 0 || R <= L + 2 || j < 3 || j > 11) return row;
    const [hot, cool] = side === 'l' ? [L, R] : [R, L];
    const inH = side === 'l' ? hot + 1 : hot - 1, inC = side === 'l' ? cool - 1 : cool + 1;
    a[hot] = 'o'; if (a[inH] === 'f') a[inH] = 'e'; if (a[inC] === 'f') a[inC] = 'd';
    return a.join('');
  });
  cv.spr(rows, x, y);
}
/** Crescent moon */
function moonV3(cv, mx, my, r = 5) {
  for (let y = my - r - 1; y <= my + r + 1; y++) for (let x = mx - r - 1; x <= mx + r + 1; x++) {
    const d1 = Math.hypot(x - mx, y - my), d2 = Math.hypot(x - mx - 3, y - my + 2);
    if (d1 <= r + 0.4 && d2 > r - 0.4) cv.px(x, y, d2 < r + 0.6 ? 'e' : 'f');
  }
}
/** Chapter title: numeral in spark yellow, name in ink, 2× font, wrapped to fit; returns { svg, boxes } */
function titleV3(num, name, W = V3.W, top = 8, maxW = W - 14) {
  const S = 2, words = [num, '·', ...name.split(' ')], lines = [[]];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur.length && PX.textWidth([...cur, w].join(' '), S) > maxW) lines.push([w]); else cur.push(w);
  }
  const LH = 18, y0 = top + (lines.length === 1 ? Math.round(LH / 2) : 0);
  let svg = ''; const boxes = [];
  lines.forEach((ln, li) => {
    const lw = PX.textWidth(ln.join(' '), S), y = y0 + li * LH;
    let x = Math.floor((W - lw) / 2);
    boxes.push([x, y, lw, 14]);
    ln.forEach((w, wi) => {
      const fill = li === 0 && wi < 2 && (w === num || w === '·') ? C.M : C.i;
      svg += PX.text(w, { x, y, scale: S, fill });
      x += PX.textWidth(w, S) + PX.textWidth(' ', S) + 2 * S;
    });
  });
  return { svg, boxes };
}
/** Sky, stars, moon, the shared horizon and the ground → canvas */
function landV3({ dawn = false, moon = null, boxes = [], skipStars = () => false } = {}) {
  const { W, H, HZ, FX } = V3;
  const cv = new Cv(W, H, 'k');
  const night = (x, y) => (y < 44 ? 'k' : y < 47 ? dband(x, y, 44, 'k', 'N') : y < 76 ? 'N' : y < 79 ? dband(x, y, 76, 'N', '3') : '3');
  const morn = (x, y) => (y < 26 ? 'N' : y < 29 ? dband(x, y, 26, 'N', '3') : y < 46 ? '3' : y < 49 ? dband(x, y, 46, '3', '4') : y < 62 ? '4' : y < 65 ? dband(x, y, 62, '4', 'a') : y < 74 ? 'a' : y < 77 ? dband(x, y, 74, 'a', 'b') : 'b');
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) cv.px(x, y, (dawn ? morn : night)(x, y));
  // stars: none behind the title, fading out at dawn
  const rs = rng(311);
  const inBox = (x, y) => boxes.some(([bx, by, bw, bh]) => x >= bx - 3 && x < bx + bw + 3 && y >= by - 3 && y < by + bh + 3);
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rs() * W), y = Math.floor(rs() * 84), big = rs() < 0.12, dim = rs() < 0.5;
    if (inBox(x, y) || skipStars(x, y) || (moon && Math.hypot(x - moon[0], y - moon[1]) < 9) || (dawn && y > 44)) continue;
    cv.px(x, y, dawn ? (y < 26 ? 't' : 'a') : big ? 'i' : dim ? '4' : 'a');
  }
  if (moon) moonV3(cv, moon[0], moon[1]);
  // far mountains with moonlit edges, mid hills, treeline (taller at the edges to frame the clearing)
  const peaks = [[-2, 86], [14, 78], [30, 84], [48, 74], [64, 82], [80, 79], [96, 86], [112, 76], [128, 72], [144, 80], [162, 76]];
  const mt = [];
  for (let x = 0; x < W; x++) {
    const k = peaks.findIndex((p) => p[0] > x), [x0, y0] = peaks[k - 1], [x1, y1] = peaks[k];
    mt[x] = Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
  }
  for (let x = 0; x < W; x++) {
    cv.rect(x, mt[x], 1, HZ - mt[x], 'g');
    const lit = mt[x + 1] !== undefined && mt[x + 1] > mt[x];
    cv.px(x, mt[x], lit ? (dawn ? 'c' : 'a') : '4');
  }
  for (let x = 0; x < W; x++) { const y = 96 + Math.round(2 * Math.sin(x / 13) + 1.5 * Math.sin(x / 7 + 2)); cv.rect(x, y, 1, HZ - y, '2'); }
  const rt = rng(312);
  for (let x = -3; x < W + 4; x += 3 + Math.floor(rt() * 4)) {
    const edge = x < 22 ? (22 - x) / 22 : x > 138 ? (x - 138) / 22 : 0;
    pine(cv, x, HZ + 1, 5 + Math.floor(rt() * 6) + Math.round(edge * 14), 'k');
  }
  // ground: bumpy edge, grass tufts lit near the fire, pebbles
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) cv.px(x, y, y < 148 ? '3' : y < 151 ? dband(x, y, 148, '3', '2') : '2');
  const rg = rng(313);
  for (let x = 0; x < W; x += 5 + Math.floor(rg() * 6)) cv.ell(x, HZ, 2 + Math.floor(rg() * 3), 1, 'k');
  const tuft = ['..a..', 'a.a.a', '.aaa.'];
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(rg() * (W - 5)), y = HZ + 4 + Math.floor(rg() * 44), d = Math.hypot((x + 2 - FX) / 3, y - 139);
    if (d < 9) continue;
    cv.spr(tuft, x, y, { a: d < 14 ? 'c' : d < 20 ? 'b' : 'a' });
  }
  for (let i = 0; i < 9; i++) cv.rect(Math.floor(rg() * W), HZ + 6 + Math.floor(rg() * 40), 2, 1, 's');
  return cv;
}
/** One chapter card: land → back props → stumps/stones → fire → logs, front props → title → frame */
function chapterCard(n, ch) {
  const { W, H, FX, FY } = V3;
  const t = titleV3(ch.num, ch.name);
  const cv = landV3({ dawn: ch.dawn, moon: ch.moon, boxes: t.boxes, skipStars: ch.skipStars });
  const seats = ch.seats || SEATS.map((_, i) => i);
  if (ch.back) ch.back(cv);
  seats.filter((i) => SEATS[i][1] < FY).forEach((i) => cv.spr(STUMP, SEATS[i][0], SEATS[i][1]));
  const back = new Cv(W, H), front = new Cv(W, H);
  stonesV3(back, front);
  let body = cv.svg() + back.svg() + (ch.backSvg ? ch.backSvg() : '');
  const fire = ch.fire ? ch.fire(`c${n}f`) : fireV3(`c${n}f`, FX, FY + 4, ch.h, ch.hw);
  if (!ch.dawn) body += fire.svg;
  front.spr(PX.SPRITES.logs, FX - 10, FY, ch.dawn ? { m: 'W', n: 'R' } : undefined);
  if (!ch.dawn) [[FX - 3, FY + 4, 'r'], [FX + 2, FY + 4, 'R'], [FX, FY + 5, 'o'], [FX - 1, FY + 4, 'y']].forEach(([x, y, c]) => front.px(x, y, c));
  seats.filter((i) => SEATS[i][1] >= FY).forEach((i) => front.spr(STUMP, SEATS[i][0], SEATS[i][1]));
  if (ch.front) ch.front(front);
  body += front.svg() + (ch.dawn ? fire.svg : '') + (ch.frontSvg ? ch.frontSvg() : '') + t.svg + frame2(W, H);
  write(`chapter-${n}.svg`, {
    w: W, h: H, bg: C.k, css: fire.css, body,
    title: `Chapter ${ch.num} · ${ch.title}`,
    desc: `Square pixel-art chapter card ${ch.num} of VIII, titled ${ch.num} · ${ch.title} in pixel letters in the night sky. ${ch.desc}`,
  });
}

/* Small props for the cards */
const GHOST = ['...ffff...', '..ffffff..', '.ffffffff.', '.ffgffgff.', '.ffgffgff.', 'ffffffffff', 'ffffggffff', 'ffffffffff', 'ffffffffff', 'fff.ff.fff', '.f...f..f.'];
/** A-frame tent 15×9 with a lit door */
function tent(cv, x, y, c = 'u', d = 'z') {
  for (let r = 0; r < 9; r++) { cv.rect(x + 7 - r, y + r, r + 1, 1, c); cv.rect(x + 8, y + r, r, 1, d); }
  for (let r = 0; r < 9; r++) cv.px(x + 7 - r, y + r, 'k').px(x + 7 + r, y + r, 'k');
  cv.rect(x + 6, y + 4, 3, 5, 'o').rect(x + 7, y + 5, 1, 4, 'y').px(x + 7, y - 1, 'k');
}
/** Little house 7×7 with a lit window */
function house(cv, x, y, c = 'k', win = 'y') {
  cv.rect(x, y + 3, 7, 4, c).rect(x + 1, y + 2, 5, 1, c).rect(x + 2, y + 1, 3, 1, c).px(x + 3, y, c).rect(x + 2, y + 4, 2, 2, win);
}
/** Dashed polyline on a canvas */
function dashLine(cv, pts, c = 'd', on = 2, gap = 2) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s < len; s++, acc++) if (acc % (on + gap) < on) cv.px(Math.round(x0 + ((x1 - x0) * s) / len), Math.round(y0 + ((y1 - y0) * s) / len), c);
  }
}

const CHAPTERS = [
  { num: 'I', name: 'THE GATHERING', title: 'The gathering', h: 7, hw: 3, moon: [22, 60],
    desc: 'A ring of six empty tree stumps around a small, freshly lit campfire under the stars. Pix, the little pixel mascot, walks in from the left to join.',
    front: (c) => {
      pixLit(c, 6, 124, 'r');
      [[2, 139], [0, 138]].forEach(([x, y]) => c.px(x, y, 's'));
      [[79, 117, 'y'], [83, 113, 'o'], [77, 109, 'r']].forEach(([x, y, k]) => c.px(x, y, k));
    } },
  { num: 'II', name: 'OLD FIRES', title: 'Old fires', h: 12, hw: 5, moon: [40, 54], seats: [1, 2, 4, 5],
    desc: 'A big rock on the left carries cave paintings: a deer, a hand print, a sun and a little fire. On the right an old computer terminal with a blinking prompt stands by the campfire, the ELIZA era. Pix sits on a stump and listens.',
    back: (c) => {
      for (let y = 84; y < 132; y++) { const t = (y - 84) / 48, hw = Math.round(22 * Math.sqrt(Math.min(1, t * 1.6)) * (1 - 0.15 * t)); c.rect(26 - hw, y, hw * 2 + 1, 1, 's'); c.rect(26 + hw - 3, y, 4, 1, y > 90 ? 't' : 's'); }
      for (let y = 88; y < 128; y += 5) c.rect(10 + ((y * 7) % 20), y, 3, 1, '4');
      c.spr(['.n.n......', '..nn......', '..nnnnnnn.', '...nnnnnn.', '...n.n.n.n', '...n.n.n.n'], 12, 98);
      c.spr(['.R.R.R.', '.R.R.R.', 'RR.R.R.', 'RRRRRR.', '.RRRRR.', '..RRR..'], 30, 104);
      c.spr(['.m.m.', 'm.m.m', '.mmm.', 'mm.mm', '.mmm.', 'm.m.m'], 18, 112);
      c.spr(['..R..', '.RoR.', 'RooR.', '.RR..'], 34, 116);
    },
    front: (c) => {
      const t = new Cv(16, 16); LORE_ICONS.eliza(t, 0); c.spr(t.rows(), 100, 120);
      pixLit(c, 120, 131, 'l');
    } },
  { num: 'III', name: 'WORDS BY THE FIRE', title: 'Words by the fire', h: 17, hw: 6, moon: [130, 54],
    skipStars: (x, y) => x > 50 && x < 112 && y > 48 && y < 104,
    desc: 'The campfire burns brighter. Words rise from it like sparks and cool as they climb: RAG just above the flames, MCP higher, TOKEN highest. Pix sits on a stump and looks up.',
    front: (c) => {
      pixLit(c, 38, 108, 'r');
      [[82, 108, 'y'], [78, 103, 'o'], [86, 99, 'y'], [73, 94, 'o'], [90, 86, 'r'], [69, 82, 'r'], [76, 66, 'r'], [94, 70, 'o']].forEach(([x, y, k]) => c.px(x, y, k));
    },
    frontSvg: () => PX.text('RAG', { x: 92, y: 90, fill: C.w, align: 'center' }) + PX.text('MCP', { x: 66, y: 72, fill: C.y, align: 'center' }) + PX.text('TOKEN', { x: 88, y: 54, fill: C.o, align: 'center' }) },
  { num: 'IV', name: 'KINDLING', title: 'Kindling', h: 20, hw: 7, moon: [58, 52], seats: [3, 4, 5],
    desc: 'Hands-on: next to the campfire lies a bundle of kindling, and a lit match leans against it. On the right a phone stands upright and shows one single HTML file. Pix sits close by.',
    back: (c) => {
      const x = 116, y = 98;
      c.rect(x, y, 22, 36, 'k').rect(x + 1, y + 1, 20, 34, 'z').rect(x + 2, y + 4, 18, 26, 'N').rect(x + 9, y + 2, 4, 1, 's').rect(x + 8, y + 31, 6, 2, 's');
      c.rect(x + 4, y + 7, 14, 18, 'f').rect(x + 14, y + 7, 4, 4, 'e').px(x + 14, y + 7, 'N').rect(x + 15, y + 7, 3, 1, 'N').rect(x + 17, y + 8, 1, 2, 'N');
      c.rect(x + 6, y + 21, 10, 1, 'c').rect(x + 6, y + 23, 7, 1, 'c').rect(x + 2, y + 28, 18, 1, 'a');
    },
    frontSvg: () => PX.text('</>', { x: 116 + 11, y: 98 + 12, fill: C.R, align: 'center' }),
    front: (c) => {
      // a teepee of kindling with tinder inside, a lit match leaning on it
      [[29, 142], [33, 143], [37, 143], [41, 143], [45, 143], [49, 142]].forEach(([x, y], k) => c.line(39, 123, x, y, k % 2 ? 'm' : 'n'));
      c.px(39, 122, 'n').px(38, 121, 'n').px(40, 121, 'm');
      c.rect(35, 140, 9, 2, 'W').rect(36, 139, 7, 1, 'y').px(38, 138, 'w').px(40, 138, 'o').px(42, 139, 'o');
      c.line(60, 148, 52, 134, 'f'); c.line(61, 148, 53, 134, 'n');
      c.rect(51, 131, 3, 3, 'R').px(52, 130, 'o').px(52, 129, 'y').px(51, 128, 'y').px(52, 127, 'w').px(53, 129, 'o');
      pixLit(c, 96, 132, 'l');
    } },
  { num: 'V', name: 'MANY FIRES', title: 'Many fires', moon: [96, 52], seats: [2, 3],
    desc: 'A camp of many fires: the big campfire in the middle and four smaller fires around it, linked by dashed paths across the ground. Tents stand by the fires, and far away more fires glow on the mountains. Pix stands by a tent.',
    back: (c) => {
      [[22, 118], [138, 118], [52, 110], [108, 110]].forEach(([x, y]) => dashLine(c, [[80, 138], [x, y + 3]], 'd'));
      tent(c, 2, 108, 'u', 'z'); tent(c, 142, 108, 'v', 'q'); tent(c, 60, 98, 'x', 's'); tent(c, 90, 98, 'u', 'z');
      [[18, 84], [56, 76], [120, 80], [134, 74]].forEach(([x, y]) => c.px(x, y, 'o'));
    },
    backSvg: () => [[22, 118], [138, 118], [52, 110], [108, 110]].map(([x, y]) => `<path fill="${C.o}" fill-opacity=".12" d="${ellD(x, y + 3, 7, 2)}"/>`).join('')
      + [[18, 84], [56, 76], [120, 80], [134, 74]].map(([x, y]) => `<path fill="${C.o}" fill-opacity=".14" d="${ellD(x, y, 2, 1)}"/>`).join(''),
    fire: (cls) => frameSet(cls, 3, (f) => {
      const c = new Cv(V3.W, V3.H);
      flameV3(c, V3.FX, V3.FY + 4, 22, 8, f);
      [[22, 118, 6, 3], [138, 118, 6, 3], [52, 110, 4, 2], [108, 110, 4, 2]].forEach(([x, y, h, hw], k) => {
        flameV3(c, x, y + 1, h, hw, (f + k) % 3);
        c.rect(x - 3, y + 1, 6, 1, 'W').rect(x - 2, y + 2, 4, 1, 'm');
      });
      return glowV3(V3.FX, V3.FY + 7, 11 + (f === 1 ? 1 : f === 2 ? -1 : 0), V3.HZ, 20) + c.svg();
    }, [0, 1, 2, 0, 2, 1], 0.125),
    front: (c) => { pixLit(c, 140, 120, 'l'); } },
  { num: 'VI', name: 'A FIRE FOR VAVE', title: 'A fire for VAVE', h: 27, hw: 10, moon: [134, 54], seats: [2, 3, 4, 5],
    skipStars: (x, y) => x > 34 && x < 126 && y > 50,
    desc: 'A big campfire burns in front of a lit trade-fair booth at night. The booth has a truss with spotlights, a header that reads VAVE.LOG, a calendar screen and a clock screen on the wall, and a counter. Pix stands next to the fire.',
    back: (c) => {
      const x0 = 38, x1 = 122, top = 60;
      c.rect(x0, top, x1 - x0, 1, 't').rect(x0, top + 3, x1 - x0, 1, 't');
      for (let x = x0; x < x1; x += 3) c.px(x, top + 1, 's').px(x + 1, top + 2, 's');
      c.rect(x0, top, 1, 50, 't').rect(x1 - 1, top, 1, 50, 't');
      [50, 80, 110].forEach((x) => c.rect(x - 1, top + 4, 3, 2, 's').px(x, top + 6, 'y'));
      c.rect(x0 + 4, top + 7, x1 - x0 - 8, 11, 'k').rect(x0 + 4, top + 17, x1 - x0 - 8, 1, 'M');
      c.rect(x0 + 4, top + 18, x1 - x0 - 8, 30, '4');
      for (let y = top + 19; y < top + 48; y += 6) c.rect(x0 + 4, y, x1 - x0 - 8, 1, 'a');
      const cx = 46, cy = top + 21;
      c.rect(cx, cy, 22, 20, 'k').rect(cx + 1, cy + 1, 20, 18, 'f').rect(cx + 1, cy + 1, 20, 4, 'R').px(cx + 5, cy, 'i').px(cx + 16, cy, 'i');
      for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) c.rect(cx + 2 + k * 4, cy + 7 + r * 4, 2, 2, r === 1 && k === 2 ? 'o' : 'a');
      const kx = 103, ky = top + 31;
      c.ell(kx, ky, 9, 9, 'k'); c.ell(kx, ky, 8, 8, 'f'); c.ell(kx, ky, 6, 6, 'i');
      [[0, -7], [7, 0], [0, 7], [-7, 0]].forEach(([dx, dy]) => c.px(kx + dx, ky + dy, 'g'));
      c.line(kx, ky, kx, ky - 5, 'g'); c.line(kx, ky, kx + 4, ky + 2, 'R'); c.px(kx, ky, 'k');
      c.rect(x0 + 2, top + 48, x1 - x0 - 4, 2, 'n').rect(x0 + 2, top + 50, x1 - x0 - 4, 1, 'W');
    },
    backSvg: () => PX.text('VAVE.LOG', { x: 80, y: 69, fill: C.M, align: 'center' })
      + [50, 80, 110].map((x) => `<path fill="${C.y}" fill-opacity=".07" d="${dotD([[x - 2, 67, 5, 4], [x - 4, 71, 9, 6], [x - 6, 77, 13, 8], [x - 8, 85, 17, 22]])}"/>`).join(''),
    front: (c) => { pixLit(c, 98, 126, 'l'); } },
  { num: 'VII', name: 'SMOKE', title: 'Smoke', h: 14, hw: 6, moon: [118, 50], seats: [0, 1, 3, 4, 5],
    skipStars: (x, y) => x > 48 && x < 120 && y > 40,
    desc: 'The fire burns low and a column of smoke curls up into the night. Three friendly ghosts float in the smoke: one holds a key, one wears a padlock, one carries a question mark. Pix peeks out from behind a stump.',
    backSvg: () => {
      let s = '';
      for (let k = 0; k < 13; k++) {
        const y = Math.round(118 - k * 5.4), x = 80 + Math.round(9 * Math.sin(k / 2.2)) + Math.round(k * 0.6), r = 3 + Math.round(k * 0.65);
        s += `<path fill="${C.s}" fill-opacity=".42" d="${ellD(x, y, r + 2, r)}"/><path fill="${C.t}" fill-opacity=".16" d="${ellD(x - 1, y - 1, r, Math.max(1, r - 2))}"/>`;
      }
      return s;
    },
    frontSvg: () => {
      const g = (x, y, extra) => `<g fill-opacity=".92">${PX.sprite(GHOST, { x, y, pal: { f: C.i } })}</g>` + extra;
      return g(60, 88, PX.sprite(['.yy.', 'y..y', '.yy.', '..y.', '..yy', '..y.', '..yy'], { x: 71, y: 93 }))
        + g(96, 70, PX.sprite(['.tt.', 't..t', 'tttt', 'tkkt', 'tttt'], { x: 99, y: 77 }))
        + g(68, 50, PX.text('?', { x: 81, y: 52, fill: C.y }));
    },
    front: (c) => { pixLit(c, 30, 136, 'r'); c.spr(STUMP, 26, 146); } },
  { num: 'VIII', name: 'EMBERS', title: 'Embers', dawn: true,
    desc: 'Dawn: the sky turns pale green over the hills. The fire has burnt down to glowing embers, a thin wisp of smoke rises, and a few sparks fly home along dotted trails to the small lit houses on the hills. Pix sits on a stump and watches them go.',
    back: (c) => {
      [[18, 94], [56, 92], [124, 92]].forEach(([x, y]) => house(c, x, y, 'k', 'y'));
      [[[80, 128], [64, 110], [46, 102], [26, 100]], [[80, 128], [74, 108], [66, 98], [60, 96]], [[82, 128], [98, 110], [114, 100], [126, 98]]].forEach((p) => dashLine(c, p, 'o', 1, 3));
      [[80, 124], [81, 120], [80, 116], [79, 112], [80, 108]].forEach(([x, y]) => c.px(x, y, 's'));
    },
    frontSvg: () => [[30, 98], [62, 95], [121, 96]].map(([x, y]) => PX.sprite('spark', { x: x - 1, y: y - 1 })).join(''),
    fire: (cls) => frameSet(cls, 2, (f) => {
      const c = new Cv(V3.W, V3.H);
      const hot = f ? ['o', 'r', 'R', 'y'] : ['r', 'R', 'o', 'r'];
      c.rect(73, 136, 15, 2, 'R').rect(75, 135, 11, 1, 'r');
      [[74, 134], [77, 133], [80, 134], [83, 133], [86, 134], [76, 136], [79, 135], [82, 136], [85, 135], [78, 137], [81, 137], [72, 137], [88, 137], [80, 132]].forEach(([x, y], k) => c.px(x, y, hot[k % 4]));
      if (f) c.px(80, 130, 'o').px(80, 129, 'y').px(79, 131, 'o').px(81, 131, 'r'); else c.px(79, 131, 'r').px(80, 131, 'o');
      return glowV3(V3.FX, V3.FY + 5, f ? 6 : 5, V3.HZ, 8) + c.svg();
    }, [0, 0, 1, 1, 1, 0, 1, 0], 0.3),
    front: (c) => { pixLit(c, 110, 108, 'l'); } },
];
function chapters() { CHAPTERS.forEach((ch, i) => chapterCard(i + 1, ch)); }

/* ── v3 · Story map: the trail of the evening, eight camps (200×200) ──────── */
function storyMap() {
  const W = 200, H = 200, rnd = rng(321);
  const CAMPS = [
    ['I', 'GATHERING', 44, 46], ['II', 'OLD FIRES', 128, 46], ['III', 'WORDS', 158, 86], ['IV', 'KINDLING', 78, 86],
    ['V', 'MANY FIRES', 42, 126], ['VI', 'VAVE', 120, 126], ['VII', 'SMOKE', 158, 166], ['VIII', 'EMBERS', 82, 166],
  ];
  const cv = new Cv(W, H, 'N');
  for (let y = 0; y < 22; y++) cv.rect(0, y, W, 1, 'k');
  for (let x = 0; x < W; x++) for (let y = 22; y < 25; y++) cv.px(x, y, dband(x, y, 22, 'k', 'N'));
  for (let i = 0; i < 30; i++) { const x = Math.floor(rnd() * W), y = 3 + Math.floor(rnd() * 18); if ((x < 22 || x > 176) && Math.hypot(x - 184, y - 12) > 7) cv.px(x, y, rnd() < 0.3 ? 'i' : rnd() < 0.5 ? '4' : 'a'); }
  moonV3(cv, 184, 12, 4);
  for (let i = 0; i < 260; i++) cv.rect(Math.floor(rnd() * W), 26 + Math.floor(rnd() * (H - 26)), 2 + Math.floor(rnd() * 2), 1, rnd() < 0.5 ? '2' : '3');
  // the trail: a smooth curve through the camps with wide turns at the row ends
  const turn = { 1: [[176, 50], [182, 70]], 3: [[24, 92], [18, 112]], 5: [[176, 132], [182, 152]] };
  const pts = [[14, 40]];
  CAMPS.forEach(([, , x, y], i) => { pts.push([x, y + 2]); if (turn[i]) pts.push(...turn[i]); });
  const smooth = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.05) {
      const t2 = t * t, t3 = t2 * t;
      smooth.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  smooth.push(pts[pts.length - 1]);
  const near = (x, y, r) => smooth.some(([a, b]) => Math.hypot(a - x, b - y) < r) || CAMPS.some(([, nm, a, b]) => Math.abs(a - x) < PX.textWidth(nm) / 2 + 8 && y > b - 16 && y < b + 28);
  for (let i = 0; i < 70; i++) {
    const x = 6 + Math.floor(rnd() * (W - 12)), y = 36 + Math.floor(rnd() * (H - 44));
    if (near(x, y, 9)) continue;
    pine(cv, x, y, 5 + Math.floor(rnd() * 5), rnd() < 0.5 ? '4' : 'g', 'k');
  }
  dashLine(cv, smooth.map(([x, y]) => [Math.round(x), Math.round(y)]), 'c', 2, 2);
  const front = new Cv(W, H);
  let ink = '', glow = '';
  CAMPS.forEach(([num, nm, x, y]) => {
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.4; front.px(Math.round(x + 6 * Math.cos(a)), Math.round(y + 2 + 1.6 * Math.sin(a)), Math.sin(a) > 0 ? 't' : 's'); }
    front.rect(x - 3, y + 1, 7, 1, 'W').rect(x - 2, y + 2, 5, 1, 'm');
    glow += `<path fill="${C.o}" fill-opacity=".12" d="${ellD(x, y + 2, 10, 3)}"/>`;
    ink += PX.text(num, { x: x + 1, y: y + 7, fill: C.M, align: 'center' });
    ink += PX.text(nm, { x: x + 1, y: y + 16, fill: C.i, align: 'center' });
  });
  // the fire grows along the trail, smokes at VII, is embers at VIII
  const SIZE = [[3, 1], [5, 2], [6, 2], [7, 3], [7, 3], [9, 3], [5, 2], [0, 0]];
  const fires = frameSet('mf', 3, (f) => {
    const c = new Cv(W, H);
    CAMPS.forEach(([, , x, y], i) => {
      const [h, hw] = SIZE[i];
      if (h) flameV3(c, x + 1, y + 1, h, hw, (f + i) % 3);
      if (i === 4) { flameV3(c, x - 7, y + 2, 3, 1, (f + 1) % 3); flameV3(c, x + 9, y + 2, 3, 1, (f + 2) % 3); }
      if (i === 7) { c.rect(x - 2, y + 1, 7, 1, 'R'); [[x - 1, y], [x + 1, y], [x + 3, y], [x, y - 1], [x + 2, y - 1]].forEach(([a, b], k) => c.px(a, b, (k + f) % 2 ? 'r' : f ? 'y' : 'o')); }
    });
    return c.svg();
  }, [0, 1, 2, 0, 2, 1], 0.125);
  const smoke = [[159, 157, 2, 1, 0.4], [161, 152, 3, 2, 0.3], [164, 146, 3, 2, 0.22], [166, 141, 2, 1, 0.15]].map(([x, y, rx, ry, o]) => `<path fill="${C.t}" fill-opacity="${o}" d="${ellD(x, y, rx, ry)}"/>`).join('');
  const title = PX.text('THE TRAIL OF THE EVENING', { x: W / 2, y: 8, fill: C.i, align: 'center' });
  write('story-map.svg', {
    w: W, h: H, bg: C.k, css: fires.css,
    body: cv.svg() + glow + front.svg() + fires.svg + smoke + ink + title + frame2(W, H),
    title: 'The trail of the evening: eight camps',
    desc: `A pixel-art night map. A dotted trail winds through a dark pine forest past eight small campfires, each labelled: ${CAMPS.map(([n, nm]) => `${n} ${nm.toLowerCase()}`).join(', ')}. The fires grow along the way, smoke rises at VII and only embers glow at VIII. Stars and a crescent moon at the top.`,
  });
}

/* ── v3 · Title: Playing with Fire, stories around the fire (320×180) ──────── */
function titleFire() {
  const W = 320, H = 180, HZ = 136, FX = 160, rnd = rng(331);
  const cv = new Cv(W, H, 'k');
  for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) cv.px(x, y, y < 104 ? 'k' : y < 107 ? dband(x, y, 104, 'k', 'N') : y < 118 ? 'N' : y < 121 ? dband(x, y, 118, 'N', '3') : '3');
  // logo first, so the stars keep clear of it
  const S = 4, logo = new Cv(W, H);
  const green = (r) => (r < 8 ? 'f' : r < 16 ? 'e' : r < 24 ? 'd' : 'c');
  const flameCol = (r) => (r < 6 ? 'w' : r < 12 ? 'y' : r < 20 ? 'o' : 'r');
  const w1 = PX.textWidth('PLAYING', S), w2 = PX.textWidth('WITH FIRE', S), wWith = PX.textWidth('WITH ', S);
  textCv(logo, 'PLAYING', Math.floor((W - w1) / 2), 12, S, green);
  textCv(logo, 'WITH', Math.floor((W - w2) / 2), 46, S, green);
  textCv(logo, 'FIRE', Math.floor((W - w2) / 2) + wWith, 46, S, flameCol);
  const shadow = new Cv(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (logo.get(x, y) !== '.') shadow.px(x + 2, y + 2, 'g');
  const lg = new Cv(W, H);
  outlined(shadow, lg, 'k');
  outlined(logo, lg, 'k');
  const sub1 = 'STORIES AROUND THE FIRE', sub2 = 'AN EVENING WITH VAVE', subW = PX.textWidth(sub1, 2);
  const clear = (x, y) => [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dy]) => lg.get(x + dx, y + dy) === '.') && !(y > 76 && y < 110 && Math.abs(x - W / 2) < subW / 2 + 6);
  for (let i = 0; i < 90; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 112); if (clear(x, y) && Math.hypot(x - 286, y - 22) > 10) cv.px(x, y, rnd() < 0.12 ? 'i' : rnd() < 0.5 ? '4' : 'a'); }
  moonV3(cv, 286, 22, 6);
  // horizon: mountains, hills, treeline, ground
  const mt = (x) => 115 + Math.round(4 * Math.sin(x / 29) + 3 * Math.sin(x / 11 + 1) + 1.5 * Math.sin(x / 5.3));
  for (let x = 0; x < W; x++) { cv.rect(x, mt(x), 1, HZ - mt(x), 'g'); if (mt(x + 1) > mt(x)) cv.px(x, mt(x), 'a'); }
  for (let x = 0; x < W; x++) { const y = 124 + Math.round(3 * Math.sin(x / 17) + 2 * Math.sin(x / 7 + 1)); cv.rect(x, y, 1, HZ - y, '2'); }
  for (let x = -2; x < W + 3; x += 3 + Math.floor(rnd() * 5)) { const e = x < 70 ? (70 - x) / 70 : x > 250 ? (x - 250) / 70 : 0; pine(cv, x, HZ + 1, 5 + Math.floor(rnd() * 6) + Math.round(e * 16), 'k'); }
  for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) cv.px(x, y, y < 170 ? '3' : y < 173 ? dband(x, y, 170, '3', '2') : '2');
  // stumps, stones, logs, Pix
  const back = new Cv(W, H), front = new Cv(W, H);
  [[FX - 52, 140], [FX + 44, 140], [FX - 76, 154], [FX + 68, 154]].forEach(([x, y]) => back.spr(STUMP, x, y));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3, x = Math.round(FX + 16 * Math.cos(a)) - 2, y = Math.round(161 + 3.6 * Math.sin(a)) - 1;
    if (Math.sin(a) > 0) front.spr(STONE3, x, y, { t: 'n' }); else back.spr(STONE3, x, y, { s: 'n', t: 't' });
  }
  front.spr(PX.SPRITES.logs, FX - 10, 154);
  [[FX - 3, 158, 'r'], [FX + 2, 158, 'R'], [FX, 159, 'o'], [FX - 1, 158, 'y']].forEach(([x, y, c]) => front.px(x, y, c));
  pixLit(front, FX + 22, 145, 'l');
  const fire = frameSet('tf', 3, (f) => {
    const c = new Cv(W, H);
    flameV3(c, FX, 158, 24, 9, f);
    return [[52, 12], [36, 9], [22, 6]].map(([rx, ry]) => `<path fill="${C.o}" fill-opacity=".09" d="${ellD(FX, 162, rx + (f === 1 ? 2 : 0), ry, HZ)}"/>`).join('')
      + `<path fill="${C.o}" fill-opacity=".05" d="${ellD(FX, 146, 22 + f, 22 + f)}"/>` + c.svg();
  }, [0, 1, 2, 0, 2, 1], 0.125);
  let body = cv.svg() + lg.svg() + back.svg() + fire.svg + front.svg();
  body += PX.text(sub1, { x: W / 2, y: 80, scale: 2, fill: C.y, align: 'center' });
  body += PX.text(sub2, { x: W / 2, y: 99, fill: C.t, align: 'center' });
  body += frame2(W, H);
  write('title-fire.svg', {
    w: W, h: H, bg: C.k, css: fire.css, body,
    title: 'Playing with Fire: stories around the fire',
    desc: 'Pixel-art title picture at night. Big pixel letters read Playing with fire, the word fire in flame colours. Below: stories around the fire, and an evening with VAVE. A starry sky with a crescent moon over dark mountains and pines; in front a campfire crackles inside a ring of stones and stumps, and Pix, the little pixel mascot, sits beside it in the warm light.',
  });
}

/* node campfire/tools/art.mjs [name …] renders only the named pieces (default: all) */
const ONLY = process.argv.slice(2);
const JOBS = {
  scene, fireplaceRules, repoWall, trailMap, lifeStrip, pixWave, icons,
  itemsSheet, worldMap, titleScreen, boothScene, loreStrip, bosses, guildHall, remixMap, vavelogQuest,
  chapters, storyMap, titleFire,
};
for (const [name, fn] of Object.entries(JOBS)) if (!ONLY.length || ONLY.includes(name)) fn();
