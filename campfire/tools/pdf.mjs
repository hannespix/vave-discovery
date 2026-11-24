#!/usr/bin/env node
// Campfire PDFs: every built deck (dist/decks/*.html) printed to dist/pdf/<name>.pdf with reveal.js' print mode.
// Needs Chromium and playwright-core — not a dependency of this repo:
//   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core CHROMIUM=/path/to/chromium node campfire/tools/pdf.mjs
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pw = await import(process.env.PLAYWRIGHT_CORE ? pathToFileURL(join(process.env.PLAYWRIGHT_CORE, 'index.mjs')).href : 'playwright-core');
const decks = join(root, 'dist', 'decks');
const out = join(root, 'dist', 'pdf');
mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
let fehler = 0;
page.on('pageerror', (e) => { fehler += 1; console.error('pageerror:', e.message); });
for (const f of existsSync(decks) ? readdirSync(decks).filter((x) => x.endsWith('.html')) : []) {
  await page.goto(`${pathToFileURL(join(decks, f)).href}?print-pdf`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);              // fonts + pixel sprites
  const ziel = join(out, f.replace(/\.html$/, '.pdf'));
  await page.pdf({ path: ziel, printBackground: true, preferCSSPageSize: true });
  console.log(`✔ dist/pdf/${f.replace(/\.html$/, '.pdf')}`);
}
await browser.close();
process.exit(fehler ? 1 : 0);
