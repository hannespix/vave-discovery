import { ArrowRight, CircleAlert, CircleCheck, Clock3, Timer, TriangleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import { useStoredState } from '../lib/store.js';
import { href } from '../lib/router.js';
import { cleanEntries, cleanTasks, validTimer } from '../lib/data.js';
import { spentHours } from '../lib/budget.js';
import { budgetLabel, budgetState, fmtClock, fmtDate, fmtDuration, fmtTime, isoDay, pct, weekStart } from '../lib/format.js';
import { CLOSE_HOUR, OPEN_HOUR, daysFromToday, dueLabel, greeting, studioStatus, useNow } from '../lib/time.js';
import { byId, me, projects, statusLabel, studios, tasks as sampleTasks, timeEntries as sampleEntries } from '../data/sample.js';
import '../styles/pages.css';

const projectById = byId(projects);
// Nur echte Projekte – gespeicherte Werte wie „__proto__“ ergeben kein Projekt
const projectOf = id => (typeof id === 'string' && Object.hasOwn(projectById, id) ? projectById[id] : null);
const firstName = me.name.split(' ')[0];
const sum = list => list.reduce((a, e) => a + (Number(e.minutes) || 0), 0);
const budgetIcon = { ok: CircleCheck, warn: TriangleAlert, danger: CircleAlert };

// Stunden für die Anzeige, gerundet in Richtung der Ampel (wie pct): unter Budget ab-, darüber aufrunden –
// so steht nie „640 h von 640 h“ neben „knapp“.
const shownHours = (h, budget) => {
  const tenths = h > budget ? Math.ceil(h * 10 - 1e-9) : Math.floor(h * 10 + 1e-9);
  return `${(tenths / 10).toLocaleString('de-DE')} h`;
};
// Fälligkeit: überfällig = Koralle, heute/morgen = schwarze Kontur, sonst reiner Text
const dueTone = days => (days === null ? null : days < 0 ? 'danger' : days <= 1 ? 'warn' : null);

// Startseite: liest die Speicher-Schlüssel der Werkzeuge (Beispieldaten als Startwert), geprüft über lib/data.js
export default function Today() {
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const [storedTimer] = useStoredState('timer', null);
  const [tasks] = useStoredState('tasks', sampleTasks, cleanTasks);
  const timer = validTimer(storedTimer);
  const running = timer !== null;
  const now = useNow(running ? 1000 : 30000);

  const mine = entries.filter(e => !e.person || e.person === me.id);
  const todayIso = isoDay(now);
  const monday = weekStart(now);
  const mondayIso = isoDay(monday);

  const todayMin = sum(mine.filter(e => e.date === todayIso));
  const todayCount = mine.filter(e => e.date === todayIso).length;
  const weekMin = sum(mine.filter(e => e.date >= mondayIso && e.date <= todayIso));
  const elapsedSec = running ? Math.max(0, Math.floor((now - Date.parse(timer.startedAt)) / 1000)) : 0;

  const myOpen = tasks
    .filter(t => t.assignee === me.id && t.status !== 'done')
    .map(t => {
      const d = daysFromToday(t.due, now);
      return { ...t, days: Number.isFinite(d) ? d : null };
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));
  const dueSoon = myOpen.filter(t => t.days !== null && t.days <= 2).length;

  // Budgets aus Stand + allen Buchungen (auch aus „Zeiten“), Ampel auf ungerundeten Stunden
  const active = projects
    .filter(p => p.status === 'aktiv')
    .map(p => {
      const spent = spentHours(p, entries);
      return { ...p, spent, ratio: p.budget > 0 ? spent / p.budget : Infinity, percent: pct(spent, p.budget), state: budgetState(spent, p.budget) };
    })
    .sort((a, b) => b.ratio - a.ratio);
  const over = active.filter(p => p.state === 'danger').length;

  const timerProject = running ? projectOf(timer.project) : null;
  const timerNote = running && typeof timer.note === 'string' ? timer.note.trim() : '';

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
              {timerNote ? ` – ${timerNote}` : ''}
            </p>
          </div>
          <p className="timer-banner__clock num"><span className="visually-hidden">Laufzeit </span>{fmtClock(elapsedSec)}</p>
          <a className="btn" href={href('/zeit')}>Zur Zeiterfassung</a>
        </section>
      )}

      <section aria-labelledby="kpi-title" className="today-block">
        <h2 id="kpi-title" className="visually-hidden">Kennzahlen</h2>
        <dl className="stats">
          <div className="stat">
            <dt className="stat__label">Heute gebucht</dt>
            <dd className="stat__value"><span className="stat__mark">{fmtDuration(todayMin)}</span></dd>
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
          <div className="stat">
            <dt className="stat__label">Projekte über Budget</dt>
            <dd className="stat__value">{over ? <span className="stat__mark stat__mark--alert">{over}</span> : over}</dd>
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
                const p = projectOf(t.project);
                const tone = dueTone(t.days);
                return (
                  <li key={t.id} className="row-link">
                    <div className="row-link__main">
                      {/* Öffnet das Projekt und fokussiert die Aufgabe (Route von K1) */}
                      <a className="row-link__title" href={href(p ? `/projekte/${p.id}/${t.id}` : '/projekte')}>{t.title}</a>
                      <span className="row-link__meta">
                        {statusLabel[t.status] || t.status} · {p ? `${p.code} ${p.name}` : 'Ohne Projekt'}
                      </span>
                    </div>
                    <div className="row-link__side">
                      {tone ? (
                        <span className={`badge badge-${tone}`}><Clock3 aria-hidden="true" size={14} strokeWidth={2} />{dueLabel(t.days)}</span>
                      ) : (
                        <span className="row-link__due">{dueLabel(t.days)}</span>
                      )}
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
              const { open, workday } = studioStatus(now, s.tz);
              return (
                <li key={s.id} className="studio-mini__row">
                  <span className="studio-mini__name">{s.name}</span>
                  <span className="studio-mini__time num">{fmtTime(now, s.tz)}<span className="visually-hidden"> Uhr Ortszeit</span></span>
                  <OpenBadge open={open} workday={workday} />
                </li>
              );
            })}
          </ul>
          <p className="quiet studio-mini__foot">
            Offen heißt hier: Mo–Fr {OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit, Feiertage nicht berücksichtigt.
          </p>
        </section>

        <section className="card today-card today-card--wide" aria-labelledby="budget-title">
          <div className="section__head">
            <h2 id="budget-title" className="section__title">Budgets</h2>
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
                    {shownHours(p.spent, p.budget)} von {p.budget.toLocaleString('de-DE')} h · {p.percent} %
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
