import { readRaw, uid, useStoredState } from './store.js';
import { clients as sampleClients, projects as sampleProjects } from '../data/sample.js';

// Projekte und Kunden als gemeinsame, bearbeitbare Quelle (r07, Wunsch Hannes: „Projekte editieren, Stundenbudget
// anpassen“). Alle Werkzeuge lesen hier statt direkt aus sample.js – so wirkt eine Budgetänderung sofort in Liste,
// Burn-up, Heute, Wochenraster und Befehlspalette. Nur Stunden, kein Geld (bis G2). „Demo zurücksetzen“ stellt die
// Beispieldaten wieder her.
//
// Projekt: { id, code, name, client, studio, lead, status: 'aktiv'|'pitch'|'intern', phase, budget (h), spent (h,
//   Stand vor der Zeiterfassung), due: 'YYYY-MM-DD'|null, budgetLog?: [{ at, from, to, note }] }

export const PROJECT_STATUSES = ['aktiv', 'pitch', 'intern'];

const isDayOrNull = v => v === null || v === undefined || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
export const isProject = p =>
  p !== null && typeof p === 'object' && !Array.isArray(p) &&
  typeof p.id === 'string' && typeof p.code === 'string' && p.code.trim() !== '' &&
  typeof p.name === 'string' && p.name.trim() !== '' &&
  Number.isFinite(Number(p.budget)) && Number(p.budget) >= 0 &&
  Number.isFinite(Number(p.spent)) && Number(p.spent) >= 0 &&
  PROJECT_STATUSES.includes(p.status) && isDayOrNull(p.due);
// Liste mit mindestens einem gültigen Projekt behalten (nur die gültigen), sonst Startwert
export const cleanProjects = (v, fallback) => {
  if (!Array.isArray(v)) return fallback;
  const ok = v.filter(isProject);
  return ok.length ? ok : fallback;
};

const isClient = c => c !== null && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string' && c.name.trim() !== '';
export const cleanClients = (v, fallback) => {
  if (!Array.isArray(v)) return fallback;
  const ok = v.filter(isClient);
  return ok.length ? ok : fallback;
};

// Budgetänderung mit Datum und Grund vermerken (nachvollziehbar statt still überschrieben)
function applyPatch(p, patch, note) {
  const next = { ...p, ...patch };
  if (patch.budget !== undefined && Number(patch.budget) !== Number(p.budget)) {
    next.budget = Number(patch.budget);
    next.budgetLog = [
      ...(Array.isArray(p.budgetLog) ? p.budgetLog : []),
      { at: new Date().toISOString(), from: Number(p.budget), to: Number(patch.budget), note: String(note || '').trim() },
    ];
  }
  return next;
}

// Synchron lesen (für Helfer wie projectInfo): immer der aktuelle Speicherstand, gecacht am Rohtext.
// Komponenten, die bei Änderungen neu zeichnen sollen, rufen zusätzlich useProjects()/useClients() auf.
function cachedReader(key, sample, clean) {
  let cache = { raw: undefined, list: sample, byId: null };
  return () => {
    const raw = readRaw(key);
    if (raw !== cache.raw) {
      let parsed = sample;
      if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = sample; } }
      cache = { raw, list: clean(parsed, sample), byId: null };
    }
    if (!cache.byId) cache.byId = Object.fromEntries(cache.list.map(x => [x.id, x]));
    return cache;
  };
}
const readProjects = cachedReader('projects', sampleProjects, cleanProjects);
const readClients = cachedReader('clients', sampleClients, cleanClients);
export const loadProjects = () => readProjects().list;
export const projectsById = () => readProjects().byId;
export const loadClients = () => readClients().list;
export const clientsById = () => readClients().byId;

export function useProjects() {
  const [projects, setProjects] = useStoredState('projects', sampleProjects, cleanProjects);
  const byId = Object.fromEntries(projects.map(p => [p.id, p]));
  // Code eindeutig (ohne Groß/Klein): Rückgabe des Konflikts oder null
  const codeTaken = (code, exceptId = null) =>
    projects.find(p => p.id !== exceptId && p.code.trim().toLowerCase() === String(code).trim().toLowerCase()) || null;
  const update = (id, patch, note = '') => setProjects(list => list.map(p => (p.id === id ? applyPatch(p, patch, note) : p)));
  // createdAt: angelegt im Prototyp – solche Projekte haben keinen erfundenen Beispielverlauf, nur echte Buchungen
  const create = draft => {
    const project = {
      id: `pr-${uid()}`, status: 'aktiv', phase: '', studio: 'fra', lead: null, client: null, due: null,
      ...draft, budget: Number(draft.budget) || 0, spent: 0, budgetLog: [], createdAt: new Date().toISOString(),
    };
    setProjects(list => [...list, project]);
    return project;
  };
  return { projects, byId, codeTaken, update, create };
}

export function useClients() {
  const [clients, setClients] = useStoredState('clients', sampleClients, cleanClients);
  const byId = Object.fromEntries(clients.map(c => [c.id, c]));
  // Vorhandenen Kunden nach Namen finden oder neu anlegen; liefert die ID
  const ensure = name => {
    const n = String(name).trim();
    const found = clients.find(c => c.name.toLowerCase() === n.toLowerCase());
    if (found) return found.id;
    const client = { id: `c-${uid()}`, name: n, sector: '' };
    setClients(list => [...list, client]);
    return client.id;
  };
  return { clients, byId, ensure };
}
