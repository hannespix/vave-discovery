// Felder der Zeiterfassung: Fehlermeldung am Feld und das Dauerfeld mit Echo („= 1:30 h“).
import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { fmtDuration } from '../../lib/format.js';
import { DURATION_HINT, durationError, echoOf, parseDuration } from './duration.js';

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="tt-error">
      <CircleAlert aria-hidden="true" size={18} />
      <span>{children}</span>
    </p>
  );
}

// Dauer mit sofortigem Echo. Fehler erscheinen nach Verlassen des Felds oder nach „Speichern“ (forceError) –
// eindeutige Fehler (über 24 h, Minuten > 59) sofort. hint: Text, solange nichts eingegeben ist.
export function DurationField({ id, label, value, onChange, inputRef, forceError = false, hint = DURATION_HINT, className = '' }) {
  const [left, setLeft] = useState(false);
  const typed = value.trim() !== '';
  const parsed = parseDuration(value);
  const echo = typed ? echoOf(parsed) : null;
  const definite = parsed.error === 'max' || parsed.error === 'minutes';
  const error = parsed.error && (forceError || (typed && (left || definite))) ? durationError(parsed) : '';
  // Über 24 h mit Einheit: die gelesene Dauer vorweg („Gelesen: 25:00 h.“); ohne Einheit nennt der Text sie selbst
  const readAs = parsed.error === 'max' && parsed.minutes && !parsed.plain ? `Gelesen: ${fmtDuration(parsed.minutes)}. ` : '';
  return (
    <div className={`field tt-dur ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id} ref={inputRef} className="input num" type="text" autoComplete="off" spellCheck={false}
        enterKeyHint="done" value={value}
        onChange={e => onChange(e.target.value)} onBlur={() => setLeft(true)} onFocus={() => setLeft(false)}
        aria-invalid={error ? 'true' : undefined} aria-describedby={`${id}-echo`}
      />
      <p id={`${id}-echo`} className="tt-echo" data-state={error ? 'error' : echo ? 'echo' : 'hint'} aria-live="polite">
        {error ? (
          <>
            <CircleAlert aria-hidden="true" size={16} />
            <span>{readAs}{error}</span>
          </>
        ) : (
          <span>{echo ?? hint}</span>
        )}
      </p>
    </div>
  );
}
