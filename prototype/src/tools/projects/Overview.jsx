// Übersicht = Projektgesundheit in Stunden: Rest als große Zahl, Balken, darunter der Prognose-Block: ein Satz, bei
// Warnung (überzogen oder reicht nicht bis zur Abgabe) mit Kontur und Symbol. Stammt die Prognose aus dem erfundenen
// Verlauf der Beispielprojekte, steht sichtbar „Beispielrechnung“ davor (r07-Korrektur, red-team #2); im Prototyp
// angelegte Projekte rechnen nur mit echten Buchungen und zeigen unter zwei Wochen keine Prognose.
// Darunter der Burn-up mit Textalternative, die Budgetänderungen (neueste zuerst, aus budgetLog), dann Team.
// Alle Stunden mit fmtH1 (lib/format.js), Rest aus restHours (über budgetInfo).
import { useId, useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import { fmtDate, fmtH1 } from '../../lib/format.js';
import { forecast, MIN_FORECAST_WEEKS, TEMPO_WEEKS } from './forecast.js';
import { budgetChanges, fmt1, fmtDelta, fmtKw, fmtRest, personById } from './helpers.js';
import { Avatar, BudgetBar, StateIcon, StudioTag } from './parts.jsx';
import BurnUp from './BurnUp.jsx';

const TOO_FEW = 'Noch zu wenig Buchungen für eine Prognose.';

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
                <p className="row__title num">{fmtH1(c.from)} → {fmtH1(c.to)}</p>
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
  const ids = { health: useId(), burn: useId(), changes: useId(), team: useId(), desc: useId(), tag: useId() };
  const { info } = f;
  const year = f.today.getFullYear();
  const tempo = `≈ ${Math.round(f.tempo).toLocaleString('de-DE')} h/Woche`;
  const dueKw = f.dueKw ? fmtKw(f.dueKw, year) : null;

  let sentence;
  if (f.over) {
    sentence = `Budget überschritten um ${fmtH1(-info.rest)}.`;
    if (!f.enough) sentence += ` ${TOO_FEW}`;
    else if (f.tempo > 0.05 && f.due && !f.duePast) sentence += ` Bei aktuellem Tempo (${tempo}) kommen bis zur Abgabe (${dueKw}) etwa ${fmtH1(Math.round(f.toDue))} dazu.`;
    else if (f.duePast) sentence += ` Die Abgabe war in ${dueKw}.`;
  } else if (!f.enough) {
    sentence = TOO_FEW;
  } else if (!f.cross) {
    sentence = `In den letzten ${TEMPO_WEEKS} Wochen ist nichts gebucht – ohne Tempo keine Prognose.`;
  } else {
    sentence = `Bei aktuellem Tempo (${tempo}) reicht das Budget bis ${fmtKw(f.crossKw, year)}`;
    sentence += f.due ? (f.duePast ? ` – die Abgabe war ${dueKw}.` : ` – Abgabe ${dueKw}.`) : '. Kein Abgabetermin.';
  }
  const hint = f.short
    ? `Reicht voraussichtlich nicht bis zur Abgabe: Bis ${dueKw} fehlen bei diesem Tempo etwa ${fmtH1(Math.max(1, Math.round(f.missing)))}.`
    : null;
  const warn = f.over || f.short;
  const fine = f.sample
    ? `Tempo = Ø der letzten ${TEMPO_WEEKS} abgeschlossenen Wochen. Gebucht = Stand aus den Beispieldaten + Zeiterfassung.`
    : f.enough
      ? `Tempo = Ø der letzten ${TEMPO_WEEKS} abgeschlossenen Wochen. Gebucht = Zeiterfassung.`
      : `Gebucht = Zeiterfassung. Eine Prognose gibt es ab ${MIN_FORECAST_WEEKS} abgeschlossenen Wochen mit Buchungen.`;
  const describedBy = f.sample ? `${ids.tag} ${ids.desc}` : ids.desc;

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
            {info.percent} % von {fmtH1(p.budget)} gebucht ({fmtH1(info.spent)})
          </p>
        </div>
        <BudgetBar info={info} spent={info.spent} budget={p.budget} className="is-l" />
        <div className={`pj-forecast-block${warn ? ' is-warn' : ''}`} data-warn={warn ? (f.over ? 'over' : 'short') : undefined}>
          {f.sample && <p className="pj-sample-tag" id={ids.tag}>Beispielrechnung</p>}
          <p className="pj-forecast" id={ids.desc}>
            {f.over && <TriangleAlert size={18} aria-hidden="true" />}
            {sentence}
          </p>
          {hint && <p className="pj-callout"><TriangleAlert size={18} aria-hidden="true" /> {hint}</p>}
        </div>
        <p className="quiet">{fine}</p>
      </section>

      <section className="pj-burnup" aria-labelledby={ids.burn}>
        <div className="pj-sec-head">
          <h2 id={ids.burn}>Burn-up</h2>
          {f.enough && (
            <p className="quiet">{f.sample ? 'Verlauf aus Beispieldaten, Buchungen der Zeiterfassung eingerechnet' : 'Verlauf aus der Zeiterfassung'}</p>
          )}
        </div>
        {f.enough ? (
          <figure className="pj-burn-fig" aria-describedby={describedBy}>
            <BurnUp f={f} />
            <figcaption className="pj-burn-legend">
              <span><span className="pj-key is-line" aria-hidden="true" /> Gebucht, kumuliert</span>
              <span><span className="pj-key is-prog" aria-hidden="true" /> Prognose</span>
              <span><span className="pj-key is-budget" aria-hidden="true" /> Budget</span>
            </figcaption>
            {/* Hülle statt Tabelle verstecken: Tabellen ignorieren width: 1px und verbreiterten sonst die Seite am Handy */}
            <div className="visually-hidden">
              <table>
                <caption>Gebuchte Stunden und Budget je Woche ({f.sample ? 'Verlauf aus Beispieldaten' : 'aus der Zeiterfassung'})</caption>
                <thead><tr><th scope="col">Woche</th><th scope="col">Gebucht</th><th scope="col">Kumuliert</th><th scope="col">Budget</th></tr></thead>
                <tbody>
                  {f.weeks.map((w, i) => (
                    <tr key={i}>
                      <th scope="row">{fmtKw(w.kw, year)} ({range(w.monday)}){i === f.n ? ', bis heute' : ''}</th>
                      <td>{fmt1(w.hours)} h</td>
                      <td>{i === f.n ? fmt1(info.spent) : fmt1(w.cum)} h</td>
                      <td>{fmtH1(w.budget)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </figure>
        ) : (
          <p className="pj-changes-empty">Noch kein Verlauf – er erscheint nach {MIN_FORECAST_WEEKS} abgeschlossenen Wochen mit Buchungen.</p>
        )}
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
