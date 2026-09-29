// Gespeicherte Daten prüfen, bevor die Oberfläche sie nutzt. Kaputtes JSON fängt store.js ab, falsch Geformtes fangen
// diese Prüfer: Listen behalten nur gültige Einträge, alles andere fällt auf den Startwert zurück. Keine Ausnahme bricht
// die App. Einsatz: useStoredState('time-entries', sampleEntries, cleanEntries).

const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const isDay = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Laufender Timer: Objekt mit gültigem startedAt (ISO), sonst null
export const validTimer = t =>
  isObj(t) && typeof t.startedAt === 'string' && !Number.isNaN(Date.parse(t.startedAt)) ? t : null;
export const cleanTimer = v => validTimer(v);

// Zeiteintrag: { id, date 'YYYY-MM-DD', minutes > 0, project, … }
export const isEntry = e =>
  isObj(e) && typeof e.id === 'string' && isDay(e.date) && Number.isFinite(Number(e.minutes)) && Number(e.minutes) > 0 &&
  typeof e.project === 'string';
export const cleanEntries = (v, fallback) => (Array.isArray(v) ? v.filter(isEntry) : fallback);

// Aufgabe: { id, project, title, status, … }
export const isTask = t =>
  isObj(t) && typeof t.id === 'string' && typeof t.project === 'string' && typeof t.title === 'string' &&
  typeof t.status === 'string';
export const cleanTasks = (v, fallback) => (Array.isArray(v) ? v.filter(isTask) : fallback);
