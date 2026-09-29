// Zeiterfassung (Builder B): Timer, Nachtragen, Liste der Woche, Wochenblick. Ohne Backend – localStorage.
// Datenvertrag (liest auch die Startseite, mit denselben Prüfern aus lib/data.js): 'time-entries' = [{ id, date, start,
// minutes, project, note, person }], 'timer' = { project, note, startedAt } | null.
import { useEffect, useState } from 'react';
import { useStoredState } from '../../lib/store.js';
import { cleanEntries, cleanTimer } from '../../lib/data.js';
import { me, timeEntries } from '../../data/sample.js';
import TimerCard from './TimerCard.jsx';
import ManualEntry from './ManualEntry.jsx';
import EntryList from './EntryList.jsx';
import WeekChart from './WeekChart.jsx';
import { bookableIds } from './ProjectSelect.jsx';
import { scrollToEl } from './Confirmation.jsx';
import { isoWeek, lastProject, rowId, sumMinutes, todayIso, weekDays } from './timeUtils.js';
import './time.css';

// Hervorhebung nach dem Speichern: so lange Limette, danach 300 ms Ausblenden (bei reduzierter Bewegung ohne)
const FLASH_MS = 2000;

// Routen-Vertrag: jede Seite bekommt { parts }; die Zeiterfassung hat keine Unterseiten.
export default function TimeTracker({ parts }) { // eslint-disable-line no-unused-vars
  // Abgleich mit anderen Tabs macht useStoredState; Kaputtes fällt über die Prüfer heraus
  const [stored, setEntries] = useStoredState('time-entries', timeEntries, cleanEntries);
  const [timer, setTimer] = useStoredState('timer', null, cleanTimer);
  const [flash, setFlash] = useState(null);     // { id, date } – zuletzt gespeichert (id) bzw. geänderter Tag (date)
  const [prefill, setPrefill] = useState(null); // Vorbelegung für „Nachtragen“, wenn Stopp nichts bucht
  const entries = Array.isArray(stored) ? stored : [];

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

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
  const dateOf = id => entries.find(e => e.id === id)?.date;
  const mark = (id, date) => setFlash({ id, date });
  const addEntry = entry => {
    setEntries(prev => [...list(prev), entry]);
    mark(entry.id, entry.date);
  };
  const updateEntry = (id, patch) => {
    setEntries(prev => list(prev).map(e => (e.id === id ? { ...e, ...patch } : e)));
    mark(id, patch.date ?? dateOf(id));
  };
  const deleteEntry = id => {
    const index = entries.findIndex(e => e.id === id);
    setEntries(prev => list(prev).filter(e => e.id !== id));
    mark(null, dateOf(id));
    return index;
  };
  const restoreEntry = (entry, index) => {
    setEntries(prev => {
      const all = list(prev);
      if (all.some(e => e.id === entry.id)) return all;
      const at = index < 0 ? all.length : Math.min(index, all.length);
      return [...all.slice(0, at), entry, ...all.slice(at)];
    });
    mark(entry.id, entry.date);
  };

  // „Anzeigen“: erst auf Wunsch zum Eintrag rollen, ihn fokussieren und noch einmal hervorheben
  const reveal = id => {
    const row = document.getElementById(rowId(id));
    if (!row) return;
    scrollToEl(row, 'center');
    row.focus({ preventScroll: true });
    mark(id, dateOf(id));
  };
  // „Dauer eintragen“ nach einem Timer über 24 h: zum vorbelegten Formular
  const focusManual = () => {
    const field = document.getElementById('tt-m-dur');
    if (!field) return;
    scrollToEl(field, 'center');
    field.focus({ preventScroll: true });
  };

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
            timer={timer} setTimer={setTimer} onBook={addEntry} onReveal={reveal}
            onOverlong={setPrefill} onFixDuration={focusManual}
            defaultProject={defaultProject} todayMinutes={todayMinutes} weekStartIso={days[0].iso}
          />
          <ManualEntry
            entries={mine} onAdd={addEntry} onReveal={reveal} prefill={prefill}
            defaultProject={defaultProject} weekStartIso={days[0].iso}
          />
        </div>
        <div className="tt-col">
          <EntryList
            entries={week} days={days} weekNo={weekNo} flash={flash}
            onUpdate={updateEntry} onDelete={deleteEntry} onRestore={restoreEntry}
          />
          <WeekChart days={days} entries={week} weekNo={weekNo} />
        </div>
      </div>
    </div>
  );
}
