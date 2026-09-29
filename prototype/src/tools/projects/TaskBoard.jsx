// Aufgaben-Board: vier Spalten, Aufgabe anlegen, Verschieben per Ziehen (Maus: ganze Karte, Finger/Stift: Griff)
// und gleichwertig ohne Ziehen über das Status-Feld jeder Karte; Löschen mit Rückgängig; jede Änderung per aria-live.
// Nach Verschieben, Anlegen, Wiederherstellen und tiefem Link (taskId) bleibt die Karte im Bild und wird kurz markiert.
// Daten: Schlüssel 'tasks' (useStoredState im Elternteil) – Form { id, project, title, status, assignee, due } bleibt unverändert.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AlarmClock, CalendarDays, CircleAlert, Clock, GripVertical, Plus, Trash2, Undo2, X } from 'lucide-react';
import { people, statusLabel, studios } from '../../data/sample.js';
import { uid } from '../../lib/store.js';
import { addDays, isoDay } from '../../lib/format.js';
import { STATUSES, daysUntil, fmtDayShort, personById, relDays } from './helpers.js';
import { Avatar } from './parts.jsx';

const dueKey = t => (typeof t.due === 'string' && t.due) || '9999';
const byDue = (a, b) => dueKey(a).localeCompare(dueKey(b)) || a.title.localeCompare(b.title, 'de');
const LANDED_MS = 2000; // so lange bleibt die Markierung „hier gelandet“ stehen
const INTERACTIVE = 'button, select, input, textarea, a, label';
const EDGE = 24; // Randzone für automatisches Scrollen beim Ziehen (px) – schmaler als die angeschnittene Nachbarspalte
// Je näher am Rand, desto schneller (1–10 px je Bild); so bleibt die Nachbarspalte als Ziel treffbar
const edgeSpeed = dist => (dist < EDGE ? Math.min(10, Math.ceil(((EDGE - dist) / EDGE) * 10)) : 0);

function DueLine({ task }) {
  const n = daysUntil(task.due);
  if (n === null) return null;
  const open = task.status !== 'done';
  if (open && n < 0) {
    return (
      <p className="pj-due is-overdue">
        <AlarmClock size={16} aria-hidden="true" />
        <span><strong>Überfällig</strong> seit {n === -1 ? 'gestern' : `${-n} Tagen`} · {fmtDayShort(task.due)}</span>
      </p>
    );
  }
  if (open && n === 0) {
    return <p className="pj-due is-today"><Clock size={16} aria-hidden="true" /><span><strong>Heute fällig</strong></span></p>;
  }
  return (
    <p className="pj-due">
      <CalendarDays size={16} aria-hidden="true" />
      <span className="num">Fällig {fmtDayShort(task.due)} ({relDays(n)})</span>
    </p>
  );
}

function TaskCard({ task, dragging, landed, onStatus, onDelete, pointer }) {
  const selectId = useId();
  const person = personById[task.assignee];
  const n = daysUntil(task.due);
  const overdue = task.status !== 'done' && n !== null && n < 0;
  const cls = `pj-task${overdue ? ' is-overdue' : ''}${dragging ? ' is-dragging' : ''}${landed ? ' is-landed' : ''}`;
  // tabIndex -1: Ziel für den Fokus nach einem tiefen Link, nicht in der Tab-Reihenfolge
  return (
    <li className={cls} data-task={task.id} tabIndex={-1} {...pointer}>
      <div className="pj-task-head">
        <p className="pj-task-title">{task.title}</p>
        <span className="pj-grip" data-grip="" title="Ziehen, um die Aufgabe zu verschieben" aria-hidden="true">
          <GripVertical size={20} />
        </span>
      </div>
      <p className="pj-task-meta"><Avatar person={person} /> {person ? person.name : 'Niemand zugewiesen'}</p>
      <DueLine task={task} />
      <div className="pj-task-actions">
        <label className="pj-task-label" htmlFor={selectId}>
          Status<span className="visually-hidden"> von „{task.title}“</span>
        </label>
        <select id={selectId} className="select pj-task-status" data-ctl="status" value={task.status}
          onChange={e => onStatus(task, e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
        <button type="button" className="btn btn-ghost btn-icon pj-del" data-ctl="delete" title="Löschen"
          aria-label={`„${task.title}“ löschen`} onClick={() => onDelete(task)}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function Column({ status, count, over, children }) {
  const headingId = useId();
  return (
    <div className={`pj-col${over ? ' is-over' : ''}`} data-drop-status={status}>
      <h3 className="pj-col-head" id={headingId}>
        <span>{statusLabel[status]}</span>
        <span className="pj-count num" aria-hidden="true">{count}</span>
        <span className="visually-hidden">, {count} {count === 1 ? 'Aufgabe' : 'Aufgaben'}</span>
      </h3>
      <ul className="pj-col-list" aria-labelledby={headingId}>{children}</ul>
      {!count && <p className="pj-col-empty quiet">Keine Aufgaben</p>}
    </div>
  );
}

function AddTask({ project, onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(project.lead);
  const [due, setDue] = useState(() => isoDay(addDays(new Date(), 7)));
  const [errors, setErrors] = useState({});
  const ids = { form: useId(), title: useId(), who: useId(), due: useId(), titleErr: useId(), dueErr: useId() };
  const titleRef = useRef(null);
  const dueRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => { if (open) titleRef.current?.focus(); }, [open]);

  const close = () => { setOpen(false); setErrors({}); toggleRef.current?.focus(); };
  const submit = e => {
    e.preventDefault();
    const next = {};
    if (!title.trim()) next.title = 'Bitte einen Titel eingeben.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) next.due = 'Bitte ein Fälligkeitsdatum wählen.';
    setErrors(next);
    if (next.title) return titleRef.current?.focus();
    if (next.due) return dueRef.current?.focus();
    onAdd({ title: title.trim(), assignee, due });
    setTitle('');
    titleRef.current?.focus();
  };

  return (
    <div className="pj-add">
      <button ref={toggleRef} type="button" className="btn btn-primary" aria-expanded={open} aria-controls={ids.form}
        onClick={() => (open ? close() : setOpen(true))}>
        <Plus size={20} aria-hidden="true" /> Neue Aufgabe
      </button>
      <form id={ids.form} className="pj-add-form" hidden={!open} noValidate onSubmit={submit} aria-label="Neue Aufgabe anlegen"
        onKeyDown={e => { if (e.key === 'Escape') close(); }}>
        <div className="field pj-add-title">
          <label htmlFor={ids.title}>Titel</label>
          <input ref={titleRef} id={ids.title} className="input" value={title} autoComplete="off" required
            aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? ids.titleErr : undefined}
            onChange={e => setTitle(e.target.value)} />
          {errors.title && <p id={ids.titleErr} className="pj-error"><CircleAlert size={16} aria-hidden="true" /> {errors.title}</p>}
        </div>
        <div className="field">
          <label htmlFor={ids.who}>Zuständig</label>
          <select id={ids.who} className="select" value={assignee} onChange={e => setAssignee(e.target.value)}>
            {studios.map(s => (
              <optgroup key={s.id} label={s.name}>
                {people.filter(p => p.studio === s.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.due}>Fällig am</label>
          <input ref={dueRef} id={ids.due} className="input" type="date" value={due} required
            aria-invalid={errors.due ? true : undefined} aria-describedby={errors.due ? ids.dueErr : undefined}
            onChange={e => setDue(e.target.value)} />
          {errors.due && <p id={ids.dueErr} className="pj-error"><CircleAlert size={16} aria-hidden="true" /> {errors.due}</p>}
        </div>
        <div className="pj-add-actions">
          <button type="submit" className="btn btn-primary">Aufgabe anlegen</button>
          <button type="button" className="btn btn-ghost" onClick={close}>Schließen</button>
        </div>
      </form>
    </div>
  );
}

export default function TaskBoard({ project, tasks, setTasks, headingId, taskId }) {
  const [live, setLive] = useState('');
  const [undo, setUndo] = useState(null); // { task, index } – nur die letzte Löschung
  const [overCol, setOverCol] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [landed, setLanded] = useState(null); // { id, n } – zuletzt gelandete Karte; n startet die Markierung neu
  const boardRef = useRef(null);
  const rootRef = useRef(null);
  const drag = useRef(null);
  const focusAfter = useRef(null);
  const revealAfter = useRef(null); // { id, keepFocus } – Karte nach dem nächsten Rendern ins Bild holen
  const undoMsgId = useId();

  const mine = tasks.filter(t => t.project === project.id);
  const columns = STATUSES.map(status => ({ status, list: mine.filter(t => t.status === status).sort(byDue) }));

  // Gleicher Text zweimal hintereinander wird sonst nicht erneut angesagt
  const announce = msg => setLive(m => (m === msg ? `${msg} ` : msg));

  // Karte ins Bild holen. Schmales Board: Zielspalte an den Anfang – sonst schnappt Scroll-Snap nach dem Ziehen auf
  // „Offen“ zurück. Dann senkrecht so wenig wie nötig; keep (Titelfeld nach „Aufgabe anlegen“) bleibt dabei im Bild.
  const reveal = (card, { block = 'nearest', keep = null } = {}) => {
    const board = boardRef.current;
    const col = card.closest('[data-drop-status]');
    if (board && col && board.scrollWidth > board.clientWidth) {
      board.scrollLeft = Math.min(col.offsetLeft, board.scrollWidth - board.clientWidth);
    }
    if (!keep) return card.scrollIntoView({ block, inline: 'nearest' });
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0;
    const need = card.getBoundingClientRect().bottom - (window.innerHeight - pad);
    const dy = Math.min(need, keep.getBoundingClientRect().top - 16);
    if (dy > 0) window.scrollBy(0, dy);
  };

  const mark = id => setLanded(l => ({ id, n: (l?.n || 0) + 1 }));

  // Die Karte wandert beim Statuswechsel in eine andere Liste und wird neu erzeugt – Blick und Fokus folgen ihr.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const r = revealAfter.current;
    revealAfter.current = null;
    const card = r && boardRef.current?.querySelector(`[data-task="${CSS.escape(r.id)}"]`);
    const keep = r?.keepFocus && document.activeElement !== document.body ? document.activeElement : null;
    if (card) reveal(card, { keep });
    const f = focusAfter.current;
    if (!f) return;
    focusAfter.current = null;
    const el = f.undo ? root?.querySelector('[data-undo]')
      : f.heading ? document.getElementById(headingId)
        : root?.querySelector(`[data-task="${CSS.escape(f.id)}"] [data-ctl="${f.ctl}"]`);
    el?.focus({ preventScroll: Boolean(card) });
  });

  // Tiefer Link #/projekte/<projekt>/<aufgabe>: Karte ins Bild, Fokus, einmal markieren. Unbekannte ID: still nichts.
  useLayoutEffect(() => {
    if (!taskId) return;
    const card = boardRef.current?.querySelector(`[data-task="${CSS.escape(taskId)}"]`);
    if (!card) return;
    reveal(card, { block: 'center' });
    card.focus({ preventScroll: true });
    mark(taskId);
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps -- nur beim Wechsel der Aufgabe

  // Markierung nach kurzer Zeit wieder weg (die Bewegung selbst dauert 280 ms, siehe .is-landed)
  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => setLanded(null), LANDED_MS);
    return () => clearTimeout(t);
  }, [landed]);

  useEffect(() => () => { // Aufräumen, falls mitten im Ziehen weg-navigiert wird
    const d = drag.current;
    if (d?.started) { cancelAnimationFrame(d.raf); d.ghost?.remove(); window.removeEventListener('keydown', d.onKey, true); }
  }, []);

  const setStatus = (task, to, focusCtl) => {
    if (!STATUSES.includes(to) || task.status === to) return;
    setTasks(all => all.map(t => (t.id === task.id ? { ...t, status: to } : t)));
    announce(`„${task.title}“ verschoben nach ${statusLabel[to]}.`);
    revealAfter.current = { id: task.id };
    mark(task.id);
    if (focusCtl) focusAfter.current = { id: task.id, ctl: focusCtl };
  };

  const remove = task => {
    const index = tasks.findIndex(t => t.id === task.id);
    setTasks(all => all.filter(t => t.id !== task.id));
    setUndo({ task, index });
    announce(`„${task.title}“ gelöscht. Rückgängig ist möglich.`);
    focusAfter.current = { undo: true };
  };

  const restore = () => {
    if (!undo) return;
    const { task, index } = undo;
    setTasks(all => (all.some(t => t.id === task.id) ? all : [...all.slice(0, index), task, ...all.slice(index)]));
    setUndo(null);
    announce(`„${task.title}“ wiederhergestellt in ${statusLabel[task.status]}.`);
    revealAfter.current = { id: task.id };
    mark(task.id);
    focusAfter.current = { id: task.id, ctl: 'status' };
  };

  const closeUndo = () => { setUndo(null); focusAfter.current = { heading: true }; };

  const add = ({ title, assignee, due }) => {
    const task = { id: `t-${uid()}`, project: project.id, title, status: 'todo', assignee, due };
    setTasks(all => [...all, task]);
    announce(`„${title}“ angelegt in ${statusLabel.todo}.`);
    // Fokus bleibt im Titelfeld (schnell mehrere anlegen) – die Karte kommt ins Bild, soweit das Feld sichtbar bleibt
    revealAfter.current = { id: task.id, keepFocus: true };
    mark(task.id);
  };

  // ---- Ziehen mit Pointer Events (Maus, Finger, Stift) ----
  const columnAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-drop-status]');
    return el && boardRef.current?.contains(el) ? el.dataset.dropStatus : null;
  };

  const autoScroll = d => {
    const board = boardRef.current;
    if (board && board.scrollWidth > board.clientWidth && Math.abs(d.x - d.x0) > 24) {
      const r = board.getBoundingClientRect();
      board.scrollLeft += edgeSpeed(r.right - d.x) - edgeSpeed(d.x - r.left);
    }
    if (Math.abs(d.y - d.y0) > 24) window.scrollBy(0, edgeSpeed(window.innerHeight - d.y) - edgeSpeed(d.y));
  };

  const endDrag = commit => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (!d.started) return;
    cancelAnimationFrame(d.raf);
    d.ghost.remove();
    window.removeEventListener('keydown', d.onKey, true);
    boardRef.current?.removeAttribute('data-dragging');
    setDragId(null);
    setOverCol(null);
    if (!commit) return announce(`Verschieben von „${d.task.title}“ abgebrochen.`);
    const to = columnAt(d.x, d.y) || d.over;
    if (to && to !== d.task.status) setStatus(d.task, to);
  };

  const startDrag = d => {
    d.started = true;
    const ghost = document.createElement('div');
    ghost.className = 'pj-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = d.task.title;
    ghost.style.width = `${Math.min(d.width, 320)}px`;
    document.body.appendChild(ghost);
    d.ghost = ghost;
    boardRef.current?.setAttribute('data-dragging', '');
    setDragId(d.task.id);
    d.onKey = ev => { if (ev.key === 'Escape') { ev.preventDefault(); endDrag(false); } };
    window.addEventListener('keydown', d.onKey, true);
    const tick = () => {
      if (drag.current !== d) return;
      autoScroll(d);
      const col = columnAt(d.x, d.y);
      if (col !== d.over) { d.over = col; setOverCol(col); }
      d.raf = requestAnimationFrame(tick);
    };
    d.raf = requestAnimationFrame(tick);
  };

  const pointerProps = task => ({
    onPointerDown: e => {
      if (e.button !== 0 || drag.current) return;
      const onGrip = e.target.closest('[data-grip]');
      // Finger und Stift nur am Griff (sonst scrollt die Seite), Maus überall außer auf Bedienelementen
      if (!onGrip && (e.pointerType !== 'mouse' || e.target.closest(INTERACTIVE))) return;
      const r = e.currentTarget.getBoundingClientRect();
      drag.current = {
        task, pointerId: e.pointerId, started: false, over: null, width: r.width,
        x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (onGrip) e.preventDefault();
    },
    onPointerMove: e => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.started) {
        if (Math.hypot(d.x - d.x0, d.y - d.y0) < 6) return;
        startDrag(d);
      }
      d.ghost.style.transform = `translate(${d.x - Math.min(d.dx, 300)}px, ${d.y - d.dy}px) rotate(2deg)`;
    },
    onPointerUp: e => { if (drag.current?.pointerId === e.pointerId) endDrag(true); },
    onPointerCancel: e => { if (drag.current?.pointerId === e.pointerId) endDrag(false); },
  });

  return (
    <div className="pj-board-wrap" ref={rootRef}>
      <AddTask project={project} onAdd={add} />
      <p className="quiet pj-hint">
        Karten mit der Maus ziehen, mit dem Finger am Griff <GripVertical size={16} aria-hidden="true" />.
        Ohne Ziehen: Status in der Karte wählen.
      </p>
      <div className="pj-board" ref={boardRef}>
        {columns.map(({ status, list }) => (
          <Column key={status} status={status} count={list.length} over={overCol === status}>
            {list.map(t => (
              <TaskCard key={t.id} task={t} dragging={dragId === t.id} landed={landed?.id === t.id} pointer={pointerProps(t)}
                onStatus={(task, to) => setStatus(task, to, 'status')} onDelete={remove} />
            ))}
          </Column>
        ))}
      </div>
      {undo && (
        <div className="pj-undo" role="group" aria-labelledby={undoMsgId} onKeyDown={e => { if (e.key === 'Escape') closeUndo(); }}>
          <p id={undoMsgId} className="pj-undo-msg"><Trash2 size={18} aria-hidden="true" /> „{undo.task.title}“ gelöscht.</p>
          <button type="button" className="btn pj-undo-btn" data-undo="" onClick={restore}>
            <Undo2 size={18} aria-hidden="true" /> Rückgängig
          </button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Hinweis schließen" title="Schließen" onClick={closeUndo}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="visually-hidden" role="status" aria-live="polite">{live}</p>
    </div>
  );
}
