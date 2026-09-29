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

// Prozent passend zur Ampel: darunter abgerundet, darüber aufgerundet – 99,6 % zeigt „99 %“ (knapp),
// 100,4 % zeigt „101 %“ (überzogen). Ohne Budget 0.
export const pct = (a, b) => {
  if (!(b > 0)) return 0;
  const x = (a / b) * 100;
  return a > b ? Math.ceil(x) : Math.floor(x);
};
// Budget-Ampel auf dem ungerundeten Verhältnis: < 80 % im Rahmen, 80–100 % knapp, > 100 % überzogen.
// Ohne Budget: jede gebuchte Stunde ist überzogen.
export const budgetState = (spent, budget) => {
  if (!(budget > 0)) return spent > 0 ? 'danger' : 'ok';
  const r = spent / budget;
  return r > 1 ? 'danger' : r >= 0.8 ? 'warn' : 'ok';
};
export const budgetLabel = { ok: 'im Rahmen', warn: 'knapp', danger: 'überzogen' };
