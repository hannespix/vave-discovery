// Ansicht „Woche“: Raster Projekt × Tag der gewählten Woche. Zeilen = Projekte mit Einträgen in der Woche plus selbst
// hinzugefügte; Spalten Mo–Fr, Sa/So nur mit Einträgen. Zelle = Summe der Einträge, direkt editierbar (Enter speichert,
// Esc verwirft, Tab geht weiter und speichert). Vergangene Wochen ganz, die laufende Woche bis heute.
// Setzen ändert nur den Sammeleintrag (grid.js, source 'grid') – Einzeleinträge aus Timer und Nachtragen bleiben immer
// stehen, die Meldung nennt sie. Jede Änderung hat „Rückgängig“ in der Statuszeile (bleibt bis zur nächsten Änderung).
import { useEffect, useState } from 'react';
import { CircleAlert, Copy, Undo2 } from 'lucide-react';
import { fmtDuration, fmtH1 } from '../../lib/format.js';
import { restHours } from '../../lib/budget.js';
import { Dot, bookable, projectInfo } from './ProjectSelect.jsx';
import { durationError, echoOf, parseDuration, toInputDuration } from './duration.js';
import { cellTotals } from './grid.js';
import { WEEK_TARGET_MIN, sumMinutes } from './timeUtils.js';
import { RANGE_TITLE_ID } from './WeekNav.jsx';

const cellText = min => (min > 0 ? toInputDuration(min) : '');
export const cellId = (project, iso) => `tt-c-${project}-${iso}`;

// Rest wie in Projekte und Heute: restHours + fmtH1 – eine Rundung für alle Stunden-Anzeigen
function BudgetRest({ id, entries }) {
  const { project } = projectInfo(id);
  if (!project || !(project.budget > 0)) return null;
  const rest = restHours(project, entries);
  if (rest < 0) return <span className="tt-over">{fmtH1(-rest)} überzogen</span>;
  return <span className="meta tt-rest">Rest {fmtH1(rest)}</span>;
}

// „1 Einzeleintrag (0:45 h) bleibt“ · „2 Einzeleinträge (1:30 h) bleiben“
const singles = (count, minutes) =>
  (count === 1 ? `1 Einzeleintrag (${fmtDuration(minutes)}) bleibt` : `${count} Einzeleinträge (${fmtDuration(minutes)}) bleiben`);

export default function WeekGrid({ all, mine, days, weekNo, rows, prevRows, flash, onAddRow, onCopyRows, onCell }) {
  const [active, setActive] = useState(null); // { key, project, iso, value, error }
  const [status, setStatus] = useState(null); // { tone: 'ok' | 'warn', text, undo?: { run, done, focus? } }
  const [focusCell, setFocusCell] = useState(null);

  const inWeek = new Set(days.map(d => d.iso));
  const week = mine.filter(e => inWeek.has(e.date));
  const totals = cellTotals(week);
  const cols = days.filter(d => !d.weekend || week.some(e => e.date === d.iso));
  const weekMinutes = sumMinutes(week);
  const addable = bookable().filter(p => !rows.includes(p.id));
  const fresh = prevRows.filter(id => !rows.includes(id));

  // Die Statuszeile bleibt beim Blättern stehen: Sie nennt Projekt und Tag, „Rückgängig“ wirkt auf die Einträge selbst
  useEffect(() => {
    if (!focusCell) return;
    document.getElementById(focusCell)?.focus();
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
    if (parsed.error) return fail(durationError(parsed));
    if (parsed.minutes === current) return true;
    const r = onCell(project, d.iso, parsed.minutes);
    if (r.error === 'below') {
      return fail(`${fmtDuration(parsed.minutes)} ist weniger als die Einzeleinträge (${fmtDuration(r.others)}) – bitte in der Liste kürzen.`);
    }
    if (r.error === 'day') return fail(`Der Tag hätte dann ${fmtDuration(r.dayMinutes)} – mehr als 24 h geht nicht.`);
    const at = where(project, d);
    const target = parsed.minutes;
    const aggregate = r.entry ? Number(r.entry.minutes) || 0 : 0;
    const rest = r.othersCount ? `, ${singles(r.othersCount, r.others)} unverändert` : '';
    const text2 = {
      created: r.othersCount
        ? `${at}: jetzt ${fmtDuration(target)} – ${fmtDuration(aggregate)} im Sammeleintrag „Wochenraster“${rest}.`
        : `${at}: ${fmtDuration(target)} gespeichert (Sammeleintrag „Wochenraster“).`,
      updated: r.othersCount
        ? `${at}: jetzt ${fmtDuration(target)} – ${fmtDuration(aggregate)} im Sammeleintrag${rest}.`
        : `${at}: jetzt ${fmtDuration(target)}.`,
      removed: r.othersCount
        ? `${at}: Sammeleintrag (${fmtDuration(r.beforeMinutes)}) entfernt. ${singles(r.othersCount, r.others)} stehen – ändern in der Liste.`
        : `${at}: Sammeleintrag (${fmtDuration(r.beforeMinutes)}) entfernt.`,
      unchanged: `${at}: Die Zelle besteht nur aus Einzeleinträgen (${fmtDuration(r.others)}) – bitte in der Liste kürzen.`,
    }[r.action];
    const undo = r.undo
      ? { run: r.undo, done: `${at}: rückgängig gemacht – wieder ${fmtDuration(current)}.`, focus: cellId(project, d.iso) }
      : null;
    setStatus({ tone: r.action === 'unchanged' || (r.action === 'removed' && r.othersCount) ? 'warn' : 'ok', text: text2, undo });
    const after = r.action === 'unchanged' ? current : Math.max(target, r.others);
    setActive(a => (a && a.key === key ? { ...a, value: cellText(after), error: '' } : a));
    return true;
  };

  const runUndo = () => {
    const u = status?.undo;
    if (!u) return;
    u.run();
    setStatus({ tone: 'ok', text: u.done });
    // Der Knopf verschwindet – Fokus in die betroffene Zelle bzw. auf den Wochentitel, nicht ins Leere
    setFocusCell(u.focus && document.getElementById(u.focus) ? u.focus : RANGE_TITLE_ID);
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
      else if (definite) bubble = { tone: 'error', text: durationError(parsed) };
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
    const undo = onAddRow(id);
    const first = cols.find(d => !d.isFuture);
    if (first) setFocusCell(cellId(id, first.iso));
    const code = projectInfo(id).code;
    setStatus({ tone: 'ok', text: `Zeile ${code} hinzugefügt.`, undo: { run: undo, done: `Zeile ${code} wieder entfernt.` } });
  };
  const copyRows = () => {
    if (!fresh.length) {
      setStatus({ tone: 'ok', text: prevRows.length ? 'Alle Projekte der Vorwoche stehen schon da.' : 'Die Vorwoche hat keine Zeilen.' });
      return;
    }
    const undo = onCopyRows(fresh);
    const n = fresh.length === 1 ? '1 Zeile' : `${fresh.length} Zeilen`;
    setStatus({ tone: 'ok', text: `${n} aus der Vorwoche übernommen – ohne Stunden.`, undo: { run: undo, done: `${n} wieder entfernt.` } });
  };

  const share = Math.min(100, (weekMinutes / WEEK_TARGET_MIN) * 100);
  return (
    <section className="tt-week" aria-labelledby={RANGE_TITLE_ID}>
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

      <div className="tt-grid-scroll">
        <table className="table tt-grid">
          <caption className="visually-hidden">
            Stunden je Projekt und Tag, KW {weekNo}. Eine Zahl sind Stunden (1,5 = 1:30 h), Minuten mit m (45m).
            Enter speichert, Escape verwirft.
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
                      <Dot />
                      <span className="tt-grid-code">{info.code}</span>
                      <span className="tt-grid-pname">{info.name}</span>
                    </span>
                    <BudgetRest id={id} entries={all} />
                  </th>
                  {cols.map(d => (
                    <td
                      key={d.iso} className="num tt-cell" data-today={d.isToday ? 'true' : undefined}
                      data-highlight={flash?.project === id && flash?.date === d.iso ? 'true' : undefined}
                    >
                      {cellInput(id, d)}
                    </td>
                  ))}
                  <td className="num tt-grid-sumcol">{rowMinutes ? toInputDuration(rowMinutes) : '–'}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={cols.length + 2} className="meta">
                  In KW {weekNo} noch keine Zeilen. „+ Projekt“ oder „Vorwoche übernehmen“.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="tt-grid-statusbar">
        <p className="tt-grid-status" role="status" data-tone={status?.tone}>{status?.text}</p>
        {status?.undo && (
          <button type="button" className="btn tt-grid-undo" onClick={runUndo}>
            <Undo2 aria-hidden="true" size={18} />
            Rückgängig
          </button>
        )}
      </div>

      <div className="tt-goal">
        <p className="tt-goal-text">
          <span className="overline">Woche</span>{' '}
          <strong className="num">{fmtDuration(weekMinutes)}</strong>{' '}
          <span className="meta">von {WEEK_TARGET_MIN / 60} h Soll</span>
        </p>
        <div className="tt-goal-bar" aria-hidden="true"><span style={{ width: `${share}%` }} /></div>
      </div>
    </section>
  );
}
