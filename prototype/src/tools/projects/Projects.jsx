// Projekte und Aufgaben (B3, B5 · r07). Routen (parts = Pfadteile nach „projekte“):
//   #/projekte                     Liste
//   #/projekte/neu                 Liste mit offenem Panel „Neues Projekt“
//   #/projekte/<id>                Detail, Tab Aufgaben
//   #/projekte/<id>/aufgaben|uebersicht|zeiten   Tabs
//   #/projekte/<id>/bearbeiten     Detail (zuletzt gezeigter Tab) mit offenem Panel „Projekt bearbeiten“
//   #/projekte/<id>/<aufgabe>      Tab Aufgaben, Karte der Aufgabe im Bild, fokussiert und einmal markiert
// Das Panel schließt über die Route: zurück zur Ansicht dahinter – per history.back(), wenn sie der vorige Eintrag ist,
// sonst ersetzend. Nach dem Anlegen ersetzt das neue Projekt den Eintrag „neu“; Zurück führt dann zur Liste.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ProjectList, { initialFilters } from './ProjectList.jsx';
import ProjectDetail, { TABS } from './ProjectDetail.jsx';
import ProjectEditor from './ProjectEditor.jsx';
import Notice from './Notice.jsx';
import { useClients, useProjects } from '../../lib/projects.js';
import { fmtNum } from './helpers.js';
import './projects.css';

const NEW = 'neu';
const EDIT = 'bearbeiten';

export default function Projects({ parts = [] }) {
  // Gemeinsame, bearbeitbare Quelle (lib/projects.js): neu zeichnen bei Änderungen – und hier wird geschrieben, weil
  // diese Komponente über alle Projekt-Routen stehen bleibt (ihre Speicher-Effekte laufen sicher zu Ende)
  const { projects, byId, codeTaken, update, create } = useProjects();
  const { clients, ensure } = useClients();
  const creating = parts[0] === NEW;
  const id = creating ? null : parts[0] || null;
  const sub = id ? parts[1] || null : null;
  const editing = sub === EDIT;
  const route = ['/projekte', ...parts].join('/');
  const panelRoute = creating || editing;

  // Zuletzt gezeigte Ansicht ohne Panel (in diesem Besuch): Hintergrund beim Bearbeiten und Rückweg beim Schließen
  const [lastPlain, setLastPlain] = useState(panelRoute ? null : route);
  if (!panelRoute && lastPlain !== route) setLastPlain(route);
  const [, , plainId, plainSub] = lastPlain ? lastPlain.split('/') : [];
  const plainTab = editing && plainId === id && TABS.some(t => t.key === plainSub) ? plainSub : null;

  const isTab = TABS.some(t => t.key === sub);
  const tab = isTab ? sub : plainTab || 'aufgaben';
  const taskId = sub && !isTab && !editing ? sub : null;
  const project = id ? byId[id] ?? null : null;
  const panelBase = creating ? '/projekte' : `/projekte/${id}${plainTab ? `/${plainTab}` : ''}`;

  // Filter leben hier, damit sie beim Wechsel Liste → Detail → zurück erhalten bleiben
  const [filters, setFilters] = useState(initialFilters);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(null); // Navigation nach dem Speichern: { to, replace? }
  const rootRef = useRef(null);
  const prevId = useRef(id);

  const leave = to => {
    if (lastPlain === to) history.back();
    else location.replace(`#${to}`);
  };

  // Erst nach den Speicher-Effekten (oben in useProjects/useClients) navigieren – so findet das Detail das neue Projekt
  useEffect(() => {
    if (!pending) return;
    setPending(null);
    if (pending.replace) location.replace(`#${pending.to}`);
    else leave(pending.to);
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps -- leave liest den aktuellen Rückweg

  const say = text => setNotice({ id: `${Date.now()}-${Math.random()}`, text });
  const dismissNotice = useCallback(() => setNotice(null), []);

  const save = values => {
    const { note, ...fields } = values;
    const before = Number(project.budget);
    update(project.id, { ...fields, client: ensure(values.client) }, note);
    say(values.budget !== before ? `Budget angepasst: ${fmtNum(before)} → ${fmtNum(values.budget)} h` : 'Gespeichert');
    setPending({ to: panelBase });
  };
  const add = values => {
    const fields = { ...values, client: ensure(values.client) };
    delete fields.note; // einen Grund gibt es erst bei einer Budgetänderung
    const created = create(fields);
    say(`Projekt angelegt: ${created.code}`);
    setPending({ to: `/projekte/${created.id}`, replace: true });
  };

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
      <ProjectEditor
        open={creating || (editing && Boolean(project))}
        mode={creating ? 'new' : 'edit'}
        project={creating ? null : project}
        projects={projects}
        clients={clients}
        codeTaken={codeTaken}
        onDismiss={() => leave(panelBase)}
        onSubmit={creating ? add : save}
      />
      <Notice notice={notice} onDismiss={dismissNotice} />
    </div>
  );
}
