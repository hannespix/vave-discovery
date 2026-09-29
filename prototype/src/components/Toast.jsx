import { useEffect, useState } from 'react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { href } from '../lib/router.js';

// Bestätigung der Hülle (Timer gebucht, nicht gebucht, verworfen, Aufgabe angelegt, Timer über 24 h), unten über
// --dock-bottom. Die Statusmeldung (role=status) bleibt immer im DOM, damit Screenreader jede neue Meldung ansagen.
// toast: { id, text, link?: { to, label }, tone?: 'ok' | 'info' | 'warn', sticky?, quiet? } – quiet = nur für Screenreader.
// info: nichts gebucht, aber auch kein Fehler (unter einer Minute, verworfen) – kein Haken, der „erledigt“ behauptet.
const SHOW_MS = 8000;

export default function Toast({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const visible = Boolean(toast && !toast.quiet);

  useEffect(() => {
    if (!toast || toast.sticky || paused) return undefined;
    const t = setTimeout(onDismiss, toast.quiet ? 3000 : SHOW_MS);
    return () => clearTimeout(t);
  }, [toast, paused, onDismiss]);

  useEffect(() => { setPaused(false); }, [toast]);

  const Icon = toast?.tone === 'warn' ? TriangleAlert : toast?.tone === 'info' ? Info : CircleCheck;
  return (
    <div className="toast-dock">
      <div
        className={`toast${visible ? ' is-visible' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      >
        {visible && <Icon className="toast__icon" aria-hidden="true" size={20} strokeWidth={1.75} />}
        <p role="status" className={visible ? 'toast__text' : 'visually-hidden'}>{toast?.text ?? ''}</p>
        {visible && toast.link && (
          <a className="toast__link" href={href(toast.link.to)} onClick={onDismiss}>{toast.link.label}</a>
        )}
        {visible && (
          <button type="button" className="btn btn-ghost btn-icon toast__close" onClick={onDismiss} aria-label="Hinweis schließen">
            <X aria-hidden="true" size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
