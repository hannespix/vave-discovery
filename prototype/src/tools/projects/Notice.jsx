// Bestätigung nach Speichern oder Anlegen („Gespeichert“, „Budget angepasst: 640 → 700 h“, „Projekt angelegt: …“).
// Sieht aus wie die Bestätigung der Hülle (Klassen .toast* aus styles/shell.css, dort unverändert) und liegt unten über
// --dock-bottom. Die Statusmeldung (role=status) bleibt immer im DOM, damit Screenreader jede neue Meldung ansagen.
// Sichtbar 6 s, angehalten, solange Maus oder Tastaturfokus darauf liegen.
import { useEffect, useState } from 'react';
import { CircleCheck, X } from 'lucide-react';

const SHOW_MS = 6000;

export default function Notice({ notice, onDismiss }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!notice || paused) return undefined;
    const t = setTimeout(onDismiss, SHOW_MS);
    return () => clearTimeout(t);
  }, [notice, paused, onDismiss]);
  useEffect(() => { setPaused(false); }, [notice]);

  return (
    <div className="toast-dock pj-notice">
      <div
        className={`toast${notice ? ' is-visible' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      >
        {notice && <CircleCheck className="toast__icon" aria-hidden="true" size={20} strokeWidth={1.75} />}
        <p role="status" className={notice ? 'toast__text' : 'visually-hidden'}>{notice?.text ?? ''}</p>
        {notice && (
          <button type="button" className="btn btn-ghost btn-icon toast__close" onClick={onDismiss} aria-label="Hinweis schließen">
            <X aria-hidden="true" size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
