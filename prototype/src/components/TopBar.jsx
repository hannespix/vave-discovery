import { useEffect, useId, useRef, useState } from 'react';
import { Menu, RotateCcw, X } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import ThemeSwitch from './ThemeSwitch.jsx';
import SearchButton from './SearchButton.jsx';
import { TimerChip, TimerStart } from './TimerPill.jsx';

// Schmale Ansicht (< 1024 px): Wortmarke, Timer-Chip (nur wenn er läuft), Suchen, Menü.
// Ruht der Timer, startet ihn das Menü (oder die Palette); dort liegen auch Darstellung und Zurücksetzen.
export default function TopBar({ theme, onTheme, onReset, path, timerState, lastProject, onStart, onStop, onSearch }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef(null);
  const wrapRef = useRef(null);
  const { running } = timerState;

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

  // Start im Menü: Menü zu, Fokus auf den Menü-Knopf (der Chip erscheint daneben)
  const start = () => { setOpen(false); onStart(); btnRef.current?.focus(); };
  // Stopp im Chip: der Chip verschwindet – Fokus auf den Menü-Knopf statt ins Leere
  const stop = () => { onStop(); btnRef.current?.focus(); };

  return (
    <header className="topbar" ref={wrapRef}>
      <div className="topbar__bar">
        <Wordmark sub={null} />
        <div className="topbar__actions">
          {running && <TimerChip timerState={timerState} onStop={stop} />}
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
