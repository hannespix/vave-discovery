import { forwardRef, useId } from 'react';
import { resetDemo } from '../lib/store.js';

// Rückfrage vor „Demo zurücksetzen“ – natives <dialog>: Fokus bleibt im Dialog, Esc bricht ab.
// Erster Fokus liegt auf „Abbrechen“ (sichere Wahl).
const ResetDialog = forwardRef(function ResetDialog(props, ref) {
  const titleId = useId();
  const descId = useId();
  const confirm = () => {
    resetDemo();
    location.reload();
  };
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} aria-describedby={descId}>
      <h2 id={titleId} className="dialog__title">Demo zurücksetzen?</h2>
      <p id={descId} className="dialog__text">
        Alle Änderungen an Zeiten, Timer und Aufgaben in diesem Browser werden gelöscht.
        Danach startet der Prototyp wieder mit den Beispieldaten.
      </p>
      <form method="dialog" className="dialog__actions">
        <button className="btn" value="cancel">Abbrechen</button>
        <button type="button" className="btn btn-primary" onClick={confirm}>Zurücksetzen</button>
      </form>
    </dialog>
  );
});

export default ResetDialog;
