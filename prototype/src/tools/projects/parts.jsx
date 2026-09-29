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

// Budget-Ampel (Liste und Kopf des Details): Zustand als Icon + Wort (nicht nur Farbe), Balken, Zahlen.
// spent = ungerundete Stunden inkl. Buchungen (lib/budget.js); withRest: dazu „noch X h frei“ bzw. „überzogen um X h“.
export function BudgetMeter({ id, spent, budget, withRest = false, className = '' }) {
  const b = budgetInfo(spent, budget);
  const Icon = budgetIcon[b.state];
  const rest = b.rest < 0 ? `überzogen um ${fmtH(-b.rest)}` : `noch ${fmtH(b.rest)} frei`;
  return (
    <div className={`pj-budget is-${b.state} ${className}`} id={id}>
      <p className="pj-budget-line">
        <span className="pj-budget-state"><Icon size={18} aria-hidden="true" /> Budget {b.label}</span>
        <span className="pj-budget-pct num">{b.percent} %</span>
      </p>
      <span className="pj-bar" aria-hidden="true"><span style={{ width: `${Math.min(b.percent, 100)}%` }} /></span>
      <p className="quiet num">{fmtH(b.spent)} von {fmtH(budget)} gebucht{withRest && `, ${rest}`}</p>
    </div>
  );
}

export function DueText({ iso }) {
  if (!iso) return <>ohne Termin</>;
  const n = daysUntil(iso);
  return <span className="num">{fmtDay(iso)} <span className="pj-rel">({relDays(n)})</span></span>;
}
