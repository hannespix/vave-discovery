import { useEffect, useState } from 'react';

// Lokaler Speicher für den Prototyp (kein Backend). Alles liegt unter einem Namensraum; „Demo zurücksetzen“ leert ihn.
const NS = 'vave-proto:v1:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function save(key, value) {
  try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch (e) { /* ohne Speicher weiter */ }
}

// useStoredState('time-entries', seed) – wie useState, aber im localStorage gehalten
export function useStoredState(key, initial) {
  const [value, setValue] = useState(() => load(key, typeof initial === 'function' ? initial() : initial));
  useEffect(() => { save(key, value); }, [key, value]);
  return [value, setValue];
}

export function resetDemo() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k));
  } catch (e) { /* egal */ }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
