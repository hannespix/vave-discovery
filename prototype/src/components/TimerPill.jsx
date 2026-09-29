import { useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { useElapsed } from '../lib/timer.js';
import { fmtClock } from '../lib/format.js';
import { href } from '../lib/router.js';
import { useStoredState } from '../lib/store.js';
import { cleanTasks } from '../lib/data.js';
import { tasks as sampleTasks } from '../data/sample.js';
import { projectInfo, spokenDuration } from './shellData.js';

// Timer in der Hülle: Pille in der Seitenleiste, Start und Chip im Handy-Kopf. Zustand und Buchen: lib/timer.js (über App).
// Farbrolle: laufender Timer violett gefüllt; in Ruhe schwarze Kontur, Play im violetten Kreis (Hauptaktion).
// data-timer-start: sichtbarer Start der Hülle – dorthin geht der Fokus, wenn die Rückfrage (StopGuard) gebucht hat.

// Laufzeit in festen Ziffernzellen (je 1ch) – beim Zählen springt nichts. Für Screenreader steht die Zeit einmal am
// Stück daneben; die Zellen allein würden als „0 0 : 1 2“ vorgelesen.
export function Clock({ ms, className = '' }) {
  const text = fmtClock(Math.floor(Math.max(0, ms) / 1000));
  return (
    <span className={`clock ${className}`}>
      <span className="visually-hidden">{text}</span>
      <span className="clock__cells" aria-hidden="true">
        {[...text].map((ch, i) => <span key={i} className={ch === ':' ? 'clock__sep' : 'clock__digit'}>{ch}</span>)}
      </span>
    </span>
  );
}

// Ruhe: „Timer starten“, darunter grau das zuletzt gebuchte Projekt; ein Klick startet damit
export function TimerStart({ project, onStart, buttonRef, className = '' }) {
  const p = projectInfo(project);
  return (
    <button ref={buttonRef} type="button" className={`timer-pill ${className}`} onClick={onStart} aria-keyshortcuts="t"
      data-timer-start="">
      <span className="timer-pill__icon" aria-hidden="true"><Play size={16} strokeWidth={2.25} /></span>
      <span className="timer-pill__text">
        <span className="timer-pill__title">Timer starten</span>
        <span className="timer-pill__sub"><span className="visually-hidden">mit </span>{p.code} · {p.name}</span>
      </span>
      <kbd className="kbd timer-pill__key" aria-hidden="true">T</kbd>
    </button>
  );
}

// Läuft: Laufzeit und Projekt (Link zu Zeiten), daneben Stopp mit Projekt und Laufzeit im Namen
function TimerRunning({ timer, startedMs, onStop, stopRef }) {
  const ms = useElapsed(startedMs, true);
  const [tasks] = useStoredState('tasks', sampleTasks, cleanTasks);
  const p = projectInfo(timer.project);
  // Läuft der Timer auf einer Aufgabe (Buchen aus der Aufgabe), steht sie statt des Projektnamens da
  const taskTitle = timer.task && Array.isArray(tasks) ? tasks.find(t => t.id === timer.task)?.title : null;
  const spoken = spokenDuration(ms / 60000);
  return (
    <div className="timer-pill is-running" role="group" aria-label="Timer">
      <a className="timer-pill__main" href={href('/zeit')}>
        <span className="visually-hidden">Timer läuft: </span>
        <Clock ms={ms} className="timer-pill__clock" />
        <span className="timer-pill__sub">{p.code} · {taskTitle || p.name}</span>
        <span className="visually-hidden"> – Zeiten öffnen</span>
      </a>
      <button ref={stopRef} type="button" className="timer-stop" onClick={onStop}
        aria-label={`Timer stoppen: ${p.code}, ${spoken}`} aria-keyshortcuts="t">
        <Square size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      </button>
    </div>
  );
}

// Seitenleiste: wechselt zwischen Ruhe und Lauf; der Fokus springt mit (Start → Stopp → Start).
// Fragt der Stopp erst nach (über 10 h: { pending }), übernimmt die Rückfrage auch den Fokus.
export default function TimerPill({ timerState, lastProject, onStart, onStop }) {
  const { timer, running, startedMs } = timerState;
  const startRef = useRef(null);
  const stopRef = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    const target = pending.current === 'stop' ? stopRef.current : pending.current === 'start' ? startRef.current : null;
    pending.current = null;
    target?.focus();
  }, [running]);

  if (!running) {
    return (
      <TimerStart project={lastProject} buttonRef={startRef}
        onStart={() => { pending.current = 'stop'; if (!onStart()?.started) pending.current = null; }} />
    );
  }
  return (
    <TimerRunning timer={timer} startedMs={startedMs} stopRef={stopRef}
      onStop={() => { pending.current = 'start'; const res = onStop(); if (!res || res.pending) pending.current = null; }} />
  );
}

// Handy-Kopf in Ruhe: sichtbarer Start, 44 px hoch – Play im violetten Kreis und „Timer starten“; das Projekt steht für
// Screenreader im Namen (sichtbar im Menü). Unter 360 px nur das Icon, der Name bleibt (shell.css).
export function TimerHeadStart({ project, onStart, buttonRef }) {
  const p = projectInfo(project);
  return (
    <button ref={buttonRef} type="button" className="timer-head" onClick={onStart} aria-keyshortcuts="t" data-timer-start="">
      <span className="timer-head__icon" aria-hidden="true"><Play size={14} strokeWidth={2.25} /></span>
      <span className="timer-head__label">Timer starten</span>
      <span className="visually-hidden"> mit {p.code} · {p.name}</span>
    </button>
  );
}

// Handy-Kopf, nur solange der Timer läuft: Laufzeit (Tippen öffnet Zeiten) und Stopp
export function TimerChip({ timerState, onStop }) {
  const { timer, startedMs } = timerState;
  const ms = useElapsed(startedMs, true);
  const p = projectInfo(timer.project);
  const spoken = spokenDuration(ms / 60000);
  return (
    <div className="timer-chip" role="group" aria-label="Timer">
      <a className="timer-chip__time" href={href('/zeit')}>
        <span className="visually-hidden">Timer läuft, {p.code}: </span>
        <Clock ms={ms} />
        <span className="visually-hidden"> – Zeiten öffnen</span>
      </a>
      <button type="button" className="timer-stop" onClick={onStop} aria-label={`Timer stoppen: ${p.code}, ${spoken}`}
        aria-keyshortcuts="t">
        <Square size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      </button>
    </div>
  );
}
