import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';

// Schmale Ansicht (< 1024 px): kompakte Kopfleiste. Der Hinweis zu den Daten steht ohne Menü darunter;
// Darstellung und Zurücksetzen liegen hinter einem Aufklapp-Knopf.
export default function TopBar({ theme, onTheme, onReset, path }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setOpen(false); }, [path]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
    };
    const onPointer = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <header className="topbar" ref={wrapRef}>
      <div className="topbar__bar">
        <Wordmark sub={null} />
        <span className="badge badge-lime topbar__badge">Prototyp · Beispieldaten</span>
        <button
          ref={btnRef}
          type="button"
          className="btn btn-icon topbar__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Darstellung und Demo"
          onClick={() => setOpen(o => !o)}
        >
          {open
            ? <X aria-hidden="true" size={20} strokeWidth={1.75} />
            : <SlidersHorizontal aria-hidden="true" size={20} strokeWidth={1.75} />}
        </button>
      </div>
      <p className="topbar__note">
        <span className="topbar__note-demo">Beispieldaten · </span>Änderungen bleiben nur in diesem Browser.
      </p>
      <div id={panelId} className="topbar__panel" hidden={!open}>
        <ThemeSwitch value={theme} onChange={onTheme} />
        <button type="button" className="btn btn-block" onClick={() => { setOpen(false); onReset(); }}>
          <RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} />
          Demo zurücksetzen
        </button>
      </div>
    </header>
  );
}
