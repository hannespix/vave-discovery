import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StudioTimeline, { fmtRange } from '../components/StudioTimeline.jsx';
import { fmtDate } from '../lib/format.js';
import {
  CLOSE_HOUR, HOME_TZ, OPEN_HOUR, commonWindows, isWorkdayIn, minutesOfDay, tzOffset, useNow, workWindowInHome,
} from '../lib/time.js';
import { studios } from '../data/sample.js';
import '../styles/pages.css';

const DAY_MS = 86400000;
const LOOKAHEAD_DAYS = 14;
const zoneCount = new Set(studios.map(s => s.tz)).size;
// Annahme der Demo – steht so in der Oberfläche
const HOURS = `Mo–Fr ${OPEN_HOUR}–${CLOSE_HOUR} Uhr Ortszeit`;

const listDe = names => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`);
const ranges = win => win.map(fmtRange).join(' und ');
const length = win => win.reduce((n, [a, b]) => n + (b - a), 0);
const sameWin = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const dayMonth = d => fmtDate(d, { day: 'numeric', month: 'numeric', timeZone: HOME_TZ });   // „26.10.“
const weekday = d => fmtDate(d, { weekday: 'long', timeZone: HOME_TZ });
const dayKey = d => fmtDate(d, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: HOME_TZ });

// Gemeinsames Fenster aller Studios am Frankfurter Kalendertag von `date`
const commonOn = date => commonWindows(studios.map(s => workWindowInHome(date, s.tz)));
// Frankfurter Mittag, k Tage von heute – liegt auch über eine Zeitumstellung hinweg sicher im richtigen Kalendertag
const dayAt = (now, k) => new Date(now.getTime() - (minutesOfDay(now, HOME_TZ) - 720) * 60000 + k * DAY_MS);

function reasonFor(from, to) {
  const home = tzOffset(to, HOME_TZ) - tzOffset(from, HOME_TZ);
  if (home < 0) return 'Ende der Sommerzeit';
  if (home > 0) return 'Beginn der Sommerzeit';
  const moved = studios.filter(s => tzOffset(to, s.tz) !== tzOffset(from, s.tz)).map(s => s.name);
  return moved.length ? `Zeitumstellung in ${listDe(moved)}` : '';
}

// Heute, nächster Werktag mit gemeinsamer Zeit und die erste Änderung in den nächsten 14 Tagen (über workWindowInHome).
// Bezug ist heute; am Wochenende der letzte Werktag davor – so kündigt auch der Samstag die Umstellung am Montag an.
function outlook(now) {
  const workday = isWorkdayIn(now, HOME_TZ);
  const today = commonOn(now);
  let ref = { date: now, win: today };
  for (let k = -1; !workday && k >= -3; k--) {
    const d = dayAt(now, k);
    if (isWorkdayIn(d, HOME_TZ)) { ref = { date: d, win: commonOn(d) }; break; }
  }
  let next = null;
  let change = null;
  for (let k = 1; k <= LOOKAHEAD_DAYS && !(next && change); k++) {
    const d = dayAt(now, k);
    if (!isWorkdayIn(d, HOME_TZ)) continue;
    const win = commonOn(d);
    if (!next && win.length) next = { date: d, win };
    if (!change && !sameWin(win, ref.win)) change = { date: d, win, shorter: length(win) < length(ref.win), reason: reasonFor(ref.date, d) };
  }
  return { workday, today, next, change };
}

function changeText({ date, win, shorter, reason }) {
  const what = win.length
    ? `Ab ${dayMonth(date)} ${shorter ? 'nur noch' : 'gemeinsam'} ${ranges(win)} Frankfurt`
    : `Ab ${dayMonth(date)} keine gemeinsame Zeit mehr`;
  return reason ? `${what} – ${reason}.` : `${what}.`;
}

export default function Studios() {
  const now = useNow(15000);
  const key = dayKey(now);
  // Ausblick nur einmal je Frankfurter Tag rechnen (14 Tage × 5 Studios)
  const o = useMemo(() => outlook(now), [key]); // eslint-disable-line react-hooks/exhaustive-deps -- neu je Tag

  return (
    <>
      <PageHeader eyebrow={`${studios.length} Studios · ${zoneCount} Zeitzonen`} title="Studios">
        <p>Ortszeiten und die Zeit, in der alle Studios gleichzeitig arbeiten.</p>
        <p>Angenommen: {HOURS}, Feiertage nicht berücksichtigt.</p>
      </PageHeader>

      <div className="studios-now">
        {o.workday && o.today.length > 0 && (
          <p className="studios-now__line" data-common>
            Gemeinsam heute: <strong className="num">{ranges(o.today)}</strong> Frankfurt
          </p>
        )}
        {!o.workday && (
          <p className="studios-now__line" data-weekend>
            Heute ist Wochenende.
            {o.next && <> Gemeinsam wieder {weekday(o.next.date)}, {dayMonth(o.next.date)}, <strong className="num">{ranges(o.next.win)}</strong> Frankfurt.</>}
          </p>
        )}
        {o.workday && o.today.length === 0 && (
          <p className="studios-now__line">Heute gibt es keine Zeit, in der alle Studios arbeiten.</p>
        )}
        {o.change && (
          <p className="studios-now__change" data-change>
            <CalendarClock aria-hidden="true" size={18} strokeWidth={1.75} />
            <span>{changeText(o.change)}</span>
          </p>
        )}
      </div>

      <section aria-labelledby="scale-title">
        <h2 id="scale-title" className="studios__label">Heute in Frankfurter Zeit</h2>
        <StudioTimeline
          studios={studios}
          now={now}
          legend={
            <p className="studios__legend">
              Balken: Arbeitszeit {HOURS}, umgerechnet. Violett umrandet: alle arbeiten. Senkrechte Linie: jetzt.
            </p>
          }
        />
      </section>
    </>
  );
}
