import PageHeader from '../components/PageHeader.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import StudioTimeline, { fmtRange } from '../components/StudioTimeline.jsx';
import { href } from '../lib/router.js';
import { fmtDate, fmtTime } from '../lib/format.js';
import {
  CLOSE_HOUR, HOME_TZ, OPEN_HOUR, commonWindows, dayShift, diffToHome, fmtOffset, studioStatus, useNow, workWindowInHome,
} from '../lib/time.js';
import { people, projects, studios } from '../data/sample.js';
import '../styles/pages.css';

const zoneCount = new Set(studios.map(s => s.tz)).size;
const dayWord = { '-1': 'gestern', 0: 'heute', 1: 'morgen' };

// Gemeinsames Fenster in Ortszeit einer Zeitzone (Frankfurter Minuten + Differenz), über Mitternacht normalisiert
const shift = ([a, b], diff) => {
  const start = (((a + diff) % 1440) + 1440) % 1440;
  const end = start + (b - a);
  return [start, end > 1440 ? end - 1440 : end];
};

export default function Studios() {
  const now = useNow(15000);
  const common = commonWindows(studios.map(s => workWindowInHome(now, s.tz)));

  // Gleiche Zeitzonen zusammenfassen (Shanghai und Shenzhen)
  const zones = [];
  for (const s of studios) {
    if (s.tz === HOME_TZ) continue;
    const z = zones.find(q => q.tz === s.tz);
    if (z) z.names.push(s.name); else zones.push({ tz: s.tz, names: [s.name], diff: diffToHome(now, s.tz) });
  }

  return (
    <>
      <PageHeader eyebrow={`${studios.length} Studios · ${zoneCount} Zeitzonen`} title="Studios">
        <p>Ortszeiten, wer wo arbeitet und wann alle gleichzeitig erreichbar sind. Angenommen ist überall {OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit.</p>
      </PageHeader>

      <section className="card overlap" aria-labelledby="overlap-title">
        <div className="section__head">
          <h2 id="overlap-title" className="section__title">Gemeinsame Zeit für Calls</h2>
          <p className="section__note">Zeitleiste in Frankfurter Zeit</p>
        </div>
        {common.length ? (
          <div className="overlap__summary">
            <p className="overlap__window">
              <span className="overlap__swatch" aria-hidden="true" />
              <span><strong className="num nowrap">{common.map(fmtRange).join(' und ')} Uhr</strong> in Frankfurt</span>
            </p>
            <p className="overlap__local">
              Das ist {zones.map(z => `${common.map(seg => fmtRange(shift(seg, z.diff))).join(' und ')} Uhr in ${z.names.join(' und ')}`).join(', ')}.
            </p>
          </div>
        ) : (
          <p className="overlap__summary">Heute gibt es kein Zeitfenster, in dem alle Studios gleichzeitig arbeiten.</p>
        )}
        <StudioTimeline studios={studios} now={now} />
        <p className="quiet overlap__legend">
          Farbige Balken: Arbeitszeit {OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit, umgerechnet. Violette Fläche: alle arbeiten. Senkrechte Linie: jetzt.
        </p>
      </section>

      <section className="studios" aria-labelledby="studios-list-title">
        <h2 id="studios-list-title" className="section__title studios__title">Standorte</h2>
        <ul className="studio-grid" role="list">
          {studios.map(s => {
            const { open } = studioStatus(now, s.tz);
            const diff = diffToHome(now, s.tz);
            const shiftDays = dayShift(now, s.tz);
            const team = people.filter(p => p.studio === s.id);
            const active = projects.filter(p => p.studio === s.id && p.status === 'aktiv');
            const wins = workWindowInHome(now, s.tz);
            return (
              <li key={s.id} className="card studio-card">
                <div className="studio-card__head">
                  <span className="chip chip--lg" style={{ background: s.color }} aria-hidden="true" />
                  <h3 id={`studio-${s.id}`} className="studio-card__name">{s.name}</h3>
                </div>
                <div className="studio-card__now">
                  <p className="studio-card__clock num">
                    {fmtTime(now, s.tz)}<span className="visually-hidden"> Uhr Ortszeit</span>
                  </p>
                  <OpenBadge open={open} />
                </div>
                <p className="studio-card__meta">
                  {fmtDate(now, { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: s.tz })}
                  {shiftDays !== 0 && ` (${dayWord[shiftDays] ?? ''})`}
                  {' · '}
                  {s.tz === HOME_TZ ? 'Bezugszeit' : `${fmtOffset(diff)} zu Frankfurt`}
                </p>
                <p className="studio-card__hours">
                  {open ? `Offen bis ${CLOSE_HOUR}:00 Uhr Ortszeit` : `Öffnet um ${String(OPEN_HOUR).padStart(2, '0')}:00 Uhr Ortszeit`}
                  {s.tz !== HOME_TZ && <><br />In Frankfurter Zeit: <span className="nowrap">{wins.map(fmtRange).join(' und ')} Uhr</span></>}
                </p>

                <h4 className="studio-card__sub">Team ({team.length})</h4>
                <ul className="studio-card__team" role="list">
                  {team.map(p => (
                    <li key={p.id}><span className="studio-card__person">{p.name}</span> <span className="quiet">{p.role}</span></li>
                  ))}
                </ul>

                <h4 className="studio-card__sub">Aktive Projekte ({active.length})</h4>
                {active.length ? (
                  <ul className="studio-card__projects" role="list">
                    {active.map(p => (
                      <li key={p.id}>
                        <a href={href('/projekte/' + p.id)}><span className="budget-row__code">{p.code}</span><span>{p.name}</span></a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="quiet">Zurzeit kein aktives Projekt.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
