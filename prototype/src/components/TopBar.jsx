import { useEffect, useId, useRef, useState } from 'react';
import { Menu, RotateCcw, X } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';
import SearchButton from './SearchButton.jsx';
import { TimerChip, TimerHeadStart, TimerStart } from './TimerPill.jsx';

// Schmale Ansicht (< 1024 px): Wortmarke, Timer (Ruhe: sichtbarer Start, läuft: Chip mit Stopp), Suchen, Menü.
// Das Menü zeigt den Start zusätzlich mit Projekt; dort liegen auch Darstellung und Zurücksetzen.
export default function TopBar({ theme, onTheme, onReset, path, timerState, lastProject, onStart, onStop, onSearch }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef(null);
  const wrapRef = useRef(null);
  const startRef = useRef(null);
  const focusNext = useRef(null); // Fokus springt mit: Start → Stopp im Chip → Start im Kopf
  const { running } = timerState;

  useEffect(() => {
    const target = focusNext.current === 'stop' ? wrapRef.current?.querySelector('.timer-chip .timer-stop')
      : focusNext.current === 'start' ? startRef.current : null;
    focusNext.current = null;
    target?.focus();
  }, [running]);

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

  // Start (Kopf oder Menü): Menü zu, Fokus auf den Stopp im Chip, der an derselben Stelle erscheint
  const start = () => {
    setOpen(false);
    focusNext.current = 'stop';
    if (!onStart()?.started) { focusNext.current = null; btnRef.current?.focus(); }
  };
  // Stopp im Chip: der Chip verschwindet – Fokus auf den Start im Kopf. Fragt der Stopp erst nach (über 10 h),
  // bleibt der Chip und die Rückfrage übernimmt den Fokus.
  const stop = () => {
    focusNext.current = 'start';
    const res = onStop();
    if (!res || res.pending) focusNext.current = null;
  };

  return (
    <header className="topbar" ref={wrapRef}>
      <div className="topbar__bar">
        <Wordmark sub={null} />
        <div className="topbar__actions">
          {running
            ? <TimerChip timerState={timerState} onStop={stop} />
            : <TimerHeadStart project={lastProject} onStart={start} buttonRef={startRef} />}
          <SearchButton compact onClick={() => { setOpen(false); onSearch(); }} />
          <button
            ref={btnRef}
            type="button"
            className="btn btn-ghost btn-icon topbar__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label="Menü"
            onClick={() => setOpen(o => !o)}
          >
            {open
              ? <X aria-hidden="true" size={20} strokeWidth={1.75} />
              : <Menu aria-hidden="true" size={20} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      <p className="topbar__note">
        <span className="badge badge-lime">Beispieldaten</span><span className="visually-hidden">:</span> Änderungen bleiben im Browser.
      </p>
      <div id={panelId} className="topbar__panel" hidden={!open}>
        {!running && <TimerStart project={lastProject} onStart={start} className="timer-pill--menu" />}
        <ThemeSwitch value={theme} onChange={onTheme} />
        <button type="button" className="btn btn-block" onClick={() => { setOpen(false); onReset(); }}>
          <RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} />
          Demo zurücksetzen
        </button>
      </div>
    </header>
  );
}
