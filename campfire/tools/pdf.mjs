#!/usr/bin/env node
// Campfire PDFs: every built deck (dist/decks/*.html) → dist/pdf/<name>.pdf, one page per slide.
// Each slide is printed exactly as it looks on screen (screen media, 1280×720), then the pages are joined with
// pdfunite. reveal's own ?print-pdf mode shifted our custom layouts sideways, so we don't use it. Text stays text.
// Needs Chromium, playwright-core and poppler's pdfunite — none of them is a dependency of this repo:
//   PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core CHROMIUM=/path/to/chromium node campfire/tools/pdf.mjs
import { readdirSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pw = await import(process.env.PLAYWRIGHT_CORE ? pathToFileURL(join(process.env.PLAYWRIGHT_CORE, 'index.mjs')).href : 'playwright-core');
const decks = join(root, 'dist', 'decks');
const out = join(root, 'dist', 'pdf');
mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'campfire-pdf-'));

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });   // still frames, no half-drawn animation
let fehler = 0;
page.on('pageerror', (e) => { fehler += 1; console.error('pageerror:', e.message); });

for (const f of existsSync(decks) ? readdirSync(decks).filter((x) => x.endsWith('.html')).sort() : []) {
  await page.goto(pathToFileURL(join(decks, f)).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Reveal?.isReady?.());
  await page.addStyleTag({ content: '.reveal .controls, .reveal .progress, .reveal .slide-number { display: none !important; }' });
  const folien = await page.evaluate(() => Reveal.getSlides().map((s) => Reveal.getIndices(s)));
  const teile = [];
  for (const [i, { h, v }] of folien.entries()) {
    await page.evaluate(([h, v]) => Reveal.slide(h, v ?? 0), [h, v]);
    await page.waitForTimeout(350);                 // fonts + pixel sprites settle
    const teil = join(tmp, `${f}-${String(i).padStart(3, '0')}.pdf`);
    await page.pdf({ path: teil, width: '1280px', height: '720px', printBackground: true, pageRanges: '1' });
    teile.push(teil);
  }
  const ziel = join(out, f.replace(/\.html$/, '.pdf'));
  execFileSync('pdfunite', [...teile, ziel]);
  console.log(`✔ dist/pdf/${f.replace(/\.html$/, '.pdf')} · ${teile.length} pages`);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
process.exit(fehler ? 1 : 0);
