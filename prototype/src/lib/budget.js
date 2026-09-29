// Budget eines Projekts aus den Buchungen. `spent` in sample.js ist der Stand vor den Einträgen der Zeiterfassung
// (Stunden); jede Buchung dort kommt obendrauf. So reicht eine Buchung bis in Projekte und „Heute“.
// Einsatz: spentHours(project, entries) mit entries aus useStoredState('time-entries', sampleEntries, cleanEntries).

export const bookedMinutes = (projectId, entries) =>
  (Array.isArray(entries) ? entries : []).reduce((s, e) => s + (e.project === projectId ? Number(e.minutes) || 0 : 0), 0);

// Stunden, ungerundet – gerundet wird erst in der Anzeige (sonst kippt die Ampel an der Grenze falsch)
export const spentHours = (project, entries) => project.spent + bookedMinutes(project.id, entries) / 60;

// Rest in Stunden (negativ = überzogen), ungerundet; Anzeige mit fmtH1 aus format.js
export const restHours = (project, entries) => project.budget - spentHours(project, entries);
