// Aufgaben (r07): Board | Liste als zwei Ansichten derselben Daten. Karten und Zeilen zeigen Person und „gebucht /
// geschätzt“ (gebucht = Einträge mit task = Aufgabe), dazu ein Play-Knopf für den gemeinsamen Timer (lib/timer.js).
// Aus r06 bleibt: Ziehen (Maus: ganze Karte, Finger/Stift: Griff), gleichwertig die Status-Auswahl jeder Karte,
// Löschen mit Rückgängig, Ansage per aria-live, Landemarkierung, tiefer Link (taskId) mit Fokus.
// Daten: Schlüssel 'tasks' (useStoredState im Elternteil) – { id, project, title, status, assignee, due, estimate }.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlarmClock, CircleAlert, Clock, GripVertical, Play, Plus, Square, Timer, Trash2, Undo2, X } from 'lucide-react';
import { people, projects, statusLabel, studios } from '../../data/sample.js';
import { uid, useStoredState } from '../../lib/store.js';
import { addDays, fmtDuration, isoDay } from '../../lib/format.js';
import { href } from '../../lib/router.js';
import { useTimer } from '../../lib/timer.js';
import { STATUSES, daysUntil, fmt1, fmtDayShort, personById, relDays } from './helpers.js';
import { Avatar } from './parts.jsx';

const dueKey = t => (typeof t.due === 'string' && t.due) || '9999';
const byDue = (a, b) => dueKey(a).localeCompare(dueKey(b)) || a.title.localeCompare(b.title, 'de');
const LANDED_MS = 2000; // so lange bleibt die Markierung „hier gelandet“ stehen
const INTERACTIVE = 'button, select, input, textarea, a, label';
const EDGE = 24; // Randzone für automatisches Scrollen beim Ziehen (px) – schmaler als die angeschnittene Nachbarspalte
// Je näher am Rand, desto schneller (1–10 px je Bild); so bleibt die Nachbarspalte als Ziel treffbar
const edgeSpeed = dist => (dist < EDGE ? Math.min(10, Math.ceil(((EDGE - dist) / EDGE) * 10)) : 0);
const cleanView = v => (v === 'list' ? 'list' : 'board');
const num = x => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : 0; };

// Fälligkeit: auf dem Board nur, wenn es drängt (überfällig, heute); in der Liste immer
function DueLine({ task, always }) {
  const n = daysUntil(task.due);
  if (n === null) return null;
  const open = task.status !== 'done';
  if (open && n < 0) {
    return (
      <span className="pj-due is-overdue">
        <AlarmClock size={14} aria-hidden="true" />
        <span>Überfällig seit {n === -1 ? 'gestern' : `${-n} Tagen`}</span>
      </span>
    );
  }
  if (open && n === 0) return <span className="pj-due is-today"><Clock size={14} aria-hidden="true" /><span>Heute fällig</span></span>;
  if (!always) return null;
  return <span className="pj-due num">Fällig {fmtDayShort(task.due)} ({relDays(n)})</span>;
}

// „2,0 / 6 h“ – über der Schätzung als Koralle-Fläche mit schwarzer Schrift (Signal „überzogen“)
function Hours({ booked, estimate }) {
  const est = num(estimate);
  const over = est > 0 && booked > est;
  const b = fmt1(booked);
  const e = est ? est.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : null;
  return (
    <span className={`pj-hours num${over ? ' is-over' : ''}`}>
      <Clock size={14} aria-hidden="true" />
      <span aria-hidden="true">{e ? `${b} / ${e} h` : `${b} h`}</span>
      <span className="visually-hidden">{e ? `${b} von ${e} Stunden gebucht` : `${b} Stunden gebucht, ohne Schätzung`}{over ? ', Schätzung überschritten' : ''}</span>
    </span>
  );
}

function TaskItem({ task, layout, booked, timerOn, onPlay, dragging, landed, onStatus, onDelete, pointer }) {
  const selectId = useId();
  const person = personById[task.assignee];
  const n = daysUntil(task.due);
  const overdue = task.status !== 'done' && n !== null && n < 0;
  const board = layout === 'board';
  const cls = `pj-task is-${layout}${overdue ? ' is-overdue' : ''}${dragging ? ' is-dragging' : ''}${landed ? ' is-landed' : ''}${timerOn ? ' is-timing' : ''}`;
  // tabIndex -1: Ziel für den Fokus nach einem tiefen Link, nicht in der Tab-Reihenfolge
  return (
    <li className={cls} data-task={task.id} tabIndex={-1} {...(board ? pointer : {})}>
      <div className="pj-task-head">
        <p className="pj-task-title">{task.title}</p>
        {board && (
          <span className="pj-grip" data-grip="" title="Ziehen, um die Aufgabe zu verschieben" aria-hidden="true">
            <GripVertical size={18} />
          </span>
        )}
      </div>
      <p className="pj-task-meta">
        <span className="pj-task-person"><Avatar person={person} size="is-xs" /> {person ? person.name : 'Niemand zugewiesen'}</span>
        <Hours booked={booked} estimate={task.estimate} />
        <DueLine task={task} always={!board} />
      </p>
      <div className="pj-task-actions">
        <label className="visually-hidden" htmlFor={selectId}>Status von „{task.title}“</label>
        <select id={selectId} className="select pj-task-status" data-ctl="status" value={task.status}
          onChange={e => onStatus(task, e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
        <button type="button" className={`btn btn-icon pj-play${timerOn ? ' is-on' : ''}`} data-ctl="play"
          aria-label={timerOn ? `Timer stoppen: ${task.title}` : `Timer starten: ${task.title}`}
          title={timerOn ? 'Timer stoppen' : 'Timer starten'} onClick={() => onPlay(task)}>
          {timerOn ? <Square size={14} fill="currentColor" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <button type="button" className="btn btn-ghost btn-icon pj-del" data-ctl="delete" title="Löschen"
          aria-label={`„${task.title}“ löschen`} onClick={() => onDelete(task)}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

// Kopf einer Spalte bzw. Gruppe: Name, Zähler, „+“ (legt direkt in diesem Status an)
function GroupHead({ status, count, headingId, onAdd }) {
  return (
    <div className="pj-col-head">
      <h3 className="pj-col-title" id={headingId}>
        <span>{statusLabel[status]}</span>
        <span className="pj-count num" aria-hidden="true">{count}</span>
        <span className="visually-hidden">, {count} {count === 1 ? 'Aufgabe' : 'Aufgaben'}</span>
      </h3>
      <button type="button" className="btn btn-ghost btn-icon pj-col-add" title={`Aufgabe hinzufügen: ${statusLabel[status]}`}
        aria-label={`Aufgabe hinzufügen: ${statusLabel[status]}`} onClick={e => onAdd(status, e.currentTarget)}>
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function Column({ status, count, over, onAdd, children }) {
  const headingId = useId();
  return (
    <div className={`pj-col${over ? ' is-over' : ''}`} data-drop-status={status}>
      <GroupHead status={status} count={count} headingId={headingId} onAdd={onAdd} />
      <ul className="pj-col-list" aria-labelledby={headingId}>{children}</ul>
      {!count && <p className="pj-col-empty quiet">Keine Aufgaben</p>}
    </div>
  );
}

function Group({ status, count, onAdd, children }) {
  const headingId = useId();
  return (
    <section className="pj-group" aria-labelledby={headingId}>
      <GroupHead status={status} count={count} headingId={headingId} onAdd={onAdd} />
      {count ? <ul className="list pj-group-list" aria-labelledby={headingId}>{children}</ul> : <p className="quiet pj-group-empty">Keine Aufgaben</p>}
    </section>
  );
}

function AddTask({ project, open, status, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(project.lead);
  const [due, setDue] = useState(() => isoDay(addDays(new Date(), 7)));
  const [estimate, setEstimate] = useState('');
  const [errors, setErrors] = useState({});
  const ids = { form: useId(), title: useId(), who: useId(), due: useId(), est: useId(), titleErr: useId(), dueErr: useId(), estErr: useId() };
  const titleRef = useRef(null);
  const dueRef = useRef(null);
  const estRef = useRef(null);

  useEffect(() => { if (open) titleRef.current?.focus(); }, [open, status]);

  const submit = e => {
    e.preventDefault();
    const next = {};
    const est = estimate.trim() ? Number(estimate.replace(',', '.')) : 0;
    if (!title.trim()) next.title = 'Bitte einen Titel eingeben.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) next.due = 'Bitte ein Fälligkeitsdatum wählen.';
    if (!Number.isFinite(est) || est < 0 || est > 999) next.est = 'Schätzung in Stunden, z. B. 4 oder 1,5.';
    setErrors(next);
    if (next.title) return titleRef.current?.focus();
    if (next.due) return dueRef.current?.focus();
    if (next.est) return estRef.current?.focus();
    onAdd({ title: title.trim(), assignee, due, ...(est > 0 ? { estimate: Math.round(est * 10) / 10 } : {}) });
    setTitle('');
    setEstimate('');
    titleRef.current?.focus();
  };

  return (
    <form id={ids.form} className="pj-add-form" hidden={!open} noValidate onSubmit={submit}
      aria-label={`Neue Aufgabe in „${statusLabel[status]}“ anlegen`} onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <p className="pj-add-where overline">Neue Aufgabe · {statusLabel[status]}</p>
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
      <div className="field">
        <label htmlFor={ids.est}>Schätzung in h (optional)</label>
        <input ref={estRef} id={ids.est} className="input" inputMode="decimal" value={estimate} autoComplete="off"
          aria-invalid={errors.est ? true : undefined} aria-describedby={errors.est ? ids.estErr : undefined}
          onChange={e => setEstimate(e.target.value)} />
        {errors.est && <p id={ids.estErr} className="pj-error"><CircleAlert size={16} aria-hidden="true" /> {errors.est}</p>}
      </div>
      <div className="pj-add-actions">
        <button type="submit" className="btn btn-primary">Aufgabe anlegen</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Schließen</button>
      </div>
    </form>
  );
}

export default function TaskBoard({ project, tasks, setTasks, entries, taskId }) {
  const [view, setView] = useStoredState('project-task-view', 'board', cleanView);
  const [live, setLive] = useState('');
  const [undo, setUndo] = useState(null); // { task, index } – nur die letzte Löschung
  const [notice, setNotice] = useState(null); // Hinweis „Timer läuft schon“
  const [adding, setAdding] = useState(null); // Status, in dem angelegt wird; null = Formular zu
  const [overCol, setOverCol] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [landed, setLanded] = useState(null); // { id, n } – zuletzt gelandete Karte; n startet die Markierung neu
  const { timer, running, start, stop } = useTimer();
  const viewRef = useRef(null);
  const rootRef = useRef(null);
  const drag = useRef(null);
  const focusAfter = useRef(null);
  const revealAfter = useRef(null); // { id, keepFocus } – Karte nach dem nächsten Rendern ins Bild holen
  const opener = useRef(null);
  const headingId = useId();
  const undoMsgId = useId();
  const noticeMsgId = useId();

  const mine = tasks.filter(t => t.project === project.id);
  const groups = STATUSES.map(status => ({ status, list: mine.filter(t => t.status === status).sort(byDue) }));
  const open = mine.filter(t => t.status !== 'done');
  const overdue = open.filter(t => t.due && daysUntil(t.due) < 0).length;
  const booked = useMemo(() => {
    const m = {};
    for (const e of Array.isArray(entries) ? entries : []) if (e.task) m[e.task] = (m[e.task] || 0) + (Number(e.minutes) || 0) / 60;
    return m;
  }, [entries]);

  // Gleicher Text zweimal hintereinander wird sonst nicht erneut angesagt
  const announce = msg => setLive(m => (m === msg ? `${msg} ` : msg));

  // Karte ins Bild holen. Schmales Board: Zielspalte an den Anfang – sonst schnappt Scroll-Snap nach dem Ziehen auf
  // „Offen“ zurück. Dann senkrecht so wenig wie nötig; keep (Titelfeld nach „Aufgabe anlegen“) bleibt dabei im Bild.
  const reveal = (card, { block = 'nearest', keep = null } = {}) => {
    const board = viewRef.current;
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
    const card = r && viewRef.current?.querySelector(`[data-task="${CSS.escape(r.id)}"]`);
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
    const card = viewRef.current?.querySelector(`[data-task="${CSS.escape(taskId)}"]`);
    if (!card) return;
    reveal(card, { block: 'center' });
    card.focus({ preventScroll: true });
    mark(taskId);
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps -- nur beim Wechsel der Aufgabe

  // Markierung nach kurzer Zeit wieder weg (die Bewegung selbst dauert 180 ms, siehe .is-landed)
  useEffect(() => {
    if (!landed) return undefined;
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

  const openAdd = (status, el) => { opener.current = el || null; setAdding(status); };
  const closeAdd = () => { setAdding(null); opener.current?.focus(); };

  const add = ({ title, assignee, due, estimate }) => {
    const status = adding || 'todo';
    const task = { id: `t-${uid()}`, project: project.id, title, status, assignee, due, ...(estimate ? { estimate } : {}) };
    setTasks(all => [...all, task]);
    announce(`„${title}“ angelegt in ${statusLabel[status]}.`);
    // Fokus bleibt im Titelfeld (schnell mehrere anlegen) – die Karte kommt ins Bild, soweit das Feld sichtbar bleibt
    revealAfter.current = { id: task.id, keepFocus: true };
    mark(task.id);
  };

  // Buchen aus der Aufgabe: ein Timer für die ganze App. Läuft schon einer (andere Aufgabe), sagt ein Hinweis das klar.
  const play = task => {
    if (running && timer?.task === task.id) {
      const r = stop();
      setNotice(null);
      if (r?.entry) announce(`Timer gestoppt, ${fmtDuration(r.entry.minutes)} auf „${task.title}“ gebucht.`);
      else if (r?.overlong) announce('Timer gestoppt. Mehr als 24 Stunden – bitte unter Zeiten nachtragen.');
      return;
    }
    const r = start({ project: project.id, task: task.id });
    if (r.already) {
      const tp = projects.find(x => x.id === r.timer.project);
      const tt = tasks.find(x => x.id === r.timer.task);
      const what = [tp?.code, tt?.title || r.timer.note].filter(Boolean).join(' · ') || 'ohne Angabe';
      const msg = `Es läuft schon ein Timer (${what}). Erst stoppen, dann hier starten.`;
      setNotice({ msg, task: task.id });
      announce(msg);
      return;
    }
    setNotice(null);
    announce(`Timer läuft für „${task.title}“.`);
  };

  // ---- Ziehen mit Pointer Events (Maus, Finger, Stift) – nur auf dem Board ----
  const columnAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-drop-status]');
    return el && viewRef.current?.contains(el) ? el.dataset.dropStatus : null;
  };

  const autoScroll = d => {
    const board = viewRef.current;
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
    viewRef.current?.removeAttribute('data-dragging');
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
    viewRef.current?.setAttribute('data-dragging', '');
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

  const item = (t, layout) => (
    <TaskItem key={t.id} task={t} layout={layout} booked={booked[t.id] || 0} timerOn={running && timer?.task === t.id}
      onPlay={play} dragging={dragId === t.id} landed={landed?.id === t.id} pointer={pointerProps(t)}
      onStatus={(task, to) => setStatus(task, to, 'status')} onDelete={remove} />
  );

  return (
    <section className="pj-tasks" ref={rootRef} aria-labelledby={headingId}>
      <div className="pj-tasks-bar">
        <div className="pj-tasks-title">
          <h2 id={headingId} tabIndex={-1}>Aufgaben</h2>
          <p className="meta num">
            {open.length} offen von {mine.length}
            {overdue > 0 && <> · <span className="pj-overdue-sum">{overdue} überfällig</span></>}
          </p>
        </div>
        <div className="switch" role="group" aria-label="Ansicht">
          <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>Board</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>Liste</button>
        </div>
        <button type="button" className="btn btn-primary pj-new" aria-expanded={adding !== null}
          onClick={e => (adding !== null ? closeAdd() : openAdd('todo', e.currentTarget))}>
          <Plus size={18} aria-hidden="true" /> Neue Aufgabe
        </button>
      </div>

      <AddTask project={project} open={adding !== null} status={adding || 'todo'} onClose={closeAdd} onAdd={add} />

      {view === 'board' ? (
        <>
          <p className="quiet pj-hint">
            Karten mit der Maus ziehen, mit dem Finger am Griff <GripVertical size={14} aria-hidden="true" />.
            Ohne Ziehen: Status in der Karte wählen.
          </p>
          <div className="pj-board" ref={viewRef}>
            {groups.map(({ status, list }) => (
              <Column key={status} status={status} count={list.length} over={overCol === status} onAdd={openAdd}>
                {list.map(t => item(t, 'board'))}
              </Column>
            ))}
          </div>
        </>
      ) : (
        <div className="pj-tlist" ref={viewRef}>
          {groups.map(({ status, list }) => (
            <Group key={status} status={status} count={list.length} onAdd={openAdd}>
              {list.map(t => item(t, 'row'))}
            </Group>
          ))}
        </div>
      )}

      {(undo || notice) && (
        <div className="pj-dock">
          {notice && (
            <div className="pj-dock-item" role="group" aria-labelledby={noticeMsgId}>
              <p id={noticeMsgId} className="pj-dock-msg"><Timer size={18} aria-hidden="true" /> {notice.msg}</p>
              <a className="btn pj-dock-btn" href={href('/zeit')}>Zum Timer</a>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Hinweis schließen" title="Schließen" onClick={() => setNotice(null)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          {undo && (
            <div className="pj-dock-item" role="group" aria-labelledby={undoMsgId} onKeyDown={e => { if (e.key === 'Escape') closeUndo(); }}>
              <p id={undoMsgId} className="pj-dock-msg"><Trash2 size={18} aria-hidden="true" /> „{undo.task.title}“ gelöscht.</p>
              <button type="button" className="btn pj-dock-btn" data-undo="" onClick={restore}>
                <Undo2 size={18} aria-hidden="true" /> Rückgängig
              </button>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Hinweis schließen" title="Schließen" onClick={closeUndo}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
      <p className="visually-hidden" role="status" aria-live="polite">{live}</p>
    </section>
  );
}
