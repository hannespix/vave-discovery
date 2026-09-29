// Node-Test der Dauer-Sprache: node --test src/tools/time/   (aus prototype/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { echoOf, parseDuration, toInputDuration } from './duration.js';

const ok = [
  ['1:30', 90], ['0:45', 45], [':45', 45], ['1:5', 65], ['1:30 h', 90], ['24:00', 1440],
  ['1,5', 90], ['1.5', 90], [',5', 30], ['0,25', 15], ['1.2', 72], ['1,5 h', 90], ['1,5h', 90], ['13,5', 810],
  ['90m', 90], ['90 m', 90], ['90 min', 90], ['90 Min.', 90], ['90 Minuten', 90],
  ['1h 30m', 90], ['1h30m', 90], ['1h30', 90], ['1 h 30 m', 90], ['1 Std. 30 Min.', 90], ['1 Stunde 30 Minuten', 90],
  ['1 h', 60], ['1h', 60], ['2 Std', 120], ['24h', 1440],
  // Ganze Zahl ohne Einheit: bis 12 Stunden, darüber Minuten
  ['2', 120], ['12', 720], ['13', 13], ['45', 45], ['90', 90], ['600', 600], ['1440', 1440],
  ['  1H30M ', 90],
];
for (const [input, minutes] of ok) {
  test(`„${input}“ → ${minutes} min`, () => assert.deepEqual(parseDuration(input), { minutes }));
}

const bad = [
  ['', 'empty'], ['   ', 'empty'], ['abc', 'format'], ['1 30', 'format'], ['-1', 'format'], ['1:30:00', 'format'],
  ['1.5.2', 'format'], ['h', 'format'], ['1,5m', 'format'],
  ['1:60', 'minutes'], ['1h 75m', 'minutes'],
  ['0', 'zero'], ['0:00', 'zero'], ['0h', 'zero'],
  ['25h', 'max'], ['24:01', 'max'], ['1441', 'max'], ['30,5', 'max'], ['9'.repeat(400), 'max'],
];
for (const [input, error] of bad) {
  test(`„${input.slice(0, 12)}“ → Fehler ${error}`, () => assert.equal(parseDuration(input).error, error));
}

test('„0“ ist im Wochenraster erlaubt (Sammeleintrag entfernen)', () => {
  assert.deepEqual(parseDuration('0', { allowZero: true }), { minutes: 0 });
  assert.deepEqual(parseDuration('0,0', { allowZero: true }), { minutes: 0 });
});

test('über 24 h nennt die gelesene Dauer mit', () => assert.deepEqual(parseDuration('25h'), { error: 'max', minutes: 1500 }));

test('Echo „= 1:30 h“', () => {
  assert.equal(echoOf(parseDuration('1,5')), '= 1:30 h');
  assert.equal(echoOf(parseDuration('2')), '= 2:00 h');
  assert.equal(echoOf(parseDuration('45')), '= 0:45 h');
  assert.equal(echoOf(parseDuration('90')), '= 1:30 h');
  assert.equal(echoOf(parseDuration('x')), null);
});

test('Minuten → Eingabeformat', () => {
  assert.equal(toInputDuration(90), '1:30');
  assert.equal(toInputDuration(5), '0:05');
  assert.equal(toInputDuration(1440), '24:00');
});
