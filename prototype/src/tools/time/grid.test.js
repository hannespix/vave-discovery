// Node-Test des Wochenrasters: node --test 'src/tools/time/*.test.js'   (aus prototype/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_NOTE, GRID_SOURCE, cellTotals, gridRows, isAggregate, resumeCombo, revertCell, setCell,
} from './grid.js';

const DAY = '2026-09-29';
let n = 0;
const newId = () => `g${++n}`;
const base = { project: 'pr2', date: DAY, person: 'p1', start: '12:00', newId };
const cell = (list, project = 'pr2', date = DAY) => cellTotals(list).get(`${project}|${date}`) || 0;
const aggregates = list => list.filter(e => e.note === GRID_NOTE);

test('leere Zelle auf 2 h → ein Sammeleintrag mit 120 min, danach 1,5 h → 90 min, dann 0 → entfernt', () => {
  let list = [{ id: 'a', date: DAY, start: '09:00', minutes: 60, project: 'pr1', note: 'x', person: 'p1' }];
  let r = setCell(list, { ...base, minutes: 120 });
  assert.equal(r.action, 'created');
  list = r.entries;
  assert.equal(aggregates(list).length, 1);
  assert.equal(aggregates(list)[0].minutes, 120);
  assert.equal(aggregates(list)[0].date, DAY);
  assert.equal(cell(list), 120);

  r = setCell(list, { ...base, minutes: 90 });
  assert.equal(r.action, 'updated');
  list = r.entries;
  assert.equal(aggregates(list).length, 1);
  assert.equal(aggregates(list)[0].minutes, 90);

  r = setCell(list, { ...base, minutes: 0 });
  assert.equal(r.action, 'removed');
  list = r.entries;
  assert.equal(aggregates(list).length, 0);
  assert.equal(cell(list), 0);
  assert.equal(cell(list, 'pr1'), 60, 'andere Zelle unberührt');
});

test('mit Einzeleinträgen: Sammeleintrag = Ziel − übrige', () => {
  const list = [{ id: 'e2', date: DAY, start: '10:45', minutes: 75, project: 'pr2', note: 'Logistik', person: 'p1' }];
  const r = setCell(list, { ...base, minutes: 120 });
  assert.equal(aggregates(r.entries)[0].minutes, 45);
  assert.equal(cell(r.entries), 120);
  assert.equal(r.entries.find(e => e.id === 'e2').minutes, 75, 'Einzeleintrag unverändert');
});

test('Ziel kleiner als Einzeleinträge → Fehler, nichts geändert', () => {
  const list = [{ id: 'e2', date: DAY, start: '10:45', minutes: 75, project: 'pr2', note: 'Logistik', person: 'p1' }];
  const r = setCell(list, { ...base, minutes: 60 });
  assert.equal(r.error, 'below');
  assert.equal(r.others, 75);
});

test('Ziel gleich Einzeleinträgen → Sammeleintrag entfällt', () => {
  const list = [
    { id: 'e2', date: DAY, start: '10:45', minutes: 75, project: 'pr2', note: 'Logistik', person: 'p1' },
    { id: 'g', date: DAY, start: '12:00', minutes: 30, project: 'pr2', note: GRID_NOTE, person: 'p1' },
  ];
  const r = setCell(list, { ...base, minutes: 75 });
  assert.equal(r.action, 'removed');
  assert.deepEqual(r.entries.map(e => e.id), ['e2']);
});

test('„0“ mit Einzeleinträgen entfernt nur den Sammeleintrag', () => {
  const list = [
    { id: 'e2', date: DAY, start: '10:45', minutes: 75, project: 'pr2', note: 'Logistik', person: 'p1' },
    { id: 'g', date: DAY, start: '12:00', minutes: 30, project: 'pr2', note: GRID_NOTE, person: 'p1' },
  ];
  const r = setCell(list, { ...base, minutes: 0 });
  assert.equal(r.action, 'removed');
  assert.equal(r.others, 75);
  assert.equal(cell(r.entries), 75);
});

test('Einträge anderer Personen bleiben unberührt und zählen nicht mit', () => {
  const list = [{ id: 'x', date: DAY, start: '09:00', minutes: 300, project: 'pr2', note: GRID_NOTE, person: 'p2' }];
  const r = setCell(list, { ...base, minutes: 60 });
  assert.equal(r.action, 'created');
  assert.equal(r.entries.find(e => e.id === 'x').minutes, 300);
  assert.equal(r.entries.filter(e => e.person === 'p1')[0].minutes, 60);
});

test('mehr als 24 h an einem Tag → Fehler', () => {
  const list = [{ id: 'a', date: DAY, start: '00:00', minutes: 1200, project: 'pr1', note: 'lang', person: 'p1' }];
  assert.equal(setCell(list, { ...base, minutes: 300 }).error, 'day');
  assert.equal(setCell(list, { ...base, minutes: 240 }).action, 'created');
});

test('doppelte Sammeleinträge fallen zu einem zusammen', () => {
  const list = [
    { id: 'g1', date: DAY, start: '09:00', minutes: 30, project: 'pr2', note: GRID_NOTE, person: 'p1' },
    { id: 'g2', date: DAY, start: '10:00', minutes: 30, project: 'pr2', note: GRID_NOTE, person: 'p1' },
  ];
  const r = setCell(list, { ...base, minutes: 90 });
  assert.deepEqual(aggregates(r.entries).map(e => [e.id, e.minutes]), [['g1', 90]]);
});

test('Zeilen: Projekte der Woche plus hinzugefügte, in fester Reihenfolge', () => {
  const entries = [
    { project: 'pr7', date: DAY }, { project: 'pr1', date: DAY }, { project: 'pr4', date: '2026-09-20' },
  ];
  assert.deepEqual(gridRows(entries, [DAY], ['pr8', 'pr2'], ['pr1', 'pr2', 'pr7', 'pr8']), ['pr1', 'pr2', 'pr7', 'pr8']);
});

// ---------- r07-K1: eigenes Merkmal, nie fremde Zeit löschen, Rückgängig ----------

test('neuer Sammeleintrag trägt source „grid“; die Notiz „Wochenraster“ bleibt als Anzeige', () => {
  const r = setCell([], { ...base, minutes: 120 });
  assert.equal(r.entry.source, GRID_SOURCE);
  assert.equal(r.entry.note, GRID_NOTE);
  assert.deepEqual(r.before, []);
});

test('Befund red-team #1: Zelle 2 h, Fortsetzen + 45 min Timer, Zelle leeren → 45 min bleiben, Rückgängig bringt 2 h', () => {
  // 1. Zelle auf 2
  let list = setCell([], { ...base, minutes: 120 }).entries;
  const agg = list[0];
  // 2. Fortsetzen startet ohne die Raster-Notiz, der Timer bucht 45 min in dieselbe Zelle
  const combo = resumeCombo(agg);
  assert.deepEqual(combo, { project: 'pr2', task: null, note: '' });
  const timerEntry = { id: 't1', date: DAY, start: '14:00', project: combo.project, note: combo.note, minutes: 45, person: 'p1' };
  list = [timerEntry, ...list];
  assert.equal(cell(list), 165);
  // 3. Zelle leeren
  const r = setCell(list, { ...base, minutes: 0 });
  assert.equal(r.action, 'removed');
  assert.equal(r.others, 45);
  assert.equal(r.othersCount, 1);
  assert.equal(r.beforeMinutes, 120);
  assert.deepEqual(r.entries.map(e => e.id), ['t1'], 'nur der Sammeleintrag ist weg');
  // 4. Rückgängig stellt die 2 h wieder her, der Timer-Eintrag bleibt
  const back = revertCell(r.entries, r);
  assert.equal(cell(back), 165);
  assert.equal(back.find(e => e.id === agg.id).minutes, 120);
  assert.ok(back.some(e => e.id === 't1'));
});

test('alter Fortsetzen-Eintrag mit Notiz „Wochenraster“ neben einem markierten Sammeleintrag zählt als Einzeleintrag', () => {
  const list = [
    { id: 'g', date: DAY, start: '09:00', minutes: 120, project: 'pr2', note: GRID_NOTE, person: 'p1', source: GRID_SOURCE },
    { id: 'old', date: DAY, start: '14:00', minutes: 45, project: 'pr2', note: GRID_NOTE, person: 'p1' },
  ];
  const r = setCell(list, { ...base, minutes: 0 });
  assert.deepEqual(r.entries.map(e => e.id), ['old']);
  assert.equal(r.others, 45);
  const smaller = setCell(list, { ...base, minutes: 30 });
  assert.equal(smaller.error, 'below', 'kleiner als die Einzeleinträge geht nicht – nichts wird gekürzt');
  assert.equal(smaller.others, 45);
});

test('Altbestand: „Wochenraster“ ohne Merkmal und ohne Aufgabe ist Sammeleintrag und bekommt beim Ändern das Merkmal', () => {
  const legacy = { id: 'L', date: DAY, start: '09:00', minutes: 60, project: 'pr2', note: GRID_NOTE, person: 'p1' };
  assert.ok(isAggregate(legacy));
  const r = setCell([legacy], { ...base, minutes: 90 });
  assert.equal(r.action, 'updated');
  assert.deepEqual(r.entries, [{ ...legacy, minutes: 90, source: GRID_SOURCE }]);
  const withTask = { ...legacy, id: 'T', task: 't9' };
  assert.equal(isAggregate(withTask), false, 'mit Aufgabe: Einzeleintrag');
  assert.equal(setCell([withTask], { ...base, minutes: 0 }).action, 'unchanged');
});

test('Rückgängig nach Anlegen, Ändern und Entfernen', () => {
  const single = { id: 's', date: DAY, start: '08:00', minutes: 30, project: 'pr2', note: 'Mail', person: 'p1' };
  const created = setCell([single], { ...base, minutes: 120 });
  assert.deepEqual(revertCell(created.entries, created).map(e => e.id), ['s']);
  const updated = setCell(created.entries, { ...base, minutes: 60 });
  assert.equal(updated.action, 'updated');
  const undone = revertCell(updated.entries, updated);
  assert.equal(cell(undone), 120);
  const removed = setCell(created.entries, { ...base, minutes: 0 });
  assert.equal(cell(revertCell(removed.entries, removed)), 120);
});

test('Verkleinern und Leeren gehen auch an einem Tag über 24 h', () => {
  const list = [
    { id: 'a', date: DAY, start: '00:00', minutes: 1380, project: 'pr1', note: 'lang', person: 'p1' },
    { id: 'g', date: DAY, start: '09:00', minutes: 120, project: 'pr2', note: GRID_NOTE, person: 'p1', source: GRID_SOURCE },
  ];
  assert.equal(setCell(list, { ...base, minutes: 60 }).action, 'updated');
  assert.equal(setCell(list, { ...base, minutes: 0 }).action, 'removed');
  assert.equal(setCell(list, { ...base, minutes: 180 }).error, 'day');
});

test('resumeCombo: Notiz und Aufgabe bleiben, nur „Wochenraster“ fällt weg', () => {
  assert.deepEqual(resumeCombo({ project: 'pr1', note: ' Skript ', task: 't2' }), { project: 'pr1', task: 't2', note: 'Skript' });
  assert.deepEqual(resumeCombo({ project: 'pr1', note: GRID_NOTE, source: GRID_SOURCE }), { project: 'pr1', task: null, note: '' });
});
