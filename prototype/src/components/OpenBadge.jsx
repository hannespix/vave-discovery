import { CalendarOff, CircleCheck, Moon } from 'lucide-react';

// Offen / geschlossen / Wochenende – Text und Icon, nicht nur Farbe. Offen trägt Limette („jetzt aktiv“), der Rest ist neutral.
// workday aus studioStatus(): am Wochenende heißt es „Wochenende“, nicht „geschlossen“.
export default function OpenBadge({ open, workday = true }) {
  if (open) return <span className="badge badge-lime"><CircleCheck aria-hidden="true" size={14} strokeWidth={2} />offen</span>;
  if (!workday) return <span className="badge"><CalendarOff aria-hidden="true" size={14} strokeWidth={2} />Wochenende</span>;
  return <span className="badge"><Moon aria-hidden="true" size={14} strokeWidth={2} />geschlossen</span>;
}
