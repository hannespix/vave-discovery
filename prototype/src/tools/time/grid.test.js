// Node-Test des Wochenrasters: node --test src/tools/time/   (aus prototype/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRID_NOTE, cellTotals, gridRows, setCell } from './grid.js';

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
