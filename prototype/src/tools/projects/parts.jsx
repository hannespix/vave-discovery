// Kleine Bausteine des Projekte-Werkzeugs: Studio mit Farbpunkt, Kürzel-Avatar, Budget-Ampel, Fälligkeit.
import { budgetInfo, budgetIcon, daysUntil, fmtDay, fmtH, initials, relDays, studioById } from './helpers.js';

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

export function Avatar({ person }) {
  return <span className="pj-avatar" aria-hidden="true">{initials(person?.name)}</span>;
}

// Budget-Ampel für die Liste: Zustand als Text + Icon (nicht nur Farbe), Balken, Zahlen
export function BudgetMeter({ id, spent, budget }) {
  const { percent, state, label } = budgetInfo(spent, budget);
  const Icon = budgetIcon[state];
  return (
    <div className={`pj-budget is-${state}`} id={id}>
      <p className="pj-budget-line">
        <span className="pj-budget-state"><Icon size={18} aria-hidden="true" /> Budget {label}</span>
        <span className="pj-budget-pct num">{percent} %</span>
      </p>
      <span className="pj-bar" aria-hidden="true"><span style={{ width: `${Math.min(percent, 100)}%` }} /></span>
      <p className="quiet num">{fmtH(spent)} von {fmtH(budget)} gebucht</p>
    </div>
  );
}

export function DueText({ iso }) {
  if (!iso) return <>ohne Termin</>;
  const n = daysUntil(iso);
  return <span className="num">{fmtDay(iso)} <span className="pj-rel">({relDays(n)})</span></span>;
}
