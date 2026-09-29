// Reine Hilfsfunktionen der Zeiterfassung (ohne React) – Uhrzeiten rechnen, Woche aufbauen, Zuletzt-Kombinationen.
// Dauer lesen: duration.js. Timer-Regeln (10 h, 24 h): lib/timer.js.
import { addDays, isoDay, weekStart } from '../../lib/format.js';
import { GRID_NOTE } from './grid.js';

const pad = n => String(n).padStart(2, '0');
export const DAY_MIN = 24 * 60;

// „HH:MM“ ↔ Minuten seit Mitternacht
export const toMinutes = hhmm => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null;
};
export const fromMinutes = min => {
  const x = ((Math.round(min) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};
export const endOf = e => fromMinutes((toMinutes(e.start) ?? 0) + (Number(e.minutes) || 0));

// „YYYY-MM-DD“ als lokales Datum (new Date('YYYY-MM-DD') wäre UTC und verrutscht westlich von Greenwich)
export const parseDay = iso => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const todayIso = () => isoDay(new Date());
// Echtes Kalenderdatum im Format YYYY-MM-DD (für Routen wie #/zeit/nachtragen/2026-09-28)
export const isDayIso = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDay(parseDay(s)) === s;

// Kalenderwoche nach ISO 8601
export function isoWeek(date) {
  const x = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const wd = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - wd);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - yearStart) / 86400000 + 1) / 7);
}

const SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const dm = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;

// Die sieben Tage der Woche von `now` (Mo–So)
export function weekDays(now = new Date()) {
  const monday = weekStart(now);
  const today = isoDay(now);
  return SHORT.map((short, i) => {
    const date = addDays(monday, i);
    const iso = isoDay(date);
    return { iso, date, short, long: LONG[i], dm: dm(date), weekend: i > 4, isToday: iso === today, isFuture: iso > today };
  });
}

// Überschrift eines Tages: „Heute“, „Gestern“ oder „Montag“ – plus Datum
export function dayTitle(iso, now = new Date()) {
  const date = parseDay(iso);
  const today = isoDay(now);
  const name = iso === today ? 'Heute' : iso === isoDay(addDays(now, -1)) ? 'Gestern' : LONG[(date.getDay() + 6) % 7];
  return { name, dm: dm(date), long: `${LONG[(date.getDay() + 6) % 7]}, ${dm(date)}`, short: SHORT[(date.getDay() + 6) % 7] };
}

// Für Bestätigungen: „heute“ oder mit Datum „Montag, 28.09.“
export const dayPhrase = (iso, now = new Date()) => (iso === isoDay(now) ? 'heute' : dayTitle(iso, now).long);

// Zeile eines Eintrags in der Liste (Hervorhebung, „Anzeigen“)
export const rowId = id => `tt-entry-${id}`;

export const sumMinutes = list => list.reduce((s, e) => s + (Number(e.minutes) || 0), 0);

// Vorschlag für „Beginn“: Ende des letzten Eintrags an diesem Tag, sonst 09:00
export function suggestStart(entries, date) {
  const ends = entries.filter(e => e.date === date).map(e => (toMinutes(e.start) ?? 0) + (Number(e.minutes) || 0));
  if (!ends.length) return '09:00';
  const last = Math.max(...ends);
  return last >= DAY_MIN ? '23:59' : fromMinutes(last);
}

const newestFirst = list => [...list].sort((a, b) => (a.date + a.start < b.date + b.start ? 1 : a.date + a.start > b.date + b.start ? -1 : 0));

// Zuletzt verwendetes Projekt (neuester Eintrag), das noch wählbar ist
export function lastProject(entries, allowedIds) {
  const hit = newestFirst(entries).find(e => allowedIds.includes(e.project));
  return hit ? hit.project : allowedIds[0];
}

// Die zuletzt gebuchten Projekte (für die Gruppe „Zuletzt“ in der Projektwahl)
export function recentProjects(entries, allowedIds, max = 3) {
  const out = [];
  for (const e of newestFirst(entries)) {
    if (allowedIds.includes(e.project) && !out.includes(e.project)) out.push(e.project);
    if (out.length === max) break;
  }
  return out;
}

// Bis zu fünf zuletzt genutzte Kombinationen (Projekt, Aufgabe, Notiz) für den Ein-Klick-Start.
// Sammeleinträge aus dem Wochenraster zählen nicht – das ist keine Arbeit, die man „fortsetzt“.
export function recentCombos(entries, allowedIds, max = 5) {
  const out = [];
  const seen = new Set();
  for (const e of newestFirst(entries)) {
    if (!allowedIds.includes(e.project) || e.note === GRID_NOTE) continue;
    const note = String(e.note ?? '').trim();
    const task = typeof e.task === 'string' && e.task ? e.task : null;
    const key = `${e.project}|${task ?? ''}|${note.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, project: e.project, task, note });
    if (out.length === max) break;
  }
  return out;
}
