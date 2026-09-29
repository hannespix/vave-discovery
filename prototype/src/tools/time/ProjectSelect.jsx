// Projektauswahl der Zeiterfassung: aktive und interne Projekte, mit Code, Studio und Studiofarbe.
import { projects, studios, byId } from '../../data/sample.js';

const projectById = byId(projects);
const studioById = byId(studios);

// Buchbar sind aktive und interne Projekte (Angebote noch nicht)
export const bookable = projects.filter(p => p.status === 'aktiv' || p.status === 'intern');
export const bookableIds = bookable.map(p => p.id);

export function projectInfo(id) {
  const p = projectById[id];
  if (!p) return { id, code: id || '–', name: 'Unbekanntes Projekt', studio: '', color: 'var(--c-bg-2)' };
  const s = studioById[p.studio];
  return { id, code: p.code, name: p.name, studio: s ? s.name : '', color: s ? s.color : 'var(--c-bg-2)' };
}

// Farbpunkt des Studios – rein dekorativ, Studio steht immer auch als Text daneben oder im Optionstext
export function Swatch({ color, className = '' }) {
  return <span className={`tt-swatch ${className}`} style={{ background: color }} aria-hidden="true" />;
}

const optionLabel = p => `${p.code} · ${p.name} · ${projectInfo(p.id).studio}`;

export default function ProjectSelect({ id, value, onChange, describedBy }) {
  const groups = [
    ['Aktive Projekte', bookable.filter(p => p.status === 'aktiv')],
    ['Intern', bookable.filter(p => p.status === 'intern')],
  ];
  // Läuft schon ein Eintrag auf einem nicht (mehr) buchbaren Projekt, bleibt es sichtbar statt still zu springen
  const extra = value && !bookableIds.includes(value) ? projectInfo(value) : null;
  return (
    <div className="tt-select">
      <Swatch color={projectInfo(value).color} className="tt-select-swatch" />
      <select id={id} className="select" value={value} onChange={e => onChange(e.target.value)} aria-describedby={describedBy}>
        {extra && <option value={extra.id}>{`${extra.code} · ${extra.name}`}</option>}
        {groups.map(([label, list]) => (
          <optgroup key={label} label={label}>
            {list.map(p => <option key={p.id} value={p.id}>{optionLabel(p)}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
