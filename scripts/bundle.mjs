#!/usr/bin/env node
// npm run bundle — erzeugt dist/vave-discovery-umfrage.html: index.html mit inline eingebettetem modules.js.
// Das ist die Datei, die verschickt wird (D-003). Entwickelt wird weiter in survey/ (zwei Dateien, kein Build).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(join(root, "survey/index.html"), "utf8");
const data = readFileSync(join(root, "survey/modules.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const tag = /<script\s+src=["']modules\.js["']\s*><\/script>/i;
if (!tag.test(html)) { console.error("bundle: <script src=\"modules.js\"></script> nicht in survey/index.html gefunden"); process.exit(1); }
const out = html.replace(tag, `<script>\n/* --- eingebettet aus survey/modules.js (npm run bundle) --- */\n${data}\n</script>`);
mkdirSync(join(root, "dist"), { recursive: true });
const target = join(root, "dist/vave-discovery-umfrage.html");
writeFileSync(target, out);
console.log(`✓ dist/vave-discovery-umfrage.html — ${(out.length / 1024).toFixed(0)} kB, Einzeldatei`);
