// Projektgesundheit in Stunden: Verlauf je Woche, Tempo, Prognose „reicht bis KW …“. Reine Funktion, keine Planung.
//
// Zwei Arten Verlauf (r07-Korrektur, red-team #2):
// 1. Beispielprojekte (ID aus sample.js, ohne createdAt): erfundener Verlauf – in der Übersicht sichtbar als
//    „Beispielrechnung“ markiert. sample.js kennt je Projekt nur `spent` (Stand vor der Zeiterfassung). Verankert an
//    Budget und Abgabe aus sample.js – Änderungen im Prototyp verschieben den Verlauf nicht, sie wirken nur auf die
//    Prognose (Budget 640 → 700 h: gleiches Tempo, späteres Ende). Angenommenes Tempo:
//    – im Rahmen (Stand unter 90 % des Budgets, Abgabe in der Zukunft): im Plan – bei gleichem Tempo sind zur Abgabe
//      90 % gebucht (10 % Reserve). Tempo = (90 % des Budgets − Stand) ÷ Wochen bis zur Abgabe.
//    – ab 90 % (knapp, überzogen): Endphase mit 32 h/Woche.
//    – ohne Abgabe: gleichmäßig über 26 Wochen.
//    Beginn = Stand ÷ Tempo + ¾ Woche Anlauf (4 bis 40 abgeschlossene Wochen). Die letzten 4 Wochen tragen zusammen
//    genau das Tempo, davor Anlauf mit halber und ¾-Last; je Woche fest ±15 % (Hash aus Projekt-ID und Woche).
//    Mit den Beispieldaten warnen so nur MIR-07 (knapp: reicht nicht bis zur Abgabe) und AUR-11 (überzogen).
// 2. Im Prototyp angelegte Projekte (createdAt) und alle anderen: nur echte Buchungen, kein erfundener Verlauf.
//    Beginn = Woche des Anlegens bzw. der ersten Buchung. Tempo und Prognose erst, wenn die erste Buchung mindestens
//    2 abgeschlossene Wochen zurückliegt (enough) – vorher „Noch zu wenig Buchungen für eine Prognose“.
// Echte Buchungen (time-entries) kommen in beiden Fällen in ihrer Woche dazu. Die Summe ist exakt spentHours().
//
// Tempo = Ø der letzten 4 abgeschlossenen Wochen (bei kürzerem Verlauf der vorhandenen). Prognose: Rest ÷ Tempo ab heute,
// verglichen mit der Abgabe – immer mit aktuellem Budget und aktueller Abgabe. Budgetänderungen (budgetLog) ergeben die
// Stufen der Budgetlinie: budgetStart gilt am Beginn des Verlaufs, steps [{ at, to }] danach (älteste zuerst); jede
// Woche trägt das Budget an ihrem Ende (w.budget).
import { addDays, weekStart } from '../../lib/format.js';
import { restHours } from '../../lib/budget.js';
import { projects as sampleProjects } from '../../data/sample.js';
import { budgetChanges, budgetInfo, isDay, isoWeek, kwKey, parseDay } from './helpers.js';

const DAY = 86400000;
const WEEK = 7 * DAY;
export const TEMPO_WEEKS = 4;
export const MIN_FORECAST_WEEKS = 2;
const PLAN_SHARE = 0.9;
const END_TEMPO = 32;
const OPEN_WEEKS = 26;
const MIN_WEEKS = 4;
const MAX_WEEKS = 40;
const MAX_REAL_WEEKS = 104;

const sampleById = Object.fromEntries(sampleProjects.map(p => [p.id, p]));
// Erfundener Verlauf nur für Beispielprojekte – nie für im Prototyp angelegte
export const isSampleProject = p => Boolean(p && !p.createdAt && sampleById[p.id]);

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const weeksBetween = (a, b) => Math.round((b - a) / WEEK); // zwischen zwei Montagen; round fängt die Zeitumstellung ab
const sum = list => list.reduce((s, x) => s + x, 0);
const hash01 = s => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
};

// Beispielverlauf: Stunden je abgeschlossener Woche (Index 0 = Beginn), Summe = spent
function sampleHistory(p, today, thisMon) {
  const s = sampleById[p.id];
  const spent = Math.max(0, Number(p.spent) || 0);
  const budget = Number(s.budget) || 0;
  const due = isDay(s.due) ? parseDay(s.due) : null;
  let tempo = null;
  let n = OPEN_WEEKS;
  if (due) {
    const left = (due - today) / WEEK;
    tempo = left > 0 && spent < PLAN_SHARE * budget ? clamp((PLAN_SHARE * budget - spent) / left, 1, 60) : END_TEMPO;
    n = Math.round(spent / tempo + 0.75);
  }
  n = clamp(n, MIN_WEEKS, MAX_WEEKS);
  const noise = i => 0.85 + 0.3 * hash01(`${p.id}:${i}`);
  const hours = new Array(n).fill(0);
  // Die letzten Wochen tragen genau das Tempo (reicht der Stand dafür nicht, verteilt er sich über alle Wochen)
  const last = tempo !== null && spent >= TEMPO_WEEKS * tempo ? TEMPO_WEEKS : 0;
  const tail = Array.from({ length: last }, (_, k) => noise(n - last + k));
  tail.forEach((k, j) => { hours[n - last + j] = (tempo * last * k) / (sum(tail) || 1); });
  const head = Array.from({ length: n - last }, (_, i) => (i === 0 ? 0.5 : i === 1 ? 0.75 : 1) * noise(i));
  const rest = spent - (last ? tempo * last : 0);
  head.forEach((w, i) => { hours[i] = (rest * w) / (sum(head) || 1); });
  return { start: addDays(thisMon, -7 * n), n, hours, enough: true };
}

// Echter Verlauf: ab Anlegen bzw. erster Buchung; `spent` (bei angelegten Projekten 0) zählt in die erste Woche
function realHistory(p, mine, thisMon) {
  const created = typeof p.createdAt === 'string' && !Number.isNaN(Date.parse(p.createdAt)) ? new Date(p.createdAt) : null;
  const booked = mine.map(e => parseDay(e.date));
  const firstBooking = booked.length ? new Date(Math.min(...booked)) : null;
  const first = [created, firstBooking].filter(Boolean).reduce((a, b) => (b < a ? b : a), thisMon);
  const n = clamp(weeksBetween(weekStart(first), thisMon), 0, MAX_REAL_WEEKS);
  const hours = new Array(n).fill(0);
  if (n) hours[0] = Math.max(0, Number(p.spent) || 0);
  const enough = Boolean(firstBooking) && weeksBetween(weekStart(firstBooking), thisMon) >= MIN_FORECAST_WEEKS;
  return { start: addDays(thisMon, -7 * n), n, hours, enough, lump: n ? 0 : Math.max(0, Number(p.spent) || 0) };
}

export function forecast(p, entries, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const thisMon = weekStart(today);
  const list = Array.isArray(entries) ? entries : [];
  const mine = list.filter(e => e && e.project === p.id && isDay(e.date));
  const due = isDay(p.due) ? parseDay(p.due) : null;
  const budget = Number(p.budget) || 0;
  const sample = isSampleProject(p);
  const hist = sample ? sampleHistory(p, today, thisMon) : realHistory(p, mine, thisMon);
  const { start, n, enough } = hist;

  const weeks = Array.from({ length: n + 1 }, (_, i) => ({
    monday: addDays(start, 7 * i),
    hours: i < n ? hist.hours[i] : hist.lump || 0,
    booked: 0,
  }));
  for (const e of mine) {
    const i = clamp(weeksBetween(start, weekStart(parseDay(e.date))), 0, n); // Künftiges zählt in die laufende Woche
    const h = (Number(e.minutes) || 0) / 60;
    weeks[i].hours += h;
    weeks[i].booked += h;
  }
  // Budgetverlauf: Wert am Beginn, danach Stufen; Änderungen vor dem Beginn verschieben nur den Startwert
  const changes = budgetChanges(p).reverse();
  const initialBudget = changes.length ? changes[0].from : budget;
  let budgetStart = initialBudget;
  const steps = [];
  for (const c of changes) {
    if (c.at <= start) budgetStart = c.to;
    else steps.push({ at: c.at, to: c.to });
  }
  const budgetAt = d => steps.reduce((v, s) => (s.at <= d ? s.to : v), budgetStart);

  let cum = 0;
  for (const [i, w] of weeks.entries()) {
    cum += w.hours; w.cum = cum; w.kw = isoWeek(w.monday);
    w.budget = i < n ? budgetAt(new Date(addDays(w.monday, 7).getTime() - 1)) : budget; // laufende Woche: Stand jetzt
  }

  const info = budgetInfo(p, list);
  const total = info.total;
  const rest = restHours(p, list); // ungerundet für die Prognose; angezeigt wird info.rest (fmtH1)
  const recent = weeks.slice(Math.max(0, n - TEMPO_WEEKS), n);
  const tempo = enough && recent.length ? sum(recent.map(w => w.hours)) / recent.length : 0;

  const over = info.rest < 0;
  let cross = null; // Tag, an dem das Budget bei diesem Tempo aufgebraucht ist
  if (!over && tempo > 0.05) cross = new Date(today.getTime() + (rest / tempo) * WEEK);
  const dueKw = due ? isoWeek(due) : null;
  const crossKw = cross ? isoWeek(cross) : null;
  const duePast = due ? due < today : false;
  // Bis zur Abgabe kämen bei diesem Tempo noch so viele Stunden dazu
  const toDue = due && !duePast ? (tempo * (due - today)) / WEEK : 0;
  // Schwelle für den Hinweis: Budget ist in einer früheren Kalenderwoche aufgebraucht als die Abgabe
  const short = Boolean(!over && cross && dueKw && !duePast && kwKey(crossKw) < kwKey(dueKw));
  const missing = short ? Math.max(0, toDue - rest) : 0;

  return {
    sample, enough, start, weeks, n, today, thisMon, due, dueKw, duePast, budget, budgetStart, steps, total, info, tempo,
    over, cross, crossKw, toDue, short, missing,
  };
}
