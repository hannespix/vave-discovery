// Timer: Projekt wählen, Start, Stopp – Stopp bucht einen Eintrag von höchstens 24 h. Zustand liegt unter 'timer' und
// übersteht Reload. Länger als 10 h: Hinweis „vergessen?“; über 24 h bucht Stopp nichts und belegt „Nachtragen“ vor.
import { useEffect, useState } from 'react';
import { Play, Square, TriangleAlert } from 'lucide-react';
import { load, uid } from '../../lib/store.js';
import { fmtClock, fmtDuration, isoDay } from '../../lib/format.js';
import { me } from '../../data/sample.js';
import ProjectSelect, { projectInfo } from './ProjectSelect.jsx';
import Confirmation, { makeNote } from './Confirmation.jsx';
import { LONG_RUN_MS, MAX_BOOK_MS, clockOf, dayPhrase, endOf, rowId } from './timeUtils.js';
import { cleanTimer, validTimer } from '../../lib/data.js';

// Nur ein Objekt mit gültigem startedAt gilt als laufender Timer (gemeinsamer Prüfer, auch für „Heute“)
export { validTimer };

// „09:00“ für heute, sonst mit Datum: „Samstag, 26.09., 09:00“
const since = date => (isoDay(date) === isoDay(new Date()) ? clockOf(date) : `${dayPhrase(isoDay(date))}, ${clockOf(date)}`);

export default function TimerCard({
  timer: stored, setTimer, onBook, onReveal, onOverlong, onFixDuration, defaultProject, todayMinutes, weekStartIso,
}) {
  const timer = validTimer(stored);
  const running = Boolean(timer);
  const startedMs = running ? Date.parse(timer.startedAt) : 0;
  // Ohne eigene Wahl gilt das zuletzt gebuchte Projekt – so reichen zwei Tipps (Start, Stopp) bis zur gebuchten Zeit
  const [chosen, setChosen] = useState(null);
  const project = chosen ?? defaultProject;
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Sekundentakt nur während der Timer läuft, auf volle Sekunden ab Start ausgerichtet.
  // Nach einem Tab-Wechsel sofort neu rechnen (Hintergrund-Tabs drosseln Timeouts).
  useEffect(() => {
    if (!running) return undefined;
    let id;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const into = (((t - startedMs) % 1000) + 1000) % 1000;
      id = setTimeout(tick, 1000 - into + 10);
    };
    tick();
    const onVisible = () => { if (!document.hidden) setNow(Date.now()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [running, startedMs]);

  // Gespeicherter Timer ohne Projekt oder mit fremder Notiz: auffüllen statt abstürzen
  const timerProject = running && typeof timer.project === 'string' && timer.project ? timer.project : project;
  const timerNote = running ? String(timer.note ?? '') : '';
  const currentProject = running ? timerProject : project;
  const currentNote = running ? timerNote : note;
  const runMs = running ? now - startedMs : 0;
  const clock = fmtClock(Math.max(0, Math.floor(runMs / 1000)));
  const longRun = runMs > LONG_RUN_MS;
  const overlong = runMs > MAX_BOOK_MS;

  // Während der Timer läuft, ändern Projekt und Notiz den laufenden Timer (falsch gestartet? einfach umstellen)
  const changeProject = value => (running ? setTimer({ ...timer, project: value }) : setChosen(value));
  const changeNote = value => (running ? setTimer({ ...timer, note: value }) : setNote(value));

  const start = () => {
    const other = cleanTimer(load('timer', null));
    if (other) {
      setTimer(other);
      setStatus(makeNote('info', `Es läuft bereits ein Timer, seit ${since(new Date(other.startedAt))} Uhr.`));
      return;
    }
    const info = projectInfo(project);
    setNow(Date.now());
    setTimer({ project, note: note.trim(), startedAt: new Date().toISOString() });
    setStatus(makeNote('info', `Timer läuft: ${info.code} · ${info.name}.`));
  };

  const stop = () => {
    const stoppedAt = Date.now();
    const started = new Date(startedMs);
    setTimer(null);
    setChosen(timerProject);
    setNote('');
    // Über 24 h ist die Laufzeit kaum echt: nichts buchen, „Nachtragen“ mit Datum und Beginn vorbelegen
    if (stoppedAt - startedMs > MAX_BOOK_MS) {
      onOverlong({ date: isoDay(started), start: clockOf(started), project: timerProject, note: timerNote.trim() });
      setStatus(makeNote(
        'warn',
        `Nicht gebucht: Der Timer lief über 24 Stunden, seit ${since(started)} Uhr. ` +
          'Datum und Beginn stehen schon unter „Nachtragen“, es fehlt nur die Dauer.',
        { label: 'Dauer eintragen', run: onFixDuration },
      ));
      return;
    }
    const minutes = Math.max(1, Math.round((stoppedAt - startedMs) / 60000));
    const entry = {
      id: uid(), date: isoDay(started), start: clockOf(started), minutes,
      project: timerProject, note: timerNote.trim(), person: me.id,
    };
    onBook(entry);
    const info = projectInfo(entry.project);
    const beforeWeek = entry.date < weekStartIso;
    setStatus(makeNote(
      'ok',
      `Gestoppt und gebucht: ${fmtDuration(minutes)} auf ${info.code}, ${dayPhrase(entry.date)}, ` +
        `${entry.start}–${endOf(entry)} Uhr.${beforeWeek ? ' Der Tag liegt vor dieser Woche und steht deshalb nicht in der Liste.' : ''}`,
      beforeWeek ? null : { label: 'Anzeigen', whenHidden: rowId(entry.id), run: () => onReveal(entry.id) },
    ));
  };

  return (
    <section className="card tt-card tt-timer" aria-labelledby="tt-timer-title" data-running={running}>
      <div className="tt-card-head">
        <h2 id="tt-timer-title">Timer</h2>
        {running && <span className="badge badge-lime">Läuft</span>}
      </div>

      <div className="field">
        <label htmlFor="tt-timer-project">Projekt</label>
        <ProjectSelect id="tt-timer-project" value={currentProject} onChange={changeProject} />
      </div>
      <div className="field">
        <label htmlFor="tt-timer-note">Notiz <span className="tt-optional">(optional)</span></label>
        <input
          id="tt-timer-note" className="input" type="text" autoComplete="off" maxLength={200}
          placeholder="z. B. Abstimmung Lichtplanung" value={currentNote} onChange={e => changeNote(e.target.value)}
        />
      </div>

      <div className="tt-clock-panel" data-running={running}>
        <p className="tt-clock num">
          <span className="visually-hidden">Laufzeit {clock}</span>
          {/* Readex Pro kennt keine Tabellenziffern: jede Ziffer steht in einer festen Zelle, damit nichts springt */}
          <span className="tt-clock-digits" aria-hidden="true">
            {[...clock].map((ch, i) => <span key={i} className={ch === ':' ? 'tt-clock-sep' : 'tt-clock-digit'}>{ch}</span>)}
          </span>
        </p>
        <p className="tt-clock-sub">
          {running ? `seit ${since(new Date(startedMs))} Uhr` : `Heute erfasst: ${fmtDuration(todayMinutes)}`}
        </p>
      </div>

      {longRun && (
        <p className="tt-longrun">
          <TriangleAlert aria-hidden="true" size={20} />
          <span>
            <strong>{overlong ? 'Läuft seit über 24 h – vergessen?' : 'Läuft seit über 10 h – vergessen?'}</strong>{' '}
            {overlong ? 'Stopp bucht dann nichts, die Dauer wird nachgetragen.' : 'Stopp bucht die ganze Laufzeit.'}
          </span>
        </p>
      )}

      <button type="button" className="btn btn-primary tt-bigbtn" data-running={running} onClick={running ? stop : start}>
        {running ? <Square aria-hidden="true" size={22} fill="currentColor" /> : <Play aria-hidden="true" size={22} fill="currentColor" />}
        {running ? 'Stopp' : 'Start'}
      </button>
      <Confirmation note={status} />
    </section>
  );
}
