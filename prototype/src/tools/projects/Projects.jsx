// Projekte und Aufgaben (Builder C). Route #/projekte → Liste, #/projekte/<id> → Detail mit Aufgaben-Board.
import { useLayoutEffect, useRef, useState } from 'react';
import ProjectList, { initialFilters } from './ProjectList.jsx';
import ProjectDetail from './ProjectDetail.jsx';
import './projects.css';

export default function Projects({ parts = [] }) {
  const id = parts[0] || null;
  // Filter leben hier, damit sie beim Wechsel Liste → Detail → zurück erhalten bleiben
  const [filters, setFilters] = useState(initialFilters);
  const rootRef = useRef(null);
  const prevId = useRef(id);

  // Fokus nach Ansichtswechsel: ins Detail → Titel; zurück zur Liste → Link des zuletzt geöffneten Projekts
  useLayoutEffect(() => {
    const prev = prevId.current;
    if (prev === id) return;
    prevId.current = id;
    const root = rootRef.current;
    if (!root) return;
    const back = !id && prev ? root.querySelector(`[data-project-link="${CSS.escape(prev)}"]`) : null;
    if (!back) window.scrollTo(0, 0);
    (back || root.querySelector('h1'))?.focus();
  }, [id]);

  return (
    <div className="pj" ref={rootRef}>
      {id ? <ProjectDetail key={id} id={id} /> : <ProjectList filters={filters} setFilters={setFilters} />}
    </div>
  );
}
