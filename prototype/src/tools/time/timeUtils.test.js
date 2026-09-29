// Node-Test der Hilfen: node --test 'src/tools/time/*.test.js'   (aus prototype/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endOf, isoWeek, mondayIso, parseDay, recentCombos, sameCombo, suggestStart, toMinutes, weekDays } from './timeUtils.js';

const DAY = '2026-09-29'; // Dienstag, KW 40
const e = (id, start, minutes, extra = {}) => ({ id, date: DAY, start, minutes, project: 'pr1', note: '', ...extra });
const hm = s => toMinutes(s);

test('Beginn an einem anderen Tag: Ende des letzten Eintrags, sonst 09:00', () => {
  assert.equal(suggestStart([], DAY), '09:00');
  assert.equal(suggestStart([e('a', '09:00', 90), e('b', '10:45', 75)], DAY), '12:00');
  assert.equal(suggestStart([e('a', '20:00', 300)], DAY), '23:59');
});

test('heute direkt nach einem Timer-Stopp (18:41): 1:30 endet nie in der Zukunft, sondern kommt in die Lücke davor', () => {
  const list = [e('a', '09:00', 90), e('b', '10:45', 75), e('timer', '17:11', 90)];
  const nowMin = hm('18:41');
  assert.equal(suggestStart(list, DAY, { minutes: 0, nowMin }), '18:41', 'ohne Dauer: direkt nach dem Timer');
  const start = suggestStart(list, DAY, { minutes: 90, nowMin });
  assert.equal(start, '12:00');
  assert.ok(hm(start) + 90 <= nowMin);
  assert.ok(hm(endOf({ start, minutes: 90 })) <= nowMin);
});

test('heute ohne Einträge: 09:00, wenn es passt – sonst so, dass das Ende höchstens jetzt ist', () => {
  assert.equal(suggestStart([], DAY, { minutes: 60, nowMin: hm('15:00') }), '09:00');
  assert.equal(suggestStart([], DAY, { minutes: 120, nowMin: hm('10:00') }), '08:00');
});

test('heute ohne passende Lücke: vor den ersten Eintrag, sonst Ende = jetzt; länger als der Tag bis jetzt → 00:00', () => {
  assert.equal(suggestStart([e('a', '09:00', 180)], DAY, { minutes: 60, nowMin: hm('12:00') }), '08:00');
  assert.equal(suggestStart([e('a', '01:00', 660)], DAY, { minutes: 120, nowMin: hm('12:00') }), '10:00', 'kein Platz: endet jetzt');
  assert.equal(suggestStart([], DAY, { minutes: 120, nowMin: hm('00:30') }), '00:00');
  // Jede Kombination aus Dauer und Uhrzeit: das Ende liegt nie nach jetzt, solange die Dauer in den Tag passt
  const list = [e('a', '08:30', 120), e('b', '13:30', 150), e('c', '16:00', 45)];
  for (let now = 60; now < 1440; now += 37) {
    for (const minutes of [0, 15, 45, 90, 240]) {
      if (minutes > now) continue;
      const start = hm(suggestStart(list, DAY, { minutes, nowMin: now }));
      assert.ok(start + minutes <= now, `jetzt ${now}, Dauer ${minutes}: Beginn ${start}`);
    }
  }
});

test('Woche zu einem Datum: Montag, sieben Tage, heute/Zukunft gemessen an „jetzt“', () => {
  const now = parseDay(DAY);
  assert.equal(mondayIso('2026-09-23'), '2026-09-21');
  assert.equal(mondayIso(now), '2026-09-28');
  const past = weekDays('2026-09-23', now);
  assert.deepEqual(past.map(d => d.iso), ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
  assert.ok(past.every(d => !d.isFuture && !d.isToday), 'vergangene Woche: alles editierbar');
  const cur = weekDays(now, now);
  assert.deepEqual(cur.filter(d => d.isFuture).map(d => d.short), ['Mi', 'Do', 'Fr', 'Sa', 'So']);
  assert.equal(cur.find(d => d.isToday).iso, DAY);
  assert.equal(isoWeek(parseDay('2026-09-21')), 39);
});

test('Kombinationen: Sammeleinträge zählen nicht, laufende Kombination wird erkannt', () => {
  const list = [
    { id: '1', date: DAY, start: '09:00', minutes: 60, project: 'pr1', note: 'Skript', task: 't2' },
    { id: '2', date: DAY, start: '11:00', minutes: 60, project: 'pr1', note: 'Wochenraster', source: 'grid' },
    { id: '3', date: DAY, start: '12:00', minutes: 60, project: 'pr2', note: 'Wochenraster' },
  ];
  const combos = recentCombos(list, ['pr1', 'pr2']);
  assert.deepEqual(combos.map(c => c.key), ['pr1|t2|skript']);
  assert.ok(sameCombo({ project: 'pr1', task: 't2', note: ' skript' }, { project: 'pr1', task: 't2', note: 'Skript' }));
  assert.ok(!sameCombo({ project: 'pr1', note: 'Skript' }, { project: 'pr1', task: 't2', note: 'Skript' }));
  assert.ok(!sameCombo(null, { project: 'pr1', task: null, note: '' }));
});
