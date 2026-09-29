// Daten-Helfer der Hülle (Timer-Pille, Kopf, Befehlspalette): Projekte nach id, zuletzt gebucht, zuletzt geöffnet.
import { me } from '../data/sample.js';
import { loadProjects, projectsById } from '../lib/projects.js';

// Projekte kommen aus der gemeinsamen, bearbeitbaren Quelle (lib/projects.js) – jeder Aufruf liest den aktuellen Stand

// Code und Name eines Projekts; Unbekanntes (alter Speicher) bricht nichts
export function projectInfo(id) {
  const p = projectsById()[id];
  return p ? { id, code: p.code, name: p.name } : { id, code: 'Projekt', name: 'unbekannt' };
}

// Eigene Einträge, neueste zuerst (Tag + Beginn), je Projekt einmal
export function bookedProjects(entries) {
  const mine = (Array.isArray(entries) ? entries : []).filter(e => !e.person || e.person === me.id);
  const sorted = [...mine].sort((a, b) => `${b.date} ${b.start || ''}`.localeCompare(`${a.date} ${a.start || ''}`));
  const ids = [];
  const map = projectsById();
  sorted.forEach(e => { if (map[e.project] && !ids.includes(e.project)) ids.push(e.project); });
  return ids;
}

// Zuletzt gebuchtes Projekt – Vorgabe für „Timer starten“ (Pille, Kürzel t, Palette)
export const lastBookedProject = entries => bookedProjects(entries)[0] || loadProjects()[0].id;

// Zuletzt geöffnete Projekte (Schlüssel 'recent-projects'): nur bekannte ids, ohne Doppelte, höchstens 5
export const RECENT_MAX = 5;
export const cleanRecent = (v, fallback) =>
  Array.isArray(v) ? [...new Set(v.filter(id => typeof id === 'string' && projectsById()[id]))].slice(0, RECENT_MAX) : fallback;

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
