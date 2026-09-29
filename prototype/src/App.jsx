import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, FolderKanban, Globe, Hourglass, House } from 'lucide-react';
import { navigate, useHashRoute } from './lib/router.js';
import { useTheme } from './lib/theme.js';
import { resetDemo, useStoredState } from './lib/store.js';
import { useTimer } from './lib/timer.js';
import { cleanEntries } from './lib/data.js';
import { fmtDate, fmtDuration } from './lib/format.js';
import { projects, timeEntries as sampleEntries } from './data/sample.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import TabBar from './components/TabBar.jsx';
import ResetDialog from './components/ResetDialog.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ShortcutsDialog from './components/ShortcutsDialog.jsx';
import Toast from './components/Toast.jsx';
import { useGlobalShortcuts } from './components/shortcuts.js';
import { RECENT_MAX, bookedProjects, cleanRecent, projectById, projectInfo } from './components/shellData.js';
import Today from './pages/Today.jsx';
import Studios from './pages/Studios.jsx';
import Later from './pages/Later.jsx';
import TimeTracker from './tools/time/TimeTracker.jsx';
import Projects from './tools/projects/Projects.jsx';
import './styles/components.css';
import './styles/shell.css';

// Routen – Vertrag: jede Seite bekommt { parts } (Pfadteile nach dem ersten), z. B. /projekte/pr1 → parts ['pr1'].
// Hülle (Navigation, Kopf, Timer-Pille, Befehlspalette, Kürzel): Builder B1. Werkzeuge: B2 (Zeiten), B3 (Projekte).
// label: Navigation und Fenstertitel; short: kürzer in der Tab-Leiste; group: Gruppe in der Seitenleiste;
// key: Kürzel „g, dann key“; icon: lucide-Icon.
export const routes = [
  { path: '', label: 'Heute', icon: House, group: 'Arbeit', key: 'h', Component: Today },
  { path: 'zeit', label: 'Zeiten', icon: Clock3, group: 'Arbeit', key: 'z', Component: TimeTracker },
  { path: 'projekte', label: 'Projekte', icon: FolderKanban, group: 'Arbeit', key: 'p', Component: Projects },
  { path: 'studios', label: 'Studios', icon: Globe, group: 'Team', key: 's', Component: Studios },
  { path: 'spaeter', label: 'Nach Klärung', short: 'Klärung', icon: Hourglass, group: 'Ausblick', key: 'k', Component: Later },
];
const goKeys = Object.fromEntries(routes.map(r => [r.key, '/' + r.path]));

const APP_NAME = 'VAVE Studio-Tool (Prototyp)';

// Fängt Fehler einer Seite ab (z. B. unpassende gespeicherte Daten): statt weißer Seite ein Weg zurück
class PageBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="card stack" role="alert">
        <h1 className="h2">Hier hakt die Demo</h1>
        <p>Wahrscheinlich passen gespeicherte Demo-Daten nicht mehr. Zurücksetzen stellt die Beispieldaten wieder her.</p>
        <p><button type="button" className="btn btn-primary" onClick={() => { resetDemo(); location.reload(); }}>Demo zurücksetzen</button></p>
      </section>
    );
  }
}

// Fokus auf die Seitenüberschrift – auch für Werkzeug-Seiten ohne tabIndex
function focusHeading() {
  const h = document.querySelector('#main h1');
  if (!h) return document.getElementById('main')?.focus({ preventScroll: true });
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}

export default function App() {
  const { path, parts } = useHashRoute();
  const current = routes.find(r => r.path === (parts[0] || '')) || routes[0];
  const Page = current.Component;
  const [theme, setTheme] = useTheme();
  const resetRef = useRef(null);
  const helpRef = useRef(null);
  const lastPath = useRef(path);

  // Ein Timer für die ganze Hülle; Seiten teilen ihn über lib/timer.js
  const timerApi = useTimer();
  const [entries] = useStoredState('time-entries', sampleEntries, cleanEntries);
  const booked = useMemo(() => bookedProjects(entries), [entries]);
  const lastProject = booked[0] || projects[0].id;
  const [recent, setRecent] = useStoredState('recent-projects', [], cleanRecent);
  const routeProjectId = parts[0] === 'projekte' && projectById[parts[1]] ? parts[1] : null;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = `${current.label} · ${APP_NAME}`;
  }, [current]);

  // Nach einem Routenwechsel (nicht beim ersten Laden): nach oben, Fokus auf die <h1>. Hat die Seite den Fokus schon
  // selbst gesetzt (Effekte der Kinder laufen vorher, z. B. zurück zur Liste auf das zuletzt offene Projekt), bleibt er dort.
  useEffect(() => {
    if (lastPath.current === path) return;
    lastPath.current = path;
    const main = document.getElementById('main');
    const active = document.activeElement;
    if (main && active && active !== main && main.contains(active) && !active.matches('h1')) return;
    window.scrollTo(0, 0);
    focusHeading();
  }, [path]);

  // Zuletzt geöffnete Projekte für die leere Befehlspalette
  useEffect(() => {
    if (!routeProjectId) return;
    setRecent(list => [routeProjectId, ...(Array.isArray(list) ? list : []).filter(id => id !== routeProjectId)].slice(0, RECENT_MAX));
  }, [routeProjectId, setRecent]);

  const notify = useCallback(t => setToast({ id: `${Date.now()}-${Math.random()}`, ...t }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Start mit dem zuletzt gebuchten Projekt, falls keins genannt ist
  const startTimer = projectId => {
    const project = projectId || lastProject;
    const res = timerApi.start({ project });
    if (res?.started) notify({ quiet: true, text: `Timer läuft: ${projectInfo(project).code}` });
    return res;
  };
  // Stopp bucht (lib/timer.js); über 24 h bucht er nichts und führt zum Nachtragen
  const stopTimer = () => {
    const res = timerApi.stop();
    if (!res) return res;
    if (res.overlong) {
      notify({
        tone: 'warn', sticky: true,
        text: `Der Timer lief über 24 h (seit ${fmtDate(`${res.date}T00:00`)}, ${res.start} Uhr) und wurde nicht gebucht.`,
        link: { to: `/zeit/nachtragen/${res.date}`, label: 'Nachtragen' },
      });
    } else {
      notify({
        text: `Gebucht: ${fmtDuration(res.entry.minutes)} auf ${projectInfo(res.entry.project).code}`,
        link: { to: '/zeit', label: 'Anzeigen' },
      });
    }
    return res;
  };
  const toggleTimer = () => (timerApi.running ? stopTimer() : startTimer());

  const openPalette = () => setPaletteOpen(true);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openHelp = () => {
    setPaletteOpen(false);
    if (!helpRef.current?.open) helpRef.current?.showModal();
  };
  const openReset = () => resetRef.current?.showModal();
  const taskCreated = task => notify({
    text: `Aufgabe angelegt: „${task.title}“ in ${projectInfo(task.project).code}`,
    link: { to: `/projekte/${task.project}/${task.id}`, label: 'Anzeigen' },
  });

  useGlobalShortcuts({
    togglePalette: () => setPaletteOpen(o => !o),
    openPalette,
    openHelp,
    toggleTimer,
    go: navigate,
    goKeys,
  });

  // Skip-Link: href="#main" würde den Hash-Router umlenken – deshalb selbst fokussieren
  const skip = e => {
    e.preventDefault();
    const main = document.getElementById('main');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
  };

  const timerState = { timer: timerApi.timer, running: timerApi.running, startedMs: timerApi.startedMs };
  const shellProps = { timerState, lastProject, onStart: startTimer, onStop: stopTimer, onSearch: openPalette };

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={skip}>Zum Inhalt springen</a>
      <Sidebar routes={routes} current={current} theme={theme} onTheme={setTheme} onReset={openReset} {...shellProps} />
      <TopBar theme={theme} onTheme={setTheme} onReset={openReset} path={path} {...shellProps} />
      <main id="main" className="main" tabIndex={-1}>
        <div className="content">
          <PageBoundary key={current.path}>
            <Page parts={parts.slice(1)} />
          </PageBoundary>
        </div>
      </main>
      <TabBar routes={routes} current={current} />
      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        routes={routes}
        timerState={timerState}
        lastProject={lastProject}
        bookedIds={booked}
        recentIds={recent}
        routeProjectId={routeProjectId}
        onStart={startTimer}
        onStop={stopTimer}
        onHelp={openHelp}
        onGo={navigate}
        onTaskCreated={taskCreated}
      />
      <ShortcutsDialog ref={helpRef} goRoutes={routes} />
      <ResetDialog ref={resetRef} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
