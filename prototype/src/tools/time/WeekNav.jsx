// Kopf der gewählten Woche über Liste und Raster (r07-K1): ‹ KW 39 · 21.09.–27.09. › · „Diese Woche“ · Summe gegen Soll.
// Über die laufende Woche hinaus geht es nicht: „Nächste Woche“ bleibt fokussierbar (der Fokus springt nicht weg),
// ist dann aber aria-disabled. Der Titel ist Live-Region – ein Wochenwechsel wird angesagt.
// Schmal: Zeile 1 ‹ KW › · Zeile 2 „Diese Woche“ links, Summe rechts (flache Flex-Kinder, die Summe mit margin-left: auto).
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmtDuration } from '../../lib/format.js';
import { WEEK_TARGET_MIN } from './timeUtils.js';

export const RANGE_TITLE_ID = 'tt-range-title';

export default function WeekNav({ weekNo, days, isCurrent, minutes, onPrev, onNext, onCurrent }) {
  return (
    <div className="tt-range">
      <div className="tt-range-nav">
        <button type="button" className="btn btn-ghost btn-icon tt-range-step" aria-label="Vorherige Woche" title="Vorherige Woche" onClick={onPrev}>
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <h2 id={RANGE_TITLE_ID} className="tt-range-title" tabIndex={-1} aria-live="polite">
          <span className="tt-range-kw">KW {weekNo}</span>{' '}
          <span className="tt-range-dates num">{days[0].dm}–{days[6].dm}</span>
          {isCurrent && <span className="visually-hidden"> (diese Woche)</span>}
        </h2>
        <button
          type="button" className="btn btn-ghost btn-icon tt-range-step" aria-label="Nächste Woche"
          title={isCurrent ? 'Das ist die laufende Woche' : 'Nächste Woche'}
          aria-disabled={isCurrent ? 'true' : undefined} onClick={isCurrent ? undefined : onNext}
        >
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>
      {!isCurrent && <button type="button" className="btn tt-range-current" onClick={onCurrent}>Diese Woche</button>}
      <p className="tt-range-figure">
        <strong className="num">{fmtDuration(minutes)}</strong>{' '}
        <span className="meta">von {WEEK_TARGET_MIN / 60} h Soll</span>
      </p>
    </div>
  );
}
