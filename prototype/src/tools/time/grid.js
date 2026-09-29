// Wochenraster (Projekt × Tag) – reine Logik ohne React, Node-testbar.
// Eine Zelle zeigt die Summe aller eigenen Einträge des Projekts an dem Tag. Wer eine Zelle auf X setzt, ändert nur den
// Sammeleintrag (Notiz „Wochenraster“): Sammeleintrag = X − übrige Einträge. Einzeleinträge bleiben unangetastet.
export const GRID_NOTE = 'Wochenraster';
const DAY_MIN = 24 * 60;

export const isAggregate = e => e.note === GRID_NOTE;
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
//   { entries, action: 'created' | 'updated' | 'removed' | 'unchanged', others } oder
//   { error: 'below', others } (Ziel kleiner als die Einzeleinträge) bzw. { error: 'day', dayMinutes } (Tag über 24 h)
export function setCell(all, { project, date, minutes, person, start = '09:00', newId }) {
  const mine = ownedBy(person);
  const inCell = e => e.project === project && e.date === date && mine(e);
  const here = all.filter(inCell);
  const aggregates = here.filter(isAggregate);
  const others = sum(here.filter(e => !isAggregate(e)));
  const need = minutes - others;
  if (minutes > 0 && need < 0) return { error: 'below', others };
  const dayMinutes = sum(all.filter(e => e.date === date && mine(e) && !inCell(e))) + Math.max(minutes, others);
  if (dayMinutes > DAY_MIN) return { error: 'day', dayMinutes };

  // Mehrere Sammeleinträge (z. B. aus einem zweiten Tab) fallen zu einem zusammen
  const drop = new Set(aggregates.map(e => e.id));
  if (need <= 0) {
    if (!aggregates.length) return { entries: all, action: 'unchanged', others };
    return { entries: all.filter(e => !drop.has(e.id)), action: 'removed', others };
  }
  const [first] = aggregates;
  if (first && aggregates.length === 1 && Number(first.minutes) === need) return { entries: all, action: 'unchanged', others };
  const entry = first
    ? { ...first, minutes: need }
    : { id: newId(), date, start, minutes: need, project, note: GRID_NOTE, person };
  if (!first) return { entries: [entry, ...all], action: 'created', others, entry };
  const out = [];
  for (const e of all) {
    if (e.id === first.id) out.push(entry);
    else if (!drop.has(e.id)) out.push(e);
  }
  return { entries: out, action: 'updated', others, entry };
}

// Zeilen des Rasters: Projekte mit eigenen Einträgen in den Tagen plus selbst hinzugefügte, in fester Reihenfolge
export function gridRows(entries, dayIsos, extraIds, order) {
  const days = new Set(dayIsos);
  const ids = new Set(extraIds);
  for (const e of entries) if (days.has(e.date)) ids.add(e.project);
  const rank = id => { const i = order.indexOf(id); return i < 0 ? order.length : i; };
  return [...ids].sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : 1));
}
