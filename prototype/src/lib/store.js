import { useEffect, useRef, useState } from 'react';

// Lokaler Speicher für den Prototyp (kein Backend). Alles liegt unter einem Namensraum; „Demo zurücksetzen“ leert ihn.
const NS = 'vave-proto:v1:';
const EVT = 'vave-proto:store'; // Bescheid an andere Komponenten im selben Tab (detail = Schlüssel)

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

// Rohtext eines Schlüssels (für gecachte Leser, z. B. lib/projects.js); null ohne Wert oder ohne Speicher
export function readRaw(key) {
  try { return localStorage.getItem(NS + key); } catch (e) { return null; }
}

export function save(key, value) {
  try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch (e) { /* ohne Speicher weiter */ }
}

// useStoredState('time-entries', seed, cleanEntries) – wie useState, aber im localStorage gehalten.
// clean(value, fallback) prüft Gespeichertes: falsch geformt → fallback (siehe lib/data.js).
// Alle Komponenten mit demselben Schlüssel bleiben gleich – im selben Tab und über Tabs hinweg.
export function useStoredState(key, initial, clean) {
  const init = useRef(initial);
  const check = useRef(clean);
  const read = () => {
    const fallback = typeof init.current === 'function' ? init.current() : init.current;
    const value = load(key, fallback);
    return check.current ? check.current(value, fallback) : value;
  };
  const [value, setValue] = useState(read);
  // Rohtext, den diese Instanz zuletzt geschrieben oder übernommen hat. Geschrieben wird nur eine eigene Änderung –
  // so überschreibt eine veraltete Instanz nie den neueren Wert einer anderen (Wettlauf bei schnellen Klicks, r07).
  const synced = useRef(null);

  // Schreiben nur bei echter eigener Änderung – sonst schaukeln sich Komponenten über den Bescheid gegenseitig auf
  useEffect(() => {
    const raw = JSON.stringify(value);
    if (raw === synced.current) return;
    synced.current = raw;
    let stored = null;
    try { stored = localStorage.getItem(NS + key); } catch (e) { /* ohne Speicher */ }
    if (stored === raw) return;
    save(key, value);
    window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
  }, [key, value]);

  // Mithören: andere Komponenten (eigenes Ereignis) und andere Tabs ('storage')
  useEffect(() => {
    const sync = () => setValue(prev => {
      const next = read();
      const raw = JSON.stringify(next);
      synced.current = raw; // übernommen, nicht selbst geändert – nicht zurückschreiben
      return JSON.stringify(prev) === raw ? prev : next;
    });
    const onLocal = e => { if (e.detail === key) sync(); };
    const onStorage = e => { if (e.key === null || e.key === NS + key) sync(); };
    window.addEventListener(EVT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- read liest über Refs

  return [value, setValue];
}

export function resetDemo() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k));
  } catch (e) { /* egal */ }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
