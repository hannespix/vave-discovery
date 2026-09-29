// Burn-up als SVG in echter Pixelbreite (ResizeObserver) – so bleiben Beschriftungen am Handy lesbar.
// Kumulierte Stunden je Woche (durchgezogen), Budgetlinie, Prognose gestrichelt, Heute-Marke, Abgabe.
// Die Budgetlinie springt an jedem Änderungsdatum (f.steps); beschriftet ist der aktuelle Wert auf seiner Höhe,
// links vor dem letzten Sprung.
// Das SVG ist aria-hidden: dieselbe Aussage steht im Satz darüber, als Tabelle (mit Budget je Woche) und in der Liste
// „Budgetänderungen“ (Overview.jsx).
// „Abgabe KW …“ steht auf der von „heute“ abgewandten Seite der Abgabe-Linie, wo Platz ist; überdeckt sie die
// Heute-Linie trotzdem (Abgabe kurz nach heute, schmal), beginnt die Heute-Linie erst unter der Beschriftung (r07).
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { addDays, fmtH1, weekStart } from '../../lib/format.js';
import { fmtKw, isoWeek } from './helpers.js';

const WEEK = 7 * 86400000;
const CHAR_W = 8; // Schätzung je Zeichen bei 13 px (Readex Pro, r08: keine Schrift unter 13 px), eher zu breit
const DUE_Y = 44; // Grundlinie „Abgabe KW …“; die Schrift reicht bis etwa 48 px

// Beschriftung der Abgabe: Seite, Anker und ob sie die Heute-Linie (xt) überdeckt
function dueLabel({ xd, xt, W, pad, text }) {
  const w = text.length * CHAR_W + 4;
  const roomR = xd + 4 + w <= W - pad.r;
  const roomL = xd - 4 - w >= pad.l;
  const right = xt <= xd ? roomR || !roomL : !roomL; // weg von „heute“, sonst wo Platz ist
  let x = right ? xd + 4 : xd - 4;
  let anchor = right ? 'start' : 'end';
  if (right && !roomR) { x = W - pad.r; anchor = 'end'; } // nirgends Platz: rechtsbündig im Bild
  const x0 = anchor === 'start' ? x : x - w;
  return { text, x, anchor, hitsToday: xt >= x0 - 4 && xt <= x0 + w + 4 };
}

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(Math.round(el.clientWidth));
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export default function BurnUp({ f }) {
  const ref = useRef(null);
  const W = useWidth(ref);
  const clipId = useId().replace(/:/g, '');
  const H = W && W < 560 ? 210 : 250;
  const pad = { l: 4, r: 4, t: 52, b: 28 };
  const year = f.today.getFullYear();

  let chart = null;
  if (W > 0) {
    const cap = addDays(f.today, 26 * 7);
    const ends = [addDays(f.thisMon, 14)];
    if (f.due) ends.push(addDays(weekStart(f.due), 14));
    if (f.cross) ends.push(addDays(weekStart(f.cross < cap ? f.cross : cap), 7));
    const end = new Date(Math.max(...ends.map(Number)));
    const span = end - f.start || 1;
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const x = d => pad.l + ((d - f.start) / span) * iw;

    // Prognose: ab heute mit dem Tempo bis zum Budget (bzw. Rand); überzogen bis zur Abgabe
    let prog = null;
    if (f.cross) {
      const to = f.cross < end ? f.cross : end;
      prog = [f.today, to, f.total + (f.tempo * (to - f.today)) / WEEK];
    } else if (f.over && f.tempo > 0.05 && f.due && !f.duePast) {
      prog = [f.today, f.due, f.total + f.toDue];
    }
    const top = Math.max(f.budget, f.budgetStart, ...f.steps.map(s => s.to), f.total, prog ? prog[2] : 0) * 1.12 || 1;
    const y = v => pad.t + (1 - v / top) * ih;
    const base = y(0);

    // Budget als Stufenlinie: Startwert, an jedem Änderungsdatum senkrecht auf den neuen Wert
    const bx = d => Math.min(W - pad.r, Math.max(pad.l, x(d)));
    let budgetPath = `M${pad.l},${y(f.budgetStart).toFixed(1)}`;
    for (const s of f.steps) budgetPath += `H${bx(s.at).toFixed(1)}V${y(s.to).toFixed(1)}`;
    budgetPath += `H${W - pad.r}`;
    // Beschriftung auf Höhe des aktuellen Werts: ohne Änderung links am Anfang; sonst links vor dem letzten Sprung
    // (Vergangenheit, dort liegen weder Abgabe noch Prognose), bei zu wenig Platz rechts daneben
    const lastX = f.steps.length ? bx(f.steps[f.steps.length - 1].at) : null;
    const budgetLabelEnd = lastX !== null && lastX - pad.l > 110;
    const budgetLabelX = lastX === null ? pad.l + 2 : budgetLabelEnd ? lastX - 6 : lastX + 6;

    const pts = [[f.start, 0], ...f.weeks.slice(0, f.n).map((w, i) => [f.weeks[i + 1].monday, w.cum]), [f.today, f.total]];
    const line = pts.map(([d, v], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const area = `${line}L${x(f.today).toFixed(1)},${base}L${x(f.start).toFixed(1)},${base}Z`;
    const yb = y(f.budget);
    const xt = x(f.today);
    const xd = f.due && f.due >= f.start && f.due <= end ? x(f.due) : null;

    // KW-Beschriftung: so viele, wie mit ≥ 64 px Abstand passen
    const weeksTotal = Math.round(span / WEEK);
    const every = Math.max(1, Math.ceil(weeksTotal / Math.max(1, Math.floor(iw / 64))));
    const ticks = [];
    for (let i = 0; i < weeksTotal; i += every) {
      const mon = addDays(f.start, 7 * i);
      const cx = x(addDays(mon, 3.5));
      if (cx > pad.l + 18 && cx < W - pad.r - 18) ticks.push({ cx, kw: fmtKw(isoWeek(mon), year) });
    }
    const due = xd !== null ? dueLabel({ xd, xt, W, pad, text: `Abgabe ${fmtKw(f.dueKw, year)}` }) : null;
    const todayTop = due?.hitsToday ? DUE_Y + 8 : 22; // Linie kürzen statt die Schrift durchzustreichen

    chart = (
      <svg className="pj-burn-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`over-${clipId}`}><rect x="0" y="0" width={W} height={Math.max(0, yb)} /></clipPath>
        </defs>
        <line className="pj-burn-base" x1={pad.l} x2={W - pad.r} y1={base} y2={base} />
        <path className="pj-burn-area" d={area} />
        {f.total > f.budget && <path className="pj-burn-over" d={area} clipPath={`url(#over-${clipId})`} />}
        <path className="pj-burn-budget" d={budgetPath} />
        <text className="pj-burn-label" x={budgetLabelX} y={yb - 7} textAnchor={budgetLabelEnd ? 'end' : 'start'}>Budget {fmtH1(f.budget)}</text>
        {due && (
          <g>
            <line className="pj-burn-due" x1={xd} x2={xd} y1={34} y2={base} />
            <text className="pj-burn-label pj-burn-due-label" x={due.x} y={DUE_Y} textAnchor={due.anchor}>{due.text}</text>
          </g>
        )}
        {prog && <path className="pj-burn-prog" d={`M${xt.toFixed(1)},${y(f.total).toFixed(1)}L${x(prog[1]).toFixed(1)},${y(prog[2]).toFixed(1)}`} />}
        <path className="pj-burn-line" d={line} />
        {f.cross && f.cross <= end && <circle className="pj-burn-cross" cx={x(f.cross)} cy={yb} r="4.5" />}
        <line className="pj-burn-today" x1={xt} x2={xt} y1={todayTop} y2={base} />
        <g transform={`translate(${Math.min(Math.max(xt - 26, 0), W - 52)},2)`}>
          <rect className="pj-burn-pill" width="52" height="20" rx="10" />
          <text className="pj-burn-pill-text" x="26" y="14" textAnchor="middle">Heute</text>
        </g>
        {ticks.map(t => <text key={t.cx} className="pj-burn-tick" x={t.cx} y={H - 8} textAnchor="middle">{t.kw}</text>)}
      </svg>
    );
  }

  return <div className="pj-burn" ref={ref} style={{ minHeight: H }}>{chart}</div>;
}

