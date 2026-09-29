// Helfer für das Projekte-Werkzeug (Builder C). Nutzt src/lib, ändert es nicht.
import { CircleCheck, TriangleAlert, OctagonAlert } from 'lucide-react';
import { pct, budgetState, budgetLabel, fmtDate } from '../../lib/format.js';
import { studios, people, clients, byId } from '../../data/sample.js';

export const studioById = byId(studios);
export const personById = byId(people);
export const clientById = byId(clients);

export const STATUSES = ['todo', 'doing', 'review', 'done'];

// Stunden → „1.200 h“
export const fmtH = h => `${Math.round(h).toLocaleString('de-DE')} h`;

// Budget-Ampel: Zustand, Prozent, Klartext, Rest (negativ = überzogen)
export function budgetInfo(spent, budget) {
  const state = budgetState(spent, budget);
  return { percent: pct(spent, budget), state, label: budgetLabel[state], rest: budget - spent };
}
export const budgetIcon = { ok: CircleCheck, warn: TriangleAlert, danger: OctagonAlert };

// 'YYYY-MM-DD' als Ortsdatum (new Date('YYYY-MM-DD') wäre UTC und kippt westlich von Greenwich auf den Vortag)
export const parseDay = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Tage von heute bis zum Datum; negativ = vergangen; null ohne Datum
export function daysUntil(iso) {
  if (!iso) return null;
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
