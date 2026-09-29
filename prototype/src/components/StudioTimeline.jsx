import { useLayoutEffect, useRef, useState } from 'react';
import { fmtTime } from '../lib/format.js';
import { CLOSE_HOUR, HOME_TZ, OPEN_HOUR, commonWindows, fmtHM, minutesOfDay, workWindowInHome } from '../lib/time.js';

const DAY = 1440;
const range = ([a, b]) => `${fmtHM(a)}–${fmtHM(b)}`;
const shortRange = ([a, b]) => (a % 60 || b % 60 ? range([a, b]) : `${String(a / 60).padStart(2, '0')}–${String(b / 60).padStart(2, '0')}`);

// SVG-Zeitleiste über 24 h Frankfurter Zeit: Arbeitszeit je Studio, gemeinsames Fenster, Linie „jetzt“.
// Maße in Pixeln nach gemessener Breite, damit die Schrift auf dem Handy nicht schrumpft.
// Für Screenreader: SVG ist aria-hidden, dieselben Angaben stehen in Satz und Tabelle.
export default function StudioTimeline({ studios, now }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    setWidth(Math.floor(el.clientWidth));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = studios.map(s => ({ ...s, segs: workWindowInHome(now, s.tz) }));
  const common = commonWindows(rows.map(r => r.segs));
  const nowMin = minutesOfDay(now, HOME_TZ);

  const narrow = width < 560;
  const labelW = narrow ? 84 : 112;
  const padR = 16;
  const rowH = narrow ? 36 : 40;
  const top = 30;
  const bodyH = rows.length * rowH;
  const height = top + bodyH + 30;
  const plotW = Math.max(0, width - labelW - padR);
  const x = m => labelW + (m / DAY) * plotW;
  const ticks = narrow ? [0, 6, 12, 18, 24] : [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const nowX = x(nowMin);
  const nowAnchor = nowX < labelW + 40 ? 'start' : nowX > width - 48 ? 'end' : 'middle';

  return (
    <div className="timeline">
      <div ref={wrapRef} className="timeline__canvas">
        {width > 0 && (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
            {ticks.map(h => (
              <line key={h} className="tl-grid" x1={x(h * 60)} x2={x(h * 60)} y1={top - 4} y2={top + bodyH + 4} />
            ))}
            {common.map(seg => (
              <rect key={seg[0]} className="tl-band" x={x(seg[0])} y={top - 4} width={x(seg[1]) - x(seg[0])} height={bodyH + 8} />
            ))}
            {rows.map((r, i) => {
              const y = top + i * rowH;
              return (
                <g key={r.id}>
                  <text className="tl-label" x={0} y={y + rowH / 2} dominantBaseline="central">{r.name}</text>
                  {r.segs.map(seg => {
                    const w = x(seg[1]) - x(seg[0]);
                    return (
                      <g key={seg[0]}>
                        <rect className="tl-bar" x={x(seg[0])} y={y + 6} width={w} height={rowH - 12} rx={4} style={{ fill: r.color }} />
                        {w > 44 && (
                          <text className="tl-bar-text" x={x(seg[0]) + w / 2} y={y + rowH / 2} textAnchor="middle" dominantBaseline="central">
                            {shortRange(seg)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {ticks.map(h => (
              <text key={h} className="tl-tick" x={x(h * 60)} y={height - 8} textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}>
                {String(h).padStart(2, '0')}
              </text>
            ))}
            <line className="tl-now" x1={nowX} x2={nowX} y1={top - 10} y2={top + bodyH + 6} pathLength="1" />
            <text className="tl-now-label" x={nowX} y={14} textAnchor={nowAnchor}>jetzt {fmtTime(now, HOME_TZ)}</text>
          </svg>
        )}
      </div>

      {/* Tabellen ignorieren width: 1px – deshalb versteckt der Container, nicht die Tabelle */}
      <div className="visually-hidden">
      <table>
        <caption>Arbeitszeit der Studios ({OPEN_HOUR}–{CLOSE_HOUR} Uhr Ortszeit), umgerechnet in Frankfurter Zeit</caption>
        <thead>
          <tr><th scope="col">Studio</th><th scope="col">Ortszeit jetzt</th><th scope="col">Arbeitszeit in Frankfurter Zeit</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <th scope="row">{r.name}</th>
              <td>{fmtTime(now, r.tz)} Uhr</td>
              <td>{r.segs.map(range).join(' und ')} Uhr</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export { range as fmtRange };
