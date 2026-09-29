// Helfer für das Projekte-Werkzeug (Builder C, B5). Nutzt src/lib, ändert es nicht.
import { CircleCheck, TriangleAlert, OctagonAlert } from 'lucide-react';
import { pct, budgetState, budgetLabel, fmtDate, fmtH1 } from '../../lib/format.js';
import { restHours, spentHours } from '../../lib/budget.js';
import { studios, people, byId } from '../../data/sample.js';

export const studioById = byId(studios);
export const personById = byId(people);

export const STATUSES = ['todo', 'doing', 'review', 'done'];

// Eine Rundung für alle Stunden (r07-Korrektur): wie fmtH1 aus lib/format.js – dieselbe Zahl wie Heute und Wochenraster
const round1 = h => Math.round(Number(h) * 10) / 10;

// Budget-Ampel eines Projekts: Zustand, Prozent, Klartext und die angezeigten Stunden. Rest = restHours()
// (lib/budget.js), angezeigt mit fmtH1 – MIR-07 zeigt überall 20,3 h. Gebucht = Budget − angezeigter Rest, so ergeben
// beide Zahlen immer das Budget. Nur ein Randfall weicht ab: weniger als 0,05 h überzogen zeigt „0,1 h“ statt „0 h“
// (sonst stünde „überzogen um 0 h“ neben der Ampel). rest < 0 = überzogen.
export function budgetInfo(p, entries) {
  const spent = spentHours(p, entries);
  const rawRest = restHours(p, entries);
  const budget = Number(p.budget) || 0;
  const state = budgetState(spent, budget);
  const over = rawRest < 0;
  const rest = over ? -Math.max(0.1, round1(-rawRest)) : round1(rawRest);
  return { percent: pct(spent, budget), state, label: budgetLabel[state], over, total: spent, rest, spent: round1(budget - rest) };
}
export const budgetIcon = { ok: CircleCheck, warn: TriangleAlert, danger: OctagonAlert };

// 'YYYY-MM-DD' als Ortsdatum (new Date('YYYY-MM-DD') wäre UTC und kippt westlich von Greenwich auf den Vortag)
export const isDay = iso => typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso);
export const parseDay = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Tage von heute bis zum Datum; negativ = vergangen; null ohne (gültiges) Datum – gespeicherte Daten können kaputt sein
export function daysUntil(iso) {
  if (!isDay(iso)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDay(iso) - today) / 86400000);
}

export function relDays(n) {
  if (n === 0) return 'heute';
  if (n === 1) return 'morgen';
  if (n === -1) return 'gestern';
  return n > 0 ? `in ${n} Tagen` : `vor ${-n} Tagen`;
}

export const fmtDay = (iso, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) => fmtDate(parseDay(iso), opts);
export const fmtDayShort = iso => fmtDate(parseDay(iso), { weekday: 'short', day: '2-digit', month: '2-digit' });

// Suche ohne Rücksicht auf Groß-/Kleinschreibung und Akzente („horraume“ findet „Hörräume“)
export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('de-DE').trim();

export const initials = name => (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

// Stunden immer mit einer Nachkommastelle („2,0“) – für „gebucht / geschätzt“ (gleiche Rundung wie fmtH1)
export const fmt1 = h => round1(h).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Rest mit Vorzeichen: „331 h“, „−48 h“ (echtes Minuszeichen) – fmtH1 auf den Betrag, so rundet −79,75 wie 79,75
export const fmtRest = rest => `${rest < 0 ? '−' : ''}${fmtH1(Math.abs(rest))}`;

// Stundenzahl ohne Einheit, deutsch: 640 → „640“, 1200 → „1.200“, 80.5 → „80,5“ (gleiche Rundung wie fmtH1)
export const fmtNum = h => round1(h).toLocaleString('de-DE', { maximumFractionDigits: 1 });
// Differenz mit Vorzeichen: „+60 h“, „−40 h“ (echtes Minuszeichen)
export const fmtDelta = d => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${fmtH1(Math.abs(d))}`;

// Stunden aus einer Eingabe: „120“, „80,5“, „80.5“, „1.200“ (Tausenderpunkt), „120 h“ → Zahl; leer → null; sonst NaN
export function parseHours(input) {
  let t = String(input ?? '').trim().replace(/\s*h$/i, '').replace(/\s+/g, '');
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '');
  t = t.replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Math.round(Number(t) * 10) / 10 : NaN;
}

// Code-Vorschlag aus dem Kunden: drei Zeichen des Namens + laufende Nummer je Kunde („Kulturhafen Nord“ mit einem
// Projekt → „KUL-02“); belegte Codes werden übersprungen. Unter zwei Zeichen kein Vorschlag.
export function suggestCode(clientName, { projects, clients, taken }) {
  const letters = String(clientName ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
    .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  if (letters.length < 2) return '';
  const name = String(clientName).trim().toLowerCase();
  const client = clients.find(c => c.name.trim().toLowerCase() === name);
  let n = (client ? projects.filter(p => p.client === client.id).length : 0) + 1;
  const code = k => `${letters}-${String(k).padStart(2, '0')}`;
  while (taken(code(n)) && n < 999) n++;
  return code(n);
}

// Budgetänderungen aus dem gespeicherten budgetLog: nur gültige Einträge, neueste zuerst
export function budgetChanges(p) {
  const log = Array.isArray(p?.budgetLog) ? p.budgetLog : [];
  return log
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e && typeof e === 'object' && Number.isFinite(Number(e.from)) && Number.isFinite(Number(e.to)) &&
      typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at)))
    .map(({ e, i }) => ({ i, at: new Date(e.at), from: Number(e.from), to: Number(e.to), note: typeof e.note === 'string' ? e.note.trim() : '' }))
    .sort((a, b) => b.at - a.at || b.i - a.i);
}

// ISO-Kalenderwoche (Montag bis Sonntag; KW 1 enthält den 4. Januar)
export function isoWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3); // Donnerstag derselben Woche
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  return { week: 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7), year };
}
export const kwKey = kw => kw.year * 100 + kw.week;
// „KW 41“, im anderen Jahr „KW 2/2027“
export const fmtKw = (kw, refYear = new Date().getFullYear()) => (kw.year === refYear ? `KW ${kw.week}` : `KW ${kw.week}/${kw.year}`);
