import { CalendarOff, CircleCheck, Moon } from 'lucide-react';

// Offen / geschlossen / Wochenende – immer mit Wort, nicht nur Farbe. Offen trägt Limette (Zustand „jetzt aktiv“,
// Fläche mit schwarzer Schrift), der Rest ist neutral. workday aus studioStatus(): am Wochenende „Wochenende“.
// compact: ohne Icon, für schmale Spalten (rechte Leiste auf „Heute“).
export default function OpenBadge({ open, workday = true, compact = false }) {
  const icon = Icon => (compact ? null : <Icon aria-hidden="true" size={14} strokeWidth={2} />);
  if (open) return <span className="badge badge-lime">{icon(CircleCheck)}offen</span>;
  if (!workday) return <span className="badge">{icon(CalendarOff)}Wochenende</span>;
  return <span className="badge">{icon(Moon)}geschlossen</span>;
}

// Dasselbe als reiner Text (Tabellen, Sätze)
export const statusText = ({ open, workday = true }) => (open ? 'offen' : workday ? 'geschlossen' : 'Wochenende');
