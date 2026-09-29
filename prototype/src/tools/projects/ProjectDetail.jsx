// Projektdetail (r07): Titel aus Code und Name, darunter Eigenschaften als Chips (Status, Lead, Studio, Abgabe,
// Budget-Rest), dann Tabs als Links mit aria-current: Aufgaben | Übersicht | Zeiten. Keine Einleitung.
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { tasks as seedTasks, timeEntries as sampleEntries } from '../../data/sample.js';
import { clientsById, projectsById } from '../../lib/projects.js';
import { useStoredState } from '../../lib/store.js';
import { cleanEntries, cleanTasks } from '../../lib/data.js';
import { spentHours } from '../../lib/budget.js';
import { href } from '../../lib/router.js';
import { budgetInfo, fmtDay, fmtH, fmtKw, isDay, isoWeek, parseDay, personById, studioById } from './helpers.js';
import { Avatar, StateIcon, StatusDot } from './parts.jsx';
import TaskBoard from './TaskBoard.jsx';
import Overview from './Overview.jsx';
import ProjectTimes from './ProjectTimes.jsx';

export const TABS = [
  { key: 'aufgaben', label: 'Aufgaben' },
  { key: 'uebersicht', label: 'Übersicht' },
  { key: 'zeiten', label: 'Zeiten' },
];

function BackLink() {
  return (
    <a className="btn btn-ghost pj-back" href={href('/projekte')}>
      <ArrowLeft size={18} aria-hidden="true" /> Alle Projekte
    </a>
  );
}

function RestChip({ info }) {
  const over = info.rest < 0;
  return (
    <li className={`chip pj-prop-rest is-${info.state}`}>
      <StateIcon state={info.state} size={16} />
      <span className="visually-hidden">Budget: </span>
      <span className="num">{over ? `${fmtH(-info.rest)} überzogen` : `${fmtH(info.rest)} Rest`}</span>
      {info.state === 'warn' && <span>· knapp</span>}
    </li>
  );
}

export default function ProjectDetail({ id, tab = 'aufgaben', taskId }) {
  const [tasks, setTasks] = useStoredState('tasks', seedTasks, cleanTasks);
  // Buchungen lesen; geschrieben wird nur über den gemeinsamen Timer (lib/timer.js)
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const p = projectsById()[id] ?? null; // gemeinsame, bearbeitbare Quelle (lib/projects.js)

  if (!p) {
    return (
      <section className="pj-page" aria-labelledby="pj-title">
        <BackLink />
        <h1 id="pj-title" tabIndex={-1}>Nicht gefunden</h1>
        <p className="muted">Zu dieser Adresse gibt es kein Projekt. Die Liste zeigt alle Projekte.</p>
      </section>
    );
  }

  const info = budgetInfo(spentHours(p, entries), p.budget);
  const lead = personById[p.lead];
  const studio = studioById[p.studio];
  const due = isDay(p.due) ? parseDay(p.due) : null;
  const current = TABS.find(t => t.key === tab) || TABS[0];

  return (
    <article className="pj-page pj-detail" aria-labelledby="pj-title">
      <BackLink />
      <header className="pj-dhead">
        <p className="overline pj-client">{clientsById()[p.client]?.name}</p>
        <h1 id="pj-title" className="pj-dtitle" tabIndex={-1}>
          <span className="pj-dcode num">{p.code}</span> {p.name}
        </h1>
        <ul className="pj-props" aria-label="Eigenschaften">
          <li className="chip"><span className="visually-hidden">Status: </span><StatusDot status={p.status} /></li>
          {lead && (
            <li className="chip pj-prop-lead">
              <Avatar person={lead} size="is-xs" /><span className="visually-hidden">Lead: </span>{lead.name}
            </li>
          )}
          {studio && (
            <li className="chip">
              <span className="pj-dot" style={{ background: studio.color }} aria-hidden="true" />
              <span className="visually-hidden">Studio: </span>{studio.name}
            </li>
          )}
          <li className="chip">
            <CalendarDays size={16} aria-hidden="true" />
            <span className="visually-hidden">Abgabe: </span>
            <span className="num">{due ? `${fmtDay(p.due, { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${fmtKw(isoWeek(due))}` : 'ohne Abgabe'}</span>
          </li>
          <RestChip info={info} />
        </ul>
        <nav className="pj-tabs" aria-label="Ansichten des Projekts">
          {TABS.map(t => (
            <a key={t.key} className="pj-tab" href={href(`/projekte/${p.id}/${t.key}`)}
              aria-current={t.key === current.key ? 'page' : undefined}>{t.label}</a>
          ))}
        </nav>
      </header>

      {current.key === 'aufgaben' && <TaskBoard project={p} tasks={tasks} setTasks={setTasks} entries={entries} taskId={taskId} />}
      {current.key === 'uebersicht' && <Overview project={p} entries={entries} tasks={tasks} />}
      {current.key === 'zeiten' && <ProjectTimes project={p} entries={entries} tasks={tasks} />}
    </article>
  );
}
