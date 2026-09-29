// Zeiten (r07): eine Leiste (Timer | Nachtragen), darunter der Kopf der gewählten Woche (‹ KW › · Summe gegen Soll)
// und die Ansichten „Liste“ (nach Tag) und „Woche“ (Raster). Die Woche steht in der Route, die laufende ohne Datum:
//   #/zeit · #/zeit/nachtragen · #/zeit/liste/<Montag> (Liste einer früheren Woche)
//   #/zeit/woche · #/zeit/woche/<Montag> (Raster)
//   #/zeit/nachtragen/<YYYY-MM-DD> (Woche des Datums, Datum vorbelegt, Fokus im ersten leeren Feld)
// Künftige Wochen gibt es nicht – ein späteres Datum zeigt die laufende Woche.
// Datenvertrag: 'time-entries' = [{ id, date, start, minutes, project, note, person, task?, source? }], source 'grid' =
// Sammeleintrag des Rasters (grid.js). Der Timer kommt aus lib/timer.js. Eigener Schlüssel: 'time-week-rows' =
// { <Montag>: [Projekt-IDs] } für selbst hinzugefügte Zeilen des Wochenrasters (ohne Stunden).
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
import WeekGrid, { cellId } from './WeekGrid.jsx';
import WeekNav, { RANGE_TITLE_ID } from './WeekNav.jsx';
import Toast, { useToast } from './Toast.jsx';
import { bookableIds, projectInfo, projectOrder } from './ProjectSelect.jsx';
import { makeNote, scrollToEl } from './Confirmation.jsx';
import { gridRows, resumeCombo, revertCell, setCell } from './grid.js';
import {
  dayPhrase, endOf, isDayIso, isoWeek, lastProject, mondayIso, parseDay, recentCombos, recentProjects, rowId, sameCombo,
  suggestStart, sumMinutes, todayIso, weekDays,
} from './timeUtils.js';
import './time.css';

// Hervorhebung nach dem Speichern: so lange Limette, danach kurz ausblenden (bei reduzierter Bewegung ohne)
const FLASH_MS = 2000;
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const cleanRows = (v, fallback) =>
  isObj(v) ? Object.fromEntries(Object.entries(v).filter(([, ids]) => Array.isArray(ids)).map(([k, ids]) => [k, ids.filter(x => typeof x === 'string')])) : fallback;
const shiftWeek = (monday, n) => mondayIso(addDays(parseDay(monday), 7 * n));

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

  // Ansicht und Woche aus der Route
  const now = new Date();
  const today = todayIso();
  const currentMonday = mondayIso(now);
  const view = parts[0] === 'woche' ? 'week' : 'list';
  const routeDay = ['woche', 'liste', 'nachtragen'].includes(parts[0]) && isDayIso(parts[1]) ? parts[1] : null;
  const monday = routeDay && mondayIso(routeDay) < currentMonday ? mondayIso(routeDay) : currentMonday;
  const isCurrentWeek = monday === currentMonday;
  const days = weekDays(monday, now);
  const weekNo = isoWeek(parseDay(monday));

  const [mode, setMode] = useState(() => (parts[0] === 'nachtragen' ? 'manual' : 'timer'));
  const [draft, setDraft] = useState(() => ({ project: null, note: '', date: todayIso(), start: null, duration: '' }));
  const [focusReq, setFocusReq] = useState(null);
  const [flash, setFlash] = useState(null); // { id, date, project }

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
  const listRoute = (m, manual) => (m === currentMonday ? (manual ? '/zeit/nachtragen' : '/zeit') : `/zeit/liste/${m}`);
  const weekRoute = m => (m === currentMonday ? '/zeit/woche' : `/zeit/woche/${m}`);
  const routeFor = (v, m, manual = mode === 'manual') => (v === 'week' ? weekRoute(m) : listRoute(m, manual));

  const changeMode = next => {
    if (next === mode) return;
    setDraft(d => ({ ...d, project: shownProject })); // Projekt bleibt beim Wechsel stehen
    setMode(next);
    if (view === 'list') go(listRoute(monday, next === 'manual'));
  };
  const changeView = next => {
    if (next !== view) go(routeFor(next, monday));
  };
  // Wochen blättern – nie über die laufende Woche hinaus
  const prevWeek = () => go(routeFor(view, shiftWeek(monday, -1)));
  const nextWeek = () => { if (!isCurrentWeek) go(routeFor(view, shiftWeek(monday, 1))); };
  const thisWeek = () => {
    // „Diese Woche“ verschwindet gleich – der Fokus geht vorher auf den Wochentitel, nicht ins Leere
    document.getElementById(RANGE_TITLE_ID)?.focus();
    go(routeFor(view, currentMonday));
  };

  // Daten
  const list = prev => (Array.isArray(prev) ? prev : []);
  const mark = (id, date, project) => setFlash({ id, date, project });
  const addEntry = entry => {
    setEntries(prev => [...list(prev), entry]);
    mark(entry.id, entry.date, entry.project);
  };
  const updateEntry = (id, patch) => {
    const old = entries.find(e => e.id === id);
    setEntries(prev => list(prev).map(e => (e.id === id ? { ...e, ...patch } : e)));
    mark(id, patch.date ?? old?.date, patch.project ?? old?.project);
  };
  const restoreEntry = (entry, index) => {
    setEntries(prev => {
      const all = list(prev);
      if (all.some(e => e.id === entry.id)) return all;
      const at = index < 0 ? all.length : Math.min(index, all.length);
      return [...all.slice(0, at), entry, ...all.slice(at)];
    });
    mark(entry.id, entry.date, entry.project);
  };

  const [focusAfter, setFocusAfter] = useState(null);
  useEffect(() => {
    if (!focusAfter) return;
    document.getElementById(focusAfter)?.focus();
    setFocusAfter(null);
  }, [focusAfter]);
  const toast = useToast({ onClosed: () => setFocusAfter(RANGE_TITLE_ID) });

  // Bestätigung in der Leiste – gehört zu einem Timer-Zustand (stoppt die Pille den Timer, verschwindet sie)
  const [barNote, setBarNote] = useState(null);
  const timerKey = timer.timer?.startedAt ?? null;
  const note = barNote && barNote.timerKey === timerKey ? barNote : null;
  const say = (n, key = timerKey) => setBarNote(n ? { ...n, timerKey: key } : null);

  const context = e => `${projectInfo(e.project).code}, ${e.start} Uhr, ${fmtDuration(e.minutes)}`;
  const deleteEntry = entry => {
    const index = entries.findIndex(e => e.id === entry.id);
    setEntries(prev => list(prev).filter(e => e.id !== entry.id));
    mark(null, entry.date, null);
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

  // „Anzeigen“: erst auf Wunsch zur Woche des Eintrags wechseln, zur Zeile (Liste) bzw. Zelle (Raster) rollen,
  // fokussieren und noch einmal hervorheben. Liegt der Eintrag in einer anderen Woche, geschieht das nach dem Wechsel.
  const [reveal, setReveal] = useState(null); // { id, project, date, monday }
  useEffect(() => {
    if (!reveal || reveal.monday !== monday) return;
    setReveal(null);
    const el = document.getElementById(view === 'list' ? rowId(reveal.id) : cellId(reveal.project, reveal.date));
    if (!el) return;
    scrollToEl(el, 'center');
    el.focus({ preventScroll: true });
    mark(reveal.id, reveal.date, reveal.project);
  }, [reveal, monday, view]);
  const showEntry = entry => {
    const target = mondayIso(entry.date) > currentMonday ? currentMonday : mondayIso(entry.date);
    setReveal({ id: entry.id, project: entry.project, date: entry.date, monday: target });
    if (target !== monday) go(routeFor(view, target));
  };
  const revealAction = entry => {
    const run = () => showEntry(entry);
    if (mondayIso(entry.date) !== monday) return { label: 'Anzeigen', run };
    return { label: 'Anzeigen', whenHidden: view === 'list' ? rowId(entry.id) : cellId(entry.project, entry.date), run };
  };
  const booked = entry => `${fmtDuration(entry.minutes)} auf ${projectInfo(entry.project).code}, ${dayPhrase(entry.date)}, ` +
    `${entry.start}–${endOf(entry)} Uhr`;

  const onOverlong = r => {
    setDraft(d => ({ ...d, project: r.project, note: r.note, date: r.date, start: r.start, duration: '' }));
    setMode('manual');
    if (view === 'list') go(listRoute(monday, true));
    setFocusReq({ key: Date.now(), target: 'duration' });
  };

  // Stopp – gleiche Auswertung für den runden Knopf und den gedrückten Play-Knopf in der Liste (lib/timer.js):
  // pending (über 10 h): nichts tun, die Hülle fragt nach (TIMER_GUARD) und bucht selbst · tooShort: nichts gebucht ·
  // discarded: verworfen · overlong: Nachtragen vorbelegen · entry: gebucht. via 'toast': Rückmeldung unten statt oben.
  const stopTimer = (via = 'bar') => {
    const startedMs = timer.startedMs;
    const r = timer.stop();
    if (!r || r.pending) return;
    const project = r.entry?.project ?? r.project;
    if (project) setDraft(d => ({ ...d, project, note: '' }));
    const tell = (tone, text, action = null) => {
      if (via === 'toast') toast.show({ tone: tone === 'ok' ? undefined : 'warn', text });
      else say(makeNote(tone, text, action), null);
    };
    if (r.tooShort) return tell('note', 'Unter einer Minute – nicht gebucht.');
    if (r.discarded) return tell('note', 'Verworfen.');
    if (r.overlong) {
      onOverlong(r);
      say(makeNote('warn', `Nicht gebucht: Der Timer lief über 24 Stunden, seit ${since(new Date(startedMs))} Uhr. ` +
        'Datum und Beginn stehen schon unter „Nachtragen“, es fehlt nur die Dauer.'), null);
      return undefined;
    }
    if (!r.entry) return undefined;
    mark(r.entry.id, r.entry.date, r.entry.project);
    return tell('ok', `Gestoppt und gebucht: ${booked(r.entry)}.`, revealAction(r.entry));
  };

  const saveManual = entry => {
    addEntry(entry);
    say(makeNote('ok', `Gespeichert: ${booked(entry)}.`, revealAction(entry)));
  };

  // Fortsetzen: neuer Timer mit Projekt, Aufgabe und Notiz des Eintrags (ohne die Anzeige-Notiz „Wochenraster“).
  // Läuft der Timer schon auf genau dieser Kombination, ist der Knopf gedrückt – dann stoppt ein Klick.
  const isRunningOn = entry => running && sameCombo(timer.timer, resumeCombo(entry));
  const resume = entry => {
    const combo = resumeCombo(entry);
    if (running) {
      if (sameCombo(timer.timer, combo)) { stopTimer('toast'); return; }
      const t = timer.timer;
      toast.show({
        tone: 'warn',
        text: `Es läuft schon ein Timer: ${projectInfo(t.project).code}, seit ${since(new Date(timer.startedMs))} Uhr. Erst stoppen, dann fortsetzen.`,
      });
      return;
    }
    const r = timer.start(combo);
    if (r.already) return;
    const title = taskTitle(combo.task) || combo.note;
    toast.show({ text: `Timer läuft: ${projectInfo(combo.project).code}${title ? ` · ${title}` : ''}.` });
    if (mode !== 'timer') {
      setMode('timer');
      if (view === 'list') go(listRoute(monday, false));
    }
  };

  // Wochenraster: Zelle setzen (nur der Sammeleintrag), Zeilen hinzufügen, Vorwoche übernehmen – alles mit Rückgängig
  const onCell = (project, date, minutes) => {
    const id = uid();
    const args = { project, date, minutes, person: me.id, start: suggestStart(mine, date), newId: () => id };
    const r = setCell(entries, args);
    if (r.error || r.action === 'unchanged') return r;
    setEntries(prev => {
      const x = setCell(list(prev), args);
      return x.error ? prev : x.entries;
    });
    return { ...r, undo: () => setEntries(prev => revertCell(list(prev), r)) };
  };
  const extra = weekRows[monday] ?? [];
  const order = projectOrder();
  const rows = gridRows(mine, days.map(d => d.iso), extra, order);
  const prevMonday = shiftWeek(monday, -1);
  const prevRows = gridRows(mine, weekDays(prevMonday, now).map(d => d.iso), weekRows[prevMonday] ?? [], order);
  const addRows = newIds => {
    const at = monday;
    const added = newIds.filter(x => !(weekRows[at] ?? []).includes(x));
    const edit = fn => setWeekRows(prev => {
      const all = isObj(prev) ? prev : {};
      return { ...all, [at]: fn(all[at] ?? []) };
    });
    edit(have => [...have, ...added.filter(x => !have.includes(x))]);
    return () => edit(have => have.filter(x => !added.includes(x)));
  };

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
      </header>

      <EntryBar
        mode={mode} onMode={changeMode} timer={timer} draft={draft} setDraft={setDraft} shownProject={shownProject}
        recent={recent} combos={combos} taskTitle={taskTitle} mine={mine} todayMinutes={todayMinutes} focusReq={focusReq}
        note={note} say={say} onClearNote={() => setBarNote(null)} onStop={() => stopTimer('bar')} onSave={saveManual}
      />

      <div className="tt-range-section">
        <WeekNav
          weekNo={weekNo} days={days} isCurrent={isCurrentWeek} minutes={weekMinutes}
          onPrev={prevWeek} onNext={nextWeek} onCurrent={thisWeek}
        />
        {view === 'list' ? (
          <EntryList
            entries={week} days={days} weekNo={weekNo} flash={flash} taskOf={taskOf} taskTitle={taskTitle}
            isRunning={isRunningOn} onResume={resume} onUpdate={updateEntry} onDelete={deleteEntry} notify={toast.show}
          />
        ) : (
          <WeekGrid
            all={entries} mine={mine} days={days} weekNo={weekNo} rows={rows} prevRows={prevRows} flash={flash}
            onAddRow={id => addRows([id])} onCopyRows={addRows} onCell={onCell}
          />
        )}
      </div>

      <Toast api={toast} />
    </div>
  );
}
