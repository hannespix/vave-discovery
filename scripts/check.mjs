#!/usr/bin/env node
// npm run check [-- <export.json ...>] [--hook]
// Prüft: 1) survey/index.html (und dist/*.html, falls vorhanden): keine externen Referenzen, Motion-Ausweg, Viewport
//        2) survey/modules.js: konsistent (eindeutige IDs, bekannte Gruppen, Pflichtfelder)
//        3) data/results/*.json (oder übergebene Dateien) gegen docs/survey/results-schema.json (Format vave-discovery/1)
// Keine Abhängigkeiten. --hook: Fehler nach stderr, Exit 2 (Claude-Code-Hook-Konvention).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = process.argv.slice(2);
const hookMode = args.includes("--hook");
const files = args.filter((a) => !a.startsWith("--"));
const errors = [];
const fail = (msg) => errors.push(msg);

// 1) HTML-Dateien: Einzeldatei-Regeln
const externals = [
  [/<script[^>]+src=["']https?:/i, "externes Script"],
  [/<link[^>]+href=["']https?:/i, "externes Stylesheet/Link"],
  [/<link[^>]+href=["']\/\//i, "protokollrelativer Link"],
  [/@import\s+url\(\s*["']?https?:/i, "@import von extern"],
  [/url\(\s*["']?https?:\/\//i, "url() nach extern"],
  [/<img[^>]+src=["']https?:/i, "externes Bild"],
  [/fetch\(\s*["']https?:/i, "fetch nach extern"],
];
function checkHtml(path, label) {
  const html = readFileSync(path, "utf8");
  externals.forEach(([re, what]) => { if (re.test(html)) fail(`${label}: ${what} gefunden — Einzeldatei-Regel (D-003) verletzt`); });
  if (html.length > 2_000_000) fail(`${label}: ${html.length} Bytes — größer als 2 MB`);
  if (!/prefers-reduced-motion/.test(html)) fail(`${label}: kein prefers-reduced-motion — Animationen brauchen einen Ausweg`);
  if (!/<meta[^>]+viewport/.test(html)) fail(`${label}: kein viewport-Meta`);
  return html;
}
const surveyPath = join(root, "survey", "index.html");
let surveyHtml = null;
if (existsSync(surveyPath)) surveyHtml = checkHtml(surveyPath, "survey/index.html");
const distDir = join(root, "dist");
if (existsSync(distDir)) {
  for (const f of readdirSync(distDir).filter((f) => f.endsWith(".html"))) {
    const html = checkHtml(join(distDir, f), `dist/${f}`);
    if (/<script\s+src=["'][^"']+["']\s*><\/script>/i.test(html)) fail(`dist/${f}: enthält noch <script src=…></script> — nicht gebündelt`);
  }
}

// 2) Modulkatalog aus survey/modules.js (einzige Quelle)
const groups = ["alltag", "projekt", "finanzen", "gruppe", "anbindung"];
const win = {};
try {
  new Function("window", readFileSync(join(root, "survey/modules.js"), "utf8"))(win);
} catch (e) { fail(`survey/modules.js: lässt sich nicht laden (${e.message})`); }
const D = win.VAVE_DATA ?? { modules: [], wishes: [], roles: [], frequency: [] };
const moduleIds = new Set(), wishIds = new Set(), roleIds = new Set();
if (!Array.isArray(D.modules) || D.modules.length < 20) fail("modules.js: weniger als 20 Module");
for (const m of D.modules ?? []) {
  for (const k of ["id", "group", "price", "name", "desc"]) if (!(k in m)) fail(`modules.js: Modul ${m.id ?? "?"} ohne Feld '${k}'`);
  if (moduleIds.has(m.id)) fail(`modules.js: doppelte Modul-ID '${m.id}'`);
  moduleIds.add(m.id);
  if (!groups.includes(m.group)) fail(`modules.js: ${m.id} hat unbekannte Gruppe '${m.group}'`);
  if (D.groups && !(m.group in D.groups)) fail(`modules.js: Gruppe '${m.group}' fehlt in groups{}`);
}
for (const w of D.wishes ?? []) { if (wishIds.has(w.id)) fail(`modules.js: doppelte Wunsch-ID '${w.id}'`); wishIds.add(w.id); }
for (const r of D.roles ?? []) { if (roleIds.has(r.id)) fail(`modules.js: doppelte Rollen-ID '${r.id}'`); roleIds.add(r.id); }
if (!Array.isArray(D.frictionLabels) || D.frictionLabels.length !== 5) fail("modules.js: frictionLabels braucht genau 5 Einträge (Skala 0–4)");
if (surveyHtml && !/modules\.js/.test(surveyHtml)) fail("survey/index.html: lädt modules.js nicht");

// 3) Exporte gegen Schema (handgeschriebene Teilmenge von JSON Schema, ohne ajv)
const zones = ["keep", "drop", "unknown"], levels = ["off", "nice", "must"], freq = ["never", "rarely", "weekly", "daily"];
const isDate = (s) => typeof s === "string" && !Number.isNaN(Date.parse(s));
function validateExport(path) {
  const p = `${path.replace(root + "/", "")}:`;
  let r;
  try { r = JSON.parse(readFileSync(path, "utf8")); } catch (e) { return fail(`${p} kein gültiges JSON (${e.message})`); }
  const top = ["schema", "exportedAt", "startedAt", "respondent", "sort", "friction", "wishes", "customWishes", "roles", "budget", "wand", "noGo", "hypothesis"];
  for (const k of top) if (!(k in r)) fail(`${p} Feld '${k}' fehlt`);
  for (const k of Object.keys(r)) if (!top.includes(k)) fail(`${p} unbekanntes Feld '${k}'`);
  if (r.schema !== "vave-discovery/1") fail(`${p} schema muss "vave-discovery/1" sein`);
  if (!isDate(r.exportedAt)) fail(`${p} exportedAt kein Datum`);
  if (!isDate(r.startedAt)) fail(`${p} startedAt kein Datum`);
  if (typeof r.respondent !== "string" || !r.respondent) fail(`${p} respondent fehlt`);

  for (const [id, z] of Object.entries(r.sort ?? {})) {
    if (!moduleIds.has(id)) fail(`${p} sort: unbekannte Modul-ID '${id}'`);
    if (!zones.includes(z)) fail(`${p} sort[${id}]: Zone '${z}' ungültig`);
  }
  const unsorted = [...moduleIds].filter((id) => !(id in (r.sort ?? {})));
  if (unsorted.length) fail(`${p} sort: ${unsorted.length} Modul(e) nicht einsortiert (${unsorted.slice(0, 4).join(", ")}${unsorted.length > 4 ? ", …" : ""})`);
  for (const [id, v] of Object.entries(r.friction ?? {})) {
    if (!moduleIds.has(id)) fail(`${p} friction: unbekannte Modul-ID '${id}'`);
    if (!(Number.isInteger(v) && v >= 0 && v <= 4)) fail(`${p} friction[${id}]: muss ganze Zahl 0–4 sein`);
    if (r.sort?.[id] !== "keep") fail(`${p} friction[${id}]: Reibung nur für Zone keep`);
  }
  for (const [id, lv] of Object.entries(r.wishes ?? {})) {
    if (!wishIds.has(id)) fail(`${p} wishes: unbekannte Wunsch-ID '${id}'`);
    if (!levels.includes(lv)) fail(`${p} wishes[${id}]: Stufe '${lv}' ungültig`);
  }
  if (!Array.isArray(r.customWishes)) fail(`${p} customWishes muss Array sein`);
  for (const [i, w] of (r.customWishes ?? []).entries()) {
    if (typeof w.id !== "string" || typeof w.text !== "string" || !w.text) fail(`${p} customWishes[${i}]: id/text fehlen`);
    if (!levels.includes(w.level)) fail(`${p} customWishes[${i}]: Stufe ungültig`);
  }
  for (const [id, f] of Object.entries(r.roles ?? {})) {
    if (!roleIds.has(id)) fail(`${p} roles: unbekannte Rollen-ID '${id}'`);
    if (!freq.includes(f)) fail(`${p} roles[${id}]: Häufigkeit '${f}' ungültig`);
  }
  const b = r.budget ?? {};
  if (typeof b.currentUnknown !== "boolean") fail(`${p} budget.currentUnknown muss boolean sein`);
  if (!(typeof b.current === "number" && b.current >= 0 && b.current <= 6000)) fail(`${p} budget.current muss Zahl 0–6000 sein`);
  if (!(typeof b.max === "number" && b.max >= 0)) fail(`${p} budget.max muss Zahl ≥ 0 sein`);
  if (!(Number.isInteger(b.buildBuy) && b.buildBuy >= 0 && b.buildBuy <= 100)) fail(`${p} budget.buildBuy muss ganze Zahl 0–100 sein`);
  if (typeof r.wand !== "string") fail(`${p} wand muss String sein`);
  if (typeof r.noGo !== "string") fail(`${p} noGo muss String sein`);
  const h = r.hypothesis ?? {};
  if (!["A", "B", "C"].includes(h.target)) fail(`${p} hypothesis.target muss A, B oder C sein`);
  if (!Array.isArray(h.reasons)) fail(`${p} hypothesis.reasons muss Array sein`);
}
const resultsDir = join(root, "data/results");
const resultFiles = files.length
  ? files.map((f) => resolve(f))
  : (existsSync(resultsDir) ? readdirSync(resultsDir).filter((f) => f.endsWith(".json")).map((f) => join(resultsDir, f)) : []);
resultFiles.forEach(validateExport);

// Ausgabe
if (errors.length) {
  const out = errors.map((e) => `✗ ${e}`).join("\n");
  if (hookMode) { console.error(`npm run check: ${errors.length} Fehler\n${out}`); process.exit(2); }
  console.error(`${out}\n\n${errors.length} Fehler`);
  process.exit(1);
}
if (!hookMode) console.log(`✓ check grün — ${moduleIds.size} Module, ${wishIds.size} Wünsche, ${roleIds.size} Rollen, ${resultFiles.length} Export(e)${surveyHtml ? ", survey/index.html ohne externe Referenzen" : ""}`);
