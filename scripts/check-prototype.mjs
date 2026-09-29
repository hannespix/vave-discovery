#!/usr/bin/env node
// npm run check:prototype — prüft den gebauten Prototyp (prototype/dist, vorher `npm run build` in prototype/).
// Läuft in CI nach dem Build (check.yml, pages.yml); ein Fund hält nur den Prototyp auf, nie die Umfrage.
// Prüft: keine externen Referenzen oder Netzwerkaufrufe (README-Zusage „keine externen Aufrufe zur Laufzeit“),
// noindex gesetzt, kein Zugriff auf den Speicher der Umfrage (gleicher Ursprung auf GitHub Pages).
// Keine Abhängigkeiten.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const dist = join(root, "prototype", "dist");
const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(join(dist, "index.html"))) {
  console.error("✗ prototype/dist/index.html fehlt — erst `npm run build` in prototype/");
  process.exit(1);
}

// Muster wie in check.mjs, dazu Laufzeit-Aufrufe im Script-Bundle. Fehlermeldungs-URLs in Strings (z. B. React) sind
// keine Aufrufe und fallen nicht darunter.
const rules = {
  ".html": [
    [/<script[^>]+src=["'](https?:)?\/\//i, "externes Script"],
    [/<link[^>]+href=["'](https?:)?\/\//i, "externes Stylesheet/Link"],
    [/<img[^>]+src=["'](https?:)?\/\//i, "externes Bild"],
    [/<iframe/i, "iframe"],
  ],
  ".css": [
    [/@import/i, "@import"],
    [/url\(\s*["']?(https?:)?\/\//i, "url() nach extern"],
  ],
  ".js": [
    [/fetch\(\s*["'`](https?:)?\/\//i, "fetch nach extern"],
    [/import\(\s*["'`](https?:)?\/\//i, "dynamischer Import von extern"],
    [/sendBeacon\s*\(/, "sendBeacon"],
    [/new\s+WebSocket\s*\(/, "WebSocket"],
    [/new\s+EventSource\s*\(/, "EventSource"],
    [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
    [/vave-discovery-v1/, "Zugriff auf den Speicher der Umfrage"],
  ],
};

const files = [join(dist, "index.html"), ...readdirSync(join(dist, "assets")).map((f) => join(dist, "assets", f))];
for (const path of files) {
  const list = rules[extname(path)];
  if (!list) continue;
  const text = readFileSync(path, "utf8");
  const label = path.slice(root.length + 1);
  list.forEach(([re, what]) => { if (re.test(text)) fail(`${label}: ${what}`); });
}

const html = readFileSync(join(dist, "index.html"), "utf8");
if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) fail("prototype/dist/index.html: noindex fehlt");

if (errors.length) {
  console.error(`✗ Prototyp-Check: ${errors.length} Fund(e)\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ Prototyp-Check grün — ${files.length} Dateien, keine externen Referenzen, noindex gesetzt`);
