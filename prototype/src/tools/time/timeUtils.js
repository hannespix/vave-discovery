// Reine Hilfsfunktionen der Zeiterfassung (ohne React) – Dauer lesen, Uhrzeiten rechnen, Woche aufbauen.
import { addDays, isoDay, weekStart } from '../../lib/format.js';

const pad = n => String(n).padStart(2, '0');
export const DAY_MIN = 24 * 60;

// Dauer aus freier Eingabe: „1:30“, „90“, „90 min“, „1,5“, „1.5“, „1,5 h“, „2 h“, „1 h 30“ → { minutes } oder { error }.
// Ganze Zahl ohne Einheit = Minuten, Komma-/Punktzahl ohne Einheit = Stunden.
export function parseDuration(input) {
  const s = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/stunden|stunde|std\.?/g, 'h')
    .replace(/minuten|minute|min\.?/g, 'm');
  if (!s) return { error: 'empty' };
  const ok = min => (min < 1 ? { error: 'zero' } : min > DAY_MIN ? { error: 'max' } : { minutes: min });
  let m = s.match(/^(\d{1,2}):(\d{1,2})\s?h?$/);
  if (m) return +m[2] > 59 ? { error: 'minutes' } : ok(+m[1] * 60 + +m[2]);
  m = s.match(/^(\d*)[.,](\d+)\s?h?$/);
  if (m) return ok(Math.round(parseFloat(`${m[1] || '0'}.${m[2]}`) * 60));
  m = s.match(/^(\d+)\s?h$/);
  if (m) return ok(+m[1] * 60);
  m = s.match(/^(\d+)\s?h\s?(\d{1,2})\s?m?$/);
  if (m) return +m[2] > 59 ? { error: 'minutes' } : ok(+m[1] * 60 + +m[2]);
  m = s.match(/^(\d+)\s?m?$/);
  if (m) return ok(+m[1]);
  return { error: 'format' };
}

export const durationMessage = {
  empty: 'Bitte eine Dauer eingeben, zum Beispiel 1:30.',
  format: 'Diese Dauer verstehe ich nicht. Möglich sind 1:30, 90, 1,5 oder 1,5 h.',
  minutes: 'Nach dem Doppelpunkt höchstens 59 Minuten, zum Beispiel 1:45.',
  zero: 'Die Dauer muss mindestens 1 Minute betragen.',
  max: 'Ein Eintrag darf höchstens 24 Stunden lang sein.',
};

// Minuten → „1:30“ (für Eingabefelder)
export const toInputDuration = min => `${Math.floor(min / 60)}:${pad(min % 60)}`;

// „HH:MM“ ↔ Minuten seit Mitternacht
export const toMinutes = hhmm => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? +m[1] * 60 + +m[2] : null;
};
export const fromMinutes = min => {
  const x = ((Math.round(min) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};
export const endOf = e => fromMinutes((toMinutes(e.start) ?? 0) + e.minutes);
export const clockOf = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// „YYYY-MM-DD“ als lokales Datum (new Date('YYYY-MM-DD') wäre UTC und verrutscht westlich von Greenwich)
export const parseDay = iso => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const todayIso = () => isoDay(new Date());

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
    return { iso, date, short, long: LONG[i], dm: dm(date), isToday: iso === today, isFuture: iso > today };
  });
}

// Überschrift eines Tages: „Heute“, „Gestern“ oder „Montag“ – plus Datum
export function dayTitle(iso, now = new Date()) {
  const date = parseDay(iso);
  const today = isoDay(now);
  const name = iso === today ? 'Heute' : iso === isoDay(addDays(now, -1)) ? 'Gestern' : LONG[(date.getDay() + 6) % 7];
  return { name, dm: dm(date), long: `${LONG[(date.getDay() + 6) % 7]}, ${dm(date)}` };
}

export const sumMinutes = list => list.reduce((s, e) => s + (Number(e.minutes) || 0), 0);

// Vorschlag für „Beginn“: Ende des letzten Eintrags an diesem Tag, sonst 09:00
export function suggestStart(entries, date) {
  const ends = entries.filter(e => e.date === date).map(e => (toMinutes(e.start) ?? 0) + e.minutes);
  if (!ends.length) return '09:00';
  const last = Math.max(...ends);
  return last >= DAY_MIN ? '23:59' : fromMinutes(last);
}

// Zuletzt verwendetes Projekt (neuester Eintrag), das noch wählbar ist
export function lastProject(entries, allowedIds) {
  const sorted = [...entries].sort((a, b) => (a.date + a.start < b.date + b.start ? 1 : -1));
  const hit = sorted.find(e => allowedIds.includes(e.project));
  return hit ? hit.project : allowedIds[0];
}
