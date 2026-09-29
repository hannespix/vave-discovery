import { forwardRef, useId } from 'react';
import { MOD_LABEL } from './shortcuts.js';

// Übersicht der Tastenkürzel („?“) – natives <dialog>: Esc schließt, der Fokus geht zurück.
// goRoutes: Einträge aus App.routes mit key (g, dann key).
const Keys = ({ keys }) => (
  <span className="keys">
    {keys.map((k, i) => (k === 'dann' || k === 'oder'
      ? <span key={i} className="keys__word">{k}</span>
      : <kbd key={i} className="kbd">{k}</kbd>))}
  </span>
);

const ShortcutsDialog = forwardRef(function ShortcutsDialog({ goRoutes }, ref) {
  const titleId = useId();
  const descId = useId();
  const sections = [
    {
      title: 'Allgemein',
      rows: [
        ['Suchen und Befehle', [MOD_LABEL, 'K', 'oder', '/']],
        ['Diese Übersicht', ['?']],
      ],
    },
    {
      title: 'Zeit',
      rows: [
        ['Timer starten oder stoppen', ['T']],
        ['Zeit nachtragen', ['N']],
      ],
    },
    { title: 'Gehe zu', rows: goRoutes.map(r => [r.label, ['G', 'dann', r.key.toUpperCase()]]) },
  ];

  return (
    <dialog ref={ref} className="dialog shortcuts" aria-labelledby={titleId} aria-describedby={descId}>
      <h2 id={titleId} className="dialog__title">Tastenkürzel</h2>
      <p id={descId} className="dialog__text">
        Einzeltasten wirken nicht, solange ein Eingabefeld den Fokus hat. Der Timer startet mit dem zuletzt gebuchten Projekt.
      </p>
      {sections.map(s => (
        <section key={s.title} className="shortcuts__section">
          <h3 className="overline">{s.title}</h3>
          <dl className="shortcuts__list">
            {s.rows.map(([label, keys]) => (
              <div key={label} className="shortcuts__row">
                <dt>{label}</dt>
                <dd><Keys keys={keys} /></dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <form method="dialog" className="dialog__actions">
        <button className="btn" value="close">Schließen</button>
      </form>
    </dialog>
  );
});

export default ShortcutsDialog;
