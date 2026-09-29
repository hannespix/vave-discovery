import { useEffect, useRef } from 'react';
import { Clock3, FolderKanban, Globe, Hourglass, House } from 'lucide-react';
import { useHashRoute } from './lib/router.js';
import { useTheme } from './lib/theme.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import TabBar from './components/TabBar.jsx';
import ResetDialog from './components/ResetDialog.jsx';
import Today from './pages/Today.jsx';
import Studios from './pages/Studios.jsx';
import Later from './pages/Later.jsx';
import TimeTracker from './tools/time/TimeTracker.jsx';
import Projects from './tools/projects/Projects.jsx';
import './styles/components.css';
import './styles/shell.css';

// Routen – Vertrag: jede Seite bekommt { parts } (Pfadteile nach dem ersten), z. B. /projekte/pr1 → parts ['pr1'].
// Besitzer der Hülle (Navigation, Kopf, Layout): Builder A. Werkzeuge: B (Zeiten), C (Projekte).
// label: Navigation und Fenstertitel; short: kürzere Beschriftung in der Tab-Leiste; icon: lucide-Icon.
export const routes = [
  { path: '', label: 'Heute', icon: House, Component: Today },
  { path: 'zeit', label: 'Zeiten', icon: Clock3, Component: TimeTracker },
  { path: 'projekte', label: 'Projekte', icon: FolderKanban, Component: Projects },
  { path: 'studios', label: 'Studios', icon: Globe, Component: Studios },
  { path: 'spaeter', label: 'Nach Klärung', short: 'Klärung', icon: Hourglass, Component: Later },
];

const APP_NAME = 'VAVE Studio-Tool (Prototyp)';

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
  const lastPath = useRef(path);

  useEffect(() => {
    document.title = `${current.label} · ${APP_NAME}`;
  }, [current]);

  // Nach einem Routenwechsel (nicht beim ersten Laden): nach oben, Fokus auf die <h1>
  useEffect(() => {
    if (lastPath.current === path) return;
    lastPath.current = path;
    window.scrollTo(0, 0);
    focusHeading();
  }, [path]);

  const openReset = () => resetRef.current?.showModal();

  // Skip-Link: href="#main" würde den Hash-Router umlenken – deshalb selbst fokussieren
  const skip = e => {
    e.preventDefault();
    const main = document.getElementById('main');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={skip}>Zum Inhalt springen</a>
      <Sidebar routes={routes} current={current} theme={theme} onTheme={setTheme} onReset={openReset} />
      <TopBar theme={theme} onTheme={setTheme} onReset={openReset} path={path} />
      <main id="main" className="main" tabIndex={-1}>
        <div className="content">
          <Page key={current.path} parts={parts.slice(1)} />
        </div>
      </main>
      <TabBar routes={routes} current={current} />
      <ResetDialog ref={resetRef} />
    </div>
  );
}
