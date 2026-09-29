// Zeiten-Tab: Einträge der Zeiterfassung für dieses Projekt, nach Kalenderwoche gruppiert (neueste zuerst) mit Summen.
// Aufgabentitel, wo der Eintrag eine Aufgabe hat (Link auf die Karte). Leerzustand als ein Satz.
import { useId } from 'react';
import { fmtDate, fmtDuration, weekStart } from '../../lib/format.js';
import { href } from '../../lib/router.js';
import { fmtH, fmtKw, isoWeek, parseDay, personById } from './helpers.js';

function WeekGroup({ week, tasksById, projectId, year }) {
  const headId = useId();
  const end = new Date(week.monday.getTime() + 6 * 86400000);
  return (
    <section className="pj-week" aria-labelledby={headId}>
      <div className="pj-week-head">
        <h2 id={headId}>
          {fmtKw(isoWeek(week.monday), year)}{' '}
          <span className="pj-week-range num">
            {fmtDate(week.monday, { day: '2-digit', month: '2-digit' })}–{fmtDate(end, { day: '2-digit', month: '2-digit' })}
          </span>
        </h2>
        <p className="pj-week-sum num"><span className="visually-hidden">Summe: </span>{fmtDuration(week.minutes)}</p>
      </div>
      <ul className="list">
        {week.list.map(e => {
          const task = e.task ? tasksById[e.task] : null;
          const person = personById[e.person];
          return (
            <li key={e.id} className="row pj-entry">
              <span className="pj-entry-day num">{fmtDate(parseDay(e.date), { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
              <div className="row__main">
                {task
                  ? <a className="row__title pj-entry-task" href={href(`/projekte/${projectId}/${task.id}`)}>{task.title}</a>
                  : <p className="row__title">{e.note || 'Ohne Notiz'}</p>}
                <p className="row__meta">
                  {[task && e.note, e.start && `ab ${e.start}`, person?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="row__aside num">{fmtDuration(Number(e.minutes) || 0)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProjectTimes({ project, entries, tasks }) {
  const mine = entries
    .filter(e => e.project === project.id)
    .sort((a, b) => `${b.date} ${b.start || ''}`.localeCompare(`${a.date} ${a.start || ''}`));
  const tasksById = Object.fromEntries(tasks.map(t => [t.id, t]));
  const year = new Date().getFullYear();

  if (!mine.length) {
    return <p className="pj-times-empty">Auf dieses Projekt ist in der Zeiterfassung noch nichts gebucht.</p>;
  }

  const weeks = [];
  for (const e of mine) {
    const monday = weekStart(parseDay(e.date));
    let w = weeks.find(x => x.monday.getTime() === monday.getTime());
    if (!w) { w = { monday, list: [], minutes: 0 }; weeks.push(w); }
    w.list.push(e);
    w.minutes += Number(e.minutes) || 0;
  }
  const total = mine.reduce((s, e) => s + (Number(e.minutes) || 0), 0);

  return (
    <div className="pj-times">
      <p className="meta num">
        {fmtDuration(total)} in {mine.length} {mine.length === 1 ? 'Eintrag' : 'Einträgen'}. Dazu kommen {fmtH(project.spent)} aus der
        Zeit vor der Zeiterfassung (Beispieldaten, nicht einzeln aufgeführt).
      </p>
      {weeks.map(w => <WeekGroup key={w.monday.getTime()} week={w} tasksById={tasksById} projectId={project.id} year={year} />)}
    </div>
  );
}
