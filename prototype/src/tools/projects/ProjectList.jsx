// Projektliste: Filter-Chips (Studio, Status), Suche, Sortierung, Karten mit Budget-Ampel. Jede Karte ist genau ein Link.
// Auf schmalen Schirmen liegen Suche, Sortierung und Chips hinter „Filter“, damit die Karten gleich im Bild sind.
import { useId, useMemo, useState } from 'react';
import { Check, ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react';
import { projects, studios, projectStatusLabel, timeEntries as sampleEntries } from '../../data/sample.js';
import { href } from '../../lib/router.js';
import { useStoredState } from '../../lib/store.js';
import { cleanEntries } from '../../lib/data.js';
import { spentHours } from '../../lib/budget.js';
import { clientById, norm, personById } from './helpers.js';
import { BudgetMeter, DueText, StudioTag } from './parts.jsx';

export const initialFilters = { query: '', studios: [], statuses: [], sort: 'due' };

const byCode = (a, b) => a.code.localeCompare(b.code);
// spent: Stunden je Projekt inkl. Buchungen der Zeiterfassung
const SORTS = {
  due: { label: 'Fälligkeit (nächste zuerst)', fn: (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || byCode(a, b) },
  budget: { label: 'Budgetauslastung (höchste zuerst)', fn: (a, b, spent) => spent[b.id] / b.budget - spent[a.id] / a.budget || byCode(a, b) },
};
const statusBadge = { aktiv: 'badge-accent', pitch: 'badge-lime', intern: '' };

function Chip({ checked, onChange, children }) {
  return (
    <label className="pj-chip">
      <input type="checkbox" className="visually-hidden" checked={checked} onChange={onChange} />
      <span className="pj-chip-face">
        {checked && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
        {children}
      </span>
    </label>
  );
}

function ProjectCard({ p, spent }) {
  const budgetId = useId();
  const lead = personById[p.lead];
  return (
    <li className="pj-card">
      <div className="pj-card-top">
        <span className="pj-code num">{p.code}</span>
        <span className={`badge ${statusBadge[p.status]}`}>{projectStatusLabel[p.status]}</span>
      </div>
      <h2 className="pj-card-title">
        <a className="pj-card-link" href={href('/projekte/' + p.id)} data-project-link={p.id} aria-describedby={budgetId}>
          {p.name}
        </a>
        <ChevronRight className="pj-card-arrow" size={20} aria-hidden="true" />
      </h2>
      <p className="muted">{clientById[p.client]?.name}</p>
      <dl className="pj-meta">
        <div><dt>Studio</dt><dd><StudioTag id={p.studio} /></dd></div>
        <div><dt>Leitung</dt><dd>{lead?.name}</dd></div>
        <div><dt>Phase</dt><dd>{p.phase}</dd></div>
        <div><dt>Fällig</dt><dd><DueText iso={p.due} /></dd></div>
      </dl>
      <BudgetMeter id={budgetId} spent={spent} budget={p.budget} />
    </li>
  );
}

export default function ProjectList({ filters, setFilters }) {
  const { query, sort } = filters;
  const searchId = useId();
  const sortId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false); // nur schmal wirksam, breit ist alles offen
  // Buchungen nur lesen – der Setter bleibt ungenutzt
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const spent = useMemo(() => Object.fromEntries(projects.map(p => [p.id, spentHours(p, entries)])), [entries]);
  const set = patch => setFilters(f => ({ ...f, ...patch }));
  const toggle = (key, value) =>
    setFilters(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(x => x !== value) : [...f[key], value] }));
  const active = (query.trim() ? 1 : 0) + filters.studios.length + filters.statuses.length;
  const filtered = active > 0;

  const list = useMemo(() => {
    const q = norm(query);
    return projects
      .filter(p => !filters.studios.length || filters.studios.includes(p.studio))
      .filter(p => !filters.statuses.length || filters.statuses.includes(p.status))
      .filter(p => !q || [p.name, p.code, clientById[p.client]?.name].some(s => norm(s).includes(q)))
      .sort((a, b) => SORTS[sort].fn(a, b, spent));
  }, [query, filters.studios, filters.statuses, sort, spent]);

  const reset = () => setFilters(f => ({ ...f, query: '', studios: [], statuses: [] }));

  return (
    <section className="pj-page" aria-labelledby="pj-title">
      <header className="pj-head">
        <p className="eyebrow">Projekte</p>
        <h1 id="pj-title" tabIndex={-1}>Alle Projekte</h1>
        <p className="muted">Budget in Stunden, Stand heute. Die Ampel zeigt, wo es eng wird.</p>
      </header>

      <div className="pj-filters" role="search" aria-label="Projekte filtern">
        <div className="pj-result">
          <button type="button" className="btn pj-filter-toggle" aria-expanded={open} aria-controls={panelId}
            onClick={() => setOpen(o => !o)}>
            <SlidersHorizontal size={20} aria-hidden="true" /> Filter
            {filtered && <span className="pj-filter-count num">{active}<span className="visually-hidden"> aktiv</span></span>}
          </button>
          <p role="status" className="quiet num pj-result-text">
            {filtered ? `${list.length} von ${projects.length} Projekten` : `${projects.length} Projekte`}
          </p>
          {filtered && list.length > 0 && <button type="button" className="btn btn-ghost" onClick={reset}>Filter zurücksetzen</button>}
        </div>
        <div id={panelId} className="pj-filter-panel" data-open={open}>
          <div className="pj-filter-row">
            <div className="field pj-search">
              <label htmlFor={searchId}>Suchen</label>
              <input id={searchId} className="input" type="search" value={query} placeholder="Name, Kunde oder Code"
                autoComplete="off" onChange={e => set({ query: e.target.value })} />
            </div>
            <div className="field pj-sort">
              <label htmlFor={sortId}>Sortieren nach</label>
              <select id={sortId} className="select" value={sort} onChange={e => set({ sort: e.target.value })}>
                {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <fieldset className="pj-chips">
            <legend className="pj-legend">Studio</legend>
            {studios.map(s => (
              <Chip key={s.id} checked={filters.studios.includes(s.id)} onChange={() => toggle('studios', s.id)}>
                <span className="pj-dot" style={{ background: s.color }} aria-hidden="true" />{s.name}
              </Chip>
            ))}
          </fieldset>
          <fieldset className="pj-chips">
            <legend className="pj-legend">Status</legend>
            {Object.entries(projectStatusLabel).map(([k, label]) => (
              <Chip key={k} checked={filters.statuses.includes(k)} onChange={() => toggle('statuses', k)}>{label}</Chip>
            ))}
          </fieldset>
        </div>
      </div>

      {list.length ? (
        <ul className="pj-cards" aria-label="Projekte">
          {list.map(p => <ProjectCard key={p.id} p={p} spent={spent[p.id]} />)}
        </ul>
      ) : (
        <div className="pj-empty">
          <SearchX size={32} aria-hidden="true" />
          <h2 className="h3">Keine Projekte gefunden</h2>
          <p className="muted">Kein Projekt passt zu Suche und Filtern. Weniger Filter wählen oder alles zurücksetzen.</p>
          <button type="button" className="btn" onClick={reset}>Filter zurücksetzen</button>
        </div>
      )}
    </section>
  );
}
