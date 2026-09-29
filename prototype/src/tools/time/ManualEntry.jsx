// Nachtragen: Datum, Beginn, Dauer (1:30 · 90 · 1,5 · 1,5 h), Projekt, Notiz. Fehler stehen am Feld.
import { useRef, useState } from 'react';
import { CircleAlert, Plus } from 'lucide-react';
import { uid } from '../../lib/store.js';
import { fmtDuration } from '../../lib/format.js';
import { me } from '../../data/sample.js';
import ProjectSelect, { projectInfo } from './ProjectSelect.jsx';
import { dayTitle, durationMessage, endOf, parseDuration, suggestStart, toMinutes, todayIso } from './timeUtils.js';

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="tt-error">
      <CircleAlert aria-hidden="true" size={18} />
      <span>{children}</span>
    </p>
  );
}

function validate({ date, start, duration, today }) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'Bitte ein Datum wählen.';
  else if (date > today) errors.date = 'Das Datum liegt in der Zukunft. Nachtragen geht bis heute.';
  if (toMinutes(start) == null) errors.start = 'Bitte eine Uhrzeit für den Beginn wählen, zum Beispiel 09:00.';
  const d = parseDuration(duration);
  if (d.error) errors.duration = durationMessage[d.error];
  return errors;
}

const describe = (...ids) => ids.filter(Boolean).join(' ') || undefined;

export default function ManualEntry({ entries, onAdd, defaultProject, weekStartIso }) {
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [startInput, setStartInput] = useState(null); // null = Vorschlag verwenden
  const [duration, setDuration] = useState('');
  const [project, setProject] = useState(defaultProject);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState('');
  const refs = { date: useRef(null), start: useRef(null), duration: useRef(null) };

  // Beginn: bis zur ersten eigenen Eingabe das Ende des letzten Eintrags an diesem Tag
  const start = startInput ?? suggestStart(entries, date);
  const errors = validate({ date, start, duration, today });
  const shown = submitted ? errors : {};
  const parsed = parseDuration(duration);
  const hint = duration.trim() && parsed.minutes ? `Ergibt ${fmtDuration(parsed.minutes)}.` : 'Zum Beispiel 1:30, 90, 1,5 oder 1,5 h.';

  const submit = ev => {
    ev.preventDefault();
    setSubmitted(true);
    const first = ['date', 'start', 'duration'].find(k => errors[k]);
    if (first) {
      setSaved('');
      refs[first].current?.focus();
      return;
    }
    const entry = { id: uid(), date, start, minutes: parsed.minutes, project, note: note.trim(), person: me.id };
    onAdd(entry);
    const info = projectInfo(project);
    let message = `Gespeichert: ${fmtDuration(entry.minutes)} auf ${info.code}, ${dayTitle(date).long}, ${start}–${endOf(entry)} Uhr.`;
    if (date < weekStartIso) message += ' Der Tag liegt vor dieser Woche und steht deshalb nicht in der Liste.';
    setSaved(message);
    setDuration('');
    setNote('');
    setStartInput(null);
    setSubmitted(false);
    // Fokus bleibt im Formular, auf dem Feld für den nächsten Eintrag
    refs.duration.current?.focus();
  };

  return (
    <section className="card tt-card" aria-labelledby="tt-manual-title">
      <h2 id="tt-manual-title">Nachtragen</h2>
      <form className="tt-form" noValidate onSubmit={submit}>
        <div className="tt-form-row">
          <div className="field">
            <label htmlFor="tt-m-date">Datum</label>
            <input
              id="tt-m-date" ref={refs.date} className="input" type="date" max={today} value={date}
              onChange={e => setDate(e.target.value)}
              aria-invalid={shown.date ? 'true' : undefined} aria-describedby={describe(shown.date && 'tt-m-date-err')}
            />
            <FieldError id="tt-m-date-err">{shown.date}</FieldError>
          </div>
          <div className="field">
            <label htmlFor="tt-m-start">Beginn</label>
            <input
              id="tt-m-start" ref={refs.start} className="input" type="time" value={start}
              onChange={e => setStartInput(e.target.value)}
              aria-invalid={shown.start ? 'true' : undefined} aria-describedby={describe(shown.start && 'tt-m-start-err')}
            />
            <FieldError id="tt-m-start-err">{shown.start}</FieldError>
          </div>
          <div className="field tt-form-dur">
            <label htmlFor="tt-m-dur">Dauer</label>
            <input
              id="tt-m-dur" ref={refs.duration} className="input" type="text" autoComplete="off" spellCheck={false}
              value={duration} onChange={e => setDuration(e.target.value)}
              aria-invalid={shown.duration ? 'true' : undefined}
              aria-describedby={shown.duration ? 'tt-m-dur-err' : 'tt-m-dur-hint'}
            />
            <FieldError id="tt-m-dur-err">{shown.duration}</FieldError>
            {!shown.duration && <p id="tt-m-dur-hint" className="tt-hint">{hint}</p>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="tt-m-project">Projekt</label>
          <ProjectSelect id="tt-m-project" value={project} onChange={setProject} />
        </div>
        <div className="field">
          <label htmlFor="tt-m-note">Notiz <span className="tt-optional">(optional)</span></label>
          <input
            id="tt-m-note" className="input" type="text" autoComplete="off" maxLength={200}
            value={note} onChange={e => setNote(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary tt-submit">
          <Plus aria-hidden="true" size={20} />
          Zeit eintragen
        </button>
        <p className="tt-saved" role="status">{saved}</p>
      </form>
    </section>
  );
}
