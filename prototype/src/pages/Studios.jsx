import PageHeader from '../components/PageHeader.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import StudioTimeline, { fmtRange } from '../components/StudioTimeline.jsx';
import { href } from '../lib/router.js';
import { fmtDate, fmtTime } from '../lib/format.js';
import {
  CLOSE_HOUR, HOME_TZ, OPEN_HOUR, commonWindows, dayShift, diffToHome, fmtOffset, studioStatus, useNow, weekdayIn, workWindowInHome,
} from '../lib/time.js';
import { people, projects, studios } from '../data/sample.js';
import '../styles/pages.css';

const zoneCount = new Set(studios.map(s => s.tz)).size;
const dayWord = { '-1': 'gestern', 0: 'heute', 1: 'morgen' };
// Annahme der Demo – steht so in der Oberfläche
const HOURS = `Mo–Fr ${OPEN_HOUR}–${CLOSE_HOUR} Uhr Ortszeit`;
const OPEN_AT = `${String(OPEN_HOUR).padStart(2, '0')}:00 Uhr Ortszeit`;
const listDe = names => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`);

// Gemeinsames Fenster in Ortszeit einer Zeitzone (Frankfurter Minuten + Differenz), über Mitternacht normalisiert
const shift = ([a, b], diff) => {
  const start = (((a + diff) % 1440) + 1440) % 1440;
  const end = start + (b - a);
  return [start, end > 1440 ? end - 1440 : end];
};

// Wann öffnet das Studio als Nächstes? Freitag nach Feierabend und am Wochenende erst Montag.
function openingNote(now, tz, { open, workday, minutes }) {
  if (open) return `Offen bis ${CLOSE_HOUR}:00 Uhr Ortszeit`;
  if (workday && minutes < OPEN_HOUR * 60) return `Öffnet um ${OPEN_AT}`;
  const wd = weekdayIn(now, tz); // 0 So … 6 Sa
  return `Öffnet ${wd === 5 || wd === 6 || wd === 0 ? 'Montag' : 'morgen'} um ${OPEN_AT}`;
}

export default function Studios() {
  const now = useNow(15000);
  const windows = studios.map(s => workWindowInHome(now, s.tz));
  const common = commonWindows(windows);
  // Studios ohne Arbeitszeit am Frankfurter Kalendertag (Wochenende in Ortszeit)
  const resting = studios.filter((s, i) => windows[i].length === 0).map(s => s.name);

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
        <p>Ortszeiten, wer wo arbeitet und wann alle gleichzeitig erreichbar sind.</p>
        <p>Angenommen: {HOURS}, Feiertage nicht berücksichtigt.</p>
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
              Das ist {zones.map(z => `${common.map(seg => fmtRange(shift(seg, z.diff))).join(' und ')} Uhr in ${listDe(z.names)}`).join(', ')}.
            </p>
          </div>
        ) : (
          <div className="overlap__summary">
            <p className="overlap__none">Heute gibt es keine Zeit, in der alle Studios arbeiten.</p>
            <p className="overlap__local">
              {resting.length
                ? `Wochenende in ${listDe(resting)}. Ein gemeinsamer Termin geht erst wieder an einem Werktag.`
                : 'Die Arbeitszeiten überschneiden sich heute nicht.'}
            </p>
          </div>
        )}
        <StudioTimeline studios={studios} now={now} />
        <p className="quiet overlap__legend">
          Farbige Balken: Arbeitszeit {HOURS}, umgerechnet. Violette Fläche: alle arbeiten. Senkrechte Linie: jetzt.
        </p>
      </section>

      <section className="studios" aria-labelledby="studios-list-title">
        <h2 id="studios-list-title" className="section__title studios__title">Standorte</h2>
        <ul className="studio-grid" role="list">
          {studios.map((s, i) => {
            const status = studioStatus(now, s.tz);
            const diff = diffToHome(now, s.tz);
            const shiftDays = dayShift(now, s.tz);
            const team = people.filter(p => p.studio === s.id);
            const active = projects.filter(p => p.studio === s.id && p.status === 'aktiv');
            const wins = windows[i];
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
                  <OpenBadge open={status.open} workday={status.workday} />
                </div>
                <p className="studio-card__meta">
                  {fmtDate(now, { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: s.tz })}
                  {shiftDays !== 0 && ` (${dayWord[shiftDays] ?? ''})`}
                  {' · '}
                  {s.tz === HOME_TZ ? 'Bezugszeit' : `${fmtOffset(diff)} zu Frankfurt`}
                </p>
                <p className="studio-card__hours">
                  {openingNote(now, s.tz, status)}
                  {s.tz !== HOME_TZ && (
                    <>
                      <br />
                      {wins.length
                        ? <>In Frankfurter Zeit heute: <span className="nowrap">{wins.map(fmtRange).join(' und ')} Uhr</span></>
                        : 'In Frankfurter Zeit heute: keine Arbeitszeit'}
                    </>
                  )}
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
