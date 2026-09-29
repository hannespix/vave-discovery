import { href } from '../lib/router.js';

// Schmale Ansicht (< 1024 px): untere Tab-Leiste, 5 Ziele, je ≥ 44 px, über dem Home-Indikator
export default function TabBar({ routes, current }) {
  return (
    <nav aria-label="Hauptnavigation" className="tabbar">
      <ul role="list">
        {routes.map(r => {
          const Icon = r.icon;
          const short = r.short && r.short !== r.label;
          return (
            <li key={r.path}>
              <a
                className="tabbar__link"
                href={href('/' + r.path)}
                aria-current={r === current ? 'page' : undefined}
                aria-label={short ? r.label : undefined}
              >
                <span className="tabbar__icon"><Icon aria-hidden="true" size={20} strokeWidth={1.75} /></span>
                <span className="tabbar__label">{r.short || r.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
