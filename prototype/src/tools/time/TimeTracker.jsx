// Zeiterfassung (Builder B): Timer, Nachtragen, Liste der Woche, Wochenblick. Ohne Backend – localStorage.
// Datenvertrag (liest auch die Startseite): 'time-entries' = [{ id, date, start, minutes, project, note, person }],
// 'timer' = { project, note, startedAt } | null.
import { useEffect } from 'react';
import { load, useStoredState } from '../../lib/store.js';
import { me, timeEntries } from '../../data/sample.js';
import TimerCard from './TimerCard.jsx';
import ManualEntry from './ManualEntry.jsx';
import EntryList from './EntryList.jsx';
import WeekChart from './WeekChart.jsx';
import { bookableIds } from './ProjectSelect.jsx';
import { isoWeek, lastProject, sumMinutes, todayIso, weekDays } from './timeUtils.js';
import './time.css';

// Routen-Vertrag: jede Seite bekommt { parts }; die Zeiterfassung hat keine Unterseiten.
export default function TimeTracker({ parts }) { // eslint-disable-line no-unused-vars
  const [stored, setEntries] = useStoredState('time-entries', timeEntries);
  const [timer, setTimer] = useStoredState('timer', null);
  const entries = Array.isArray(stored) ? stored : [];

  // Zweiter Tab oder zweites Fenster ändert dieselben Schlüssel: Zustand nachziehen, damit nur ein Timer läuft
  useEffect(() => {
    const onStorage = e => {
      if (e.storageArea !== localStorage) return;
      if (e.key === null || e.key.endsWith(':timer')) setTimer(load('timer', null));
      if (e.key === null || e.key.endsWith(':time-entries')) setEntries(load('time-entries', timeEntries));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setTimer, setEntries]);

  const now = new Date();
  const today = todayIso();
  const days = weekDays(now);
  const inWeek = new Set(days.map(d => d.iso));
  const mine = entries.filter(e => e && (!e.person || e.person === me.id));
  const week = mine.filter(e => inWeek.has(e.date));
  const todayMinutes = sumMinutes(mine.filter(e => e.date === today));
  const defaultProject = lastProject(mine, bookableIds);
  const weekNo = isoWeek(now);

  const list = prev => (Array.isArray(prev) ? prev : []);
  const addEntry = entry => setEntries(prev => [...list(prev), entry]);
  const updateEntry = (id, patch) => setEntries(prev => list(prev).map(e => (e.id === id ? { ...e, ...patch } : e)));
  const deleteEntry = id => {
    const index = entries.findIndex(e => e.id === id);
    setEntries(prev => list(prev).filter(e => e.id !== id));
    return index;
  };
  const restoreEntry = (entry, index) =>
    setEntries(prev => {
      const all = list(prev);
      if (all.some(e => e.id === entry.id)) return all;
      const at = index < 0 ? all.length : Math.min(index, all.length);
      return [...all.slice(0, at), entry, ...all.slice(at)];
    });

  return (
    <div className="tt">
      <header className="tt-head">
        <p className="eyebrow">Zeiterfassung</p>
        <h1 id="page-title">Zeiten</h1>
        <p className="muted tt-lead">Start und Stopp buchen die Zeit. Vergessenes lässt sich nachtragen.</p>
      </header>

      <div className="tt-grid">
        <div className="tt-col">
          <TimerCard
            timer={timer} setTimer={setTimer} onBook={addEntry}
            defaultProject={defaultProject} todayMinutes={todayMinutes}
          />
          <ManualEntry entries={mine} onAdd={addEntry} defaultProject={defaultProject} weekStartIso={days[0].iso} />
        </div>
        <div className="tt-col">
          <EntryList
            entries={week} days={days} weekNo={weekNo}
            onUpdate={updateEntry} onDelete={deleteEntry} onRestore={restoreEntry}
          />
          <WeekChart days={days} entries={week} weekNo={weekNo} />
        </div>
      </div>
    </div>
  );
}
