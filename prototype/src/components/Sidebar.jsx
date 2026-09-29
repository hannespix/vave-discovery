import { useId } from 'react';
import { RotateCcw } from 'lucide-react';
import { href } from '../lib/router.js';
import Wordmark from './Wordmark.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';
import TimerPill from './TimerPill.jsx';
import SearchButton from './SearchButton.jsx';

// Breite Ansicht (≥ 1024 px): neutrale Seitenleiste. Oben die Hauptaktion (Timer) und die Suche,
// darunter die Navigation in Gruppen mit kleinen grauen Labels, unten Hinweis, Zurücksetzen, Darstellung.
export default function Sidebar({ routes, current, theme, onTheme, onReset, timerState, lastProject, onStart, onStop, onSearch }) {
  const baseId = useId();
  const groups = [];
  routes.forEach(r => {
    let g = groups.find(x => x.label === r.group);
    if (!g) groups.push((g = { label: r.group, routes: [] }));
    g.routes.push(r);
  });

  return (
    <header className="sidebar">
      <Wordmark />
      <div className="sidebar__actions">
        <TimerPill timerState={timerState} lastProject={lastProject} onStart={onStart} onStop={onStop} />
        <SearchButton onClick={onSearch} />
      </div>
      <nav aria-label="Hauptnavigation" className="sidenav">
        {groups.map((g, i) => (
          <div key={g.label} className="sidenav__group">
            <p id={`${baseId}-${i}`} className="sidenav__label">{g.label}</p>
            <ul role="list" aria-labelledby={`${baseId}-${i}`}>
              {g.routes.map(r => {
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
          </div>
        ))}
      </nav>
      <div className="sidebar__foot">
        <DemoNote />
        <button type="button" className="btn btn-ghost sidebar__reset" onClick={onReset}>
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
      <p>Alles erfunden. Änderungen bleiben in diesem Browser.</p>
    </div>
  );
}
