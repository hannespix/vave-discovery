// Projektauswahl der Zeiterfassung: oben „Zuletzt“ (bis zu 3), dann aktive und interne Projekte, mit Code und Studio.
// Farbe nur als Punkt (Studiofarbe), dekorativ – Code und Studio stehen immer im Text.
import { projects, studios, byId } from '../../data/sample.js';

const projectById = byId(projects);
const studioById = byId(studios);

// Buchbar sind aktive und interne Projekte (Pitches und Angebote nicht)
export const bookable = projects.filter(p => p.status === 'aktiv' || p.status === 'intern');
export const bookableIds = bookable.map(p => p.id);
export const projectOrder = projects.map(p => p.id);

export function projectInfo(id) {
  const p = typeof id === 'string' && Object.hasOwn(projectById, id) ? projectById[id] : null;
  if (!p) return { id, code: id || '–', name: 'Unbekanntes Projekt', studio: '', color: 'var(--c-bg-2)', budget: 0, project: null };
  const s = studioById[p.studio];
  return { id, code: p.code, name: p.name, studio: s ? s.name : '', color: s ? s.color : 'var(--c-bg-2)', budget: p.budget, project: p };
}

// Projektpunkt – rein dekorativ, mit Kontur (Limette wäre auf Weiß sonst kaum sichtbar)
export function Dot({ color }) {
  return <span className="dot tt-dot" style={{ background: color }} aria-hidden="true" />;
}

const optionLabel = p => `${p.code} · ${p.name} · ${projectInfo(p.id).studio}`;

// label: nur ohne sichtbares <label> setzen (wird zum aria-label)
export default function ProjectSelect({ id, value, onChange, recent = [], label, describedBy }) {
  const groups = [
    ['Zuletzt', recent.filter(x => bookableIds.includes(x)).slice(0, 3).map(x => projectById[x])],
    ['Aktive Projekte', bookable.filter(p => p.status === 'aktiv')],
    ['Intern', bookable.filter(p => p.status === 'intern')],
  ].filter(([, list]) => list.length);
  // Läuft schon ein Eintrag auf einem nicht (mehr) buchbaren Projekt, bleibt es sichtbar statt still zu springen
  const extra = value && !bookableIds.includes(value) ? projectInfo(value) : null;
  return (
    <div className="tt-select">
      <Dot color={projectInfo(value).color} />
      <select
        id={id} className="select" value={value ?? ''} onChange={e => onChange(e.target.value)}
        aria-label={label} aria-describedby={describedBy}
      >
        {extra && <option value={extra.id}>{`${extra.code} · ${extra.name}`}</option>}
        {groups.map(([name, list]) => (
          <optgroup key={name} label={name}>
            {list.map(p => <option key={`${name}-${p.id}`} value={p.id}>{optionLabel(p)}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
