import { useEffect, useId, useRef, useState } from 'react';
import { FEIERABEND_HOUR, MAX_BOOK_MS, TIMER_GUARD, useElapsed } from '../lib/timer.js';
import { fmtDate, fmtDuration } from '../lib/format.js';
import { projectInfo } from './shellData.js';

// Rückfrage bei langem Timer (r07-Korrektur). Über 10 h bucht stop() in lib/timer.js nicht, sondern feuert TIMER_GUARD.
// Die Hülle hört hier an einer Stelle zu – so fragt jeder Stopp-Ort gleich: Pille, Handy-Chip, Kürzel t, Palette,
// Zeiten, Board. Natives <dialog>: Fokus bleibt im Dialog, Esc heißt „weiterlaufen lassen“.
// onResolve(resolution, endAt) ruft stop({ resolution, endAt }) auf und zeigt die Bestätigung (App).
const minutesOf = ms => Math.max(0, Math.round(ms / 60000));
const hourLabel = `${String(FEIERABEND_HOUR).padStart(2, '0')}:00`;
// Zusammenhalten, was nicht umbrechen soll („15:00 h“, „MIR-07“) – schmal bricht sonst „H“ oder „07“ allein um.
// In Knöpfen steht die Beschriftung in einem <span>: .btn ist ein Flex-Container mit Abstand zwischen den Kindern.
const Keep = ({ children }) => <span className="stop-guard__keep">{children}</span>;

export default function StopGuard({ timerState, onResolve }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  const [ask, setAsk] = useState(null); // detail aus TIMER_GUARD: { startedMs, feierabend, project, note, date, start, … }
  const elapsed = useElapsed(ask?.startedMs ?? 0, Boolean(ask));

  useEffect(() => {
    const onGuard = e => { if (e.detail && Number.isFinite(e.detail.startedMs)) setAsk(e.detail); };
    window.addEventListener(TIMER_GUARD, onGuard);
    return () => window.removeEventListener(TIMER_GUARD, onGuard);
  }, []);

  // Öffnen ohne Animation; Fokus auf die empfohlene Wahl (Buchen), sonst auf „Weiterlaufen lassen“
  useEffect(() => {
    const d = ref.current;
    if (!ask || !d) return;
    if (!d.open) d.showModal();
    d.querySelector('[data-autofocus]')?.focus();
  }, [ask]);

  // Nach dem Buchen ist der Stopp-Knopf weg (die Pille zeigt wieder „Timer starten“): Fokus dorthin statt ins Leere
  const refocus = () => requestAnimationFrame(() => {
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected) return;
    const start = [...document.querySelectorAll('[data-timer-start]')].find(el => el.getClientRects().length);
    (start || document.getElementById('main'))?.focus({ preventScroll: true });
  });

  const finish = (resolution = null, endAt = null) => {
    setAsk(null);
    if (ref.current?.open) ref.current.close();
    if (!resolution) return;
    onResolve(resolution, endAt);
    refocus();
  };

  // Timer inzwischen anderswo gestoppt oder neu gestartet (anderer Tab, Zeiten): Frage erledigt, nichts tun
  const { running, startedMs } = timerState;
  useEffect(() => {
    if (ask && (!running || startedMs !== ask.startedMs)) finish();
  }, [ask, running, startedMs]); // eslint-disable-line react-hooks/exhaustive-deps -- finish liest nur Refs/Setter

  const runMs = ask ? Math.max(elapsed, ask.runMs || 0) : 0;
  const canBookFull = runMs <= MAX_BOOK_MS;
  const endMs = ask && Number.isFinite(ask.feierabend) ? ask.feierabend : null;
  const p = ask ? projectInfo(ask.project) : null;
  const note = ask ? String(ask.note ?? '').trim() : '';
  const recommended = endMs !== null ? 'end' : canBookFull ? 'full' : 'keep';

  return (
    <dialog ref={ref} className="dialog stop-guard" aria-labelledby={titleId} aria-describedby={descId}
      onClose={() => setAsk(null)}>
      {ask && (
        <>
          <h2 id={titleId} className="dialog__title">Timer läuft seit <Keep>{fmtDuration(minutesOf(runMs))}</Keep></h2>
          <div id={descId} className="dialog__text stop-guard__text">
            <p>
              Gestartet <Keep>{fmtDate(ask.startedMs, { weekday: 'short', day: '2-digit', month: '2-digit' })}</Keep>,{' '}
              <Keep>{ask.start} Uhr</Keep> auf <Keep>{p.code}</Keep>{note ? ` · ${note}` : ` · ${p.name}`}. Vergessen zu stoppen?
            </p>
            {!canBookFull && <p>Mehr als 24 h lassen sich nicht am Stück buchen.</p>}
          </div>
          <div className="stop-guard__options">
            {endMs !== null && (
              <button type="button" className="btn btn-primary btn-block" data-choice="end"
                data-autofocus={recommended === 'end' ? '' : undefined} onClick={() => finish('end', endMs)}>
                <span>Bis {hourLabel} buchen (<Keep>{fmtDuration(minutesOf(endMs - ask.startedMs))}</Keep>)</span>
              </button>
            )}
            {canBookFull && (
              <button type="button" className={`btn btn-block${recommended === 'full' ? ' btn-primary' : ''}`} data-choice="full"
                data-autofocus={recommended === 'full' ? '' : undefined} onClick={() => finish('full')}>
                <span>Alles buchen (<Keep>{fmtDuration(minutesOf(runMs))}</Keep>)</span>
              </button>
            )}
            <button type="button" className="btn btn-block" data-choice="discard" onClick={() => finish('discard')}>
              Verwerfen
            </button>
            <button type="button" className="btn btn-ghost btn-block" data-choice="keep"
              data-autofocus={recommended === 'keep' ? '' : undefined} onClick={() => finish()}>
              Weiterlaufen lassen
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
