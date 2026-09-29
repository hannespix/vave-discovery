// Ansicht „Woche“: Raster Projekt × Tag. Zeilen = Projekte mit Einträgen in der Woche plus selbst hinzugefügte; Spalten
// Mo–Fr, Sa/So nur mit Einträgen. Zelle = Summe der Einträge, direkt editierbar (Enter speichert, Esc verwirft, Tab geht
// weiter und speichert). Setzen schreibt nur den Sammeleintrag „Wochenraster“ (grid.js). Unten: Woche gegen Soll 40 h.
import { useEffect, useState } from 'react';
import { CircleAlert, Copy } from 'lucide-react';
import { fmtDuration } from '../../lib/format.js';
import { spentHours } from '../../lib/budget.js';
import { Dot, bookable, projectInfo } from './ProjectSelect.jsx';
import { durationMessage, echoOf, parseDuration, toInputDuration } from './duration.js';
import { cellTotals } from './grid.js';
import { sumMinutes } from './timeUtils.js';

export const WEEK_TARGET_MIN = 40 * 60;
const cellText = min => (min > 0 ? toInputDuration(min) : '');
const hours = h => h.toLocaleString('de-DE', { maximumFractionDigits: 1 });
const cellId = (project, iso) => `tt-c-${project}-${iso}`;

function BudgetRest({ id, entries }) {
  const { project } = projectInfo(id);
  if (!project || !(project.budget > 0)) return null;
  const rest = project.budget - spentHours(project, entries);
  if (rest < 0) return <span className="tt-over">{hours(Math.ceil(-rest * 10) / 10)} h überzogen</span>;
  return <span className="meta tt-rest">Rest {hours(Math.floor(rest * 10) / 10)} h</span>;
}

export default function WeekGrid({ all, mine, days, weekNo, rows, prevRows, onAddRow, onCopyRows, onCell }) {
  const [active, setActive] = useState(null); // { key, project, iso, value, error }
  const [status, setStatus] = useState(null); // { tone: 'ok' | 'warn', text }
  const [focusCell, setFocusCell] = useState(null);

  const inWeek = new Set(days.map(d => d.iso));
  const week = mine.filter(e => inWeek.has(e.date));
  const totals = cellTotals(week);
  const cols = days.filter(d => !d.weekend || week.some(e => e.date === d.iso));
  const weekMinutes = sumMinutes(week);
  const addable = bookable.filter(p => !rows.includes(p.id));
  const fresh = prevRows.filter(id => !rows.includes(id));

  useEffect(() => {
    if (!focusCell) return;
    const el = document.getElementById(focusCell);
    el?.focus();
    setFocusCell(null);
  }, [focusCell]);

  const where = (project, d) => `${projectInfo(project).code}, ${d.short} ${d.dm}`;

  // Wert übernehmen. fromBlur: Fehler landen in der Statuszeile, der Wert springt zurück (Tab bleibt frei)
  const commit = (project, d, text, fromBlur) => {
    const key = `${project}|${d.iso}`;
    const current = totals.get(key) || 0;
    const raw = text.trim();
    const parsed = raw === '' ? { minutes: 0 } : parseDuration(raw, { allowZero: true });
    const fail = message => {
      if (fromBlur) setStatus({ tone: 'warn', text: `Nicht gespeichert (${where(project, d)}): ${message}` });
      else setActive(a => (a && a.key === key ? { ...a, error: message } : a));
      return false;
    };
    if (parsed.error) return fail(durationMessage[parsed.error]);
    if (parsed.minutes === current) return true;
    const r = onCell(project, d.iso, parsed.minutes);
    if (r.error === 'below') {
      return fail(`${fmtDuration(parsed.minutes)} ist weniger als die Einzeleinträge (${fmtDuration(r.others)}) – bitte in der Liste kürzen.`);
    }
    if (r.error === 'day') return fail(`Der Tag hätte dann ${fmtDuration(r.dayMinutes)} – mehr als 24 h geht nicht.`);
    const at = where(project, d);
    const text2 = {
      created: `${at}: ${fmtDuration(parsed.minutes)} gespeichert (Sammeleintrag „Wochenraster“).`,
      updated: `${at}: jetzt ${fmtDuration(parsed.minutes)}.`,
      removed: r.others
        ? `${at}: Sammeleintrag entfernt. ${fmtDuration(r.others)} aus Einzeleinträgen bleiben – bitte in der Liste kürzen.`
        : `${at}: Sammeleintrag entfernt.`,
      unchanged: `${at}: Die Zelle besteht nur aus Einzeleinträgen (${fmtDuration(r.others)}) – bitte in der Liste kürzen.`,
    }[r.action];
    setStatus({ tone: r.action === 'unchanged' || (r.action === 'removed' && r.others) ? 'warn' : 'ok', text: text2 });
    const after = parsed.minutes === 0 ? r.others : parsed.minutes;
    setActive(a => (a && a.key === key ? { ...a, value: cellText(after), error: '' } : a));
    return true;
  };

  const cellInput = (project, d) => {
    const key = `${project}|${d.iso}`;
    const total = totals.get(key) || 0;
    const isActive = active?.key === key;
    const value = isActive ? active.value : cellText(total);
    const id = cellId(project, d.iso);
    if (d.isFuture) {
      return (
        <span className="tt-cell-static">
          {total ? cellText(total) : <><span aria-hidden="true">–</span><span className="visually-hidden">noch nicht buchbar</span></>}
        </span>
      );
    }
    let bubble = null;
    if (isActive) {
      const typed = active.value.trim();
      const parsed = typed === '' ? { minutes: 0 } : parseDuration(typed, { allowZero: true });
      const definite = parsed.error === 'max' || parsed.error === 'minutes';
      if (active.error) bubble = { tone: 'error', text: active.error };
      else if (definite) bubble = { tone: 'error', text: durationMessage[parsed.error] };
      else if (!parsed.error && active.value !== cellText(total)) bubble = { tone: 'echo', text: parsed.minutes ? echoOf(parsed) : '= – (leer)' };
    }
    return (
      <>
        <input
          id={id} className="tt-cell-input num" type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
          enterKeyHint="done" placeholder="–" value={value}
          aria-label={`${projectInfo(project).name}, ${d.long} ${d.dm}, Stunden`}
          aria-invalid={isActive && bubble?.tone === 'error' ? 'true' : undefined}
          aria-describedby={isActive && bubble ? `${id}-echo` : undefined}
          onFocus={e => {
            const el = e.target;
            setActive({ key, project, iso: d.iso, value: cellText(total), error: '' });
            requestAnimationFrame(() => { if (document.activeElement === el) el.select(); });
          }}
          onChange={e => setActive(a => ({ ...(a ?? { key, project, iso: d.iso }), value: e.target.value, error: '' }))}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (commit(project, d, e.target.value, false)) requestAnimationFrame(() => e.target.select());
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setActive(a => ({ ...a, value: cellText(total), error: '' }));
              requestAnimationFrame(() => e.target.select());
            }
          }}
          onBlur={e => {
            if (active?.key === key && e.target.value !== cellText(total)) commit(project, d, e.target.value, true);
            setActive(a => (a?.key === key ? null : a));
          }}
        />
        {bubble && (
          <span id={`${id}-echo`} className="tt-bubble" data-tone={bubble.tone} role="status">
            {bubble.tone === 'error' && <CircleAlert aria-hidden="true" size={14} />}
            {bubble.text}
          </span>
        )}
      </>
    );
  };

  const addRow = id => {
    if (!id) return;
    onAddRow(id);
    const first = cols.find(d => !d.isFuture);
    if (first) setFocusCell(cellId(id, first.iso));
    setStatus({ tone: 'ok', text: `Zeile ${projectInfo(id).code} hinzugefügt.` });
  };
  const copyRows = () => {
    if (!fresh.length) {
      setStatus({ tone: 'ok', text: prevRows.length ? 'Alle Projekte der Vorwoche stehen schon da.' : 'Die Vorwoche hat keine Zeilen.' });
      return;
    }
    onCopyRows(fresh);
    setStatus({
      tone: 'ok',
      text: `${fresh.length === 1 ? '1 Zeile' : `${fresh.length} Zeilen`} aus der Vorwoche übernommen – ohne Stunden.`,
    });
  };

  const share = Math.min(100, (weekMinutes / WEEK_TARGET_MIN) * 100);
  return (
    <section className="tt-week" aria-labelledby="tt-week-title">
      <div className="tt-week-head">
        <h2 id="tt-week-title" tabIndex={-1}>KW {weekNo} · {days[0].dm}–{days[6].dm}</h2>
        <div className="tt-week-tools">
          <label className="visually-hidden" htmlFor="tt-add-row">Projekt als Zeile hinzufügen</label>
          <select
            id="tt-add-row" className="tt-add-row" value="" disabled={!addable.length}
            onChange={e => addRow(e.target.value)}
          >
            <option value="">+ Projekt</option>
            {addable.map(p => <option key={p.id} value={p.id}>{`${p.code} · ${p.name}`}</option>)}
          </select>
          <button type="button" className="btn" onClick={copyRows}>
            <Copy aria-hidden="true" size={18} />
            Vorwoche übernehmen
          </button>
        </div>
      </div>

      <div className="tt-grid-scroll">
        <table className="table tt-grid">
          <caption className="visually-hidden">
            Stunden je Projekt und Tag, KW {weekNo}. Eine Zahl sind Stunden; Enter speichert, Escape verwirft.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="tt-grid-project">Projekt</th>
              {cols.map(d => (
                <th key={d.iso} scope="col" className="num tt-grid-day" data-today={d.isToday ? 'true' : undefined}>
                  <span className="tt-grid-dayname">{d.short} {d.date.getDate()}.</span>
                  {d.isToday && <span className="visually-hidden"> (heute)</span>}
                </th>
              ))}
              <th scope="col" className="num tt-grid-sumcol">Woche</th>
            </tr>
            <tr className="tt-grid-sums">
              <td className="tt-grid-project meta">Summe</td>
              {cols.map(d => {
                const m = sumMinutes(week.filter(e => e.date === d.iso));
                return <td key={d.iso} className="num">{m ? toInputDuration(m) : '–'}</td>;
              })}
              <td className="num tt-grid-sumcol">{toInputDuration(weekMinutes)}</td>
            </tr>
          </thead>
          <tbody>
            {rows.map(id => {
              const info = projectInfo(id);
              const rowMinutes = sumMinutes(week.filter(e => e.project === id));
              return (
                <tr key={id}>
                  <th scope="row" className="tt-grid-project">
                    <span className="tt-grid-name">
                      <Dot color={info.color} />
                      <span className="tt-grid-code">{info.code}</span>
                      <span className="tt-grid-pname">{info.name}</span>
                    </span>
                    <BudgetRest id={id} entries={all} />
                  </th>
                  {cols.map(d => (
                    <td key={d.iso} className="num tt-cell" data-today={d.isToday ? 'true' : undefined}>{cellInput(id, d)}</td>
                  ))}
                  <td className="num tt-grid-sumcol">{rowMinutes ? toInputDuration(rowMinutes) : '–'}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={cols.length + 2} className="meta">Diese Woche noch keine Zeilen. „+ Projekt“ oder „Vorwoche übernehmen“.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="tt-grid-status" role="status" data-tone={status?.tone}>{status?.text}</p>

      <div className="tt-goal">
        <p className="tt-goal-text">
          <span className="overline">Woche</span>
          <strong className="num">{fmtDuration(weekMinutes)}</strong>
          <span className="meta">von {WEEK_TARGET_MIN / 60} h Soll</span>
        </p>
        <div className="tt-goal-bar" aria-hidden="true"><span style={{ width: `${share}%` }} /></div>
      </div>
    </section>
  );
}
