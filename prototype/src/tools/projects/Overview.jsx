// Übersicht = Projektgesundheit in Stunden: Rest als große Zahl, Balken, ein Satz zur Prognose, Hinweis nur beim
// Überschreiten einer Schwelle (Budget reicht nicht bis zur Abgabe). Darunter der Burn-up mit Textalternative, die
// Budgetänderungen (neueste zuerst, aus budgetLog), dann Team. Prognose und Rest rechnen mit dem aktuellen Budget.
import { useId, useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import { fmtDate } from '../../lib/format.js';
import { forecast, TEMPO_WEEKS } from './forecast.js';
import { budgetChanges, fmt1, fmtDelta, fmtH, fmtKw, fmtRest, personById } from './helpers.js';
import { Avatar, BudgetBar, StateIcon, StudioTag } from './parts.jsx';
import BurnUp from './BurnUp.jsx';

// Budgetänderungen: Datum, alt → neu, Differenz, Grund – ohne Änderungen ein Satz
function BudgetChanges({ project, headingId }) {
  const changes = budgetChanges(project);
  return (
    <section className="pj-changes" aria-labelledby={headingId}>
      <h2 id={headingId}>Budgetänderungen</h2>
      {changes.length ? (
        <ul className="list pj-change-list">
          {changes.map(c => (
            <li key={`${c.i}-${c.at.getTime()}`} className="row pj-change">
              <span className="pj-change-day num">{fmtDate(c.at, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <div className="row__main">
                <p className="row__title num">{fmtH(c.from)} → {fmtH(c.to)}</p>
                {c.note && <p className="row__meta">{c.note}</p>}
              </div>
              <span className="row__aside num"><span className="visually-hidden">Differenz: </span>{fmtDelta(c.to - c.from)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pj-changes-empty">Noch keine Budgetänderung erfasst.</p>
      )}
    </section>
  );
}

export default function Overview({ project: p, entries, tasks }) {
  const f = useMemo(() => forecast(p, entries), [p, entries]);
  const ids = { health: useId(), burn: useId(), changes: useId(), team: useId(), desc: useId() };
  const { info } = f;
  const year = f.today.getFullYear();
  const tempo = `≈ ${Math.round(f.tempo).toLocaleString('de-DE')} h/Woche`;
  const dueKw = f.dueKw ? fmtKw(f.dueKw, year) : null;

  let sentence;
  if (f.over) {
    sentence = `Budget überschritten um ${fmtH(-info.rest)}.`;
    if (f.tempo > 0.05 && f.due && !f.duePast) sentence += ` Bei aktuellem Tempo (${tempo}) kommen bis zur Abgabe (${dueKw}) etwa ${fmtH(Math.round(f.toDue))} dazu.`;
    else if (f.duePast) sentence += ` Die Abgabe war in ${dueKw}.`;
  } else if (!f.cross) {
    sentence = `In den letzten ${TEMPO_WEEKS} Wochen ist nichts gebucht – ohne Tempo keine Prognose.`;
  } else {
    sentence = `Bei aktuellem Tempo (${tempo}) reicht das Budget bis ${fmtKw(f.crossKw, year)}`;
    sentence += f.due ? (f.duePast ? ` – die Abgabe war ${dueKw}.` : ` – Abgabe ${dueKw}.`) : '. Kein Abgabetermin.';
  }
  const hint = f.short
    ? `Reicht voraussichtlich nicht bis zur Abgabe: Bis ${dueKw} fehlen bei diesem Tempo etwa ${fmtH(Math.max(1, Math.round(f.missing)))}.`
    : null;

  const mine = tasks.filter(t => t.project === p.id);
  const team = [...new Set([p.lead, ...mine.map(t => t.assignee)])].filter(id => personById[id]);
  const range = mon => `${fmtDate(mon, { day: '2-digit', month: '2-digit' })}–${fmtDate(new Date(mon.getTime() + 6 * 86400000), { day: '2-digit', month: '2-digit' })}`;

  return (
    <div className="pj-overview">
      <section className="pj-health" aria-labelledby={ids.health}>
        <h2 id={ids.health}>Budget</h2>
        <div className="pj-health-top">
          <p className="figure num"><span className={f.over ? 'pj-fig-over' : undefined}>{fmtRest(info.rest)}</span></p>
          <p className="meta num">
            <StateIcon state={info.state} size={16} /> {f.over ? 'über Budget' : 'Rest'} · Budget {info.label} ·{' '}
            {info.percent} % von {fmtH(p.budget)} gebucht ({fmtH(info.spent)})
          </p>
        </div>
        <BudgetBar info={info} spent={info.spent} budget={p.budget} className="is-l" />
        <p className="pj-forecast" id={ids.desc}>{sentence}</p>
        {hint && <p className="pj-callout"><TriangleAlert size={18} aria-hidden="true" /> {hint}</p>}
        <p className="quiet">Tempo = Ø der letzten {TEMPO_WEEKS} abgeschlossenen Wochen. Alle gebuchten Stunden zählen.</p>
      </section>

      <section className="pj-burnup" aria-labelledby={ids.burn}>
        <div className="pj-sec-head">
          <h2 id={ids.burn}>Burn-up</h2>
          <p className="quiet">Verlauf aus Beispieldaten, Buchungen der Zeiterfassung eingerechnet</p>
        </div>
        <figure className="pj-burn-fig" aria-describedby={ids.desc}>
          <BurnUp f={f} />
          <figcaption className="pj-burn-legend">
            <span><span className="pj-key is-line" aria-hidden="true" /> Gebucht, kumuliert</span>
            <span><span className="pj-key is-prog" aria-hidden="true" /> Prognose</span>
            <span><span className="pj-key is-budget" aria-hidden="true" /> Budget</span>
          </figcaption>
          {/* Hülle statt Tabelle verstecken: Tabellen ignorieren width: 1px und verbreiterten sonst die Seite am Handy */}
          <div className="visually-hidden">
            <table>
              <caption>Gebuchte Stunden und Budget je Woche (Verlauf aus Beispieldaten)</caption>
              <thead><tr><th scope="col">Woche</th><th scope="col">Gebucht</th><th scope="col">Kumuliert</th><th scope="col">Budget</th></tr></thead>
              <tbody>
                {f.weeks.map((w, i) => (
                  <tr key={i}>
                    <th scope="row">{fmtKw(w.kw, year)} ({range(w.monday)}){i === f.n ? ', bis heute' : ''}</th>
                    <td>{fmt1(w.hours)} h</td>
                    <td>{i === f.n ? fmt1(info.spent) : fmt1(w.cum)} h</td>
                    <td>{fmtH(w.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      </section>

      <BudgetChanges project={p} headingId={ids.changes} />

      <section className="pj-team" aria-labelledby={ids.team}>
        <h2 id={ids.team}>Team</h2>
        <ul className="list">
          {team.map(id => {
            const m = personById[id];
            return (
              <li key={id} className="row pj-member">
                <Avatar person={m} />
                <div className="row__main">
                  <p className="row__title">{m.name}{id === p.lead && <span className="pj-lead-tag"> · Lead</span>}</p>
                  <p className="row__meta">{m.role} · <StudioTag id={m.studio} /></p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
