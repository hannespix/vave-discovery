// Hinweis unten im Blick (über der Tab-Leiste), ohne die Seite zu verschieben: „Gelöscht … Rückgängig“, „Timer läuft …“.
// Pausiert, solange Maus oder Tastaturfokus darauf liegen; Esc schließt.
import { useEffect, useRef, useState } from 'react';
import { CircleCheck, TriangleAlert, Undo2 } from 'lucide-react';

const UNDO_MS = 8000;
const INFO_MS = 4000;

// show({ text, tone?: 'ok' | 'warn', undo?: () => void, focusUndo?: boolean }); onClosed(hadFocus) nach dem Schließen
export function useToast({ onClosed } = {}) {
  const [toast, setToast] = useState(null);
  const ref = useRef(null);
  const timer = useRef(0);
  const closed = useRef(onClosed);
  closed.current = onClosed;
  useEffect(() => () => clearTimeout(timer.current), []);

  const dismiss = moveFocus => {
    clearTimeout(timer.current);
    const hadFocus = Boolean(ref.current?.contains(document.activeElement));
    setToast(null);
    if (hadFocus || moveFocus) closed.current?.(true);
  };
  const schedule = ms => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => dismiss(false), ms);
  };
  const show = next => {
    setToast({ ...next, key: Date.now() });
    schedule(next.undo ? UNDO_MS : INFO_MS);
  };
  const keyboardInside = () => {
    const el = document.activeElement;
    return Boolean(ref.current?.contains(el) && el.matches(':focus-visible'));
  };
  const events = {
    onMouseEnter: () => clearTimeout(timer.current),
    onMouseLeave: () => { if (toast && !keyboardInside()) schedule(INFO_MS); },
    onFocus: e => { if (e.target.matches(':focus-visible')) clearTimeout(timer.current); },
    onBlur: e => { if (toast && !ref.current?.contains(e.relatedTarget)) schedule(INFO_MS); },
    onKeyDown: e => { if (e.key === 'Escape' && toast) { e.preventDefault(); dismiss(true); } },
  };
  return { toast, show, dismiss, ref, events };
}

export default function Toast({ api }) {
  const { toast, ref, events } = api;
  const Icon = toast?.tone === 'warn' ? TriangleAlert : CircleCheck;
  return (
    <div className="tt-toast-region" role="status" ref={ref} {...events}>
      {toast && (
        <div className="tt-toast" key={toast.key} data-tone={toast.tone}>
          <p className="tt-toast-msg">
            {!toast.undo && <Icon aria-hidden="true" size={18} />}
            <span>{toast.text}</span>
          </p>
          {toast.undo && (
            <button id="tt-undo" type="button" className="btn tt-toast-btn" onClick={toast.undo}>
              <Undo2 aria-hidden="true" size={18} />
              Rückgängig
            </button>
          )}
        </div>
      )}
    </div>
  );
}
