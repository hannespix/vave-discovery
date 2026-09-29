import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarRange, ClockPlus, FolderKanban, FolderPlus, Keyboard, ListPlus, Play, Search, Square, SquareCheck } from 'lucide-react';
import { uid, useStoredState } from '../lib/store.js';
import { cleanTasks } from '../lib/data.js';
import { byId, me, people, projectStatusLabel, statusLabel, tasks as sampleTasks } from '../data/sample.js';
import { clientsById, loadProjects, projectsById } from '../lib/projects.js';
import { projectInfo, spokenDuration } from './shellData.js';

// Befehlspalette (⌘K / Strg K, „/“, Suchen-Knopf): natives <dialog>, darin Combobox + Listbox mit aria-activedescendant.
// Gruppen: Aktionen, Projekte, Aufgaben (eigene zuerst), Seiten. Leer: Aktionen und zuletzt geöffnete Projekte.
// „Neue Aufgabe“ ist ein zweiter Schritt in der Palette (Titel, Projekt) und schreibt in 'tasks'.

const personById = byId(people);

// Suche ohne Rücksicht auf Akzente: „horr“ findet „Hörräume“, „hoerr“ auch
export const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const spelled = s => String(s ?? '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
const haystack = (...parts) => {
  const raw = parts.filter(Boolean).join(' ');
  return `${fold(raw)} ${fold(spelled(raw))}`;
};
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Relevanz: jedes Suchwort muss vorkommen; Code-Anfang zählt mehr als Wortanfang, der mehr als „irgendwo“
function score(item, tokens) {
  let s = 0;
  for (const t of tokens) {
    if (!item.hay.includes(t)) return 0;
    if (item.code && item.code.startsWith(t)) s += 4;
    else if (new RegExp(`(^|[^a-z0-9])${escapeRe(t)}`).test(item.hay)) s += 2;
    else s += 1;
  }
  return s;
}

// Timer-Aktionen erscheinen beim Suchen nur, wenn ein Wort das Verb meint („tim“, „sta“, „sto“ …).
// Sonst stünde „Timer starten · MIR-07“ vor dem Projekt, und „mir“ + Enter würde starten statt öffnen.
const meansVerb = (item, tokens) => tokens.some(t => t.length >= 3 && item.verbs.some(v => v.startsWith(t)));

const PAGE_WORDS = {
  '': 'start startseite übersicht tag',
  zeit: 'zeiterfassung timer buchungen stunden liste',
  projekte: 'budget aufgaben board',
  studios: 'team zeitzonen standorte',
  spaeter: 'ausblick später offen fragen',
};
const LIMIT = { projects: 6, tasks: 6 };

const projectMeta = p => {
  const client = clientsById()[p.client]?.name;
  return p.status === 'aktiv' ? client : `${client} · ${projectStatusLabel[p.status] || p.status}`;
};
const projectItem = (p, prefix) => ({
  id: `${prefix}-${p.id}`, icon: FolderKanban, label: `${p.code} · ${p.name}`, meta: projectMeta(p),
  to: `/projekte/${p.id}`, code: fold(p.code), hay: haystack(p.code, p.name, clientsById()[p.client]?.name, p.phase),
});

function buildIndex({ routes, running, timer, elapsedMin, lastProject, bookedIds, tasks, routeProjectId, handlers }) {
  // Aktionen
  const order = [lastProject, ...bookedIds.filter(id => id !== lastProject),
    ...loadProjects().map(p => p.id).filter(id => id !== lastProject && !bookedIds.includes(id))];
  const starts = running ? [] : order.map(id => projectsById()[id]).filter(Boolean).map(p => ({
    id: `start-${p.id}`, icon: Play, label: `Timer starten · ${p.code}`, meta: p.name,
    keys: p.id === lastProject ? ['T'] : null, run: () => handlers.onStart(p.id),
    verbs: ['timer', 'starten', 'start'], code: fold(p.code),
    hay: haystack('Timer starten', p.code, p.name, clientsById()[p.client]?.name),
  }));
  const stop = running ? (() => {
    const p = projectInfo(timer.project);
    return {
      id: 'stop', icon: Square, label: `Timer stoppen · ${p.code}`, meta: `läuft seit ${spokenDuration(elapsedMin)}, wird gebucht`,
      keys: ['T'], run: handlers.onStop, verbs: ['timer', 'stoppen', 'stop', 'beenden'], hay: haystack('Timer stoppen beenden', p.code),
    };
  })() : null;
  const routeProject = projectsById()[routeProjectId];
  const general = [
    { id: 'log', icon: ClockPlus, label: 'Zeit nachtragen', meta: 'Dauer oder Von–Bis', keys: ['N'], to: '/zeit/nachtragen',
      hay: haystack('Zeit nachtragen eintragen vergessen buchen manuell') },
    { id: 'new-task', icon: ListPlus, label: 'Neue Aufgabe', meta: routeProject ? `in ${routeProject.code}` : 'mit Titel und Projekt',
      step: 'task', hay: haystack('Neue Aufgabe anlegen erstellen hinzufügen') },
    { id: 'new-project', icon: FolderPlus, label: 'Neues Projekt', meta: 'Kunde, Code, Budget', to: '/projekte/neu',
      hay: haystack('Neues Projekt anlegen erstellen hinzufügen') },
    { id: 'help', icon: Keyboard, label: 'Tastenkürzel anzeigen', keys: ['?'], run: handlers.onHelp,
      hay: haystack('Tastenkürzel Kürzel Tastatur Hilfe') },
  ];

  // Seiten (Woche als eigenes Ziel direkt nach Zeiten)
  const pages = [];
  routes.forEach(r => {
    pages.push({
      id: `page-${r.path || 'heute'}`, icon: r.icon, label: r.label, to: `/${r.path}`, keys: ['G', r.key.toUpperCase()],
      hay: haystack(r.label, PAGE_WORDS[r.path]),
    });
    if (r.path === 'zeit') {
      pages.push({ id: 'page-woche', icon: CalendarRange, label: 'Woche', meta: 'Zeiten', to: '/zeit/woche',
        hay: haystack('Woche Wochenraster Zeiten Kalenderwoche') });
    }
  });

  // Aufgaben: eigene zuerst, erledigte zuletzt
  const taskItems = tasks.filter(t => projectsById()[t.project]).map(t => {
    const p = projectsById()[t.project];
    const own = t.assignee === me.id;
    const who = own ? 'dir zugewiesen' : personById[t.assignee]?.name.split(' ')[0];
    return {
      id: `task-${t.id}`, icon: SquareCheck, label: t.title,
      meta: [p.code, statusLabel[t.status] || t.status, who].filter(Boolean).join(' · '),
      to: `/projekte/${p.id}/${t.id}`, own, done: t.status === 'done',
      hay: haystack(t.title, p.code, p.name, personById[t.assignee]?.name),
    };
  });

  return { starts, stop, general, projects: loadProjects().map(p => projectItem(p, 'project')), taskItems, pages };
}

function search(index, query, recentIds, bookedIds, running) {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    const recentSource = recentIds.length ? recentIds : bookedIds;
    return [
      { id: 'actions', label: 'Aktionen', items: [running ? index.stop : index.starts[0], ...index.general].filter(Boolean) },
      {
        id: 'recent', label: recentIds.length ? 'Zuletzt geöffnet' : 'Zuletzt gebucht',
        items: recentSource.slice(0, 5).map(id => projectItem(projectsById()[id], 'recent')),
      },
    ].filter(g => g.items.length);
  }
  const rank = (list, keep = () => true) => list
    .map((item, i) => ({ item, i, s: keep(item) ? score(item, tokens) : 0 }))
    .filter(x => x.s > 0);
  const byScore = (a, b) => b.s - a.s || a.i - b.i;

  const timerActions = rank(running ? [index.stop] : index.starts, item => meansVerb(item, tokens));
  const actions = [...timerActions.sort((a, b) => a.i - b.i), ...rank(index.general).sort(byScore)].map(x => x.item);
  const projectHits = rank(index.projects).sort(byScore).slice(0, LIMIT.projects).map(x => x.item);
  const taskHits = rank(index.taskItems)
    .sort((a, b) => (b.item.own - a.item.own) || (a.item.done - b.item.done) || byScore(a, b))
    .slice(0, LIMIT.tasks).map(x => x.item);
  const pageHits = rank(index.pages).sort(byScore).map(x => x.item);

  return [
    { id: 'actions', label: 'Aktionen', items: actions },
    { id: 'projects', label: 'Projekte', items: projectHits },
    { id: 'tasks', label: 'Aufgaben', items: taskHits },
    { id: 'pages', label: 'Seiten', items: pageHits },
  ].filter(g => g.items.length);
}

function Keys({ keys }) {
  return <span className="palette__keys" aria-hidden="true">{keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}</span>;
}

function SearchStep({ index, recentIds, bookedIds, running, query, setQuery, onRun }) {
  const [active, setActive] = useState(0);
  const listId = useId();
  const baseId = useId();
  const groups = useMemo(() => search(index, query, recentIds, bookedIds, running), [index, query, recentIds, bookedIds, running]);
  const flat = groups.flatMap(g => g.items);
  const current = flat.length ? flat[Math.min(active, flat.length - 1)] : null;
  const optId = item => `${baseId}-${item.id}`;
  const currentId = current ? optId(current) : undefined;

  // Aktive Zeile im sichtbaren Bereich halten
  useEffect(() => {
    if (currentId) document.getElementById(currentId)?.scrollIntoView({ block: 'nearest' });
  }, [currentId]);

  const onKeyDown = e => {
    if (e.nativeEvent.isComposing) return; // Enter bestätigt hier die Eingabemethode, nicht die Auswahl
    const n = flat.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      const at = Math.min(active, n - 1);
      setActive(e.key === 'ArrowDown' ? (at + 1) % n : (at - 1 + n) % n);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (current) onRun(current);
    }
  };

  return (
    <>
      <div className="palette__bar">
        <Search className="palette__glass" aria-hidden="true" size={20} strokeWidth={1.75} />
        <input
          data-autofocus
          className="palette__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={currentId}
          aria-label="Suchen oder Befehl eingeben"
          placeholder="Suchen oder Befehl eingeben …"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          value={query}
          onChange={e => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
        />
        <kbd className="kbd palette__esc" aria-hidden="true">Esc</kbd>
      </div>
      <div id={listId} role="listbox" aria-label="Treffer" className="palette__list">
        {groups.map(g => (
          <div key={g.id} role="group" aria-labelledby={`${baseId}-g-${g.id}`} className="palette__group">
            <div role="presentation" id={`${baseId}-g-${g.id}`} className="palette__group-label">{g.label}</div>
            {g.items.map(item => {
              const idx = flat.indexOf(item);
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  id={optId(item)}
                  role="option"
                  aria-selected={item === current}
                  className="palette__option"
                  onMouseMove={() => { if (idx !== active) setActive(idx); }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onRun(item)}
                >
                  <Icon className="palette__icon" aria-hidden="true" size={18} strokeWidth={1.75} />
                  <span className="palette__text">
                    <span className="palette__label">{item.label}</span>
                    {item.meta && <span className="palette__meta"><span className="visually-hidden">, </span>{item.meta}</span>}
                  </span>
                  {item.keys && <Keys keys={item.keys} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!flat.length && <p className="palette__empty">Keine Treffer für „{query.trim()}“.</p>}
      <p className="visually-hidden" role="status">{query.trim() ? `${flat.length} Treffer` : ''}</p>
      <p className="palette__hint" aria-hidden="true">
        <span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> auswählen</span>
        <span><kbd className="kbd">↵</kbd> ausführen</span>
        <span><kbd className="kbd">Esc</kbd> schließen</span>
      </p>
    </>
  );
}

// Zweiter Schritt: Titel und Projekt; Esc und „Zurück“ führen zur Suche zurück
function NewTaskStep({ initialProject, onBack, onCreate }) {
  const titleId = useId();
  const projectId = useId();
  const errorId = useId();
  const headId = useId();
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState('');
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const submit = e => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError('Bitte einen Titel eingeben.');
      titleRef.current?.focus();
      return;
    }
    onCreate({ title: t, project });
  };

  return (
    <form className="palette__form" onSubmit={submit} aria-labelledby={headId} noValidate
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onBack(); } }}>
      <h2 id={headId} className="palette__form-title">Neue Aufgabe</h2>
      <div className="field">
        <label htmlFor={titleId}>Titel</label>
        <input ref={titleRef} id={titleId} className="input" type="text" value={title} maxLength={200} autoComplete="off"
          enterKeyHint="done" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}
          onChange={e => { setTitle(e.target.value); if (error) setError(''); }} />
        {error && <p id={errorId} className="palette__error">{error}</p>}
      </div>
      <div className="field">
        <label htmlFor={projectId}>Projekt</label>
        <select id={projectId} className="select" value={project} onChange={e => setProject(e.target.value)}>
          {loadProjects().map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
        </select>
      </div>
      <p className="meta">Dir zugewiesen, Status „{statusLabel.todo}“, ohne Schätzung und ohne Termin.</p>
      <div className="palette__form-actions">
        <button type="button" className="btn" onClick={onBack}>Zurück</button>
        <button type="submit" className="btn btn-primary">Aufgabe anlegen</button>
      </div>
    </form>
  );
}

function PaletteBody({
  routes, timerState, lastProject, bookedIds, recentIds, routeProjectId, onStart, onStop, onHelp, onGo, onTaskCreated, close,
}) {
  const [tasks, setTasks] = useStoredState('tasks', sampleTasks, cleanTasks);
  const [step, setStep] = useState('search');
  const [query, setQuery] = useState('');
  const { running, timer, startedMs } = timerState;
  // Laufzeit beim Öffnen reicht für „läuft seit …“ – die Palette zählt nicht mit
  const [openedAt] = useState(() => Date.now());
  const elapsedMin = running ? (openedAt - startedMs) / 60000 : 0;

  const index = useMemo(() => buildIndex({
    routes, running, timer, elapsedMin, lastProject, bookedIds, tasks: Array.isArray(tasks) ? tasks : [], routeProjectId,
    handlers: { onStart, onStop, onHelp },
  }), [routes, running, timer, elapsedMin, lastProject, bookedIds, tasks, routeProjectId, onStart, onStop, onHelp]);

  const run = item => {
    if (item.step) { setStep(item.step); return; }
    if (item.to) { close({ toMain: true }); onGo(item.to); return; }
    close();
    item.run();
  };

  const create = ({ title, project }) => {
    const task = { id: `t-${uid()}`, project, title, status: 'todo', assignee: me.id, due: null, estimate: null };
    setTasks(list => [...(Array.isArray(list) ? list : []), task]);
    close();
    onTaskCreated(task);
  };

  const backToSearch = () => {
    setStep('search');
    // Fokus zurück ins Suchfeld, sobald es wieder da ist
    requestAnimationFrame(() => document.querySelector('.palette [data-autofocus]')?.focus());
  };

  if (step === 'task') {
    const initial = projectsById()[routeProjectId] ? routeProjectId : recentIds[0] || lastProject;
    return <NewTaskStep initialProject={initial} onBack={backToSearch} onCreate={create} />;
  }
  return (
    <SearchStep index={index} recentIds={recentIds} bookedIds={bookedIds} running={running}
      query={query} setQuery={setQuery} onRun={run} />
  );
}

export default function CommandPalette({ open, onClose, ...rest }) {
  const ref = useRef(null);
  const opener = useRef(null);
  const restore = useRef(true);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      restore.current = true;
      d.showModal();
      d.querySelector('[data-autofocus]')?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Schließen; bei Navigation geht der Fokus an <main> – die Hülle setzt ihn dann auf die <h1> der neuen Seite
  const close = ({ toMain = false } = {}) => {
    restore.current = !toMain;
    ref.current?.close();
    if (toMain) document.getElementById('main')?.focus({ preventScroll: true });
  };

  const onDialogClose = () => {
    const el = opener.current;
    opener.current = null;
    onClose();
    if (restore.current && el && el.isConnected && typeof el.focus === 'function') el.focus({ preventScroll: true });
  };

  // Klick auf den Hintergrund schließt
  const onClick = e => {
    const d = ref.current;
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  };

  return (
    <dialog ref={ref} className="palette panel" aria-label="Befehlspalette" onClose={onDialogClose} onClick={onClick}>
      {open && <PaletteBody {...rest} close={close} />}
    </dialog>
  );
}
