#!/usr/bin/env node
// npm run check [-- <results.json ...>] [--hook]
// Prüft: 1) survey/index.html ist eine echte Einzeldatei ohne externe Referenzen
//        2) docs/survey/modules.json ist konsistent
//        3) data/results/*.json (oder übergebene Dateien) entsprechen results-schema.json
// Keine Abhängigkeiten. --hook: Fehler nach stderr, Exit 2 (Claude-Code-Hook-Konvention).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = process.argv.slice(2);
const hookMode = args.includes("--hook");
const files = args.filter((a) => !a.startsWith("--"));
const errors = [];
const fail = (msg) => errors.push(msg);

// 1) Einzeldatei
const surveyPath = join(root, "survey", "index.html");
if (existsSync(surveyPath)) {
  const html = readFileSync(surveyPath, "utf8");
  const externals = [
    /<script[^>]+src=["']https?:/i,
    /<link[^>]+href=["']https?:/i,
    /<link[^>]+href=["']\/\//i,
    /@import\s+url\(\s*["']?https?:/i,
    /url\(\s*["']?https?:\/\//i,
    /<img[^>]+src=["']https?:/i,
    /fetch\(\s*["']https?:/i,
  ];
  externals.forEach((re) => {
    if (re.test(html)) fail(`survey/index.html: externe Referenz gefunden (${re})`);
  });
  if (html.length > 2_000_000) fail(`survey/index.html: ${html.length} Bytes — größer als 2 MB`);
  if (!/prefers-reduced-motion/.test(html)) fail("survey/index.html: kein prefers-reduced-motion — Animationen brauchen einen Ausweg");
  if (!/viewport/.test(html)) fail("survey/index.html: kein viewport-Meta");
}

// 2) Katalog
const roles = ["gf", "pm", "kreation", "backoffice", "asia"];
const layers = ["surface", "core", "backoffice"];
const catalog = JSON.parse(readFileSync(join(root, "docs/survey/modules.json"), "utf8"));
const ids = new Set();
if (!Array.isArray(catalog.modules) || catalog.modules.length < 20) fail("modules.json: weniger als 20 Module");
for (const m of catalog.modules ?? []) {
  for (const k of ["id", "label", "hint", "layer", "roles", "assumedBooked"]) {
    if (!(k in m)) fail(`modules.json: ${m.id ?? "?"} ohne Feld '${k}'`);
  }
  if (ids.has(m.id)) fail(`modules.json: doppelte id '${m.id}'`);
  ids.add(m.id);
  if (!layers.includes(m.layer)) fail(`modules.json: ${m.id} hat ungültigen layer '${m.layer}'`);
  for (const r of m.roles ?? []) if (!roles.includes(r)) fail(`modules.json: ${m.id} hat ungültige Rolle '${r}'`);
}

// 3) Ergebnisse gegen Schema (handgeschriebene Teilmenge von JSON Schema, ohne ajv)
const zones = ["keep", "kill", "miss", "skip"];
function validateResult(path) {
  const p = `${path}:`;
  let r;
  try { r = JSON.parse(readFileSync(path, "utf8")); } catch (e) { return fail(`${p} kein gültiges JSON (${e.message})`); }
  const top = ["meta", "modules", "missing", "budget", "wand"];
  for (const k of top) if (!(k in r)) fail(`${p} Feld '${k}' fehlt`);
  for (const k of Object.keys(r)) if (!top.includes(k)) fail(`${p} unbekanntes Feld '${k}'`);

  const m = r.meta ?? {};
  if (m.schemaVersion !== "1.0") fail(`${p} meta.schemaVersion muss "1.0" sein`);
  if (!["quojob", "prototype"].includes(m.target)) fail(`${p} meta.target ungültig`);
  if (!roles.includes(m.role)) fail(`${p} meta.role ungültig`);
  if (typeof m.respondent !== "string" || !m.respondent) fail(`${p} meta.respondent fehlt`);
  if (Number.isNaN(Date.parse(m.completedAt ?? ""))) fail(`${p} meta.completedAt kein Datum`);
  if (!Number.isInteger(m.durationSec) || m.durationSec < 0) fail(`${p} meta.durationSec ungültig`);

  if (!Array.isArray(r.modules) || r.modules.length === 0) fail(`${p} modules leer`);
  for (const x of r.modules ?? []) {
    if (!ids.has(x.id)) fail(`${p} modules: unbekannte id '${x.id}'`);
    if (!zones.includes(x.zone)) fail(`${p} modules[${x.id}]: zone ungültig`);
    if (x.zone === "keep" && !(Number.isInteger(x.frust) && x.frust >= 0 && x.frust <= 5))
      fail(`${p} modules[${x.id}]: zone=keep braucht frust 0–5`);
    if (x.zone !== "keep" && x.frust != null) fail(`${p} modules[${x.id}]: frust nur bei zone=keep`);
    for (const ro of x.roles ?? []) if (!roles.includes(ro)) fail(`${p} modules[${x.id}]: Rolle '${ro}' ungültig`);
  }

  for (const [i, x] of (r.missing ?? []).entries()) {
    if (typeof x.label !== "string" || !x.label) fail(`${p} missing[${i}].label fehlt`);
    if (!Number.isInteger(x.priority) || x.priority < 1) fail(`${p} missing[${i}].priority ungültig`);
    if (x.moduleId != null && !ids.has(x.moduleId)) fail(`${p} missing[${i}].moduleId unbekannt`);
  }

  const b = r.budget ?? {};
  for (const k of ["currentMonthlyEur", "painThresholdEur"])
    if (!(b[k] === null || (typeof b[k] === "number" && b[k] >= 0))) fail(`${p} budget.${k} muss Zahl ≥ 0 oder null sein`);
  if (!Number.isInteger(b.buildWillingness) || b.buildWillingness < 0 || b.buildWillingness > 10)
    fail(`${p} budget.buildWillingness muss 0–10 sein`);
  if (typeof r.wand !== "string") fail(`${p} wand muss String sein`);
}

const resultFiles = files.length
  ? files.map((f) => resolve(f))
  : readdirSync(join(root, "data/results")).filter((f) => f.endsWith(".json")).map((f) => join(root, "data/results", f));
resultFiles.forEach(validateResult);

// Ausgabe
if (errors.length) {
  const out = errors.map((e) => `✗ ${e}`).join("\n");
  if (hookMode) { console.error(`npm run check: ${errors.length} Fehler\n${out}`); process.exit(2); }
  console.error(out);
  console.error(`\n${errors.length} Fehler`);
  process.exit(1);
}
if (!hookMode) console.log(`✓ check grün — ${catalog.modules.length} Module, ${resultFiles.length} Ergebnisdatei(en)${existsSync(surveyPath) ? ", Einzeldatei ok" : ", survey/index.html noch nicht vorhanden"}`);
