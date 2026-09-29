import { useEffect, useState } from 'react';

// Kleiner Hash-Router: #/projekte/pr1 → { path: '/projekte/pr1', parts: ['projekte', 'pr1'] }. Läuft ohne Server-Konfiguration.
const read = () => {
  const path = (location.hash.replace(/^#/, '') || '/').replace(/\/+$/, '') || '/';
  return { path, parts: path.split('/').filter(Boolean) };
};

export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = to => { location.hash = to; };
export const href = to => '#' + to;
