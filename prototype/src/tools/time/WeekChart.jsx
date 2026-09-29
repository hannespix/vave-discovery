// Wochenblick: SVG-Balken Mo–So (Textalternative als Tabelle) und Summen je Projekt.
import { fmtDuration } from '../../lib/format.js';
import { Swatch, projectInfo } from './ProjectSelect.jsx';
import { sumMinutes, toInputDuration } from './timeUtils.js';

const HEIGHT = 196;
const TOP = 26;      // Platz für die Werte über den Balken
const BOTTOM = 46;   // Platz für Wochentag und Datum
const PLOT = HEIGHT - TOP - BOTTOM;
const SLOT = 100 / 7; // Prozent der Breite je Tag
const BAR = 8.5;      // Balkenbreite in Prozent

export default function WeekChart({ days, entries, weekNo }) {
  const perDay = days.map(d => ({ ...d, minutes: sumMinutes(entries.filter(e => e.date === d.iso)) }));
  const scale = Math.max(8 * 60, ...perDay.map(d => d.minutes));
  const total = sumMinutes(entries);
  const byProject = new Map();
  entries.forEach(e => byProject.set(e.project, (byProject.get(e.project) || 0) + e.minutes));
  const projectRows = [...byProject]
    .map(([id, minutes]) => ({ info: projectInfo(id), minutes, share: total ? Math.round((minutes / total) * 100) : 0 }))
    .sort((a, b) => b.minutes - a.minutes);
  const base = TOP + PLOT;

  return (
    <section className="card tt-card" aria-labelledby="tt-week-title">
      <div className="tt-card-head">
        <h2 id="tt-week-title">Wochenblick</h2>
        <p className="tt-card-meta">KW {weekNo} · {days[0].dm}–{days[6].dm}</p>
      </div>

      <svg className="tt-chart" width="100%" height={HEIGHT} aria-hidden="true" focusable="false">
        <line className="tt-axis" x1="0" x2="100%" y1={base} y2={base} />
        {perDay.map((d, i) => {
          const cx = (i + 0.5) * SLOT;
          const h = d.minutes ? Math.max(4, (d.minutes / scale) * PLOT) : 0;
          return (
            <g key={d.iso}>
              {h > 0 && (
                <rect
                  className={`tt-bar${d.isToday ? ' is-today' : ''}`}
                  x={`${cx - BAR / 2}%`} y={base - h} width={`${BAR}%`} height={h} rx="5"
                />
              )}
              {h > 0 && (
                <text className="tt-chart-value" x={`${cx}%`} y={base - h - 8} textAnchor="middle">
                  {toInputDuration(d.minutes)}
                </text>
              )}
              <text className={`tt-chart-day${d.isToday ? ' is-today' : ''}${d.isFuture ? ' is-future' : ''}`} x={`${cx}%`} y={base + 20} textAnchor="middle">
                {d.short}
              </text>
              <text className={`tt-chart-date${d.isToday ? ' is-today' : ''}`} x={`${cx}%`} y={base + 38} textAnchor="middle">
                {d.date.getDate()}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="visually-hidden">
        <caption>Erfasste Zeit je Wochentag, KW {weekNo}</caption>
        <thead>
          <tr><th scope="col">Tag</th><th scope="col">Dauer</th></tr>
        </thead>
        <tbody>
          {perDay.map(d => (
            <tr key={d.iso}>
              <th scope="row">{d.long}, {d.dm}{d.isToday ? ' (heute)' : ''}</th>
              <td>{fmtDuration(d.minutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="tt-sub">Nach Projekt</h3>
      {projectRows.length ? (
        <ul className="tt-projects" role="list">
          {projectRows.map(({ info, minutes, share }) => (
            <li key={info.id} className="tt-project">
              <Swatch color={info.color} />
              <span className="tt-project-name"><strong>{info.code}</strong> {info.name}</span>
              <span className="tt-project-value num">
                {fmtDuration(minutes)} <span className="tt-project-share">· {share} %</span>
              </span>
              <span className="tt-project-bar" aria-hidden="true"><span style={{ width: `${share}%` }} /></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tt-empty">Diese Woche noch keine Zeiten.</p>
      )}
    </section>
  );
}
