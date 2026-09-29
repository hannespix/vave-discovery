// Eine Dauer-Sprache für die ganze Zeiterfassung (r07-K1): Leiste, Bearbeiten-Panel und Wochenraster lesen dasselbe.
//   Zahl ohne Einheit = Stunden: „2“ = 2:00 h, „13“ = 13:00 h, „1,5“ = „1.5“ = 1:30 h. „90“ wären 90 h → Fehler.
//   Minuten nur mit Einheit: „45m“, „90 min“, „90 Minuten“. Dazu „1:30“, „:45“, „1h 30m“, „1h30“, „1 h“, „2 Std.“
// Ergebnis: { minutes } oder { error, minutes?, plain? } – Text über durationError(). Reines Modul (Node-testbar).
import { fmtDuration } from '../../lib/format.js';

export const DAY_MIN = 24 * 60;

// Einheiten vereinheitlichen: Wörter → h/m, Leerraum um Einheiten entfernen. Leerraum zwischen zwei Zahlen bleibt
// stehen und ist dann ein Formatfehler („1 30“ ist mehrdeutig).
function normalize(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/stunden|stunde|std\.?|hrs?\b/g, 'h')
    .replace(/minuten|minute|min\.?/g, 'm')
    .replace(/\s*([hm])\s*/g, '$1');
}

// plain: ohne Einheit geschrieben (dann sind es Stunden) – für den Hinweis „Minuten mit m“
function interpret(s) {
  let m = /^(\d{0,2}):(\d{1,2})h?$/.exec(s);
  if (m) return +m[2] > 59 ? { error: 'minutes' } : { minutes: +(m[1] || 0) * 60 + +m[2] };
  m = /^(\d*)[.,](\d+)(h?)$/.exec(s);
  if (m) return { minutes: Math.round(parseFloat(`${m[1] || '0'}.${m[2]}`) * 60), plain: !m[3] };
  m = /^(\d+)h$/.exec(s);
  if (m) return { minutes: +m[1] * 60 };
  m = /^(\d+)h(\d{1,2})m?$/.exec(s);
  if (m) return +m[2] > 59 ? { error: 'minutes' } : { minutes: +m[1] * 60 + +m[2] };
  m = /^(\d+)m$/.exec(s);
  if (m) return { minutes: +m[1] };
  m = /^(\d+)$/.exec(s);
  if (m) return { minutes: +m[1] * 60, plain: true };
  return { error: 'format' };
}

// allowZero: im Wochenraster heißt „0“ „Sammeleintrag entfernen“; sonst braucht ein Eintrag mindestens 1 Minute.
export function parseDuration(input, { allowZero = false } = {}) {
  const s = normalize(input);
  if (!s) return { error: 'empty' };
  const r = interpret(s);
  if (r.error) return r;
  const plain = r.plain ? { plain: true } : {};
  if (!Number.isFinite(r.minutes)) return { error: 'max', ...plain };
  if (r.minutes > DAY_MIN) return { error: 'max', minutes: r.minutes, ...plain };
  if (r.minutes === 0 && !allowZero) return { error: 'zero' };
  return { minutes: r.minutes };
}

export const durationMessage = {
  empty: 'Bitte eine Dauer eingeben, zum Beispiel 1:30.',
  format: 'Diese Dauer verstehe ich nicht. Möglich sind 1,5 (Stunden), 1:30, 90m oder 1h 30m.',
  minutes: 'Nach dem Doppelpunkt höchstens 59 Minuten, zum Beispiel 1:45.',
  zero: 'Die Dauer muss mindestens 1 Minute betragen.',
  max: 'Mehr als 24 Stunden gehen nicht in einen Eintrag.',
};

// Fehlertext zu einem Ergebnis von parseDuration. Eine ganze Zahl über 24 ohne Einheit war meist als Minuten gemeint:
// dann steht die Schreibweise mit „m“ gleich dabei („90“ → „… Minuten mit m: 90m.“). Nie still umdeuten.
export function durationError(r) {
  if (!r || !r.error) return '';
  if (r.error === 'max' && r.plain && Number.isFinite(r.minutes)) {
    const n = r.minutes / 60;
    if (Number.isInteger(n) && n <= DAY_MIN) return `${n} h ist mehr als 24 h. Minuten mit m: ${n}m.`;
  }
  return durationMessage[r.error] ?? durationMessage.format;
}

export const DURATION_HINT = 'z. B. 1,5 (Stunden) oder 90m';

// Echo unter jedem Dauerfeld: „= 1:30 h“; ungültig → null (dann entscheidet das Feld, ob es die Meldung zeigt)
export const echoOf = r => (r && !r.error ? `= ${fmtDuration(r.minutes)}` : null);

// Minuten → „1:30“ (Eingabefelder, Zellen des Wochenrasters)
export const toInputDuration = min => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`;
