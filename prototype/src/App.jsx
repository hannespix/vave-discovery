import { useHashRoute, href } from './lib/router.js';
import Today from './pages/Today.jsx';
import Studios from './pages/Studios.jsx';
import Later from './pages/Later.jsx';
import TimeTracker from './tools/time/TimeTracker.jsx';
import Projects from './tools/projects/Projects.jsx';

// Routen – Vertrag: jede Seite bekommt { parts } (Pfadteile nach dem ersten), z. B. /projekte/pr1 → parts ['pr1'].
// Besitzer der Hülle (Navigation, Kopf, Layout): Builder A. Werkzeuge: B (Zeiten), C (Projekte).
export const routes = [
  { path: '', label: 'Heute', Component: Today },
  { path: 'zeit', label: 'Zeiten', Component: TimeTracker },
  { path: 'projekte', label: 'Projekte', Component: Projects },
  { path: 'studios', label: 'Studios', Component: Studios },
  { path: 'spaeter', label: 'Nach Klärung', Component: Later },
];

export default function App() {
  const { parts } = useHashRoute();
  const current = routes.find(r => r.path === (parts[0] || '')) || routes[0];
  const Page = current.Component;
  return (
    <>
      <a className="skip-link" href="#main">Zum Inhalt</a>
      <header style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--c-line)' }}>
        <nav aria-label="Hauptnavigation" className="cluster">
          <strong>VAVE</strong>
          {routes.map(r => (
            <a key={r.path} href={href('/' + r.path)} aria-current={r === current ? 'page' : undefined}>{r.label}</a>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1} style={{ padding: 'var(--s-5)' }}>
        <Page parts={parts.slice(1)} />
      </main>
    </>
  );
}
