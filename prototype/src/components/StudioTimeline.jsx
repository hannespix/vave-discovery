import { ChevronRight } from 'lucide-react';
import OpenBadge, { statusText } from './OpenBadge.jsx';
import { fmtTime } from '../lib/format.js';
import {
  CLOSE_HOUR, HOME_TZ, OPEN_HOUR, commonWindows, dayShift, diffToHome, fmtHM, fmtOffset, minutesOfDay, studioStatus, workWindowInHome,
} from '../lib/time.js';

// Eine Zeile je Studio auf gemeinsamer 24-h-Skala (Frankfurter Zeit): Stadt mit Punkt in der Studiofarbe, Ortszeit groß,
// Versatz grau, Status, Arbeitsfenster als neutraler Balken (grau, schwarze Kontur), gemeinsames Fenster als Band in
// Limette (Zustand „alle arbeiten“), Linie „jetzt“. Farbrollen r07: die Studiofarbe steht nur im Punkt.
// Reines HTML/CSS in Prozent – keine Messung, keine Bewegung beim Öffnen. Die Skala ist aria-hidden; dieselben Angaben
// stehen je Zeile als Text und darunter als Tabelle.
const DAY = 1440;
const pad = n => String(n).padStart(2, '0');
const range = ([a, b]) => `${fmtHM(a)}–${fmtHM(b)}`;
const shortRange = ([a, b]) => (a % 60 || b % 60 ? range([a, b]) : `${pad(a / 60)}–${pad(b / 60)}`);
const at = m => `${(m / DAY) * 100}%`;
const TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const dayWord = { '-1': 'gestern', 1: 'morgen' };

const dayNote = r => (dayWord[r.shift] ? `, ${dayWord[r.shift]}` : '');
const offsetText = r => (r.tz === HOME_TZ ? 'Bezugszeit' : `${fmtOffset(r.diff)}${dayNote(r)}`);
const offsetLong = r => (r.tz === HOME_TZ ? 'Bezugszeit' : `${fmtOffset(r.diff)} zu Frankfurt${dayNote(r)}`);
const windowText = segs => (segs.length ? `${segs.map(range).join(' und ')} Uhr` : 'keine (Wochenende)');

export default function StudioTimeline({ studios, now, legend = null }) {
  const rows = studios.map(s => ({
    ...s,
    segs: workWindowInHome(now, s.tz),
    status: studioStatus(now, s.tz),
    diff: diffToHome(now, s.tz),
    shift: dayShift(now, s.tz),
  }));
  const common = commonWindows(rows.map(r => r.segs));
  const nowMin = minutesOfDay(now, HOME_TZ);
  // „jetzt“-Marke am Rand nicht abschneiden
  const nowAlign = nowMin < 90 ? ' tl__now-label--start' : nowMin > DAY - 90 ? ' tl__now-label--end' : '';

  return (
    <div className="tl">
      <div className="tl__row tl__row--axis" aria-hidden="true">
        <span className="tl__axis-gap" />
        <div className="tl__scale">
          <span className={`tl__now-label${nowAlign}`} style={{ left: at(nowMin) }}>jetzt {fmtTime(now, HOME_TZ)}</span>
          {TICKS.map(h => (
            <span
              key={h}
              className={`tl__tick${h % 6 ? ' tl__tick--minor' : ''}${h === 0 ? ' tl__tick--start' : ''}${h === 24 ? ' tl__tick--end' : ''}`}
              style={{ left: at(h * 60) }}
            >
              {pad(h)}
            </span>
          ))}
        </div>
      </div>

      <ul className="tl__list" role="list">
        {rows.map(r => (
          <li key={r.id} className="tl__row" data-studio={r.id}>
            <div className="tl__info">
              <p className="tl__city"><span className="tl__dot" style={{ background: r.color }} aria-hidden="true" />{r.name}</p>
              <OpenBadge open={r.status.open} workday={r.status.workday} />
              <p className="tl__clock">
                <span className="tl__time num">{fmtTime(now, r.tz)}</span>
                <span className="visually-hidden"> Uhr Ortszeit, </span>
                <span className="tl__offset" aria-hidden="true">{offsetText(r)}</span>
                <span className="visually-hidden">{offsetLong(r)}</span>
              </p>
              <p className="visually-hidden">Arbeitszeit in Frankfurter Zeit: {windowText(r.segs)}</p>
            </div>
            <div className="tl__track" aria-hidden="true">
              {common.map(seg => (
                <span key={`c${seg[0]}`} className="tl__common" style={{ left: at(seg[0]), width: at(seg[1] - seg[0]) }} />
              ))}
              {r.segs.map(seg => (
                <span key={seg[0]} className="tl__bar" style={{ left: at(seg[0]), width: at(seg[1] - seg[0]) }}>
                  {seg[1] - seg[0] >= 180 ? shortRange(seg) : ''}
                </span>
              ))}
              <span className="tl__now" style={{ left: at(nowMin) }} />
            </div>
          </li>
        ))}
      </ul>
      {legend}

      <details className="tl-table">
        <summary><ChevronRight aria-hidden="true" size={18} strokeWidth={2} />Als Tabelle anzeigen</summary>
        {/* Schmal scrollt die Tabelle waagerecht – per Tastatur erreichbar */}
        <div className="tl-table__scroll" tabIndex={0} role="region" aria-label="Tabelle: Arbeitszeiten der Studios">
          <table className="table">
            <caption className="visually-hidden">
              Studios heute: Ortszeit, Status und Arbeitszeit (Mo–Fr {OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit) in Frankfurter Zeit
            </caption>
            <thead>
              <tr>
                <th scope="col">Studio</th>
                <th scope="col" className="num">Ortszeit</th>
                <th scope="col">Versatz</th>
                <th scope="col">Status</th>
                <th scope="col">Arbeitszeit in Frankfurter Zeit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <th scope="row">{r.name}</th>
                  <td className="num">{fmtTime(now, r.tz)}</td>
                  <td>{offsetLong(r)}</td>
                  <td>{statusText(r.status)}</td>
                  <td>{windowText(r.segs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export { range as fmtRange };
