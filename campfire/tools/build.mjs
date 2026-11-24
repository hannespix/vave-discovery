#!/usr/bin/env node
// Campfire build: every page in decks/, modules/ and index.html becomes ONE self-contained HTML file in dist/.
// Local <link rel=stylesheet>, <script src> and <img src> are inlined (fonts and images as data: URIs), so each
// file works offline, by double-click, and as an embedded tool card in PixiNotes. No dependencies.
//
//   node campfire/tools/build.mjs            build everything
//   node campfire/tools/build.mjs decks/spark.html   build one page
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve, relative, extname } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const dist = join(root, 'dist');
const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const isLocal = (u) => u && !/^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/i.test(u);

function dataUri(file) {
  const mime = MIME[extname(file).toLowerCase()];
  if (!mime) throw new Error(`build: no mime type for ${relative(root, file)}`);
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

/** url(...) in CSS → data: URI, relative to the CSS file's folder */
function inlineCssUrls(css, baseDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => (isLocal(u) ? `url("${dataUri(resolve(baseDir, u))}")` : m));
}

const scriptSafe = (js) => js.replace(/<\/script/gi, '<\\/script');

function inlinePage(file) {
  const base = dirname(file);
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
    if (!isLocal(href)) return tag;
    const f = resolve(base, href);
    return `<style>/* ${relative(root, f)} */\n${inlineCssUrls(readFileSync(f, 'utf8'), dirname(f))}</style>`;
  });
  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, a, src, b) => {
    if (!isLocal(src)) return tag;
    const f = resolve(base, src);
    const attrs = `${a}${b}`.replace(/\s+/g, ' ').trim();
    return `<script${attrs ? ' ' + attrs : ''}>/* ${relative(root, f)} */\n${scriptSafe(readFileSync(f, 'utf8'))}\n</script>`;
  });
  // <img data-link> stays a link (the hub page shows the art files it also offers for download)
  html = html.replace(/<img\b[^>]*>/gi, (tag) => (/\bdata-link\b/i.test(tag) ? tag : tag.replace(/(\bsrc=["'])([^"']+)(["'])/i, (m, a, src, b) => (isLocal(src) ? `${a}${dataUri(resolve(base, src))}${b}` : m))));
  // url() inside the page's own <style> blocks
  html = html.replace(/<style>([\s\S]*?)<\/style>/gi, (m, css) => `<style>${inlineCssUrls(css, base)}</style>`);
  return html;
}

/** Left-over local references would break the single-file promise */
function leftovers(html) {
  const bad = [];
  for (const m of html.matchAll(/<(?:script|img|link|source|video|audio|iframe)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) if (isLocal(m[1]) && !/\bdata-link\b/i.test(m[0])) bad.push(m[1]);
  return bad;
}

const wanted = process.argv.slice(2);
const pages = wanted.length ? wanted.map((p) => resolve(root, p)) : [
  ...['decks', 'modules'].flatMap((d) => (existsSync(join(root, d)) ? readdirSync(join(root, d)).filter((f) => f.endsWith('.html')).map((f) => join(root, d, f)) : [])),
  join(root, 'index.html'),
].filter(existsSync);

let failed = false;
for (const page of pages) {
  const out = join(dist, relative(root, page));
  mkdirSync(dirname(out), { recursive: true });
  const html = inlinePage(page);
  const bad = leftovers(html);
  if (bad.length) { console.error(`✘ ${relative(root, page)}: local references left: ${bad.join(', ')}`); failed = true; }
  if (!/prefers-reduced-motion/.test(html)) { console.error(`✘ ${relative(root, page)}: no prefers-reduced-motion`); failed = true; }
  writeFileSync(out, html);
  console.log(`✔ ${relative(root, out)}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}

// Art: standalone SVGs and their PNGs travel as they are
if (!wanted.length && existsSync(join(root, 'art'))) {
  mkdirSync(join(dist, 'art'), { recursive: true });
  for (const f of readdirSync(join(root, 'art')).filter((f) => /\.(svg|png)$/.test(f))) copyFileSync(join(root, 'art', f), join(dist, 'art', f));
}
process.exit(failed ? 1 : 0);
