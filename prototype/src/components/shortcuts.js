import { useEffect, useRef } from 'react';

// Globale Tastenkürzel – vergibt nur die Hülle; Seiten binden keine Einzeltasten.
//   ⌘K / Strg K  Befehlspalette (wirkt auch in Feldern)
//   /            Befehlspalette        ?   Übersicht der Kürzel
//   g, dann h/z/p/s/k  Heute, Zeiten, Projekte, Studios, Nach Klärung
//   t            Timer starten/stoppen  n   Zeit nachtragen
// Einzeltasten wirken nie bei Fokus in Feld, Auswahl oder bearbeitbarem Element, nie mit Strg/⌘/Alt
// (Umschalt ist erlaubt: „?“ und „/“ brauchen sie auf vielen Tastaturen) und nie bei offenem Dialog.

const platform = typeof navigator === 'undefined'
  ? ''
  : navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
export const IS_APPLE = /mac|iphone|ipad|ipod/i.test(platform);
export const MOD_LABEL = IS_APPLE ? '⌘' : 'Strg';
// Für aria-keyshortcuts am Suchen-Knopf
export const PALETTE_KEYSHORTCUTS = `${IS_APPLE ? 'Meta+K' : 'Control+K'} /`;

export const SEQUENCE_MS = 1500;
const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock'];

export function isTypingTarget(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.isContentEditable) return true;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
  return /^(textbox|searchbox|combobox|spinbutton)$/.test(el.getAttribute('role') || '');
}

// handlers: { togglePalette, openPalette, openHelp, toggleTimer, go(path), goKeys: { h: '/', … } }
export function useGlobalShortcuts(handlers) {
  const ref = useRef(handlers);
  useEffect(() => { ref.current = handlers; });

  useEffect(() => {
    let gAt = -Infinity; // Zeitpunkt des „g“ einer Folge
    const onKey = e => {
      const key = typeof e.key === 'string' ? e.key : ''; // Autofill feuert keydown ohne key
      if (!key || e.defaultPrevented || e.isComposing || key === 'Process' || MODIFIER_KEYS.includes(key)) return;
      const h = ref.current;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.altKey && !e.shiftKey && (key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        if (document.querySelector('dialog[open]:not(.palette)')) return; // anderer Dialog hat Vorrang
        e.preventDefault();
        h.togglePalette();
        return;
      }

      const inSequence = e.timeStamp - gAt < SEQUENCE_MS;
      gAt = -Infinity;
      if (mod || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
      if (document.querySelector('dialog[open]')) return;

      if (inSequence) {
        const to = h.goKeys[key];
        if (to !== undefined) { e.preventDefault(); h.go(to); }
        return;
      }
      switch (key) {
        case 'g': gAt = e.timeStamp; break;
        case '/': e.preventDefault(); h.openPalette(); break;
        case '?': e.preventDefault(); h.openHelp(); break;
        case 't': e.preventDefault(); h.toggleTimer(); break;
        case 'n': e.preventDefault(); h.go('/zeit/nachtragen'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
