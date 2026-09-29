// Burn-up als SVG in echter Pixelbreite (ResizeObserver) – so bleiben Beschriftungen am Handy lesbar.
// Kumulierte Stunden je Woche (durchgezogen), Budgetlinie, Prognose gestrichelt, Heute-Marke, Abgabe.
// Das SVG ist aria-hidden: dieselbe Aussage steht im Satz darüber und als Tabelle (Overview.jsx).
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { addDays, weekStart } from '../../lib/format.js';
import { fmtH, fmtKw, isoWeek } from './helpers.js';

const WEEK = 7 * 86400000;

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
    const top = Math.max(f.budget, f.total, prog ? prog[2] : 0) * 1.12 || 1;
    const y = v => pad.t + (1 - v / top) * ih;
    const base = y(0);

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
    const anchor = (px, room) => (px > W - room ? 'end' : px < room ? 'start' : 'middle');
    const labelX = (px, a, dx = 0) => (a === 'end' ? px - dx : a === 'start' ? px + dx : px);

    chart = (
      <svg className="pj-burn-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`over-${clipId}`}><rect x="0" y="0" width={W} height={Math.max(0, yb)} /></clipPath>
        </defs>
        <line className="pj-burn-base" x1={pad.l} x2={W - pad.r} y1={base} y2={base} />
        <path className="pj-burn-area" d={area} />
        {f.total > f.budget && <path className="pj-burn-over" d={area} clipPath={`url(#over-${clipId})`} />}
        <line className="pj-burn-budget" x1={pad.l} x2={W - pad.r} y1={yb} y2={yb} />
        <text className="pj-burn-label" x={pad.l + 2} y={yb - 7}>Budget {fmtH(f.budget)}</text>
        {xd !== null && (
          <g>
            <line className="pj-burn-due" x1={xd} x2={xd} y1={34} y2={base} />
            <text className="pj-burn-label" x={labelX(xd, anchor(xd, 70), 4)} y={44} textAnchor={anchor(xd, 70)}>Abgabe {fmtKw(f.dueKw, year)}</text>
          </g>
        )}
        {prog && <path className="pj-burn-prog" d={`M${xt.toFixed(1)},${y(f.total).toFixed(1)}L${x(prog[1]).toFixed(1)},${y(prog[2]).toFixed(1)}`} />}
        <path className="pj-burn-line" d={line} />
        {f.cross && f.cross <= end && <circle className="pj-burn-cross" cx={x(f.cross)} cy={yb} r="4.5" />}
        <line className="pj-burn-today" x1={xt} x2={xt} y1={22} y2={base} />
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

