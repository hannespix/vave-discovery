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
const PX = globalThis.PX;
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

  body += PX.text('41 REPOS · 1 YEAR', { x: GX, y: 10, scale: 2, fill: C.i });
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
    title: '41 repos, 1 year',
    desc: 'A wall of 41 pixel tiles, one per repository built in one year, coloured by kind: 17 everyday tools, 6 family business and winery, 9 personal and play, 4 brand and presentation, 3 for VAVE, 2 system configuration. A light wave runs across the tiles.',
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
  const rules = ['NO CLIENT SECRETS IN\nCONSUMER CHATS', 'KEYS NEVER LIVE IN CODE', 'EVERY TOOL HAS AN OWNER',
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

scene();
fireplaceRules();
repoWall();
trailMap();
lifeStrip();
pixWave();
icons();
