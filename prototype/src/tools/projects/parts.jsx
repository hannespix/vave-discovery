// Kleine Bausteine des Projekte-Werkzeugs: Studio mit Farbpunkt, Status als Punkt, Kürzel-Avatar, Budget-Balken,
// Abgabe. Farbe nur im Punkt; Zustand immer zusätzlich als Wort oder Icon.
import { projectStatusLabel } from '../../data/sample.js';
import { budgetIcon, daysUntil, fmtDay, initials, relDays, studioById } from './helpers.js';

export function StudioTag({ id }) {
  const s = studioById[id];
  if (!s) return null;
  return (
    <span className="pj-studio">
      <span className="pj-dot" style={{ background: s.color }} aria-hidden="true" />
      {s.name}
    </span>
  );
}

// Aktiv = gefüllter Punkt, Pitch = Ring, Intern = grauer Punkt – das Wort steht immer daneben
export function StatusDot({ status }) {
  return (
    <span className={`pj-status is-${status}`}>
      <span className="dot" aria-hidden="true" />
      {projectStatusLabel[status] || status}
    </span>
  );
}

export function Avatar({ person, size = '' }) {
  return <span className={`pj-avatar ${size}`} aria-hidden="true">{initials(person?.name)}</span>;
}

// Schmaler Balken: gebuchter Anteil schwarz auf --c-bg-2, überzogen ganz Koralle mit schwarzer Marke am Budget
export function BudgetBar({ info, spent, budget, className = '' }) {
  const over = info.rest < 0;
  const used = budget > 0 ? Math.min(100, (spent / budget) * 100) : 100;
  const mark = over && spent > 0 ? (budget / spent) * 100 : null;
  return (
    <span className={`pj-bar ${over ? 'is-over' : ''} ${className}`} aria-hidden="true">
      <span className="pj-bar-fill" style={{ width: `${over ? 100 : used}%` }} />
      {mark !== null && <span className="pj-bar-mark" style={{ left: `${mark}%` }} />}
    </span>
  );
}

export function StateIcon({ state, size = 16 }) {
  const Icon = budgetIcon[state];
  return Icon ? <Icon size={size} aria-hidden="true" className={`pj-state-icon is-${state}`} /> : null;
}

export function DueText({ iso, short = false }) {
  if (!iso) return <>ohne Termin</>;
  const n = daysUntil(iso);
  const date = fmtDay(iso, short ? { day: '2-digit', month: '2-digit' } : undefined);
  const near = n !== null && n >= -14 && n <= 14;
  return <span className="num">{date}{near && <span className="pj-rel"> · {relDays(n)}</span>}</span>;
}
