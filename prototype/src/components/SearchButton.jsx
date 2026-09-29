import { Search } from 'lucide-react';
import { MOD_LABEL, PALETTE_KEYSHORTCUTS } from './shortcuts.js';

// Öffnet die Befehlspalette. Breit (Seitenleiste) mit Tastenkappe ⌘K bzw. Strg K; schmal (Handy-Kopf) als Icon-Knopf.
export default function SearchButton({ onClick, compact = false }) {
  if (compact) {
    return (
      <button type="button" className="btn btn-ghost btn-icon topbar__search" onClick={onClick} aria-label="Suchen"
        aria-haspopup="dialog" aria-keyshortcuts={PALETTE_KEYSHORTCUTS}>
        <Search aria-hidden="true" size={20} strokeWidth={1.75} />
      </button>
    );
  }
  return (
    <button type="button" className="search-btn" onClick={onClick} aria-haspopup="dialog" aria-keyshortcuts={PALETTE_KEYSHORTCUTS}>
      <Search aria-hidden="true" size={18} strokeWidth={1.75} />
      <span className="search-btn__label">Suchen</span>
      <span className="search-btn__keys" aria-hidden="true">
        <kbd className="kbd">{MOD_LABEL}</kbd><kbd className="kbd">K</kbd>
      </span>
    </button>
  );
}
