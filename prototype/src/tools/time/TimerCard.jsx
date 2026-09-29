// Timer: Projekt wählen, Start, Stopp – Stopp bucht einen Eintrag. Zustand liegt unter 'timer' und übersteht Reload.
import { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { load, uid } from '../../lib/store.js';
import { fmtClock, fmtDuration, isoDay } from '../../lib/format.js';
import { me } from '../../data/sample.js';
import ProjectSelect, { projectInfo } from './ProjectSelect.jsx';
import { clockOf } from './timeUtils.js';
import { validTimer } from '../../lib/data.js';

// Nur ein Objekt mit gültigem startedAt gilt als laufender Timer (gemeinsamer Prüfer, auch für „Heute“)
export { validTimer };

export default function TimerCard({ timer: stored, setTimer, onBook, defaultProject, todayMinutes }) {
  const timer = validTimer(stored);
  const running = Boolean(timer);
  const startedMs = running ? Date.parse(timer.startedAt) : 0;
  // Ohne eigene Wahl gilt das zuletzt gebuchte Projekt – so reichen zwei Tipps (Start, Stopp) bis zur gebuchten Zeit
  const [chosen, setChosen] = useState(null);
  const project = chosen ?? defaultProject;
  const [note, setNote] = useState('');
  const [announce, setAnnounce] = useState('');
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

  const currentProject = running ? timer.project : project;
  const currentNote = running ? timer.note || '' : note;
  const elapsed = running ? Math.max(0, Math.floor((now - startedMs) / 1000)) : 0;
  const clock = fmtClock(elapsed);

  // Während der Timer läuft, ändern Projekt und Notiz den laufenden Timer (falsch gestartet? einfach umstellen)
  const changeProject = value => (running ? setTimer({ ...timer, project: value }) : setChosen(value));
  const changeNote = value => (running ? setTimer({ ...timer, note: value }) : setNote(value));

  const start = () => {
    const other = validTimer(load('timer', null));
    if (other) {
      setTimer(other);
      setAnnounce(`Es läuft bereits ein Timer, seit ${clockOf(new Date(other.startedAt))} Uhr.`);
      return;
    }
    const info = projectInfo(project);
    setNow(Date.now());
    setTimer({ project, note: note.trim(), startedAt: new Date().toISOString() });
    setAnnounce(`Timer läuft: ${info.code} · ${info.name}.`);
  };

  const stop = () => {
    const started = new Date(startedMs);
    const minutes = Math.max(1, Math.round((Date.now() - startedMs) / 60000));
    const entry = {
      id: uid(), date: isoDay(started), start: clockOf(started), minutes,
      project: timer.project, note: (timer.note || '').trim(), person: me.id,
    };
    onBook(entry);
    setTimer(null);
    setChosen(timer.project);
    setNote('');
    const info = projectInfo(entry.project);
    setAnnounce(`Gestoppt und gebucht: ${fmtDuration(minutes)} auf ${info.code} · ${info.name}.`);
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
          {running ? `seit ${clockOf(new Date(startedMs))} Uhr` : `Heute erfasst: ${fmtDuration(todayMinutes)}`}
        </p>
      </div>

      <button type="button" className="btn btn-primary tt-bigbtn" data-running={running} onClick={running ? stop : start}>
        {running ? <Square aria-hidden="true" size={22} fill="currentColor" /> : <Play aria-hidden="true" size={22} fill="currentColor" />}
        {running ? 'Stopp' : 'Start'}
      </button>
      <p className="tt-announce" role="status">{announce}</p>
    </section>
  );
}
