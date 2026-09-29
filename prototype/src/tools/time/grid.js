// Wochenraster (Projekt × Tag) – reine Logik ohne React, Node-testbar.
// Eine Zelle zeigt die Summe aller eigenen Einträge des Projekts an dem Tag. Wer eine Zelle auf X setzt, ändert nur den
// Sammeleintrag: Sammeleintrag = X − übrige Einträge. Einzeleinträge (Timer, Nachtragen) bleiben unangetastet.
// Erkennung (r07-K1): eigenes Merkmal source 'grid'; die Notiz „Wochenraster“ ist nur noch Anzeige. Ältere Einträge ohne
// Merkmal gelten weiter als Sammeleintrag, wenn die Notiz genau „Wochenraster“ lautet und keine Aufgabe dranhängt – aber
// nur in Zellen ohne markierten Sammeleintrag (dort ist so ein Eintrag z. B. ein fortgesetzter Timer).
export const GRID_NOTE = 'Wochenraster';
export const GRID_SOURCE = 'grid';
const DAY_MIN = 24 * 60;

export const isMarked = e => Boolean(e) && e.source === GRID_SOURCE;
export const isLegacyAggregate = e => Boolean(e) && !e.source && e.note === GRID_NOTE && !e.task;
// Ohne Zellbezug (Liste, Zuletzt-Kombinationen)
export const isAggregate = e => isMarked(e) || isLegacyAggregate(e);
// Sammeleinträge unter den Einträgen einer Zelle
export const cellAggregates = here => (here.some(isMarked) ? here.filter(isMarked) : here.filter(isLegacyAggregate));

// „Fortsetzen“: Projekt, Aufgabe und Notiz des Eintrags – die Anzeige-Notiz „Wochenraster“ fällt weg. Sonst landet der
// Timer-Eintrag mit derselben Notiz in der Zelle und sieht wie ein Sammeleintrag aus (red-team r07 #1).
export function resumeCombo(entry) {
  const note = String(entry.note ?? '').trim();
  return {
    project: entry.project,
    task: typeof entry.task === 'string' && entry.task ? entry.task : null,
    note: note === GRID_NOTE ? '' : note,
  };
}

const sum = list => list.reduce((s, e) => s + (Number(e.minutes) || 0), 0);
const ownedBy = person => e => !e.person || e.person === person;

// Minuten je Zelle: Map „projekt|tag“ → Minuten
export function cellTotals(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = `${e.project}|${e.date}`;
    map.set(key, (map.get(key) || 0) + (Number(e.minutes) || 0));
  }
  return map;
}

// Zelle setzen. all = alle gespeicherten Einträge (auch anderer Personen – die bleiben unberührt).
// minutes = Zielwert der Zelle (0 = Sammeleintrag entfernen). Ergebnis:
//   { entries, action: 'created' | 'updated' | 'removed' | 'unchanged', entry?, before, beforeMinutes, others, othersCount }
//   oder { error: 'below', others, othersCount } (Ziel kleiner als die Einzeleinträge) bzw. { error: 'day', dayMinutes }.
// before = Sammeleinträge der Zelle vor der Änderung (für revertCell), others = Minuten der Einzeleinträge.
export function setCell(all, { project, date, minutes, person, start = '09:00', newId }) {
  const mine = ownedBy(person);
  const inCell = e => e.project === project && e.date === date && mine(e);
  const here = all.filter(inCell);
  const aggregates = cellAggregates(here);
  const aggIds = new Set(aggregates.map(e => e.id));
  const singles = here.filter(e => !aggIds.has(e.id));
  const others = sum(singles);
  const info = { before: aggregates, beforeMinutes: sum(aggregates), others, othersCount: singles.length };
  const need = minutes - others;
  if (minutes > 0 && need < 0) return { error: 'below', ...info };
  // Tag über 24 h: nur beim Vergrößern prüfen – Verkleinern und Leeren gehen immer
  const cellAfter = Math.max(minutes, others);
  const dayMinutes = sum(all.filter(e => e.date === date && mine(e) && !inCell(e))) + cellAfter;
  if (cellAfter > sum(here) && dayMinutes > DAY_MIN) return { error: 'day', dayMinutes };

  if (need <= 0) {
    if (!aggregates.length) return { entries: all, action: 'unchanged', ...info };
    return { entries: all.filter(e => !aggIds.has(e.id)), action: 'removed', ...info };
  }
  // Mehrere Sammeleinträge (z. B. aus einem zweiten Tab) fallen zu einem zusammen; ein alter bekommt das Merkmal
  const [first] = aggregates;
  if (first && aggregates.length === 1 && isMarked(first) && Number(first.minutes) === need) {
    return { entries: all, action: 'unchanged', ...info };
  }
  const entry = first
    ? { ...first, minutes: need, source: GRID_SOURCE }
    : { id: newId(), date, start, minutes: need, project, note: GRID_NOTE, person, source: GRID_SOURCE };
  if (!first) return { entries: [entry, ...all], action: 'created', entry, ...info };
  const out = [];
  for (const e of all) {
    if (e.id === first.id) out.push(entry);
    else if (!aggIds.has(e.id)) out.push(e);
  }
  return { entries: out, action: 'updated', entry, ...info };
}

// Rückgängig für eine Zelländerung (Ergebnis von setCell): den geschriebenen Sammeleintrag entfernen, die vorherigen
// zurücklegen. Alles, was seitdem sonst passiert ist (z. B. ein gestoppter Timer), bleibt stehen.
export function revertCell(all, { before = [], entry = null }) {
  const drop = new Set(before.map(e => e.id));
  if (entry) drop.add(entry.id);
  return [...before, ...all.filter(e => !drop.has(e.id))];
}

// Zeilen des Rasters: Projekte mit eigenen Einträgen in den Tagen plus selbst hinzugefügte, in fester Reihenfolge
export function gridRows(entries, dayIsos, extraIds, order) {
  const days = new Set(dayIsos);
  const ids = new Set(extraIds);
  for (const e of entries) if (days.has(e.date)) ids.add(e.project);
  const rank = id => { const i = order.indexOf(id); return i < 0 ? order.length : i; };
  return [...ids].sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : 1));
}
