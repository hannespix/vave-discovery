import { useEffect, useState } from 'react';
import { uid, useStoredState } from './store.js';
import { cleanEntries, cleanTimer } from './data.js';
import { isoDay } from './format.js';
import { me, timeEntries as sampleEntries } from '../data/sample.js';

// Ein Timer für die ganze App (r07): Seitenleiste/Kopf, Zeiten, Heute, Aufgaben und Befehlspalette teilen den Zustand
// unter 'timer' (abgeglichen über useStoredState). Regeln wie in r06 (K2):
//   – nur ein Timer zur Zeit; Start bei laufendem Timer tut nichts und meldet { already }
//   – Stopp bucht einen Eintrag in 'time-entries' (mindestens 1 min, Tag und Beginn = Start)
//   – über 24 h bucht Stopp nichts und liefert { overlong, date, start, … } zum Nachtragen
//   – ab 10 h gilt der Lauf als „vergessen?“ (LONG_RUN_MS)
// Einträge merken sich optional die Aufgabe (task) – für „Buchen aus der Aufgabe“ und Schätzung gegen gebucht.

export const LONG_RUN_MS = 10 * 3600 * 1000;
export const MAX_BOOK_MS = 24 * 3600 * 1000;
const pad = n => String(n).padStart(2, '0');
export const clockOf = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export function useTimer() {
  const [timer, setTimer] = useStoredState('timer', null, cleanTimer);
  const [, setEntries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const running = Boolean(timer);
  // Start in der Zukunft (verstellte Uhr, fremder Speicher) zählt ab jetzt – nie an einem künftigen Tag buchen
  const startedMs = running ? Math.min(Date.parse(timer.startedAt), Date.now()) : 0;

  const start = ({ project, task = null, note = '' }) => {
    if (running) return { already: true, timer };
    const next = { project, note: String(note).trim(), startedAt: new Date().toISOString(), ...(task ? { task } : {}) };
    setTimer(next);
    return { started: next };
  };

  // Laufenden Timer ändern (falsches Projekt gestartet? einfach umstellen)
  const update = patch => { if (running) setTimer({ ...timer, ...patch }); };

  const stop = () => {
    if (!running) return null;
    const stoppedAt = Date.now();
    const started = new Date(startedMs);
    const base = {
      date: isoDay(started), start: clockOf(started), project: timer.project,
      note: String(timer.note ?? '').trim(), ...(timer.task ? { task: timer.task } : {}),
    };
    setTimer(null);
    if (stoppedAt - startedMs > MAX_BOOK_MS) return { overlong: true, ...base };
    const entry = { id: uid(), ...base, minutes: Math.max(1, Math.round((stoppedAt - startedMs) / 60000)), person: me.id };
    setEntries(list => [entry, ...(Array.isArray(list) ? list : [])]);
    return { entry };
  };

  const discard = () => setTimer(null);

  return { timer, running, startedMs, start, update, stop, discard };
}

// Laufzeit in ms, im Sekundentakt auf volle Sekunden ab Start ausgerichtet; nach Tab-Wechsel sofort neu
export function useElapsed(startedMs, running) {
  const [now, setNow] = useState(() => Date.now());
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
  return running ? Math.max(0, now - startedMs) : 0;
}
