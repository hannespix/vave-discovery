// Reine Hilfsfunktionen der Zeiterfassung (ohne React) – Uhrzeiten rechnen, Woche aufbauen, Zuletzt-Kombinationen.
// Dauer lesen: duration.js. Timer-Regeln (10 h, 24 h): lib/timer.js.
import { addDays, isoDay, weekStart } from '../../lib/format.js';
import { isAggregate } from './grid.js';

const pad = n => String(n).padStart(2, '0');
export const DAY_MIN = 24 * 60;
export const WEEK_TARGET_MIN = 40 * 60; // Soll je Woche (Annahme der Demo)

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

// Montag der Woche eines Datums (Date oder „YYYY-MM-DD“) als „YYYY-MM-DD“
export const mondayIso = d => isoDay(weekStart(typeof d === 'string' ? parseDay(d) : d));

// Die sieben Tage der Woche, in der `anchor` liegt (Mo–So); heute/Zukunft gemessen an `now`
export function weekDays(anchor = new Date(), now = new Date()) {
  const monday = weekStart(typeof anchor === 'string' ? parseDay(anchor) : anchor);
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

const DAY_START = 9 * 60;
export const minutesNow = (now = new Date()) => now.getHours() * 60 + now.getMinutes();

// Vorschlag für „Beginn“: Ende des letzten Eintrags an diesem Tag, sonst 09:00.
// Heute (nowMin = Minuten seit Mitternacht) endet der Vorschlag nie in der Zukunft – Ende ≤ jetzt (ui-critic r07:
// Nachtragen direkt nach einem Timer-Stopp lag bei 18:41–20:11). Passt die Dauer nicht mehr hinter den letzten Eintrag,
// dann in die späteste Lücke davor (Beginn direkt nach dem Eintrag davor), sonst vor den ersten Eintrag (höchstens
// ab 09:00), sonst so, dass sie jetzt endet. Nur wenn die Dauer länger ist als der Tag bis jetzt, geht es nicht: 00:00.
export function suggestStart(entries, date, { minutes = 0, nowMin = null } = {}) {
  const spans = entries
    .filter(e => e.date === date)
    .map(e => { const a = toMinutes(e.start) ?? 0; return [a, a + (Number(e.minutes) || 0)]; })
    .sort((x, y) => x[0] - y[0]);
  const lastEnd = spans.length ? Math.max(...spans.map(s => s[1])) : null;
  if (nowMin == null) return lastEnd == null ? fromMinutes(DAY_START) : lastEnd >= DAY_MIN ? '23:59' : fromMinutes(lastEnd);

  const need = Math.max(0, Number(minutes) || 0);
  const fits = (from, until) => from + need <= Math.min(until, nowMin);
  const base = lastEnd ?? DAY_START;
  if (base < DAY_MIN && fits(base, DAY_MIN)) return fromMinutes(base);
  // Überlappende Einträge zusammenfassen, dann Lücken von hinten prüfen
  const merged = [];
  for (const [a, b] of spans) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  for (let i = merged.length - 2; i >= 0; i--) {
    if (fits(merged[i][1], merged[i + 1][0])) return fromMinutes(merged[i][1]);
  }
  const firstStart = merged.length ? merged[0][0] : DAY_MIN;
  const before = Math.min(DAY_START, Math.min(firstStart, nowMin) - need);
  if (before >= 0) return fromMinutes(before);
  return fromMinutes(Math.max(0, nowMin - need));
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

const comboKey = c => `${c.project}|${c.task ?? ''}|${String(c.note ?? '').trim().toLowerCase()}`;
// Läuft der Timer auf genau dieser Kombination (Projekt, Aufgabe, Notiz)?
export const sameCombo = (timer, combo) =>
  Boolean(timer && combo) && comboKey({ ...timer, task: typeof timer.task === 'string' && timer.task ? timer.task : null }) === comboKey(combo);

// Bis zu fünf zuletzt genutzte Kombinationen (Projekt, Aufgabe, Notiz) für den Ein-Klick-Start.
// Sammeleinträge aus dem Wochenraster zählen nicht – das ist keine Arbeit, die man „fortsetzt“.
export function recentCombos(entries, allowedIds, max = 5) {
  const out = [];
  const seen = new Set();
  for (const e of newestFirst(entries)) {
    if (!allowedIds.includes(e.project) || isAggregate(e)) continue;
    const note = String(e.note ?? '').trim();
    const task = typeof e.task === 'string' && e.task ? e.task : null;
    const key = comboKey({ project: e.project, task, note });
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, project: e.project, task, note });
    if (out.length === max) break;
  }
  return out;
}
