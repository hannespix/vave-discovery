// Daten-Helfer der Hülle (Timer-Pille, Kopf, Befehlspalette): Projekte nach id, zuletzt gebucht, zuletzt geöffnet.
import { byId, clients, me, projects } from '../data/sample.js';

export const projectById = byId(projects);
export const clientById = byId(clients);

// Code und Name eines Projekts; Unbekanntes (alter Speicher) bricht nichts
export function projectInfo(id) {
  const p = projectById[id];
  return p ? { id, code: p.code, name: p.name } : { id, code: 'Projekt', name: 'unbekannt' };
}

// Eigene Einträge, neueste zuerst (Tag + Beginn), je Projekt einmal
export function bookedProjects(entries) {
  const mine = (Array.isArray(entries) ? entries : []).filter(e => !e.person || e.person === me.id);
  const sorted = [...mine].sort((a, b) => `${b.date} ${b.start || ''}`.localeCompare(`${a.date} ${a.start || ''}`));
  const ids = [];
  sorted.forEach(e => { if (projectById[e.project] && !ids.includes(e.project)) ids.push(e.project); });
  return ids;
}

// Zuletzt gebuchtes Projekt – Vorgabe für „Timer starten“ (Pille, Kürzel t, Palette)
export const lastBookedProject = entries => bookedProjects(entries)[0] || projects[0].id;

// Zuletzt geöffnete Projekte (Schlüssel 'recent-projects'): nur bekannte ids, ohne Doppelte, höchstens 5
export const RECENT_MAX = 5;
export const cleanRecent = (v, fallback) =>
  Array.isArray(v) ? [...new Set(v.filter(id => typeof id === 'string' && projectById[id]))].slice(0, RECENT_MAX) : fallback;

// Laufzeit für Screenreader: „12 Minuten“, „1 Stunde 30 Minuten“
export function spokenDuration(min) {
  const m = Math.max(0, Math.floor(min));
  if (m < 1) return 'unter 1 Minute';
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hours = h ? `${h} ${h === 1 ? 'Stunde' : 'Stunden'}` : '';
  const mins = r ? `${r} ${r === 1 ? 'Minute' : 'Minuten'}` : '';
  return [hours, mins].filter(Boolean).join(' ');
}
