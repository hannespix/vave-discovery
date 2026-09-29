// Projektauswahl der Zeiterfassung: oben „Zuletzt“ (bis zu 3), dann aktive und interne Projekte, mit Code und Studio.
// Farbe nur als Punkt (Studiofarbe), dekorativ – Code und Studio stehen immer im Text.
import { studios, byId } from '../../data/sample.js';
import { loadProjects, projectsById } from '../../lib/projects.js';

const studioById = byId(studios);

// Projekte kommen aus der gemeinsamen, bearbeitbaren Quelle (lib/projects.js) – bei jedem Aufruf aktuell.
// Buchbar sind alle: aktive, Pitch- und interne Projekte (auch Pitch-Zeit wird erfasst, z. B. PIT-01).
export const bookable = () => loadProjects().filter(p => ['aktiv', 'pitch', 'intern'].includes(p.status));
export const bookableIds = () => bookable().map(p => p.id);
export const projectOrder = () => loadProjects().map(p => p.id);

export function projectInfo(id) {
  const map = projectsById();
  const p = typeof id === 'string' && Object.hasOwn(map, id) ? map[id] : null;
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
  const map = projectsById();
  const ids = bookableIds();
  const list = bookable();
  const groups = [
    ['Zuletzt', recent.filter(x => ids.includes(x)).slice(0, 3).map(x => map[x])],
    ['Aktive Projekte', list.filter(p => p.status === 'aktiv')],
    ['Pitch', list.filter(p => p.status === 'pitch')],
    ['Intern', list.filter(p => p.status === 'intern')],
  ].filter(([, items]) => items.length);
  // Läuft schon ein Eintrag auf einem nicht (mehr) buchbaren Projekt, bleibt es sichtbar statt still zu springen
  const extra = value && !ids.includes(value) ? projectInfo(value) : null;
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
