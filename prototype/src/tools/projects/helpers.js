// Helfer für das Projekte-Werkzeug (Builder C). Nutzt src/lib, ändert es nicht.
import { CircleCheck, TriangleAlert, OctagonAlert } from 'lucide-react';
import { pct, budgetState, budgetLabel, fmtDate } from '../../lib/format.js';
import { studios, people, clients, byId } from '../../data/sample.js';

export const studioById = byId(studios);
export const personById = byId(people);
export const clientById = byId(clients);

export const STATUSES = ['todo', 'doing', 'review', 'done'];

// Stunden → „1.200 h“, „619,8 h“ – deutsch, höchstens eine Nachkommastelle
export const fmtH = h => `${(Math.round(h * 10) / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;

const floor1 = h => Math.floor(h * 10 + 1e-6) / 10;
const ceil1 = h => Math.ceil(h * 10 - 1e-6) / 10;

// Budget-Ampel: Zustand, Prozent, Klartext und die angezeigten Stunden. Gerundet wie pct(): im Budget ab-, darüber
// aufgerundet – so steht nie „640 von 640 h“ neben „überzogen“ oder „überzogen um 0 h“. rest < 0 = überzogen;
// gebucht + Rest ergibt immer das Budget.
export function budgetInfo(spent, budget) {
  const state = budgetState(spent, budget);
  const over = spent > budget;
  const shown = over ? Math.max(ceil1(spent), floor1(budget) + 0.1) : floor1(spent);
  return { percent: pct(spent, budget), state, label: budgetLabel[state], spent: shown, rest: Math.round((budget - shown) * 10) / 10 };
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
