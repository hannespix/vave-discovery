// Projektliste als Zeilen (r07): Code und Name, Kunde grau, Status als Punkt mit Wort, Lead als Kürzel, Abgabe und rechts
// die Reststunden mit schmalem Balken. Ab 720 px Inhaltsbreite tabellenartig ausgerichtet (ein Raster für alle Zeilen).
// Jede Zeile ist genau ein Link (Name; die Trefferfläche deckt die ganze Zeile). Schmal liegen Suche, Chips und
// Sortierung hinter „Filter“, damit die erste Zeile gleich im Bild ist.
import { useId, useMemo, useState } from 'react';
import { Search, SearchX, SlidersHorizontal } from 'lucide-react';
import { studios, projectStatusLabel, timeEntries as sampleEntries } from '../../data/sample.js';
import { clientsById, loadProjects } from '../../lib/projects.js';
import { href } from '../../lib/router.js';
import { useStoredState } from '../../lib/store.js';
import { cleanEntries } from '../../lib/data.js';
import { spentHours } from '../../lib/budget.js';
import { budgetInfo, fmtH, fmtRest, norm, personById } from './helpers.js';
import { Avatar, BudgetBar, DueText, StateIcon, StatusDot } from './parts.jsx';

export const initialFilters = { query: '', studio: '', statuses: [], sort: 'due' };

const byCode = (a, b) => a.code.localeCompare(b.code);
const SORTS = {
  due: { label: 'Nach Abgabe', fn: (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || byCode(a, b) },
  budget: { label: 'Nach Auslastung', fn: (a, b, spent) => spent[b.id] / b.budget - spent[a.id] / a.budget || byCode(a, b) },
  rest: { label: 'Nach Reststunden', fn: (a, b, spent) => (a.budget - spent[a.id]) - (b.budget - spent[b.id]) || byCode(a, b) },
};

function ProjectRow({ p, spent }) {
  const descId = useId();
  const lead = personById[p.lead];
  const b = budgetInfo(spent, p.budget);
  const restText = b.rest < 0 ? `überzogen um ${fmtH(-b.rest)}` : `Rest ${fmtH(b.rest)}`;
  return (
    <li className={`pj-row is-${b.state}`}>
      <span className="pj-row-code num">{p.code}</span>
      <a className="pj-row-name" href={href('/projekte/' + p.id)} data-project-link={p.id} aria-describedby={descId}>{p.name}</a>
      <div className="pj-row-sub">
        <span className="pj-row-client">{clientsById()[p.client]?.name}</span>
        <span className="pj-row-status"><StatusDot status={p.status} /></span>
        <span className="pj-row-lead" title={lead?.name}>
          <Avatar person={lead} size="is-s" /><span className="visually-hidden">Lead: {lead?.name}</span>
        </span>
        <span className="pj-row-due"><span className="visually-hidden">Abgabe: </span><DueText iso={p.due} short /></span>
      </div>
      <div className="pj-row-rest">
        <span className="pj-rest-num num" aria-hidden="true"><StateIcon state={b.state} size={16} />{fmtRest(b.rest)}</span>
        <BudgetBar info={b} spent={b.spent} budget={p.budget} />
      </div>
      <span id={descId} className="visually-hidden">{`${restText} von ${fmtH(p.budget)}, Budget ${b.label}`}</span>
    </li>
  );
}

export default function ProjectList({ filters, setFilters }) {
  const { query, sort, studio } = filters;
  const ids = { search: useId(), sort: useId(), studio: useId(), panel: useId() };
  const [open, setOpen] = useState(false); // nur schmal wirksam, breit ist alles offen
  // Buchungen nur lesen – der Setter bleibt ungenutzt
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const projects = loadProjects(); // gemeinsame, bearbeitbare Quelle; Projects.jsx zeichnet bei Änderungen neu
  const spent = useMemo(() => Object.fromEntries(projects.map(p => [p.id, spentHours(p, entries)])), [entries, projects]);
  const set = patch => setFilters(f => ({ ...f, ...patch }));
  const toggleStatus = value =>
    setFilters(f => ({ ...f, statuses: f.statuses.includes(value) ? f.statuses.filter(x => x !== value) : [...f.statuses, value] }));
  const active = (query.trim() ? 1 : 0) + (studio ? 1 : 0) + filters.statuses.length;
  const filtered = active > 0;

  const list = useMemo(() => {
    const q = norm(query);
    return projects
      .filter(p => !studio || p.studio === studio)
      .filter(p => !filters.statuses.length || filters.statuses.includes(p.status))
      .filter(p => !q || [p.name, p.code, clientsById()[p.client]?.name].some(s => norm(s).includes(q)))
      .sort((a, b) => (SORTS[sort] || SORTS.due).fn(a, b, spent));
  }, [query, studio, filters.statuses, sort, spent, projects]);

  const reset = () => setFilters(f => ({ ...f, query: '', studio: '', statuses: [] }));

  return (
    <section className="pj-page" aria-labelledby="pj-title">
      <header className="pj-lhead">
        <h1 id="pj-title" tabIndex={-1}>Projekte</h1>
      </header>

      <div className="pj-filters" role="search" aria-label="Projekte filtern">
        <div className="pj-result">
          <button type="button" className="btn pj-filter-toggle" aria-expanded={open} aria-controls={ids.panel}
            onClick={() => setOpen(o => !o)}>
            <SlidersHorizontal size={18} aria-hidden="true" /> Filter
            {filtered && <span className="pj-filter-count num">{active}<span className="visually-hidden"> aktiv</span></span>}
          </button>
          <p role="status" className="meta num pj-result-text">
            {filtered ? `${list.length} von ${projects.length} Projekten` : `${projects.length} Projekte`}
          </p>
          {filtered && list.length > 0 && <button type="button" className="btn btn-ghost pj-reset" onClick={reset}>Zurücksetzen</button>}
        </div>
        <div id={ids.panel} className="pj-filter-panel" data-open={open}>
          <div className="pj-search">
            <label htmlFor={ids.search} className="visually-hidden">Suchen</label>
            <Search size={18} aria-hidden="true" className="pj-search-icon" />
            <input id={ids.search} className="input" type="search" value={query} placeholder="Name, Kunde oder Code"
              autoComplete="off" onChange={e => set({ query: e.target.value })} />
          </div>
          <fieldset className="pj-chips">
            <legend className="visually-hidden">Status</legend>
            {Object.entries(projectStatusLabel).map(([k, label]) => (
              <button key={k} type="button" className="chip" aria-pressed={filters.statuses.includes(k)} onClick={() => toggleStatus(k)}>
                {label}
              </button>
            ))}
          </fieldset>
          <div className="pj-selects">
            <label htmlFor={ids.studio} className="visually-hidden">Studio</label>
            <select id={ids.studio} className="select" value={studio} onChange={e => set({ studio: e.target.value })}>
              <option value="">Alle Studios</option>
              {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label htmlFor={ids.sort} className="visually-hidden">Sortierung</label>
            <select id={ids.sort} className="select" value={sort} onChange={e => set({ sort: e.target.value })}>
              {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {list.length ? (
        <div className="pj-table">
          <div className="pj-row pj-row-head" aria-hidden="true">
            <span className="pj-row-code">Code</span>
            <span className="pj-row-name">Projekt</span>
            <div className="pj-row-sub">
              <span className="pj-row-status">Status</span>
              <span className="pj-row-lead">Lead</span>
              <span className="pj-row-due">Abgabe</span>
            </div>
            <span className="pj-row-rest">Rest</span>
          </div>
          <ul className="list pj-rows" aria-label="Projekte">
            {list.map(p => <ProjectRow key={p.id} p={p} spent={spent[p.id]} />)}
          </ul>
        </div>
      ) : (
        <div className="pj-empty">
          <SearchX size={28} aria-hidden="true" />
          <p>Kein Projekt passt zu Suche und Filtern.</p>
          <button type="button" className="btn" onClick={reset}>Filter zurücksetzen</button>
        </div>
      )}
    </section>
  );
}
