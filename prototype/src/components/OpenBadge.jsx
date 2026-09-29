import { CircleCheck, Moon } from 'lucide-react';

// Offen/geschlossen – Text und Icon, nicht nur Farbe
export default function OpenBadge({ open }) {
  return open ? (
    <span className="badge badge-ok"><CircleCheck aria-hidden="true" size={14} strokeWidth={2} />offen</span>
  ) : (
    <span className="badge"><Moon aria-hidden="true" size={14} strokeWidth={2} />geschlossen</span>
  );
}
