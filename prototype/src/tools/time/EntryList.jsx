// Ansicht „Liste“: Einträge dieser Woche nach Tag, mit Tagessumme. Zeilen zweizeilig (Notiz bzw. Aufgabe, darunter
// Projektpunkt, Code und Zeit). Aktionen: Fortsetzen, Bearbeiten (Panel an der Zeile), Löschen mit Rückgängig.
// flash = { id, date }: der zuletzt gespeicherte Eintrag und die Summe seines Tages tragen data-highlight (Limette).
import { useEffect, useRef, useState } from 'react';
import { Pencil, Play, Trash2 } from 'lucide-react';
import { fmtDuration } from '../../lib/format.js';
import ProjectSelect, { Dot, projectInfo } from './ProjectSelect.jsx';
import { DurationField, FieldError } from './fields.jsx';
import { parseDuration, toInputDuration } from './duration.js';
import { dayTitle, endOf, rowId, sumMinutes, toMinutes, todayIso } from './timeUtils.js';

const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
const context = e => `${projectInfo(e.project).code}, ${e.start} Uhr, ${fmtDuration(e.minutes)}`;
const flagAttr = flag => (flag ? 'true' : undefined);

// Titel einer Zeile: Aufgabe, sonst Notiz, sonst Projektname
export function entryTitle(entry, taskTitle) {
  return taskTitle(entry.task) || String(entry.note ?? '').trim() || projectInfo(entry.project).name;
}

function EntryRow({ entry, taskTitle, highlight, onResume, onEdit, onDelete }) {
  const info = projectInfo(entry.project);
  const title = entryTitle(entry, taskTitle);
  const task = taskTitle(entry.task);
  const note = String(entry.note ?? '').trim();
  const label = `${title}, ${context(entry)}`;
  // tabIndex -1: „Anzeigen“ in der Bestätigung setzt den Fokus hierher
  return (
    <li id={rowId(entry.id)} className="tt-row" tabIndex={-1} data-highlight={flagAttr(highlight)}>
      <div className="tt-row-main">
        <p className="tt-row-title">{title}</p>
        <p className="tt-row-meta">
          <Dot color={info.color} />
          <span className="tt-row-code">{info.code}</span>
          <span className="num">{entry.start}–{endOf(entry)}</span>
          {task && note && note !== task ? <span className="tt-row-note">{note}</span> : null}
        </p>
      </div>
      <p className="tt-row-dur num">{fmtDuration(entry.minutes)}</p>
      <div className="tt-row-actions">
        <button type="button" className="btn btn-ghost btn-icon" title="Fortsetzen" aria-label={`Fortsetzen: ${label}`} onClick={onResume}>
          <Play aria-hidden="true" size={18} />
        </button>
        <button
          id={`tt-edit-${entry.id}`} type="button" className="btn btn-ghost btn-icon" title="Bearbeiten"
          aria-label={`Bearbeiten: ${label}`} onClick={onEdit}
        >
          <Pencil aria-hidden="true" size={18} />
        </button>
        <button
          id={`tt-del-${entry.id}`} type="button" className="btn btn-ghost btn-icon tt-danger" title="Löschen"
          aria-label={`Löschen: ${label}`} onClick={onDelete}
        >
          <Trash2 aria-hidden="true" size={18} />
        </button>
      </div>
    </li>
  );
}

// Bearbeiten als Panel direkt an der Zeile: Dauer mit Echo, Beginn, Datum, Projekt, Notiz. Links „Löschen“, rechts „Speichern“.
function EntryEditor({ entry, taskOf, onSave, onCancel, onDelete }) {
  const [duration, setDuration] = useState(toInputDuration(Number(entry.minutes) || 0));
  const [start, setStart] = useState(entry.start || '09:00');
  const [date, setDate] = useState(entry.date);
  const [project, setProject] = useState(entry.project);
  const [note, setNote] = useState(String(entry.note ?? ''));
  const [submitted, setSubmitted] = useState(false);
  const durationRef = useRef(null);
  const base = `tt-e-${entry.id}`;
  const today = todayIso();
  const task = taskOf(entry.task);
  const dropsTask = Boolean(task && task.project !== project);

  useEffect(() => {
    durationRef.current?.focus();
    durationRef.current?.select();
  }, []);

  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'Bitte ein Datum wählen.';
  else if (date > today) errors.date = 'Das Datum liegt in der Zukunft.';
  if (toMinutes(start) == null) errors.start = 'Bitte eine Uhrzeit wählen, zum Beispiel 09:00.';
  const parsed = parseDuration(duration);
  const shown = submitted ? errors : {};

  const submit = ev => {
    ev.preventDefault();
    setSubmitted(true);
    if (parsed.error) { durationRef.current?.focus(); return; }
    if (errors.start) { document.getElementById(`${base}-start`)?.focus(); return; }
    if (errors.date) { document.getElementById(`${base}-date`)?.focus(); return; }
    const patch = { minutes: parsed.minutes, start, date, project, note: note.trim() };
    if (dropsTask) patch.task = undefined;
    onSave(patch);
  };

  return (
    <li className="tt-row-editing">
      <form
        className="panel tt-edit" noValidate onSubmit={submit} aria-label={`Eintrag bearbeiten: ${context(entry)}`}
        onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onCancel(); } }}
      >
        <div className="tt-edit-grid">
          <DurationField
            id={`${base}-dur`} label="Dauer" value={duration} inputRef={durationRef} forceError={submitted}
            onChange={setDuration} hint=""
          />
          <div className="field">
            <label htmlFor={`${base}-start`}>Beginn</label>
            <input
              id={`${base}-start`} className="input" type="time" value={start} onChange={e => setStart(e.target.value)}
              aria-invalid={shown.start ? 'true' : undefined} aria-describedby={shown.start ? `${base}-start-err` : undefined}
            />
            <FieldError id={`${base}-start-err`}>{shown.start}</FieldError>
          </div>
          <div className="field">
            <label htmlFor={`${base}-date`}>Datum</label>
            <input
              id={`${base}-date`} className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)}
              aria-invalid={shown.date ? 'true' : undefined} aria-describedby={shown.date ? `${base}-date-err` : undefined}
            />
            <FieldError id={`${base}-date-err`}>{shown.date}</FieldError>
          </div>
        </div>
        <div className="field">
          <label htmlFor={`${base}-project`}>Projekt</label>
          <ProjectSelect id={`${base}-project`} value={project} onChange={setProject} describedBy={task ? `${base}-task` : undefined} />
          {task && (
            <p id={`${base}-task`} className="meta">
              {dropsTask ? `Aufgabe „${task.title}“ gehört zu einem anderen Projekt und wird beim Speichern entfernt.` : `Aufgabe: ${task.title}`}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${base}-note`}>Notiz <span className="tt-optional">(optional)</span></label>
          <input
            id={`${base}-note`} className="input" type="text" autoComplete="off" maxLength={200}
            value={note} onChange={e => setNote(e.target.value)}
          />
        </div>
        <div className="tt-edit-actions">
          <button type="button" className="btn btn-ghost tt-edit-delete" onClick={onDelete}>
            <Trash2 aria-hidden="true" size={18} />
            Löschen
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Abbrechen</button>
          <button type="submit" className="btn btn-primary">Speichern</button>
        </div>
      </form>
    </li>
  );
}

export default function EntryList({ entries, days, flash, taskOf, taskTitle, onResume, onUpdate, onDelete, notify }) {
  const [editing, setEditing] = useState(null);
  const [focusId, setFocusId] = useState(null);

  // Fokus erst nach dem Rendern setzen (Zeilen entstehen neu)
  useEffect(() => {
    if (!focusId) return;
    document.getElementById(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  const save = (entry, patch) => {
    onUpdate(entry.id, patch);
    setEditing(null);
    const moved = patch.date !== entry.date && !days.some(d => d.iso === patch.date);
    notify({ text: `Geändert: ${context({ ...entry, ...patch })}.${moved ? ' Der Tag liegt außerhalb dieser Woche.' : ''}` });
    setFocusId(moved ? 'tt-list-title' : `tt-edit-${entry.id}`);
  };
  const cancel = entry => {
    setEditing(null);
    setFocusId(`tt-edit-${entry.id}`);
  };
  const remove = entry => {
    setEditing(null);
    onDelete(entry);
  };

  const groups = days
    .filter(d => !d.isFuture)
    .reverse()
    .map(d => ({ day: d, list: entries.filter(e => e.date === d.iso).sort(byStart) }))
    .filter(g => g.list.length || g.day.isToday);

  return (
    <section className="tt-list" aria-labelledby="tt-list-title">
      <h2 id="tt-list-title" tabIndex={-1} className="visually-hidden">Einträge dieser Woche</h2>
      {groups.map(({ day, list }) => {
        const title = dayTitle(day.iso);
        return (
          <section className="tt-day" key={day.iso} aria-labelledby={`tt-day-${day.iso}`}>
            <div className="tt-day-head">
              <h3 id={`tt-day-${day.iso}`} className="tt-day-title">
                {title.name} <span className="tt-day-date">{title.dm}</span>
              </h3>
              <p className="tt-day-sum num" data-highlight={flagAttr(flash?.date === day.iso)}>
                <span className="visually-hidden">Summe </span>{fmtDuration(sumMinutes(list))}
              </p>
            </div>
            {list.length ? (
              <ul className="list tt-rows" role="list">
                {list.map(entry =>
                  editing === entry.id ? (
                    <EntryEditor
                      key={entry.id} entry={entry} taskOf={taskOf}
                      onSave={patch => save(entry, patch)} onCancel={() => cancel(entry)} onDelete={() => remove(entry)}
                    />
                  ) : (
                    <EntryRow
                      key={entry.id} entry={entry} taskTitle={taskTitle} highlight={Boolean(flash?.id) && flash.id === entry.id}
                      onResume={() => onResume(entry)} onEdit={() => setEditing(entry.id)} onDelete={() => remove(entry)}
                    />
                  ),
                )}
              </ul>
            ) : (
              <p className="tt-empty meta">Noch nichts erfasst. Timer starten oder Zeit nachtragen.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}
