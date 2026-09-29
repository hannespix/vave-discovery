// Zeiten (r07): eine Leiste (Timer | Nachtragen), darunter die Ansichten „Liste“ (nach Tag) und „Woche“ (Raster).
// Routen: #/zeit (Timer, Liste) · #/zeit/woche · #/zeit/nachtragen · #/zeit/nachtragen/<YYYY-MM-DD> (Datum vorbelegt,
// Fokus im ersten leeren Feld). Datenvertrag unverändert: 'time-entries' = [{ id, date, start, minutes, project, note,
// person, task? }]; der Timer kommt aus lib/timer.js. Eigener Schlüssel: 'time-week-rows' = { <Montag>: [Projekt-IDs] }
// für selbst hinzugefügte Zeilen des Wochenrasters (ohne Stunden).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStoredState, uid } from '../../lib/store.js';
import { cleanEntries, cleanTasks } from '../../lib/data.js';
import { useTimer } from '../../lib/timer.js';
import { useProjects } from '../../lib/projects.js';
import { navigate } from '../../lib/router.js';
import { addDays, fmtDuration } from '../../lib/format.js';
import { me, tasks as sampleTasks, timeEntries as sampleEntries } from '../../data/sample.js';
import EntryBar, { since } from './EntryBar.jsx';
import EntryList from './EntryList.jsx';
import WeekGrid, { WEEK_TARGET_MIN } from './WeekGrid.jsx';
import Toast, { useToast } from './Toast.jsx';
import { bookableIds, projectInfo, projectOrder } from './ProjectSelect.jsx';
import { scrollToEl } from './Confirmation.jsx';
import { gridRows, setCell } from './grid.js';
import {
  isDayIso, isoWeek, lastProject, recentCombos, recentProjects, rowId, suggestStart, sumMinutes, todayIso, weekDays,
} from './timeUtils.js';
import './time.css';

// Hervorhebung nach dem Speichern: so lange Limette, danach kurz ausblenden (bei reduzierter Bewegung ohne)
const FLASH_MS = 2000;
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const cleanRows = (v, fallback) =>
  isObj(v) ? Object.fromEntries(Object.entries(v).filter(([, ids]) => Array.isArray(ids)).map(([k, ids]) => [k, ids.filter(x => typeof x === 'string')])) : fallback;

export default function TimeTracker({ parts = [] }) {
  useProjects(); // neu zeichnen, wenn Projekte bearbeitet werden (Helfer lesen den Stand zur Laufzeit)
  const [stored, setEntries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const [storedTasks] = useStoredState('tasks', sampleTasks, cleanTasks);
  const [weekRows, setWeekRows] = useStoredState('time-week-rows', {}, cleanRows);
  const timer = useTimer();
  const entries = Array.isArray(stored) ? stored : [];
  const taskMap = useMemo(() => new Map((Array.isArray(storedTasks) ? storedTasks : []).map(t => [t.id, t])), [storedTasks]);
  const taskOf = id => (typeof id === 'string' ? taskMap.get(id) ?? null : null);
  const taskTitle = id => taskOf(id)?.title ?? '';

  const view = parts[0] === 'woche' ? 'week' : 'list';
  const [mode, setMode] = useState(() => (parts[0] === 'nachtragen' ? 'manual' : 'timer'));
  const [draft, setDraft] = useState(() => ({ project: null, note: '', date: todayIso(), start: null, duration: '' }));
  const [focusReq, setFocusReq] = useState(null);
  const [flash, setFlash] = useState(null); // { id, date }

  const now = new Date();
  const today = todayIso();
  const days = weekDays(now);
  const monday = days[0].iso;
  const prevDays = weekDays(addDays(now, -7));
  const weekNo = isoWeek(now);
  const inWeek = new Set(days.map(d => d.iso));
  const mine = entries.filter(e => !e.person || e.person === me.id);
  const week = mine.filter(e => inWeek.has(e.date));
  const weekMinutes = sumMinutes(week);
  const todayMinutes = sumMinutes(mine.filter(e => e.date === today));
  const ids = bookableIds();
  const defaultProject = lastProject(mine, ids);
  const recent = recentProjects(mine, ids);
  const combos = recentCombos(mine, ids);

  const running = timer.running;
  const timerProject = running && typeof timer.timer.project === 'string' && timer.timer.project ? timer.timer.project : null;
  const draftProject = draft.project ?? defaultProject;
  const shownProject = mode === 'timer' && timerProject ? timerProject : draftProject;

  // Gespeicherter Timer ohne Projekt (fremder Speicher): auffüllen, sonst bucht Stopp einen Eintrag ohne Projekt
  useEffect(() => {
    if (running && !timerProject) timer.update({ project: draftProject });
  }, [running, timerProject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

  // Routen: eigene Umschaltungen ändern den Hash (ownNav) – dann bleibt der Fokus, wo er ist. Kommt jemand von außen
  // auf #/zeit/nachtragen[/Datum] (Palette, „Heute“), wird der Modus gesetzt, das Datum vorbelegt und fokussiert.
  const routeKey = parts.join('/');
  const seenRoute = useRef(null);
  const ownNav = useRef(false);
  useEffect(() => {
    if (seenRoute.current === routeKey) return;
    seenRoute.current = routeKey;
    const own = ownNav.current;
    ownNav.current = false;
    if (parts[0] !== 'nachtragen') return;
    setMode('manual');
    if (own) return;
    const date = isDayIso(parts[1]) ? parts[1] : todayIso();
    setDraft(d => ({ ...d, date, start: null }));
    setFocusReq({ key: Date.now(), target: 'first-empty' });
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = to => {
    if (location.hash === `#${to}`) return;
    ownNav.current = true;
    navigate(to);
  };
  const changeMode = next => {
    if (next === mode) return;
    setDraft(d => ({ ...d, project: shownProject })); // Projekt bleibt beim Wechsel stehen
    setMode(next);
    if (view === 'list') go(next === 'manual' ? '/zeit/nachtragen' : '/zeit');
  };
  const changeView = next => {
    if (next === view) return;
    go(next === 'week' ? '/zeit/woche' : mode === 'manual' ? '/zeit/nachtragen' : '/zeit');
  };

  // Daten
  const list = prev => (Array.isArray(prev) ? prev : []);
  const mark = (id, date) => setFlash({ id, date });
  const addEntry = entry => {
    setEntries(prev => [...list(prev), entry]);
    mark(entry.id, entry.date);
  };
  const updateEntry = (id, patch) => {
    setEntries(prev => list(prev).map(e => (e.id === id ? { ...e, ...patch } : e)));
    mark(id, patch.date ?? entries.find(e => e.id === id)?.date);
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

  const [focusAfter, setFocusAfter] = useState(null);
  useEffect(() => {
    if (!focusAfter) return;
    document.getElementById(focusAfter)?.focus();
    setFocusAfter(null);
  }, [focusAfter]);
  const toast = useToast({ onClosed: () => setFocusAfter(view === 'week' ? 'tt-week-title' : 'tt-list-title') });

  const context = e => `${projectInfo(e.project).code}, ${e.start} Uhr, ${fmtDuration(e.minutes)}`;
  const deleteEntry = entry => {
    const index = entries.findIndex(e => e.id === entry.id);
    setEntries(prev => list(prev).filter(e => e.id !== entry.id));
    mark(null, entry.date);
    toast.show({
      text: `Gelöscht: ${context(entry)}.`,
      undo: () => {
        restoreEntry(entry, index);
        toast.show({ text: `Wiederhergestellt: ${context(entry)}.` });
        setFocusAfter(`tt-del-${entry.id}`);
      },
    });
    setFocusAfter('tt-undo');
  };

  // Fortsetzen: neuer Timer mit Projekt, Aufgabe und Notiz des Eintrags
  const resume = entry => {
    const combo = { project: entry.project, task: entry.task ?? null, note: String(entry.note ?? '') };
    if (running) {
      const t = timer.timer;
      toast.show({
        tone: 'warn',
        text: `Es läuft schon ein Timer: ${projectInfo(t.project).code}, seit ${since(new Date(timer.startedMs))} Uhr. Erst stoppen, dann fortsetzen.`,
      });
      return;
    }
    const r = timer.start(combo);
    if (r.already) return;
    const title = taskTitle(combo.task) || combo.note.trim();
    toast.show({ text: `Timer läuft: ${projectInfo(combo.project).code}${title ? ` · ${title}` : ''}.` });
    if (mode !== 'timer') {
      setMode('timer');
      if (view === 'list') go('/zeit');
    }
  };

  // „Anzeigen“: erst auf Wunsch zum Eintrag rollen, ihn fokussieren und noch einmal hervorheben
  const reveal = id => {
    const row = document.getElementById(rowId(id));
    if (!row) return;
    scrollToEl(row, 'center');
    row.focus({ preventScroll: true });
    mark(id, entries.find(e => e.id === id)?.date);
  };

  const onOverlong = r => {
    setDraft(d => ({ ...d, project: r.project, note: r.note, date: r.date, start: r.start, duration: '' }));
    setMode('manual');
    if (view === 'list') go('/zeit/nachtragen');
    setFocusReq({ key: Date.now(), target: 'duration' });
  };

  // Wochenraster: Zelle setzen (Sammeleintrag), Zeilen hinzufügen, Vorwoche übernehmen
  const onCell = (project, date, minutes) => {
    const id = uid();
    const args = { project, date, minutes, person: me.id, start: suggestStart(mine, date), newId: () => id };
    const r = setCell(entries, args);
    if (!r.error && r.action !== 'unchanged') {
      setEntries(prev => {
        const x = setCell(list(prev), args);
        return x.error ? prev : x.entries;
      });
    }
    return r;
  };
  const extra = weekRows[monday] ?? [];
  const order = projectOrder();
  const rows = gridRows(mine, days.map(d => d.iso), extra, order);
  const prevRows = gridRows(mine, prevDays.map(d => d.iso), weekRows[prevDays[0].iso] ?? [], order);
  const addRows = ids => setWeekRows(prev => {
    const all = isObj(prev) ? prev : {};
    const have = all[monday] ?? [];
    return { ...all, [monday]: [...have, ...ids.filter(x => !have.includes(x))] };
  });

  return (
    <div className="tt">
      <header className="page-header tt-header">
        <div className="tt-header-main">
          <h1 id="page-title" tabIndex={-1} className="page-header__title">Zeiten</h1>
          <div className="switch" role="group" aria-label="Ansicht">
            <button type="button" aria-pressed={view === 'list'} onClick={() => changeView('list')}>Liste</button>
            <button type="button" aria-pressed={view === 'week'} onClick={() => changeView('week')}>Woche</button>
          </div>
        </div>
        <p className="tt-header-figure">
          <span className="overline">KW {weekNo}</span>
          <strong className="num">{fmtDuration(weekMinutes)}</strong>
          <span className="meta">von {WEEK_TARGET_MIN / 60} h</span>
        </p>
      </header>

      <EntryBar
        mode={mode} onMode={changeMode} timer={timer} draft={draft} setDraft={setDraft} shownProject={shownProject}
        recent={recent} combos={combos} taskTitle={taskTitle} mine={mine} todayMinutes={todayMinutes} focusReq={focusReq}
        onBooked={entry => mark(entry.id, entry.date)} onAdd={addEntry} onOverlong={onOverlong} onReveal={reveal}
        weekStartIso={monday}
      />

      {view === 'list' ? (
        <EntryList
          entries={week} days={days} flash={flash} taskOf={taskOf} taskTitle={taskTitle}
          onResume={resume} onUpdate={updateEntry} onDelete={deleteEntry} notify={toast.show}
        />
      ) : (
        <WeekGrid
          all={entries} mine={mine} days={days} weekNo={weekNo} rows={rows} prevRows={prevRows}
          onAddRow={id => addRows([id])} onCopyRows={addRows} onCell={onCell}
        />
      )}

      <Toast api={toast} />
    </div>
  );
}
