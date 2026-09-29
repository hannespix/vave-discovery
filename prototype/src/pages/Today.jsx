import { useEffect, useState } from 'react';
import { ArrowRight, History, Play } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import { useStoredState } from '../lib/store.js';
import { href } from '../lib/router.js';
import { cleanEntries, cleanTasks } from '../lib/data.js';
import { useTimer } from '../lib/timer.js';
import { restHours, spentHours } from '../lib/budget.js';
import { addDays, budgetState, fmtDate, fmtH1, fmtTime, isoDay, pct } from '../lib/format.js';
import { CLOSE_HOUR, OPEN_HOUR, daysFromToday, dueLabel, greeting, studioStatus, useNow } from '../lib/time.js';
import { me, studios, tasks as sampleTasks, timeEntries as sampleEntries } from '../data/sample.js';
import { projectsById, useProjects } from '../lib/projects.js';
import { resumeCombo } from '../tools/time/grid.js';
import '../styles/pages.css';

// „Heute“ (r07): eine Spalte – heute Gebuchtes, eigene Aufgaben nach Fälligkeit –, daneben schmal Studios und knappe
// Budgets. Kein Kachelraster, kein eigener Timer-Knopf: den Timer hat die Hülle, hier wird nur aus der Zeile gestartet.
const DAY_GOAL_MIN = 8 * 60;      // Tagessoll der Demo
const GAP_BELOW_MIN = 6 * 60;     // sanfter Hinweis, wenn der letzte Arbeitstag darunter liegt
const WATCH_FROM = 0.8;           // „Budgets im Blick“ ab 80 %

// Nur echte Projekte – gespeicherte Werte wie „__proto__“ ergeben kein Projekt
// Projekte aus der gemeinsamen, bearbeitbaren Quelle (lib/projects.js)
const projectOf = id => { const m = projectsById(); return typeof id === 'string' && Object.hasOwn(m, id) ? m[id] : null; };
const firstName = me.name.split(' ')[0];
const minutesOf = list => list.reduce((a, e) => a + (Number(e.minutes) || 0), 0);
// Minuten → „2:45“ (ohne Einheit)
const hm = min => { const m = Math.max(0, Math.round(min)); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const hours = h => h.toLocaleString('de-DE', { maximumFractionDigits: 1 });
const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;

const GROUPS = [
  { id: 'overdue', label: 'Überfällig' },
  { id: 'today', label: 'Heute' },
  { id: 'week', label: 'Diese Woche' },
  { id: 'later', label: 'Später' },
];
// Fälligkeit → Gruppe. „Diese Woche“ reicht bis Sonntag, ohne Termin zählt als „Später“.
const groupOf = (days, toSunday) =>
  days === null ? 'later' : days < 0 ? 'overdue' : days === 0 ? 'today' : days <= toSunday ? 'week' : 'later';

// Läuft genau diese Kombination (Projekt, Aufgabe, Notiz)?
const sameCombo = (t, c) => Boolean(t) && t.project === c.project && (t.task ?? null) === (c.task ?? null)
  && String(t.note ?? '').trim() === String(c.note ?? '').trim();

// Ein Play-Zeichen überall (base.css .btn-play): rund, gefülltes Dreieck. Hier nur Start – der laufende Zustand steht als
// „läuft“ (Limette) an der Zeile; gestoppt wird in der Hülle.
function PlayButton({ label, onClick }) {
  return (
    <button type="button" className="btn-play today-play" aria-label={label} title={label} onClick={onClick}>
      <Play aria-hidden="true" fill="currentColor" />
    </button>
  );
}

function DayGoal({ minutes }) {
  const share = Math.min(1, minutes / DAY_GOAL_MIN);
  return (
    <div className="today-goal">
      <p className="today-goal__text">
        <span className="today-goal__label">Heute</span>{' '}
        <span className="visually-hidden">gebucht </span>
        <strong className="num">{hm(minutes)}</strong> von {hm(DAY_GOAL_MIN)} h
      </p>
      <span className="today-goal__bar" aria-hidden="true"><span style={{ width: `${share * 100}%` }} /></span>
    </div>
  );
}

export default function Today() {
  const { projects } = useProjects();
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const [tasks] = useStoredState('tasks', sampleTasks, cleanTasks);
  const { timer, running, start } = useTimer();
  const now = useNow(30000);
  const [hint, setHint] = useState(null);   // { key, text } – Hinweis an der Zeile, deren Play nichts starten konnte
  const [said, setSaid] = useState('');     // Ansage für Screenreader

  // Timer gestoppt (Hülle, anderer Tab): Hinweis erledigt
  useEffect(() => { if (!running) setHint(null); }, [running]);

  const taskById = new Map(tasks.map(t => [t.id, t]));
  const mine = entries.filter(e => !e.person || e.person === me.id);
  const todayIso = isoDay(now);

  // Heute gebucht, in der Reihenfolge des Tages
  const todays = mine
    .filter(e => e.date === todayIso)
    .sort((a, b) => String(a.start || '~').localeCompare(String(b.start || '~')));
  const todayMin = minutesOf(todays);

  // Letzter Arbeitstag (Mo–Fr) vor heute
  let last = addDays(now, -1);
  while (isWeekend(last)) last = addDays(last, -1);
  const lastIso = isoDay(last);
  const lastMin = minutesOf(mine.filter(e => e.date === lastIso));
  const lastName = lastIso === isoDay(addDays(now, -1)) ? 'Gestern' : fmtDate(last, { weekday: 'long' });

  // Meine Aufgaben: offen, nach Fälligkeit gruppiert; gebucht = alle Einträge mit dieser Aufgabe
  const toSunday = (7 - now.getDay()) % 7;
  const bookedByTask = new Map();
  for (const e of entries) {
    if (typeof e.task === 'string') bookedByTask.set(e.task, (bookedByTask.get(e.task) || 0) + (Number(e.minutes) || 0));
  }
  const myTasks = tasks
    .filter(t => t.assignee === me.id && t.status !== 'done')
    .map(t => {
      const d = daysFromToday(t.due, now);
      const days = Number.isFinite(d) ? d : null;
      return { ...t, days, group: groupOf(days, toSunday), bookedMin: bookedByTask.get(t.id) || 0 };
    })
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity) || a.title.localeCompare(b.title, 'de'));

  // Budgets ab 80 %: Stand + alle Buchungen, Zustand auf ungerundeten Stunden. Rest wie in Projekte und Raster:
  // restHours (lib/budget.js), angezeigt mit fmtH1 – dieselbe Zahl auf jeder Seite.
  const watch = projects
    .filter(p => p.budget > 0)
    .map(p => {
      const spent = spentHours(p, entries);
      return { ...p, spent, rest: restHours(p, entries), ratio: spent / p.budget, state: budgetState(spent, p.budget) };
    })
    .filter(p => p.ratio >= WATCH_FROM)
    .sort((a, b) => b.ratio - a.ratio);

  const describe = t => {
    const p = projectOf(t.project);
    const what = String(t.note ?? '').trim() || (t.task ? taskById.get(t.task)?.title : '') || '';
    return [p ? p.code : 'ohne Projekt', what].filter(Boolean).join(' · ');
  };

  // Play: startet genau diese Kombination. Läuft schon ein Timer, startet nichts – der Hinweis sagt, welcher läuft.
  const play = (combo, key, label, verb) => {
    const res = start(combo);
    if (res?.already) {
      const same = combo.task && !combo.note ? res.timer?.task === combo.task : sameCombo(res.timer, combo);
      const text = same
        ? 'Dieser Timer läuft bereits.'
        : `Es läuft schon ein Timer (${describe(res.timer)}). Erst stoppen, dann ${verb}.`;
      setHint({ key, text });
      setSaid(text);
      return;
    }
    setHint(null);
    setSaid(`Timer gestartet: ${label}`);
  };

  const hintFor = key => (hint?.key === key ? <p className="today-hint">{hint.text}</p> : null);

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`${greeting(now)}, ${firstName}`}
        actions={<DayGoal minutes={todayMin} />}
      />

      <div className="today">
        <div className="today__main">
          {lastMin < GAP_BELOW_MIN && (
            <a className="today-gap" href={href(`/zeit/nachtragen/${lastIso}`)}>
              <History aria-hidden="true" size={18} strokeWidth={1.75} />
              <span>
                {lastName} {lastMin > 0 ? `${hm(lastMin)} h` : 'nichts'} gebucht –{' '}
                <span className="today-gap__cta">nachtragen?</span>
              </span>
            </a>
          )}

          <section className="today-sect" aria-labelledby="booked-title">
            <div className="today-sect__head">
              <h2 id="booked-title">Heute gebucht</h2>
              {todays.length > 0 && (
                <p className="today-sect__sum num"><span className="visually-hidden">Summe </span>{hm(todayMin)} h</p>
              )}
            </div>
            {todays.length === 0 ? (
              <p className="today-empty">
                Heute ist noch nichts gebucht.{' '}
                <a className="today-empty__link" href={href('/zeit/nachtragen')}>Zeit nachtragen</a>
              </p>
            ) : (
              <ul className="list" role="list">
                {todays.map(e => {
                  const p = projectOf(e.project);
                  const task = typeof e.task === 'string' ? taskById.get(e.task) : null;
                  const note = String(e.note ?? '').trim();
                  const title = note || task?.title || 'Ohne Beschreibung';
                  // Fortsetzen wie in Zeiten: ohne die Anzeige-Notiz eines Sammeleintrags aus dem Wochenraster
                  const combo = resumeCombo(e);
                  const here = running && sameCombo(timer, combo);
                  return (
                    <li key={e.id} data-entry={e.id}>
                      <div className="row today-row">
                        <div className="row__main">
                          <p className="row__title">{title}</p>
                          <p className="row__meta">
                            <span className="dot" aria-hidden="true" />{' '}
                            {p ? <><span className="today-code">{p.code}</span>{task ? ` · ${task.title}` : ` ${p.name}`}</> : 'Ohne Projekt'}
                          </p>
                        </div>
                        <div className="today-row__aside">
                          {here && <span className="badge badge-lime">läuft</span>}
                          <span className="today-row__num num">{hm(e.minutes)} h</span>
                          <PlayButton label={`Fortsetzen: ${title}`} onClick={() => play(combo, e.id, title, 'fortsetzen')} />
                        </div>
                      </div>
                      {hintFor(e.id)}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="today-sect" aria-labelledby="tasks-title">
            <div className="today-sect__head">
              <h2 id="tasks-title">Meine Aufgaben</h2>
              <p className="today-sect__sum num">{myTasks.length} offen</p>
            </div>
            {/* Nur Gruppen mit Aufgaben; ein Satz nur, wenn alle leer sind */}
            {myTasks.length === 0 && <p className="today-empty">Keine offenen Aufgaben.</p>}
            {GROUPS.map(g => ({ ...g, list: myTasks.filter(t => t.group === g.id) })).filter(g => g.list.length > 0).map(g => (
              <div key={g.id} className="today-group" data-group={g.id}>
                <h3 className="today-group__title">
                  {g.label} <span className="today-group__count num">{g.list.length}</span>
                </h3>
                <ul className="list" role="list">
                  {g.list.map(t => {
                    const p = projectOf(t.project);
                    const key = `task:${t.id}`;
                    const here = running && timer?.task === t.id;
                    const estimate = Number(t.estimate);
                    return (
                      <li key={t.id} data-task={t.id}>
                        <div className="row today-row">
                          <div className="row__main today-task">
                            <a className="row__title today-task__link" href={href(p ? `/projekte/${p.id}/${t.id}` : '/projekte')}>
                              {t.title}
                            </a>
                            <p className="row__meta">
                              {p && <><span className="dot" aria-hidden="true" /> <span className="today-code">{p.code}</span> · </>}
                              {dueLabel(t.days)}
                            </p>
                          </div>
                          <div className="today-row__aside">
                            {here && <span className="badge badge-lime">läuft</span>}
                            <span className="today-row__num today-row__num--quiet num">
                              <span className="visually-hidden">gebucht </span>{hours(t.bookedMin / 60)}
                              {estimate > 0 && (
                                <><span aria-hidden="true"> / </span><span className="visually-hidden"> von geschätzt </span>{hours(estimate)}</>
                              )} h
                            </span>
                            <PlayButton
                              label={`Timer starten: ${t.title}`}
                              onClick={() => play({ project: t.project, task: t.id }, key, t.title, 'starten')}
                            />
                          </div>
                        </div>
                        {hintFor(key)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <aside className="today__aside" aria-label="Studios und Budgets">
          <section className="today-sect" aria-labelledby="studios-now-title">
            <div className="today-sect__head">
              <h2 id="studios-now-title">Studios jetzt</h2>
              <a className="today-more" href={href('/studios')}>Alle<span className="visually-hidden"> Studios</span><ArrowRight aria-hidden="true" size={16} /></a>
            </div>
            <ul className="list" role="list">
              {studios.map(s => {
                const st = studioStatus(now, s.tz);
                return (
                  <li key={s.id} className="today-studio">
                    <span className="today-studio__name">{s.name}</span>
                    <span className="today-studio__time num">{fmtTime(now, s.tz)}<span className="visually-hidden"> Uhr Ortszeit</span></span>
                    <OpenBadge open={st.open} workday={st.workday} compact />
                  </li>
                );
              })}
            </ul>
            <p className="today-side__note">Mo–Fr {OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit, Feiertage nicht berücksichtigt.</p>
          </section>

          <section className="today-sect" aria-labelledby="budgets-title">
            <div className="today-sect__head">
              <h2 id="budgets-title">Budgets im Blick</h2>
              <p className="today-side__hint">ab 80 %</p>
            </div>
            {watch.length === 0 ? (
              <p className="today-side__note">Kein Projekt über 80 %.</p>
            ) : (
              <ul className="list" role="list">
                {watch.map(p => {
                  const over = p.state === 'danger';
                  return (
                    <li key={p.id} data-budget={p.id}>
                      <a className="today-budget" href={href('/projekte/' + p.id)}>
                        <span className="today-budget__name"><span className="today-code">{p.code}</span> {p.name}</span>
                        <span className={`today-budget__bar is-${p.state}`} aria-hidden="true">
                          <span style={{ width: `${Math.min(1, p.ratio) * 100}%` }} />
                        </span>
                        <span className="today-budget__meta num">
                          {over
                            ? <><span className="badge badge-danger">überzogen</span> {fmtH1(-p.rest)} über Budget</>
                            : <>Rest {fmtH1(p.rest)} · {pct(p.spent, p.budget)} %</>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <p className="visually-hidden" role="status">{said}</p>
    </>
  );
}
