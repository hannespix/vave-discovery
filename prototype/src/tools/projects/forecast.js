// Projektgesundheit in Stunden: Verlauf je Woche, Tempo, Prognose „reicht bis KW …“. Reine Funktion, keine Planung.
//
// Verlauf aus Beispieldaten (deterministisch, im UI so beschriftet): sample.js kennt je Projekt nur `spent` (Stand vor
// der Zeiterfassung). Angenommen wird ein Projektbeginn L Wochen vor der Abgabe, L = ursprüngliches Budget ÷ 25 h
// (6 bis 40 Wochen; ursprünglich = vor der ersten Änderung in budgetLog);
// ohne Abgabe 26 Wochen vor dieser Woche; immer mindestens 4 abgeschlossene Wochen. `spent` verteilt sich auf die
// abgeschlossenen Wochen: Anlauf mit halber und ¾-Last, danach je Woche fest ±15 % (Hash aus Projekt-ID und Woche).
// Echte Buchungen (time-entries) kommen in ihrer Woche dazu. Die Summe ist exakt spentHours() – wie in der Liste.
//
// Tempo = Ø der letzten 4 abgeschlossenen Wochen. Prognose: Rest ÷ Tempo ab heute, verglichen mit der Abgabe – immer mit
// dem aktuellen Budget. Budgetänderungen (budgetLog) ergeben die Stufen der Budgetlinie: budgetStart gilt am Beginn des
// Verlaufs, steps [{ at, to }] danach (älteste zuerst); jede Woche trägt das Budget an ihrem Ende (w.budget).
import { addDays, weekStart } from '../../lib/format.js';
import { spentHours } from '../../lib/budget.js';
import { budgetChanges, budgetInfo, isDay, isoWeek, kwKey, parseDay } from './helpers.js';

const DAY = 86400000;
const WEEK = 7 * DAY;
export const TEMPO_WEEKS = 4;
const HOURS_PER_WEEK_PLAN = 25;
const MIN_WEEKS = 4;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const weeksBetween = (a, b) => Math.round((b - a) / WEEK); // zwischen zwei Montagen; round fängt die Zeitumstellung ab
const hash01 = s => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
};

export function forecast(p, entries, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const thisMon = weekStart(today);
  const due = isDay(p.due) ? parseDay(p.due) : null;
  const budget = Number(p.budget) || 0;
  // Budgetänderungen, älteste zuerst. Der angenommene Beginn richtet sich nach dem ursprünglichen Budget – sonst
  // verschöbe jede Änderung den Verlauf aus Beispieldaten und damit das Tempo
  const changes = budgetChanges(p).reverse();
  const initialBudget = changes.length ? changes[0].from : budget;
  const plan = clamp(Math.round(initialBudget / HOURS_PER_WEEK_PLAN), 6, 40);

  let start = due ? addDays(weekStart(due), -7 * (plan - 1)) : addDays(thisMon, -7 * 26);
  const latest = addDays(thisMon, -7 * MIN_WEEKS);
  if (start > latest) start = latest;
  const n = weeksBetween(start, thisMon); // abgeschlossene Wochen; Index n = laufende Woche

  const weights = Array.from({ length: n }, (_, i) =>
    (i === 0 ? 0.5 : i === 1 ? 0.75 : 1) * (0.85 + 0.3 * hash01(`${p.id}:${i}`)));
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const weeks = Array.from({ length: n + 1 }, (_, i) => ({
    monday: addDays(start, 7 * i),
    hours: i < n ? (p.spent * weights[i]) / sum : 0,
    booked: 0,
  }));
  for (const e of Array.isArray(entries) ? entries : []) {
    if (e.project !== p.id || !isDay(e.date)) continue;
    const i = clamp(weeksBetween(start, weekStart(parseDay(e.date))), 0, n); // Künftiges zählt in die laufende Woche
    const h = (Number(e.minutes) || 0) / 60;
    weeks[i].hours += h;
    weeks[i].booked += h;
  }
  // Budgetverlauf: Wert am Beginn, danach Stufen; Änderungen vor dem Beginn verschieben nur den Startwert
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

  const total = spentHours(p, entries);
  const info = budgetInfo(total, budget);
  const recent = weeks.slice(Math.max(0, n - TEMPO_WEEKS), n);
  const tempo = recent.reduce((s, w) => s + w.hours, 0) / Math.max(1, Math.min(TEMPO_WEEKS, recent.length));

  const over = info.rest < 0;
  let cross = null; // Tag, an dem das Budget bei diesem Tempo aufgebraucht ist
  if (!over && tempo > 0.05) cross = new Date(today.getTime() + (info.rest / tempo) * WEEK);
  const dueKw = due ? isoWeek(due) : null;
  const crossKw = cross ? isoWeek(cross) : null;
  const duePast = due ? due < today : false;
  // Bis zur Abgabe kämen bei diesem Tempo noch so viele Stunden dazu
  const toDue = due && !duePast ? (tempo * (due - today)) / WEEK : 0;
  // Schwelle für den Hinweis: Budget ist in einer früheren Kalenderwoche aufgebraucht als die Abgabe
  const short = Boolean(!over && cross && dueKw && !duePast && kwKey(crossKw) < kwKey(dueKw));
  const missing = short ? Math.max(0, toDue - info.rest) : 0;

  return { start, weeks, n, today, thisMon, due, dueKw, duePast, budget, budgetStart, steps, total, info, tempo, over, cross, crossKw, toDue, short, missing };
}
