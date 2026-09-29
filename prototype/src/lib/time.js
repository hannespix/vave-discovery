import { useEffect, useState } from 'react';

// Zeit- und Zeitzonen-Helfer (nur Intl, keine Bibliothek). Ergänzt format.js, ändert es nicht.
const pad = n => String(n).padStart(2, '0');

export const HOME_TZ = 'Europe/Berlin';   // Bezug: Frankfurt
export const OPEN_HOUR = 9;               // Arbeitszeit aller Studios, Ortszeit (Annahme für die Demo)
export const CLOSE_HOUR = 18;
const DAY = 1440;

// Aktuelle Zeit, die sich alle intervalMs erneuert
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const formatters = new Map();
function partsOf(date, tz) {
  if (!formatters.has(tz)) {
    formatters.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    }));
  }
  const p = Object.fromEntries(formatters.get(tz).formatToParts(date).map(x => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, second: +p.second };
}

// Abstand der Zeitzone zu UTC in Minuten, z. B. +120 für Frankfurt im Sommer
export function tzOffset(date, tz) {
  const z = partsOf(date, tz);
  const asUtc = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// Differenz zu Frankfurt in Minuten: +360 heißt „6 Stunden später als Frankfurt“
export const diffToHome = (date, tz) => tzOffset(date, tz) - tzOffset(date, HOME_TZ);

// Minuten seit Mitternacht in der Zeitzone
export const minutesOfDay = (date, tz) => { const z = partsOf(date, tz); return z.hour * 60 + z.minute; };

// Kalendertag der Zeitzone relativ zu Frankfurt: -1 gestern, 0 heute, 1 morgen
export function dayShift(date, tz) {
  const a = partsOf(date, tz), b = partsOf(date, HOME_TZ);
  return Math.round((Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)) / 86400000);
}

// Wochentag in der Zeitzone: 0 = Sonntag … 6 = Samstag
export function weekdayIn(date, tz) {
  const z = partsOf(date, tz);
  return new Date(Date.UTC(z.year, z.month - 1, z.day)).getUTCDay();
}
export const isWorkdayIn = (date, tz) => { const w = weekdayIn(date, tz); return w !== 0 && w !== 6; };

// Arbeitet das Studio in diesem Moment? Mo–Fr 9–18 Uhr Ortszeit; Feiertage kennt die Demo nicht (steht in der UI)
export const isWorkingAt = (date, tz) => {
  const m = minutesOfDay(date, tz);
  return isWorkdayIn(date, tz) && m >= OPEN_HOUR * 60 && m < CLOSE_HOUR * 60;
};

// Offen = Mo–Fr 9–18 Uhr Ortszeit (ohne Feiertage – Annahme für die Demo)
export function studioStatus(date, tz) {
  return { open: isWorkingAt(date, tz), minutes: minutesOfDay(date, tz), workday: isWorkdayIn(date, tz) };
}

// „+6 h“, „−2 h“, „+5,5 h“; 0 → „±0 h“
export function fmtOffset(min) {
  if (!min) return '±0 h';
  const h = Math.abs(min) / 60;
  return `${min > 0 ? '+' : '−'}${h.toLocaleString('de-DE', { maximumFractionDigits: 2 })} h`;
}

// Minuten seit Mitternacht → „09:00“ (1440 → „24:00“)
export const fmtHM = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// Frankfurter Mitternacht des Kalendertags von `date` als Zeitpunkt
function homeMidnight(date) {
  const z = partsOf(date, HOME_TZ);
  const guess = Date.UTC(z.year, z.month - 1, z.day);
  return new Date(guess - tzOffset(new Date(guess), HOME_TZ) * 60000);
}

// Arbeitszeit eines Studios am Frankfurter Kalendertag von `date`, in Frankfurter Minuten [[start, ende], …].
// Zählt Mo–Fr 9–18 Uhr Ortszeit (Raster 30 min, alle Studio-Zeitzonen sind ganz- oder halbstündig versetzt):
// Wochenenden fallen heraus, auch der Samstag in Shanghai am Frankfurter Freitagabend.
export function workWindowInHome(date, tz) {
  const base = homeMidnight(date).getTime();
  const segs = [];
  let from = -1;
  for (let m = 0; m <= DAY; m += 30) {
    const on = m < DAY && isWorkingAt(new Date(base + m * 60000), tz);
    if (on && from < 0) from = m;
    if (!on && from >= 0) { segs.push([from, m]); from = -1; }
  }
  return segs;
}

// Schnittmenge mehrerer Fensterlisten → zusammenhängende Bereiche [[start, ende], …]
export function commonWindows(list) {
  const all = new Uint8Array(DAY).fill(1);
  for (const segs of list) {
    const mask = new Uint8Array(DAY);
    for (const [a, b] of segs) mask.fill(1, a, b);
    for (let i = 0; i < DAY; i++) all[i] &= mask[i];
  }
  const out = [];
  let from = -1;
  for (let i = 0; i <= DAY; i++) {
    const on = i < DAY && all[i] === 1;
    if (on && from < 0) from = i;
    if (!on && from >= 0) { out.push([from, i]); from = -1; }
  }
  return out;
}

// Begrüßung nach Tageszeit
export function greeting(date) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'Guten Morgen';
  if (h >= 11 && h < 18) return 'Guten Tag';
  if (h >= 18) return 'Guten Abend';
  return 'Hallo';
}

// Tage von heute bis zum ISO-Tag (YYYY-MM-DD); null bei fehlendem Datum
export function daysFromToday(iso, now = new Date()) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

export function dueLabel(n) {
  if (n === null || Number.isNaN(n)) return 'ohne Termin';
  if (n < -1) return `seit ${-n} Tagen überfällig`;
  if (n === -1) return 'seit gestern überfällig';
  if (n === 0) return 'heute fällig';
  if (n === 1) return 'morgen fällig';
  return `in ${n} Tagen fällig`;
}
