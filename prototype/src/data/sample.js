// Beispieldaten – erfunden, keine echten Kunden oder Personen. Zeitangaben relativ zu „heute“, damit die Demo aktuell wirkt.
// Vertrag für alle Builder: lesen ja; eigene Zusatzdaten in den eigenen Werkzeug-Ordner, diese Datei nicht ändern.
import { addDays, isoDay } from '../lib/format.js';

const today = new Date();
today.setHours(0, 0, 0, 0);
const day = n => isoDay(addDays(today, n));

export const studios = [
  { id: 'fra', name: 'Frankfurt', tz: 'Europe/Berlin', color: 'var(--c-lime)' },
  { id: 'sha', name: 'Shanghai', tz: 'Asia/Shanghai', color: 'var(--c-sky)' },
  { id: 'szx', name: 'Shenzhen', tz: 'Asia/Shanghai', color: 'var(--c-pink)' },
  { id: 'dxb', name: 'Dubai', tz: 'Asia/Dubai', color: 'var(--c-orange)' },
  { id: 'sin', name: 'Singapur', tz: 'Asia/Singapore', color: 'var(--c-yellow)' },
];

export const people = [
  { id: 'p1', name: 'Lena Hoffmann', role: 'Projektleitung', studio: 'fra' },
  { id: 'p2', name: 'Jonas Weber', role: 'Creative Direction', studio: 'fra' },
  { id: 'p3', name: 'Mei Lin', role: 'Design Lead', studio: 'sha' },
  { id: 'p4', name: 'Chen Hao', role: 'Technische Leitung', studio: 'szx' },
  { id: 'p5', name: 'Aisha Rahman', role: 'Projektleitung', studio: 'dxb' },
  { id: 'p6', name: 'Daniel Tan', role: 'Interaction Design', studio: 'sin' },
  { id: 'p7', name: 'Sophie Krüger', role: '3D & Visualisierung', studio: 'fra' },
  { id: 'p8', name: 'Omar Haddad', role: 'Produktion', studio: 'dxb' },
  { id: 'p9', name: 'Li Wei', role: 'Grafik', studio: 'sha' },
  { id: 'p10', name: 'Nina Berg', role: 'Werkstudentin', studio: 'fra' },
];

// Angemeldete Person der Demo
export const me = people[0];

export const clients = [
  { id: 'c1', name: 'Museum der Klänge', sector: 'Kultur' },
  { id: 'c2', name: 'Mirage Mobility', sector: 'Automotive' },
  { id: 'c3', name: 'Lumen Tea', sector: 'Retail' },
  { id: 'c4', name: 'Aurora Air', sector: 'Aviation' },
  { id: 'c5', name: 'Tidewater Bank', sector: 'Finanzen' },
  { id: 'c6', name: 'Helix Health', sector: 'Gesundheit' },
  { id: 'c7', name: 'Kulturhafen Nord', sector: 'Kultur' },
  { id: 'c0', name: 'VAVE intern', sector: 'Intern' },
];

// budget/spent in Stunden; spent = Stand vor den Einträgen der Zeiterfassung (die zählt lib/budget.js dazu);
// status: 'aktiv' | 'pitch' | 'intern'
export const projects = [
  { id: 'pr1', code: 'MDK-24', name: 'Dauerausstellung „Hörräume“', client: 'c1', studio: 'fra', lead: 'p1', status: 'aktiv', phase: 'Ausführungsplanung', budget: 1200, spent: 860, due: day(45) },
  { id: 'pr2', code: 'MIR-07', name: 'Messepavillon Mobility Week', client: 'c2', studio: 'fra', lead: 'p2', status: 'aktiv', phase: 'Produktion', budget: 640, spent: 612, due: day(12) },
  { id: 'pr3', code: 'LUM-03', name: 'Flagship Store Shanghai', client: 'c3', studio: 'sha', lead: 'p3', status: 'aktiv', phase: 'Entwurf', budget: 420, spent: 180, due: day(70) },
  { id: 'pr4', code: 'AUR-11', name: 'Brand Space Terminal 3', client: 'c4', studio: 'dxb', lead: 'p5', status: 'aktiv', phase: 'Montage', budget: 900, spent: 948, due: day(5) },
  { id: 'pr5', code: 'TID-02', name: 'Interaktive Lobby-Installation', client: 'c5', studio: 'sin', lead: 'p6', status: 'aktiv', phase: 'Konzept', budget: 300, spent: 96, due: day(90) },
  { id: 'pr6', code: 'HLX-05', name: 'Showroom Shenzhen', client: 'c6', studio: 'szx', lead: 'p4', status: 'aktiv', phase: 'Ausführung', budget: 520, spent: 402, due: day(30) },
  { id: 'pr7', code: 'PIT-01', name: 'Pitch: Kulturhafen Nord', client: 'c7', studio: 'fra', lead: 'p2', status: 'pitch', phase: 'Pitch', budget: 80, spent: 34, due: day(8) },
  { id: 'pr8', code: 'VAV-00', name: 'Studio-Organisation', client: 'c0', studio: 'fra', lead: 'p1', status: 'intern', phase: 'laufend', budget: 200, spent: 75, due: null },
];

// status: 'todo' | 'doing' | 'review' | 'done'; estimate = geschätzte Stunden (Schätzung gegen gebucht, keine Planung)
export const tasks = [
  { id: 't1', project: 'pr1', title: 'Lichtplanung Raum 3 abstimmen', status: 'doing', assignee: 'p7', due: day(3), estimate: 16 },
  { id: 't2', project: 'pr1', title: 'Audio-Guide-Skript freigeben', status: 'review', assignee: 'p1', due: day(1), estimate: 6 },
  { id: 't3', project: 'pr1', title: 'Vitrinen-Details zeichnen', status: 'todo', assignee: 'p7', due: day(10), estimate: 24 },
  { id: 't4', project: 'pr1', title: 'Kostenschätzung aktualisieren', status: 'todo', assignee: 'p1', due: day(6), estimate: 8 },
  { id: 't5', project: 'pr1', title: 'Materialmuster bestellen', status: 'done', assignee: 'p10', due: day(-2), estimate: 2 },
  { id: 't6', project: 'pr2', title: 'Standplan finalisieren', status: 'doing', assignee: 'p2', due: day(2), estimate: 20 },
  { id: 't7', project: 'pr2', title: 'Content für LED-Wand rendern', status: 'doing', assignee: 'p7', due: day(4), estimate: 32 },
  { id: 't8', project: 'pr2', title: 'Aufbau-Crew buchen', status: 'todo', assignee: 'p8', due: day(5), estimate: 4 },
  { id: 't9', project: 'pr2', title: 'Transportlogistik prüfen', status: 'review', assignee: 'p1', due: day(2), estimate: 6 },
  { id: 't10', project: 'pr3', title: 'Moodboard präsentieren', status: 'done', assignee: 'p9', due: day(-3), estimate: 6 },
  { id: 't11', project: 'pr3', title: 'Grundriss Variante B', status: 'doing', assignee: 'p3', due: day(6), estimate: 18 },
  { id: 't12', project: 'pr3', title: 'Materialkonzept', status: 'todo', assignee: 'p3', due: day(14), estimate: 24 },
  { id: 't13', project: 'pr4', title: 'Abnahme mit dem Kunden', status: 'todo', assignee: 'p5', due: day(5), estimate: 4 },
  { id: 't14', project: 'pr4', title: 'Mängelliste abarbeiten', status: 'doing', assignee: 'p8', due: day(2), estimate: 16 },
  { id: 't15', project: 'pr4', title: 'Beschilderung montieren', status: 'doing', assignee: 'p8', due: day(1), estimate: 12 },
  { id: 't16', project: 'pr5', title: 'Workshop Interaktionskonzept', status: 'todo', assignee: 'p6', due: day(9), estimate: 8 },
  { id: 't17', project: 'pr5', title: 'Sensor-Prototyp testen', status: 'doing', assignee: 'p4', due: day(12), estimate: 20 },
  { id: 't18', project: 'pr6', title: 'Möbel-Ausschreibung', status: 'review', assignee: 'p4', due: day(3), estimate: 10 },
  { id: 't19', project: 'pr6', title: 'Medienplanung', status: 'doing', assignee: 'p4', due: day(8), estimate: 14 },
  { id: 't20', project: 'pr7', title: 'Story für das Pitch-Deck', status: 'doing', assignee: 'p2', due: day(3), estimate: 12 },
  { id: 't21', project: 'pr7', title: 'Budgetrahmen schätzen', status: 'todo', assignee: 'p1', due: day(4), estimate: 5 },
  { id: 't22', project: 'pr8', title: 'Onboarding Nina', status: 'done', assignee: 'p1', due: day(-5), estimate: 6 },
  { id: 't23', project: 'pr8', title: 'Tool-Umfrage auswerten', status: 'todo', assignee: 'p1', due: day(7), estimate: 8 },
];

// Zeiten der angemeldeten Person, letzte fünf Arbeitstage bis heute (Minuten). Arbeitstag 0 = heute, am Wochenende der
// Freitag davor; -1 der Arbeitstag davor usw. – keine Einträge an Samstag oder Sonntag.
const workday = n => {
  const d = new Date(today);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  for (let k = 0; k < -n; ) { d.setDate(d.getDate() - 1); if (d.getDay() !== 0 && d.getDay() !== 6) k++; }
  return isoDay(d);
};
// task: optionale Aufgabe, auf die gebucht wurde (Timer aus der Aufgabe, Schätzung gegen gebucht)
const entry = (id, d, start, minutes, project, note, task) => ({ id, date: workday(d), start, minutes, project, note, person: me.id, ...(task ? { task } : {}) });
export const timeEntries = [
  entry('e1', 0, '09:00', 90, 'pr1', 'Abstimmung Lichtplanung'),
  entry('e2', 0, '10:45', 75, 'pr2', 'Transportlogistik', 't9'),
  entry('e3', -1, '08:30', 120, 'pr1', 'Audio-Guide-Skript', 't2'),
  entry('e4', -1, '11:00', 60, 'pr7', 'Pitch-Workshop'),
  entry('e5', -1, '13:30', 150, 'pr2', 'Standplan mit Jonas'),
  entry('e6', -2, '09:15', 210, 'pr1', 'Kostenschätzung', 't4'),
  entry('e7', -2, '14:00', 90, 'pr8', 'Onboarding', 't22'),
  entry('e8', -3, '09:00', 240, 'pr2', 'Produktionsbesprechung'),
  entry('e9', -3, '14:30', 120, 'pr1', 'Vitrinen-Details'),
  entry('e10', -4, '10:00', 180, 'pr7', 'Recherche Kulturhafen'),
];

export const statusLabel = { todo: 'Offen', doing: 'In Arbeit', review: 'Prüfen', done: 'Erledigt' };
// 'pitch' = Akquisephase, ohne Angebots- oder Preislogik
export const projectStatusLabel = { aktiv: 'Aktiv', pitch: 'Pitch', intern: 'Intern' };

export const byId = list => Object.fromEntries(list.map(x => [x.id, x]));
