// Formatierung – deutsch, Ortszeit
const pad = n => String(n).padStart(2, '0');

// Minuten → „3:45 h“
export const fmtDuration = min => `${Math.floor(min / 60)}:${pad(Math.round(min % 60))} h`;
// Minuten → „3,8 h“ (für Summen und Budgets)
export const fmtHours = min => `${(min / 60).toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;
// Sekunden → „01:23:45“ (laufende Uhr)
export const fmtClock = sec => `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(Math.floor(sec % 60))}`;

export const fmtDate = (d, opts = { weekday: 'short', day: '2-digit', month: '2-digit' }) =>
  new Date(d).toLocaleDateString('de-DE', opts);
export const fmtTime = (d, timeZone) =>
  new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone });

export const isoDay = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
// Montag der Woche von d
export const weekStart = d => { const x = new Date(d); const k = (x.getDay() + 6) % 7; x.setHours(0, 0, 0, 0); return addDays(x, -k); };

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
// Budget-Ampel: < 80 % grün, 80–100 % gelb, > 100 % rot
export const budgetState = (spent, budget) => {
  const p = pct(spent, budget);
  return p > 100 ? 'danger' : p >= 80 ? 'warn' : 'ok';
};
export const budgetLabel = { ok: 'im Rahmen', warn: 'knapp', danger: 'überzogen' };
