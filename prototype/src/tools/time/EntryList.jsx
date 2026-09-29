// Liste „Diese Woche“: nach Tag gruppiert, Summen je Tag und Woche; bearbeiten, löschen, rückgängig.
import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { fmtDuration } from '../../lib/format.js';
import ProjectSelect, { Swatch, projectInfo } from './ProjectSelect.jsx';
import { FieldError } from './ManualEntry.jsx';
import { dayTitle, durationMessage, endOf, parseDuration, sumMinutes, toInputDuration } from './timeUtils.js';

const UNDO_MS = 8000;
const INFO_MS = 4000;
const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
const context = e => `${projectInfo(e.project).code}, ${e.start} Uhr, ${fmtDuration(e.minutes)}`;

function EntryRow({ entry, onEdit, onDelete }) {
  const info = projectInfo(entry.project);
  return (
    <li className="tt-entry">
      <Swatch color={info.color} className="tt-entry-swatch" />
      <div className="tt-entry-main">
        <p className="tt-entry-title"><strong>{info.code}</strong> {info.name}</p>
        <p className="tt-entry-meta">
          <span className="num">{entry.start}–{endOf(entry)}</span>
          {entry.note ? <> · {entry.note}</> : null}
        </p>
      </div>
      <p className="tt-entry-dur num">{fmtDuration(entry.minutes)}</p>
      <div className="tt-entry-actions">
        <button
          id={`tt-edit-${entry.id}`} type="button" className="btn btn-ghost btn-icon" title="Bearbeiten"
          aria-label={`Bearbeiten: ${context(entry)}`} onClick={onEdit}
        >
          <Pencil aria-hidden="true" size={18} />
        </button>
        <button
          id={`tt-del-${entry.id}`} type="button" className="btn btn-ghost btn-icon tt-danger" title="Löschen"
          aria-label={`Löschen: ${context(entry)}`} onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={18} />
        </button>
      </div>
    </li>
  );
}

function EntryEditor({ entry, onSave, onCancel }) {
  const [duration, setDuration] = useState(toInputDuration(entry.minutes));
  const [project, setProject] = useState(entry.project);
  const [note, setNote] = useState(entry.note || '');
  const [error, setError] = useState('');
  const durationRef = useRef(null);
  const base = `tt-e-${entry.id}`;

  useEffect(() => {
    durationRef.current?.focus();
    durationRef.current?.select();
  }, []);

  const changeDuration = value => {
    setDuration(value);
    if (error) {
      const p = parseDuration(value);
      setError(p.error ? durationMessage[p.error] : '');
    }
  };

  const submit = ev => {
    ev.preventDefault();
    const p = parseDuration(duration);
    if (p.error) {
      setError(durationMessage[p.error]);
      durationRef.current?.focus();
      return;
    }
    onSave({ minutes: p.minutes, project, note: note.trim() });
  };

  return (
    <li className="tt-entry tt-entry-editing">
      <form
        className="tt-edit" noValidate onSubmit={submit} aria-label={`Eintrag bearbeiten: ${context(entry)}`}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }}
      >
        <div className="tt-edit-row">
          <div className="field">
            <label htmlFor={`${base}-dur`}>Dauer</label>
            <input
              id={`${base}-dur`} ref={durationRef} className="input" type="text" autoComplete="off" spellCheck={false}
              value={duration} onChange={e => changeDuration(e.target.value)}
              aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${base}-err` : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor={`${base}-project`}>Projekt</label>
            <ProjectSelect id={`${base}-project`} value={project} onChange={setProject} />
          </div>
        </div>
        <FieldError id={`${base}-err`}>{error}</FieldError>
        <div className="field">
          <label htmlFor={`${base}-note`}>Notiz <span className="tt-optional">(optional)</span></label>
          <input
            id={`${base}-note`} className="input" type="text" autoComplete="off" maxLength={200}
            value={note} onChange={e => setNote(e.target.value)}
          />
        </div>
        <div className="cluster">
          <button type="submit" className="btn btn-primary"><Check aria-hidden="true" size={18} />Speichern</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Abbrechen</button>
        </div>
      </form>
    </li>
  );
}

export default function EntryList({ entries, days, weekNo, onUpdate, onDelete, onRestore }) {
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const toastRef = useRef(null);
  const toastTimer = useRef(0);

  // Fokus erst nach dem Rendern setzen (Zeilen und Hinweis entstehen neu)
  useEffect(() => {
    if (!focusId) return;
    document.getElementById(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const dismiss = moveFocus => {
    clearTimeout(toastTimer.current);
    const hadFocus = toastRef.current?.contains(document.activeElement);
    setToast(null);
    if (hadFocus || moveFocus) setFocusId('tt-list-title');
  };
  const schedule = ms => {
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dismiss(false), ms);
  };
  const show = next => {
    setToast({ ...next, key: Date.now() });
    schedule(next.undo ? UNDO_MS : INFO_MS);
  };
  // Pause, solange die Maus darauf liegt oder der Tastaturfokus darin ist
  const keyboardFocusInside = () => {
    const el = document.activeElement;
    return Boolean(toastRef.current?.contains(el) && el.matches(':focus-visible'));
  };
  const toastEvents = {
    onMouseEnter: () => clearTimeout(toastTimer.current),
    onMouseLeave: () => { if (toast && !keyboardFocusInside()) schedule(INFO_MS); },
    onFocus: e => { if (e.target.matches(':focus-visible')) clearTimeout(toastTimer.current); },
    onBlur: e => { if (toast && !toastRef.current?.contains(e.relatedTarget)) schedule(INFO_MS); },
    onKeyDown: e => { if (e.key === 'Escape' && toast) { e.preventDefault(); dismiss(true); } },
  };

  const save = (entry, patch) => {
    onUpdate(entry.id, patch);
    setEditing(null);
    show({ text: `Geändert: ${context({ ...entry, ...patch })}.` });
    setFocusId(`tt-edit-${entry.id}`);
  };
  const cancel = entry => {
    setEditing(null);
    setFocusId(`tt-edit-${entry.id}`);
  };
  const remove = entry => {
    const index = onDelete(entry.id);
    show({ text: `Gelöscht: ${context(entry)}.`, undo: { entry, index } });
    setFocusId('tt-undo');
  };
  const undo = () => {
    const { entry, index } = toast.undo;
    onRestore(entry, index);
    show({ text: `Wiederhergestellt: ${context(entry)}.` });
    setFocusId(`tt-del-${entry.id}`);
  };

  const weekMinutes = sumMinutes(entries);
  const groups = days
    .filter(d => !d.isFuture)
    .reverse()
    .map(d => ({ day: d, list: entries.filter(e => e.date === d.iso).sort(byStart) }))
    .filter(g => g.list.length || g.day.isToday);

  return (
    <section className="card tt-card" aria-labelledby="tt-list-title">
      <div className="tt-card-head">
        <h2 id="tt-list-title" tabIndex={-1}>Diese Woche</h2>
        <p className="tt-weeksum">
          <span className="tt-weeksum-label">KW {weekNo} · Summe</span>
          <strong className="num">{fmtDuration(weekMinutes)}</strong>
        </p>
      </div>

      <div className="tt-toast-region" role="status" ref={toastRef} {...toastEvents}>
        {toast && (
          <div className="tt-toast" key={toast.key}>
            <p>{toast.text}</p>
            {toast.undo && (
              <button id="tt-undo" type="button" className="btn tt-toast-btn" onClick={undo}>
                <Undo2 aria-hidden="true" size={18} />
                Rückgängig
              </button>
            )}
          </div>
        )}
      </div>

      {groups.map(({ day, list }) => {
        const title = dayTitle(day.iso);
        return (
          <div className="tt-day" key={day.iso}>
            <h3 className="tt-day-head">
              <span>{title.name}</span>
              <span className="tt-day-date">{title.dm}</span>
              <span className="tt-day-sum num"><span className="visually-hidden">Summe </span>{fmtDuration(sumMinutes(list))}</span>
            </h3>
            {list.length ? (
              <ul className="tt-entries" role="list">
                {list.map(entry =>
                  editing === entry.id ? (
                    <EntryEditor key={entry.id} entry={entry} onSave={patch => save(entry, patch)} onCancel={() => cancel(entry)} />
                  ) : (
                    <EntryRow key={entry.id} entry={entry} onEdit={() => setEditing(entry.id)} onDelete={() => remove(entry)} />
                  ),
                )}
              </ul>
            ) : (
              <p className="tt-empty">Noch nichts erfasst. Timer starten oder Zeit nachtragen.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
