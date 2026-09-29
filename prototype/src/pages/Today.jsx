import { ArrowRight, CircleAlert, CircleCheck, Clock3, Timer, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import { useStoredState } from '../lib/store.js';
import { href } from '../lib/router.js';
import { budgetLabel, budgetState, fmtClock, fmtDate, fmtDuration, fmtTime, isoDay, pct, weekStart } from '../lib/format.js';
import { daysFromToday, dueLabel, greeting, studioStatus, useNow } from '../lib/time.js';
import { byId, me, projects, statusLabel, studios, tasks as sampleTasks, timeEntries as sampleEntries } from '../data/sample.js';
import '../styles/pages.css';

const projectById = byId(projects);
const firstName = me.name.split(' ')[0];
const sum = list => list.reduce((a, e) => a + (Number(e.minutes) || 0), 0);
const hours = h => `${h.toLocaleString('de-DE')} h`;
const budgetIcon = { ok: CircleCheck, warn: TriangleAlert, danger: CircleAlert };

// Startseite: liest die Speicher-Schlüssel der Werkzeuge (Beispieldaten als Startwert), schreibt selbst nichts Neues
export default function Today() {
  const [storedEntries] = useStoredState('time-entries', sampleEntries);
  const [timer] = useStoredState('timer', null);
  const [storedTasks] = useStoredState('tasks', sampleTasks);
  const running = Boolean(timer && timer.startedAt);
  const now = useNow(running ? 1000 : 30000);

  const entries = (Array.isArray(storedEntries) ? storedEntries : []).filter(e => !e.person || e.person === me.id);
  const allTasks = Array.isArray(storedTasks) ? storedTasks : [];
  const todayIso = isoDay(now);
  const monday = weekStart(now);
  const mondayIso = isoDay(monday);

  const todayMin = sum(entries.filter(e => e.date === todayIso));
  const todayCount = entries.filter(e => e.date === todayIso).length;
  const weekMin = sum(entries.filter(e => e.date >= mondayIso && e.date <= todayIso));
  const elapsedSec = running ? Math.max(0, Math.floor((now - new Date(timer.startedAt)) / 1000)) : 0;

  const myOpen = allTasks
    .filter(t => t.assignee === me.id && t.status !== 'done')
    .map(t => ({ ...t, days: daysFromToday(t.due, now) }))
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const dueSoon = myOpen.filter(t => t.days !== null && t.days <= 2).length;

  const active = projects
    .filter(p => p.status === 'aktiv')
    .map(p => ({ ...p, percent: pct(p.spent, p.budget), state: budgetState(p.spent, p.budget) }))
    .sort((a, b) => b.percent - a.percent);
  const over = active.filter(p => p.state === 'danger').length;

  const timerProject = running ? projectById[timer.project] : null;

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        title={`${greeting(now)}, ${firstName}`}
        actions={
          <a className="btn btn-primary" href={href('/zeit')}>
            <Timer aria-hidden="true" size={18} strokeWidth={1.75} />
            Zeit erfassen
          </a>
        }
      >
        <p>Was heute ansteht, wo Budgets knapp werden und welche Studios gerade arbeiten.</p>
      </PageHeader>

      {running && (
        <section className="timer-banner" aria-labelledby="timer-title">
          <span className="timer-banner__dot" aria-hidden="true" />
          <div className="timer-banner__text">
            <h2 id="timer-title" className="timer-banner__title">Timer läuft</h2>
            <p>
              {timerProject ? `${timerProject.code} · ${timerProject.name}` : 'Ohne Projekt'}
              {timer.note ? ` – ${timer.note}` : ''}
            </p>
          </div>
          <p className="timer-banner__clock num"><span className="visually-hidden">Laufzeit </span>{fmtClock(elapsedSec)}</p>
          <a className="btn" href={href('/zeit')}>Zur Zeiterfassung</a>
        </section>
      )}

      <section aria-labelledby="kpi-title" className="today-block">
        <h2 id="kpi-title" className="visually-hidden">Kennzahlen</h2>
        <dl className="stats">
          <div className="stat stat--lime">
            <dt className="stat__label">Heute gebucht</dt>
            <dd className="stat__value">{fmtDuration(todayMin)}</dd>
            <dd className="stat__note">
              {todayCount === 1 ? '1 Eintrag' : `${todayCount} Einträge`}
              {running ? ' · Timer läuft' : ''}
            </dd>
          </div>
          <div className="stat">
            <dt className="stat__label">Diese Woche</dt>
            <dd className="stat__value">{fmtDuration(weekMin)}</dd>
            <dd className="stat__note">seit {fmtDate(monday, { weekday: 'long', day: 'numeric', month: 'numeric' })}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">Meine offenen Aufgaben</dt>
            <dd className="stat__value">{myOpen.length}</dd>
            <dd className="stat__note">{dueSoon} in den nächsten 2 Tagen fällig</dd>
          </div>
          <div className={`stat${over ? ' stat--alert' : ''}`}>
            <dt className="stat__label">Projekte über Budget</dt>
            <dd className="stat__value">{over}</dd>
            <dd className="stat__note">von {active.length} aktiven Projekten</dd>
          </div>
        </dl>
      </section>

      <div className="today-grid">
        <section className="card today-card" aria-labelledby="tasks-title">
          <div className="section__head">
            <h2 id="tasks-title" className="section__title">Meine nächsten Aufgaben</h2>
            <a className="link-more" href={href('/projekte')}>Alle Projekte<ArrowRight aria-hidden="true" size={16} /></a>
          </div>
          {myOpen.length === 0 ? (
            <p className="muted">Keine offenen Aufgaben. Gut gemacht.</p>
          ) : (
            <ul className="row-list" role="list">
              {myOpen.slice(0, 5).map(t => {
                const p = projectById[t.project];
                const tone = t.days === null ? '' : t.days < 0 ? ' badge-danger' : t.days <= 1 ? ' badge-warn' : '';
                return (
                  <li key={t.id} className="row-link">
                    <div className="row-link__main">
                      <a className="row-link__title" href={href('/projekte/' + t.project)}>{t.title}</a>
                      <span className="row-link__meta">{p ? `${p.code} · ${p.name}` : 'Ohne Projekt'}</span>
                    </div>
                    <div className="row-link__side">
                      <span className={`badge${tone}`}>
                        {t.days !== null && t.days <= 1 && <Clock3 aria-hidden="true" size={14} strokeWidth={2} />}
                        {dueLabel(t.days)}
                      </span>
                      <span className="badge badge-outline">{statusLabel[t.status] || t.status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card today-card" aria-labelledby="studios-title">
          <div className="section__head">
            <h2 id="studios-title" className="section__title">Studios jetzt</h2>
            <a className="link-more" href={href('/studios')}>Alle Studios<ArrowRight aria-hidden="true" size={16} /></a>
          </div>
          <ul className="studio-mini" role="list">
            {studios.map(s => {
              const { open } = studioStatus(now, s.tz);
              return (
                <li key={s.id} className="studio-mini__row">
                  <span className="chip" style={{ background: s.color }} aria-hidden="true" />
                  <span className="studio-mini__name">{s.name}</span>
                  <span className="studio-mini__time num">{fmtTime(now, s.tz)}<span className="visually-hidden"> Uhr Ortszeit</span></span>
                  <OpenBadge open={open} />
                </li>
              );
            })}
          </ul>
          <p className="quiet studio-mini__foot">Offen heißt hier: 9–18 Uhr Ortszeit.</p>
        </section>

        <section className="card today-card today-card--wide" aria-labelledby="budget-title">
          <div className="section__head">
            <h2 id="budget-title" className="section__title">Budget-Ampel</h2>
            <p className="section__note">Gebuchte Stunden gegen Budget, aktive Projekte</p>
          </div>
          <ul className="budget-list" role="list">
            {active.map(p => {
              const Icon = budgetIcon[p.state];
              return (
                <li key={p.id} className="budget-row">
                  <div className="budget-row__name">
                    <a href={href('/projekte/' + p.id)}><span className="budget-row__code">{p.code}</span> {p.name}</a>
                  </div>
                  <div className="budget-bar" aria-hidden="true">
                    <span className={`budget-bar__fill is-${p.state}`} style={{ width: `${Math.min(p.percent, 100)}%` }} />
                  </div>
                  <p className="budget-row__nums num">
                    {hours(p.spent)} von {hours(p.budget)} · {p.percent} %
                  </p>
                  <span className={`badge badge-${p.state} budget-row__state`}>
                    <Icon aria-hidden="true" size={14} strokeWidth={2} />
                    {budgetLabel[p.state]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
