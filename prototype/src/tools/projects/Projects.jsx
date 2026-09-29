// Projekte und Aufgaben (B3, r07). Routen (parts = Pfadteile nach „projekte“):
//   #/projekte                     Liste
//   #/projekte/<id>                Detail, Tab Aufgaben
//   #/projekte/<id>/aufgaben|uebersicht|zeiten   Tabs
//   #/projekte/<id>/<aufgabe>      Tab Aufgaben, Karte der Aufgabe im Bild, fokussiert und einmal markiert
import { useLayoutEffect, useRef, useState } from 'react';
import ProjectList, { initialFilters } from './ProjectList.jsx';
import ProjectDetail, { TABS } from './ProjectDetail.jsx';
import './projects.css';

export default function Projects({ parts = [] }) {
  const id = parts[0] || null;
  const sub = parts[1] || null;
  const isTab = TABS.some(t => t.key === sub);
  const tab = isTab ? sub : 'aufgaben';
  const taskId = sub && !isTab ? sub : null;
  // Filter leben hier, damit sie beim Wechsel Liste → Detail → zurück erhalten bleiben
  const [filters, setFilters] = useState(initialFilters);
  const rootRef = useRef(null);
  const prevId = useRef(id);

  // Fokus nach Ansichtswechsel: ins Detail → Titel; zurück zur Liste → Link des zuletzt geöffneten Projekts.
  // Tabwechsel im selben Projekt lässt den Fokus auf dem angeklickten Tab (die Hülle respektiert das).
  useLayoutEffect(() => {
    const prev = prevId.current;
    if (prev === id) return;
    prevId.current = id;
    const root = rootRef.current;
    if (!root) return;
    // Hat das Board den Fokus schon gesetzt (tiefer Link auf eine Aufgabe), bleibt er dort – samt Scrollstand
    if (root.contains(document.activeElement)) return;
    const back = !id && prev ? root.querySelector(`[data-project-link="${CSS.escape(prev)}"]`) : null;
    if (!back) window.scrollTo(0, 0);
    (back || root.querySelector('h1'))?.focus();
  }, [id]);

  return (
    <div className="pj" ref={rootRef}>
      {id
        ? <ProjectDetail key={id} id={id} tab={tab} taskId={taskId} />
        : <ProjectList filters={filters} setFilters={setFilters} />}
    </div>
  );
}
