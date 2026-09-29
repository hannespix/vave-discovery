// Bestätigung nach Stopp und Nachtragen: Pille mit Symbol und Klartext. Der Text ist Live-Region, der Knopf liegt daneben.
// „Anzeigen“ erscheint nur, wenn der Eintrag außerhalb des Blicks liegt – zum Eintrag gerollt wird erst auf Wunsch.
import { useLayoutEffect, useRef, useState } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';

const ICON = { ok: CircleCheck, warn: TriangleAlert };

let seq = 0;
// tone: 'ok' (gespeichert), 'warn' (nichts gebucht), 'info' (leise Zeile); action: { label, run, whenHidden?: Element-ID }
export const makeNote = (tone, text, action = null) => ({ key: ++seq, tone, text, action });

export const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Ganz im Fenster und über allem, was unten klebt (scroll-padding-bottom der Hülle hält die Tab-Leiste frei)
export function inView(el) {
  const r = el.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0;
  return r.top >= 0 && r.bottom <= window.innerHeight - pad;
}

// Sanft rollen, bei reduzierter Bewegung sofort
export const scrollToEl = (el, block) => el.scrollIntoView({ block, behavior: reducedMotion() ? 'auto' : 'smooth' });

export default function Confirmation({ note }) {
  const boxRef = useRef(null);
  const [showAction, setShowAction] = useState(false);

  useLayoutEffect(() => {
    const action = note?.action;
    const target = action?.whenHidden ? document.getElementById(action.whenHidden) : null;
    setShowAction(Boolean(action) && (!action.whenHidden || Boolean(target && !inView(target))));
    if (!note || note.tone === 'info') return undefined;
    // Die eigene Bestätigung ganz zeigen: höchstens bis zur Pille unter dem Knopf rollen, nie weiter
    const id = requestAnimationFrame(() => {
      if (boxRef.current && !inView(boxRef.current)) scrollToEl(boxRef.current, 'nearest');
    });
    return () => cancelAnimationFrame(id);
  }, [note]);

  const Icon = note ? ICON[note.tone] : null;
  return (
    <div ref={boxRef} className="tt-confirm" data-tone={note ? note.tone : undefined}>
      <p className="tt-confirm-text" role="status">
        {note && (
          <span className="tt-confirm-msg" key={note.key}>
            {Icon && <Icon aria-hidden="true" size={20} />}
            <span>{note.text}</span>
          </span>
        )}
      </p>
      {note?.action && showAction && (
        <button type="button" className="btn tt-confirm-btn" onClick={note.action.run}>{note.action.label}</button>
      )}
    </div>
  );
}
