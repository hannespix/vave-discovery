// Projekt bearbeiten und anlegen (B5, r07 – Wunsch Hannes: „Projekte editieren? Stundenbudget anpassen?“).
// Natives <dialog> (modal): ab 600 px Seitenpanel rechts, darunter Vollbild-Blatt. Geöffnet und geschlossen wird über
// die Route (#/projekte/neu, #/projekte/<id>/bearbeiten – siehe Projects.jsx). Esc und „Abbrechen“ schließen ohne
// Änderung; der Fokus geht zurück auf den auslösenden Knopf (data-pj-opener="edit" | "new").
// Budget nur in Stunden, kein Geld (bis G2). Weicht das Budget ab, stehen darunter das Echo „640 h → 700 h (+60 h)“ und
// das Feld „Grund der Änderung“ – beides landet beim Speichern in budgetLog (lib/projects.js).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CircleAlert, X } from 'lucide-react';
import { me, people, projectStatusLabel, studios } from '../../data/sample.js';
import { PROJECT_STATUSES } from '../../lib/projects.js';
import { fmtDelta, fmtH, parseHours, personById, studioById, suggestCode } from './helpers.js';

// Felder mit Prüfung in Bildschirmreihenfolge – der Fokus springt auf das erste fehlerhafte.
// Reihenfolge wie im Detail-Kopf (Kunde, Code, Name), dann Budget | Abgabe, Status | Phase, Lead | Studio.
const CHECKED = ['client', 'code', 'name', 'budget', 'due'];
const MAX_BUDGET = 99999;

const findClient = (clients, name) => {
  const n = String(name ?? '').trim().toLowerCase();
  return n ? clients.find(c => c.name.trim().toLowerCase() === n) || null : null;
};
const describe = (...ids) => ids.filter(Boolean).join(' ') || undefined;

function FieldError({ id, children }) {
  return children ? <p id={id} className="pj-error"><CircleAlert size={16} aria-hidden="true" /> {children}</p> : null;
}

function startValues(mode, project, clients) {
  if (mode !== 'edit') {
    return { client: '', code: '', name: '', lead: me.id, studio: me.studio, status: 'aktiv', phase: '', due: '', budget: '', note: '' };
  }
  return {
    client: clients.find(c => c.id === project.client)?.name ?? '',
    code: project.code,
    name: project.name,
    lead: personById[project.lead] ? project.lead : me.id,
    studio: studioById[project.studio] ? project.studio : me.studio,
    status: PROJECT_STATUSES.includes(project.status) ? project.status : 'aktiv',
    phase: project.phase ?? '',
    due: project.due ?? '',
    budget: String(project.budget).replace('.', ','),
    note: '',
  };
}

function EditorForm({ mode, project, projects, clients, codeTaken, titleId, onCancel, onSubmit, onDirty }) {
  const editing = mode === 'edit';
  const [start] = useState(() => startValues(mode, project, clients));
  const [v, setV] = useState(start);
  const [codeAuto, setCodeAuto] = useState(!editing); // Anlegen: Code folgt dem Kunden, bis man ihn selbst ändert
  const [errors, setErrors] = useState({});
  const done = useRef(false);
  const ids = {
    client: useId(), clients: useId(), clientHint: useId(), clientErr: useId(), code: useId(), codeHint: useId(),
    codeErr: useId(), name: useId(), nameErr: useId(), status: useId(), phase: useId(), lead: useId(), studio: useId(),
    due: useId(), dueErr: useId(), budget: useId(), budgetErr: useId(), echo: useId(), note: useId(),
  };
  const refs = { client: useRef(null), code: useRef(null), name: useRef(null), due: useRef(null), budget: useRef(null) };

  const dirty = JSON.stringify(v) !== JSON.stringify(start);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);

  const set = patch => {
    setV(prev => ({ ...prev, ...patch }));
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(patch).forEach(k => delete next[k]);
      return next;
    });
  };
  const changeClient = value => {
    const patch = { client: value };
    if (codeAuto) patch.code = suggestCode(value, { projects, clients, taken: c => codeTaken(c) });
    set(patch);
  };
  const changeCode = value => {
    set({ code: value });
    if (!editing) setCodeAuto(value.trim() === ''); // geleert → wieder Vorschlag
  };

  const budget = parseHours(v.budget);
  const budgetOk = budget !== null && !Number.isNaN(budget) && budget <= MAX_BUDGET;
  const changed = editing && budgetOk && budget !== Number(project.budget);
  const newClient = v.client.trim() !== '' && !findClient(clients, v.client);
  const codeHint = !editing && codeAuto && v.code !== '';

  const submit = e => {
    e.preventDefault();
    if (done.current) return;
    const client = v.client.trim();
    const code = v.code.trim();
    const name = v.name.trim();
    const next = {};
    if (!client) next.client = 'Bitte einen Kunden eingeben – intern: „VAVE intern“.';
    if (!code) next.code = 'Bitte einen Code eingeben.';
    else {
      const hit = codeTaken(code, editing ? project.id : null);
      if (hit) next.code = `„${hit.code}“ ist schon vergeben (${hit.name}).`;
    }
    if (!name) next.name = 'Bitte einen Namen eingeben.';
    if (refs.due.current?.validity?.badInput) next.due = 'Bitte ein vollständiges Datum wählen oder das Feld leeren.';
    if (budget === null) next.budget = 'Bitte ein Budget in Stunden eingeben.';
    else if (!budgetOk) next.budget = 'Bitte eine Zahl von 0 bis 99.999 eingeben, z. B. 120 oder 80,5.';
    setErrors(next);
    const first = CHECKED.find(k => next[k]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    done.current = true; // Doppelklick legt nichts doppelt an
    onSubmit({
      client, code, name, lead: v.lead, studio: v.studio, status: v.status, phase: v.phase.trim(),
      due: v.due || null, budget, note: changed ? v.note.trim() : '',
    });
  };

  return (
    <form className="pj-sheet-form" noValidate onSubmit={submit}>
      <header className="pj-sheet-head">
        <h2 id={titleId} className="pj-sheet-title" tabIndex={-1}>{editing ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
        {editing && <p className="meta pj-sheet-sub"><span className="num">{project.code}</span> · {project.name}</p>}
      </header>

      <div className="pj-sheet-body">
        <div className="field">
          <label htmlFor={ids.client}>Kunde</label>
          <input ref={refs.client} id={ids.client} className="input" list={ids.clients} value={v.client} maxLength={80}
            autoComplete="off" required data-autofocus aria-invalid={errors.client ? true : undefined}
            aria-describedby={describe(newClient && ids.clientHint, errors.client && ids.clientErr)}
            onChange={e => changeClient(e.target.value)} />
          <datalist id={ids.clients}>{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
          {newClient && <p id={ids.clientHint} className="meta">Neuer Kunde – wird beim Speichern angelegt.</p>}
          <FieldError id={ids.clientErr}>{errors.client}</FieldError>
        </div>

        <div className="field pj-field-code">
          <label htmlFor={ids.code}>Code</label>
          <input ref={refs.code} id={ids.code} className="input num" value={v.code} maxLength={16} autoComplete="off"
            autoCapitalize="characters" spellCheck={false} required aria-invalid={errors.code ? true : undefined}
            aria-describedby={describe(codeHint && ids.codeHint, errors.code && ids.codeErr)}
            onChange={e => changeCode(e.target.value)} />
          {codeHint && <p id={ids.codeHint} className="meta">Vorschlag aus dem Kunden, frei änderbar</p>}
          <FieldError id={ids.codeErr}>{errors.code}</FieldError>
        </div>

        <div className="field">
          <label htmlFor={ids.name}>Name</label>
          <input ref={refs.name} id={ids.name} className="input" value={v.name} maxLength={120} autoComplete="off" required
            aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? ids.nameErr : undefined}
            onChange={e => set({ name: e.target.value })} />
          <FieldError id={ids.nameErr}>{errors.name}</FieldError>
        </div>

        {/* Budget weit oben: Hauptgrund zum Bearbeiten; Echo und Grund erscheinen direkt darunter im Blick */}
        <div className="pj-fields-row">
          <div className="field pj-field-budget">
            <label htmlFor={ids.budget}>Budget in Stunden</label>
            <div className="pj-unit">
              <input ref={refs.budget} id={ids.budget} className="input num" inputMode="decimal" value={v.budget} maxLength={10}
                autoComplete="off" required aria-invalid={errors.budget ? true : undefined}
                aria-describedby={describe(changed && ids.echo, errors.budget && ids.budgetErr)}
                onChange={e => set({ budget: e.target.value })} />
              <span className="pj-unit-h" aria-hidden="true">h</span>
            </div>
            <FieldError id={ids.budgetErr}>{errors.budget}</FieldError>
          </div>
          <div className="field pj-field-due">
            <label htmlFor={ids.due}>Abgabe <span className="pj-optional">(optional)</span></label>
            <div className="pj-inline">
              <input ref={refs.due} id={ids.due} className="input num" type="date" value={v.due}
                aria-invalid={errors.due ? true : undefined} aria-describedby={errors.due ? ids.dueErr : undefined}
                onChange={e => set({ due: e.target.value })} />
              {v.due && (
                <button type="button" className="btn btn-ghost btn-icon" aria-label="Abgabe entfernen"
                  onClick={() => { set({ due: '' }); refs.due.current?.focus(); }}>
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
            <FieldError id={ids.dueErr}>{errors.due}</FieldError>
          </div>
        </div>

        {changed && (
          <div className="pj-change-box">
            <p id={ids.echo} className="pj-echo num">
              <span className="visually-hidden">Budget ändert sich: </span>
              {fmtH(project.budget)} → {fmtH(budget)} ({fmtDelta(budget - Number(project.budget))})
            </p>
            <div className="field">
              <label htmlFor={ids.note}>Grund der Änderung <span className="pj-optional">(optional)</span></label>
              <input id={ids.note} className="input" value={v.note} maxLength={200} autoComplete="off"
                onChange={e => set({ note: e.target.value })} />
            </div>
          </div>
        )}

        <div className="pj-fields-row">
          <div className="field pj-field-status">
            <span className="label" id={ids.status}>Status</span>
            <div className="switch pj-status-switch" role="group" aria-labelledby={ids.status}>
              {PROJECT_STATUSES.map(k => (
                <button key={k} type="button" aria-pressed={v.status === k} onClick={() => set({ status: k })}>
                  {projectStatusLabel[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor={ids.phase}>Phase <span className="pj-optional">(optional)</span></label>
            <input id={ids.phase} className="input" value={v.phase} maxLength={60} autoComplete="off"
              onChange={e => set({ phase: e.target.value })} />
          </div>
        </div>

        <div className="pj-fields-row">
          <div className="field">
            <label htmlFor={ids.lead}>Lead</label>
            <select id={ids.lead} className="select" value={v.lead} onChange={e => set({ lead: e.target.value })}>
              {studios.map(s => (
                <optgroup key={s.id} label={s.name}>
                  {people.filter(p => p.studio === s.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={ids.studio}>Studio</label>
            <select id={ids.studio} className="select" value={v.studio} onChange={e => set({ studio: e.target.value })}>
              {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <footer className="pj-sheet-foot">
        <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn btn-primary">{editing ? 'Speichern' : 'Projekt anlegen'}</button>
      </footer>
    </form>
  );
}

// open: aus der Route; mode 'edit' | 'new'; onDismiss: Esc/„Abbrechen“ (Route zurück); onSubmit(values): speichern
export default function ProjectEditor({ open, mode, project, projects, clients, codeTaken, onDismiss, onSubmit }) {
  const ref = useRef(null);
  const titleId = useId();
  const openRef = useRef(false);
  const modeRef = useRef(mode);
  const dirty = useRef(false);
  const first = useRef(true);
  const setDirty = useRef(x => { dirty.current = x; }).current;

  // Fokus zurück auf den auslösenden Knopf – nur, wenn er verloren ist (nicht nach dem Anlegen: dann hat der Titel ihn)
  const restoreFocus = () => {
    const a = document.activeElement;
    if (a && a !== document.body && a.id !== 'main' && !ref.current?.contains(a)) return;
    document.querySelector(`[data-pj-opener="${modeRef.current}"]`)?.focus();
  };

  useLayoutEffect(() => {
    const d = ref.current;
    const pageOpen = first.current; // Seite öffnet gleich mit Panel: ohne Einblenden
    first.current = false;
    openRef.current = open;
    if (!d) return;
    if (open && !d.open) {
      modeRef.current = mode;
      dirty.current = false;
      d.toggleAttribute('data-instant', pageOpen);
      if (pageOpen) window.scrollTo(0, 0);
      d.showModal();
      // Bearbeiten am Touch-Gerät: Fokus auf den Titel, damit nicht sofort die Tastatur das Blatt halb verdeckt
      const touch = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
      (mode === 'edit' && touch ? d.querySelector('.pj-sheet-title') : d.querySelector('[data-autofocus]'))?.focus();
    } else if (!open && d.open) {
      d.close();
      restoreFocus();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- nur beim Öffnen/Schließen

  // Geschlossen von Esc oder „Abbrechen“ (Route noch offen) → Route zurück; nach Routenwechsel nur Fokus
  const onClose = () => {
    if (openRef.current) onDismiss();
    restoreFocus();
  };
  const cancel = () => ref.current?.close();

  // Klick daneben schließt nur, solange nichts geändert ist – Eingaben gehen nicht aus Versehen verloren
  const onClick = e => {
    const d = ref.current;
    if (e.target !== d || dirty.current) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cancel();
  };

  return (
    <dialog ref={ref} className="pj-sheet" aria-labelledby={titleId} onClose={onClose} onClick={onClick}>
      {open && (mode === 'new' || project) && (
        <EditorForm key={`${mode}-${project?.id ?? ''}`} mode={mode} project={project} projects={projects} clients={clients}
          codeTaken={codeTaken} titleId={titleId} onCancel={cancel} onSubmit={onSubmit} onDirty={setDirty} />
      )}
    </dialog>
  );
}
