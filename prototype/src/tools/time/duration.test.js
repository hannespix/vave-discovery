// Node-Test der Dauer-Sprache: node --test 'src/tools/time/*.test.js'   (aus prototype/)
// Regel (r07-K1): Zahl ohne Einheit = Stunden, Minuten nur mit „m“/„min“.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DURATION_HINT, durationError, durationMessage, echoOf, parseDuration, toInputDuration } from './duration.js';

const ok = [
  ['1:30', 90], ['0:45', 45], [':45', 45], ['1:5', 65], ['1:30 h', 90], ['24:00', 1440],
  ['1,5', 90], ['1.5', 90], [',5', 30], ['0,25', 15], ['1.2', 72], ['1,5 h', 90], ['1,5h', 90], ['13,5', 810],
  ['45m', 45], ['45 m', 45], ['90m', 90], ['90 m', 90], ['90 min', 90], ['90 Min.', 90], ['90 Minuten', 90], ['600m', 600],
  ['1h 30m', 90], ['1h30m', 90], ['1h30', 90], ['1 h 30 m', 90], ['1 Std. 30 Min.', 90], ['1 Stunde 30 Minuten', 90],
  ['1 h', 60], ['1h', 60], ['2 Std', 120], ['24h', 1440],
  // Zahl ohne Einheit: immer Stunden
  ['1', 60], ['2', 120], ['10', 600], ['12', 720], ['13', 780], ['20', 1200], ['24', 1440],
  ['  1H30M ', 90],
];
for (const [input, minutes] of ok) {
  test(`„${input}“ → ${minutes} min`, () => assert.deepEqual(parseDuration(input), { minutes }));
}

const bad = [
  ['', 'empty'], ['   ', 'empty'], ['abc', 'format'], ['1 30', 'format'], ['-1', 'format'], ['1:30:00', 'format'],
  ['1.5.2', 'format'], ['h', 'format'], ['1,5m', 'format'],
  ['1:60', 'minutes'], ['1h 75m', 'minutes'],
  ['0', 'zero'], ['0:00', 'zero'], ['0h', 'zero'], ['0m', 'zero'],
  ['25h', 'max'], ['24:01', 'max'], ['1441m', 'max'], ['30,5', 'max'], ['9'.repeat(400), 'max'],
  // Früher Minuten, jetzt Stunden – und damit zu viel
  ['25', 'max'], ['45', 'max'], ['90', 'max'], ['600', 'max'], ['1440', 'max'],
];
for (const [input, error] of bad) {
  test(`„${input.slice(0, 12)}“ → Fehler ${error}`, () => assert.equal(parseDuration(input).error, error));
}

test('„90“ ohne Einheit: Fehler „mehr als 24 h“, mit dem Hinweis auf „90m“ – nie still als Minuten gelesen', () => {
  const r = parseDuration('90');
  assert.deepEqual(r, { error: 'max', minutes: 5400, plain: true });
  const text = durationError(r);
  assert.match(text, /mehr als 24 h/);
  assert.match(text, /90m/);
  assert.deepEqual(parseDuration('90m'), { minutes: 90 });
});

test('mit Einheit über 24 h: allgemeiner Text ohne Minuten-Hinweis', () => {
  assert.equal(durationError(parseDuration('25h')), durationMessage.max);
  assert.equal(durationError(parseDuration('30,5')), durationMessage.max, 'Kommazahl: kein „30,5m“ vorschlagen');
  assert.equal(durationError(parseDuration('9'.repeat(400))), durationMessage.max);
  assert.equal(durationError(parseDuration('1:60')), durationMessage.minutes);
  assert.equal(durationError(parseDuration('2')), '');
});

test('„0“ ist im Wochenraster erlaubt (Sammeleintrag entfernen)', () => {
  assert.deepEqual(parseDuration('0', { allowZero: true }), { minutes: 0 });
  assert.deepEqual(parseDuration('0,0', { allowZero: true }), { minutes: 0 });
});

test('über 24 h nennt die gelesene Dauer mit', () => assert.deepEqual(parseDuration('25h'), { error: 'max', minutes: 1500 }));

test('Echo „= 1:30 h“ sagt dasselbe wie die Regel', () => {
  assert.equal(echoOf(parseDuration('1,5')), '= 1:30 h');
  assert.equal(echoOf(parseDuration('2')), '= 2:00 h');
  assert.equal(echoOf(parseDuration('13')), '= 13:00 h');
  assert.equal(echoOf(parseDuration('45m')), '= 0:45 h');
  assert.equal(echoOf(parseDuration('90 min')), '= 1:30 h');
  assert.equal(echoOf(parseDuration('90')), null);
  assert.equal(echoOf(parseDuration('x')), null);
});

test('Hinweis und Formatfehler widersprechen der Regel nicht', () => {
  assert.match(DURATION_HINT, /Stunden/);
  assert.match(DURATION_HINT, /\d+m\b/);
  assert.match(durationMessage.format, /Stunden/);
});

test('Minuten → Eingabeformat', () => {
  assert.equal(toInputDuration(90), '1:30');
  assert.equal(toInputDuration(5), '0:05');
  assert.equal(toInputDuration(1440), '24:00');
});
