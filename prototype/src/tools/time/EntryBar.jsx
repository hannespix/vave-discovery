// Eine Leiste für beide Wege zur Zeit: Umschalter „Timer | Nachtragen“. Projekt und Notiz liegen im gemeinsamen Entwurf
// (draft, gehalten von TimeTracker) – beim Moduswechsel bleibt das Projekt stehen. Der Timer ist der gemeinsame aus
// lib/timer.js (useTimer): Pille, Palette und Aufgaben starten und stoppen denselben, diese Leiste folgt dem Speicher.
// Stopp und Speichern wertet TimeTracker aus (onStop, onSave) und meldet über note/say in der Bestätigung hier.
// Regeln aus lib/timer.js: unter 1 min wird nichts gebucht; ab 10 h stoppt der Knopf nicht selbst, sondern die Hülle
// fragt nach (TIMER_GUARD) – ganz buchen, bis Feierabend oder verwerfen; über 24 h ist „ganz buchen“ gesperrt.
import { useEffect, useRef, useState } from 'react';
import { Play, Plus, Square, TriangleAlert } from 'lucide-react';
import { LONG_RUN_MS, MAX_BOOK_MS, clockOf, useElapsed } from '../../lib/timer.js';
import { fmtClock, fmtDuration, isoDay } from '../../lib/format.js';
import { uid } from '../../lib/store.js';
import { me } from '../../data/sample.js';
import ProjectSelect, { projectInfo } from './ProjectSelect.jsx';
import Confirmation, { makeNote } from './Confirmation.jsx';
import { DurationField, FieldError } from './fields.jsx';
import { parseDuration, toInputDuration } from './duration.js';
import { dayPhrase, fromMinutes, minutesNow, suggestStart, toMinutes, todayIso } from './timeUtils.js';

// „09:00“ für heute, sonst mit Datum: „Samstag, 26.09., 09:00“
export const since = date => (isoDay(date) === isoDay(new Date()) ? clockOf(date) : `${dayPhrase(isoDay(date))}, ${clockOf(date)}`);

// Laufzeit mit festen Ziffernzellen (Readex Pro hat keine Tabellenziffern) – eigene Komponente, damit nur sie im
// Sekundentakt neu zeichnet
function RunClock({ startedMs, running }) {
  const ms = useElapsed(startedMs, running);
  const clock = fmtClock(Math.floor(ms / 1000));
  return (
    <p className="tt-clock" data-running={running}>
      <span className="visually-hidden">Laufzeit {clock}</span>
      <span className="tt-clock-digits" aria-hidden="true">
        {[...clock].map((ch, i) => <span key={i} className={ch === ':' ? 'tt-clock-sep' : 'tt-clock-digit'}>{ch}</span>)}
      </span>
    </p>
  );
}

// 0 = normal, 1 = über 10 h, 2 = über 24 h – zeichnet nur an den beiden Schwellen neu, nicht jede Sekunde
function useRunStage(startedMs, running) {
  const [, redraw] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const now = Date.now();
    const ids = [LONG_RUN_MS, MAX_BOOK_MS]
      .map(limit => startedMs + limit - now)
      .filter(wait => wait > 0)
      .map(wait => setTimeout(() => redraw(x => x + 1), wait + 50));
    const onVisible = () => { if (!document.hidden) redraw(x => x + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { ids.forEach(clearTimeout); document.removeEventListener('visibilitychange', onVisible); };
  }, [running, startedMs]);
  const run = running ? Date.now() - startedMs : 0;
  return run > MAX_BOOK_MS ? 2 : run > LONG_RUN_MS ? 1 : 0;
}

const comboLabel = (combo, taskTitle) => taskTitle(combo.task) || combo.note || projectInfo(combo.project).name;

function TimerMode({ timer, shownProject, draft, setDraft, recent, combos, taskTitle, todayMinutes, onStart, onStop, onQuick }) {
  const { running, startedMs } = timer;
  const t = timer.timer;
  const stage = useRunStage(startedMs, running);
  const note = running ? String(t.note ?? '') : draft.note;
  const task = running ? taskTitle(t.task) : '';

  const changeNote = value => (running ? timer.update({ note: value }) : setDraft(d => ({ ...d, note: value })));
  const changeProject = value => {
    setDraft(d => ({ ...d, project: value }));
    if (!running) return;
    // Aufgabe gehört zum alten Projekt: beim Umstellen fällt sie weg
    timer.update(t.task && value !== t.project ? { project: value, task: undefined } : { project: value });
  };

  return (
    <>
      <div className="tt-timer">
        <div className="tt-timer-what">
          <input
            id="tt-what" className="input" type="text" autoComplete="off" maxLength={200} enterKeyHint="go"
            placeholder="Woran arbeitest du?" aria-label="Woran arbeitest du?" value={note}
            onChange={e => changeNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !running) { e.preventDefault(); onStart(); } }}
          />
          {task && <p className="meta tt-timer-task">Aufgabe: {task}</p>}
        </div>
        <div className="tt-timer-project">
          <ProjectSelect id="tt-project" label="Projekt" value={shownProject} recent={recent} onChange={changeProject} />
        </div>
        <div className="tt-timer-run">
          <div className="tt-clock-box">
            <RunClock startedMs={startedMs} running={running} />
            <p className="meta tt-clock-sub">
              {running ? `seit ${since(new Date(startedMs))} Uhr` : `heute ${fmtDuration(todayMinutes)}`}
            </p>
          </div>
          <button
            type="button" className="tt-go" data-running={running} onClick={running ? onStop : onStart}
            aria-label={running ? 'Timer stoppen' : 'Timer starten'} title={running ? 'Stoppen' : 'Starten'}
          >
            {running
              ? <Square aria-hidden="true" size={22} fill="currentColor" />
              : <Play aria-hidden="true" size={24} fill="currentColor" />}
          </button>
        </div>
      </div>

      {stage > 0 && (
        <p className="tt-longrun">
          <TriangleAlert aria-hidden="true" size={20} />
          <span>
            <strong>{stage === 2 ? 'Läuft seit über 24 h – vergessen?' : 'Läuft seit über 10 h – vergessen?'}</strong>{' '}
            {stage === 2 ? 'Beim Stoppen kommt eine Rückfrage – ganz buchen geht nicht mehr.' : 'Beim Stoppen kommt eine Rückfrage, was gebucht wird.'}
          </span>
        </p>
      )}

      {combos.length > 0 && (
        <div className="tt-quick">
          <p className="overline" id="tt-quick-title">Zuletzt</p>
          <ul className="tt-quick-list" role="list" aria-labelledby="tt-quick-title">
            {combos.map(c => {
              const info = projectInfo(c.project);
              const label = comboLabel(c, taskTitle);
              return (
                <li key={c.key}>
                  <button
                    type="button" className="chip tt-chip" onClick={() => onQuick(c)}
                    aria-label={`Timer starten: ${info.code}, ${label}`}
                  >
                    <Play aria-hidden="true" size={12} fill="currentColor" className="tt-chip-play" />
                    <span className="tt-chip-code">{info.code}</span>
                    <span className="tt-chip-label">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function validate({ date, start, duration, today }) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'Bitte ein Datum wählen.';
  else if (date > today) errors.date = 'Das Datum liegt in der Zukunft. Nachtragen geht bis heute.';
  if (toMinutes(start) == null) errors.start = 'Bitte eine Uhrzeit für den Beginn wählen, zum Beispiel 09:00.';
  if (parseDuration(duration).error) errors.duration = true; // Text steht am Dauerfeld selbst
  return errors;
}

function ManualMode({ draft, setDraft, shownProject, recent, mine, focusReq, onSave }) {
  const today = todayIso();
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);
  const refs = { date: useRef(null), start: useRef(null), duration: useRef(null) };
  const submitRef = useRef(null);
  const set = patch => setDraft(d => ({ ...d, ...patch }));

  // Beginn: bis zur ersten eigenen Eingabe das Ende des letzten Eintrags an diesem Tag – heute aber nie so, dass das
  // Ende in der Zukunft liegt (der Vorschlag rückt mit der getippten Dauer in eine Lücke davor)
  const parsed = parseDuration(draft.duration);
  const start = draft.start ?? suggestStart(mine, draft.date, {
    minutes: parsed.error ? 0 : parsed.minutes,
    nowMin: draft.date === today ? minutesNow() : null,
  });
  const startMin = toMinutes(start);
  const end = startMin != null && !parsed.error ? fromMinutes(startMin + parsed.minutes) : '';
  const errors = validate({ date: draft.date, start, duration: draft.duration, today });
  const shown = submitted ? errors : {};

  // Ende statt Dauer: Differenz zum Beginn (über Mitternacht zählt bis zum nächsten Tag)
  const changeEnd = value => {
    const e = toMinutes(value);
    if (e == null || startMin == null) return;
    const diff = (e - startMin + 1440) % 1440;
    set({ duration: toInputDuration(diff) });
  };

  // Ankommen über #/zeit/nachtragen/… oder nach einem Timer über 24 h: Fokus ins erste leere bzw. ins Dauerfeld
  useEffect(() => {
    if (!focusReq) return;
    const form = formRef.current;
    if (!form) return;
    const target = focusReq.target === 'duration'
      ? refs.duration.current
      : [...form.querySelectorAll('input')].find(el => !el.value) ?? refs.duration.current;
    target?.focus();
  }, [focusReq?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = ev => {
    ev.preventDefault();
    setSubmitted(true);
    const first = ['date', 'start', 'duration'].find(k => errors[k]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    const entry = {
      id: uid(), date: draft.date, start, minutes: parsed.minutes, project: shownProject, note: draft.note.trim(), person: me.id,
    };
    onSave(entry);
    set({ duration: '', note: '', start: null });
    setSubmitted(false);
    // Fokus: mit Tastatur zurück auf „Dauer“ für den nächsten Eintrag. Am Touch-Gerät bleibt er auf dem Knopf –
    // sonst öffnet sich die Bildschirmtastatur wieder und verdeckt die Bestätigung.
    const touch = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
    (touch ? submitRef : refs.duration).current?.focus({ preventScroll: true });
  };

  const describe = id => (shown[id] ? `tt-m-${id}-err` : undefined);
  return (
    <form ref={formRef} className="tt-manual" noValidate onSubmit={submit}>
      <div className="tt-manual-when">
        <div className="field">
          <label htmlFor="tt-m-date">Datum</label>
          <input
            id="tt-m-date" ref={refs.date} className="input" type="date" max={today} value={draft.date}
            onChange={e => set({ date: e.target.value })}
            aria-invalid={shown.date ? 'true' : undefined} aria-describedby={describe('date')}
          />
          <FieldError id="tt-m-date-err">{shown.date}</FieldError>
        </div>
        <div className="field">
          <label htmlFor="tt-m-start">Beginn</label>
          <input
            id="tt-m-start" ref={refs.start} className="input" type="time" value={start}
            onChange={e => set({ start: e.target.value })}
            aria-invalid={shown.start ? 'true' : undefined} aria-describedby={describe('start')}
          />
          <FieldError id="tt-m-start-err">{shown.start}</FieldError>
        </div>
        <DurationField
          id="tt-m-dur" label="Dauer" value={draft.duration} inputRef={refs.duration} forceError={submitted}
          onChange={value => set({ duration: value })}
        />
        <div className="field">
          <label htmlFor="tt-m-end">Ende <span className="tt-optional">(oder)</span></label>
          <input id="tt-m-end" className="input" type="time" value={end} onChange={e => changeEnd(e.target.value)} />
        </div>
      </div>
      <div className="tt-manual-what">
        <div className="field tt-manual-project">
          <label htmlFor="tt-m-project">Projekt</label>
          <ProjectSelect id="tt-m-project" value={shownProject} recent={recent} onChange={value => set({ project: value })} />
        </div>
        <div className="field tt-manual-note">
          <label htmlFor="tt-m-note">Notiz <span className="tt-optional">(optional)</span></label>
          <input
            id="tt-m-note" className="input" type="text" autoComplete="off" maxLength={200}
            placeholder="Woran hast du gearbeitet?" value={draft.note} onChange={e => set({ note: e.target.value })}
          />
        </div>
        <button ref={submitRef} type="submit" className="btn btn-primary tt-save">
          <Plus aria-hidden="true" size={20} />
          Speichern
        </button>
      </div>
    </form>
  );
}

// note/say: Bestätigung in der Leiste (gehalten von TimeTracker, damit auch Stopps aus der Liste hier landen können).
// say(note, timerKey?) – Hinweise gehören zu einem Timer-Zustand und verschwinden, wenn der Timer von außen wechselt.
export default function EntryBar({
  mode, onMode, timer, draft, setDraft, shownProject, recent, combos, taskTitle, mine, todayMinutes, focusReq,
  note, say, onClearNote, onStop, onSave,
}) {
  const alreadyRunning = () => {
    const t = timer.timer;
    const info = projectInfo(t.project);
    const what = String(t.note ?? '').trim() || taskTitle(t.task);
    say(makeNote('warn', `Es läuft schon ein Timer: ${info.code}${what ? ` · ${what}` : ''}, seit ${since(new Date(timer.startedMs))} Uhr. ` +
      'Erst stoppen, dann neu starten.'));
  };

  const startWith = combo => {
    if (timer.running) { alreadyRunning(); return; }
    const r = timer.start(combo);
    if (r.already) { alreadyRunning(); return; }
    const info = projectInfo(combo.project);
    say(makeNote('info', `Timer läuft: ${info.code} · ${info.name}.`), r.started.startedAt);
  };

  const start = () => {
    startWith({ project: shownProject, note: draft.note });
    if (!timer.running) setDraft(d => ({ ...d, note: '' }));
  };

  const switchTo = next => {
    if (next === mode) return;
    onClearNote();
    onMode(next);
  };

  return (
    <section className="tt-bar" aria-label="Zeit erfassen" data-mode={mode} data-running={timer.running}>
      <div className="tt-bar-top">
        <div className="switch" role="group" aria-label="Art der Erfassung">
          <button type="button" aria-pressed={mode === 'timer'} onClick={() => switchTo('timer')}>Timer</button>
          <button type="button" aria-pressed={mode === 'manual'} onClick={() => switchTo('manual')}>Nachtragen</button>
        </div>
        {timer.running && mode === 'manual' && (
          <p className="meta tt-bar-running"><span className="tt-live-dot" aria-hidden="true" />Timer läuft</p>
        )}
      </div>
      {mode === 'timer' ? (
        <TimerMode
          timer={timer} shownProject={shownProject} draft={draft} setDraft={setDraft} recent={recent} combos={combos}
          taskTitle={taskTitle} todayMinutes={todayMinutes} onStart={start} onStop={() => onStop()} onQuick={startWith}
        />
      ) : (
        <ManualMode
          draft={draft} setDraft={setDraft} shownProject={shownProject} recent={recent} mine={mine}
          focusReq={focusReq} onSave={onSave}
        />
      )}
      <Confirmation note={note} />
    </section>
  );
}
