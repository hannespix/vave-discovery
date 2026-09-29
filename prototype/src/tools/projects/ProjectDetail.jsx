// Projektdetail: Kopf mit Kennzahlen, Budget als SVG mit Klartext, Team, Aufgaben-Board.
import { useId } from 'react';
import { ArrowLeft } from 'lucide-react';
import { projects, projectStatusLabel, tasks as seedTasks } from '../../data/sample.js';
import { useStoredState } from '../../lib/store.js';
import { href } from '../../lib/router.js';
import { budgetIcon, budgetInfo, clientById, daysUntil, fmtDay, fmtH, personById, relDays } from './helpers.js';
import { Avatar, StudioTag } from './parts.jsx';
import TaskBoard from './TaskBoard.jsx';

function BackLink() {
  return (
    <a className="btn btn-ghost pj-back" href={href('/projekte')}>
      <ArrowLeft size={20} aria-hidden="true" /> Alle Projekte
    </a>
  );
}

// Balken: Budget = volle Spur, Gebuchtes darüber; Markierungen bei 80 % (knapp) und 100 % (Budget).
// Das SVG ist Zierde – dieselbe Aussage steht darunter als Klartext.
function BudgetChart({ spent, budget }) {
  const b = budgetInfo(spent, budget);
  const Icon = budgetIcon[b.state];
  const max = Math.max(spent, budget) || 1;
  const x = v => (v / max) * 100;
  const sentence = b.rest < 0
    ? `Überzogen um ${fmtH(-b.rest)}.`
    : `${b.state === 'warn' ? 'Knapp' : 'Im Rahmen'}: noch ${fmtH(b.rest)} frei.`;
  return (
    <figure className={`pj-chart is-${b.state}`}>
      <p className="pj-chart-state">
        <Icon size={22} aria-hidden="true" />
        <span>Budget {b.label}</span>
        <strong className="num">{b.percent} %</strong>
      </p>
      <div>
        <svg className="pj-chart-svg" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect className="pj-chart-track" x="0" y="6" width={x(budget)} height="20" />
          <rect className="pj-chart-fill" x="0" y="6" width={x(Math.min(spent, budget))} height="20" />
          {spent > budget && <rect className="pj-chart-over" x={x(budget)} y="6" width={x(spent - budget)} height="20" />}
          <line className="pj-chart-mark" x1={x(budget * 0.8)} x2={x(budget * 0.8)} y1="1" y2="31" />
          <line className="pj-chart-mark is-budget" x1={x(budget)} x2={x(budget)} y1="0" y2="32" />
        </svg>
        <div className="pj-chart-scale" aria-hidden="true">
          <span style={{ left: `${x(budget * 0.8)}%` }}>80 %</span>
          <span style={{ left: `${x(budget)}%` }}>100 %</span>
        </div>
      </div>
      <figcaption className="pj-chart-text">
        <span className="num">{b.percent} % des Budgets gebucht: {fmtH(spent)} von {fmtH(budget)}. {sentence}</span>
        <span className="quiet"> Ampel: unter 80 % im Rahmen, 80 bis 100 % knapp, darüber überzogen.</span>
      </figcaption>
    </figure>
  );
}

export default function ProjectDetail({ id }) {
  const [tasks, setTasks] = useStoredState('tasks', seedTasks);
  const ids = { budget: useId(), team: useId(), tasks: useId() };
  const p = projects.find(x => x.id === id);

  if (!p) {
    return (
      <section className="pj-page" aria-labelledby="pj-title">
        <BackLink />
        <header className="pj-head">
          <p className="eyebrow">Projekte</p>
          <h1 id="pj-title" tabIndex={-1}>Nicht gefunden</h1>
        </header>
        <p className="muted">Zu dieser Adresse gibt es kein Projekt. Die Übersicht zeigt alle Projekte.</p>
      </section>
    );
  }

  const b = budgetInfo(p.spent, p.budget);
  const StateIcon = budgetIcon[b.state];
  const mine = tasks.filter(t => t.project === p.id);
  const open = mine.filter(t => t.status !== 'done');
  const overdue = open.filter(t => t.due && daysUntil(t.due) < 0).length;
  const memberIds = [...new Set([p.lead, ...mine.map(t => t.assignee)])].filter(pid => personById[pid]);

  return (
    <article className="pj-page pj-detail" aria-labelledby="pj-title">
      <BackLink />
      <header className="pj-head">
        <p className="eyebrow">Projekte · <span className="num">{p.code}</span></p>
        <h1 id="pj-title" className="pj-detail-title" tabIndex={-1}>{p.name}</h1>
        <p className="pj-sub">
          <span>{clientById[p.client]?.name}</span>
          <StudioTag id={p.studio} />
          <span className="badge">{projectStatusLabel[p.status]}</span>
        </p>
      </header>

      <dl className="pj-kpis">
        <div className="pj-kpi"><dt>Budget</dt><dd className="num">{fmtH(p.budget)}</dd></div>
        <div className="pj-kpi"><dt>Gebucht</dt><dd className="num">{fmtH(p.spent)}<span className="pj-kpi-sub">{b.percent} % vom Budget</span></dd></div>
        <div className={`pj-kpi is-${b.state}`}>
          <dt>Rest</dt>
          <dd className="num">{b.rest < 0 ? '−' : ''}{fmtH(Math.abs(b.rest))}
            <span className="pj-kpi-sub"><StateIcon size={16} aria-hidden="true" /> {b.rest < 0 ? 'über Budget' : b.label}</span>
          </dd>
        </div>
        <div className="pj-kpi">
          <dt>Fällig</dt>
          <dd className="num">{p.due ? fmtDay(p.due) : 'ohne Termin'}{p.due && <span className="pj-kpi-sub">{relDays(daysUntil(p.due))}</span>}</dd>
        </div>
        <div className="pj-kpi pj-kpi-wide"><dt>Phase</dt><dd>{p.phase}</dd></div>
      </dl>

      <div className="pj-detail-grid">
        <section className="card pj-panel" aria-labelledby={ids.budget}>
          <h2 id={ids.budget} className="pj-h2">Budget</h2>
          <BudgetChart spent={p.spent} budget={p.budget} />
        </section>
        <section className="card pj-panel" aria-labelledby={ids.team}>
          <h2 id={ids.team} className="pj-h2">Team</h2>
          <ul className="pj-team">
            {memberIds.map(pid => {
              const m = personById[pid];
              return (
                <li key={pid} className="pj-member">
                  <Avatar person={m} />
                  <div className="pj-member-text">
                    <p className="pj-member-name">
                      {m.name}{pid === p.lead && <span className="badge badge-lime">Leitung</span>}
                    </p>
                    <p className="quiet">{m.role} · <StudioTag id={m.studio} /></p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="pj-tasks" aria-labelledby={ids.tasks}>
        <div className="pj-tasks-head">
          <h2 id={ids.tasks} className="pj-h2" tabIndex={-1}>Aufgaben</h2>
          <p className="quiet num">
            {open.length} offen von {mine.length}
            {overdue > 0 && <> · <span className="pj-overdue-sum">{overdue} überfällig</span></>}
          </p>
        </div>
        <TaskBoard project={p} tasks={tasks} setTasks={setTasks} headingId={ids.tasks} />
      </section>
    </article>
  );
}
