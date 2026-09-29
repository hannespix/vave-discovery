import { useEffect, useState } from 'react';

// Darstellung Hell/Dunkel/System – als data-theme auf <html>, gemerkt im localStorage.
// Bewusst außerhalb des Demo-Namensraums (vave-proto:v1:): „Demo zurücksetzen“ behält die gewählte Darstellung.
// index.html setzt den Wert schon vor dem ersten Rendern (kein Aufblitzen).
export const THEME_KEY = 'vave-proto:theme';
export const THEMES = ['light', 'dark', 'system'];

export function readTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.includes(t) ? t : 'system';
  } catch (e) {
    return 'system';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ohne Speicher weiter */ }
  }, [theme]);
  return [theme, setTheme];
}
