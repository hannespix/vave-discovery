import { RotateCcw } from 'lucide-react';
import { href } from '../lib/router.js';
import Wordmark from './Wordmark.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';

// Breite Ansicht (≥ 1024 px): Seitenleiste als volle violette Fläche
export default function Sidebar({ routes, current, theme, onTheme, onReset }) {
  return (
    <header className="sidebar">
      <Wordmark />
      <nav aria-label="Hauptnavigation" className="sidenav">
        <ul role="list">
          {routes.map(r => {
            const Icon = r.icon;
            return (
              <li key={r.path}>
                <a className="sidenav__link" href={href('/' + r.path)} aria-current={r === current ? 'page' : undefined}>
                  <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
                  <span>{r.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar__foot">
        <DemoNote />
        <button type="button" className="btn btn-block" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} />
          Demo zurücksetzen
        </button>
        <ThemeSwitch value={theme} onChange={onTheme} />
      </div>
    </header>
  );
}

export function DemoNote() {
  return (
    <div className="demo-note">
      <span className="badge badge-lime">Prototyp · Beispieldaten</span>
      <p>Alle Namen und Zahlen sind erfunden. Änderungen bleiben nur in diesem Browser.</p>
    </div>
  );
}
