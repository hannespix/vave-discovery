# VAVE Studio – Prototyp (UI-Entwurf)

Erster Oberflächen-Entwurf auf Wunsch von Hannes (2026-09-29), **vor** der Auswertung der Umfrage:
nur Oberfläche, typische Beispieldaten, **kein Backend**, keine Rechnungs-, Buchhaltungs- oder Mandantenlogik.
Welche Funktionen wirklich gebraucht werden, klärt die Umfrage; die Speicher-Entscheidung (PGlite oder Firebase) fällt in G2.

- Stack: React + Vite, Schrift Readex Pro (OFL, lokal eingebunden), Icons lucide-react. Keine externen Aufrufe zur Laufzeit –
  prüft `npm run check:prototype` (Wurzel) nach dem Build, in CI vor jedem Deploy.
- Daten: `src/data/sample.js` (erfunden); Änderungen der Demo liegen im `localStorage` des Browsers („Demo zurücksetzen“).
  Gemeinsame Verträge: `lib/store.js` (Speicher, abgeglichen), `lib/data.js` (Prüfer), `lib/budget.js` (gebucht = Stand + Zeiterfassung).
- Design: Farben und Typografie nach vave.studio – Schwarz, Weiß, Violett `#641dff`, Limette `#e8ffb9`; Tokens in `src/styles/tokens.css`.

```bash
cd prototype
npm ci
npm run dev      # lokal entwickeln
npm run build    # → dist/ (relativ verlinkt, läuft unter /vave-discovery/prototyp/)
```

Live (nach Merge auf `main`): https://hannespix.github.io/vave-discovery/prototyp/ – `noindex`, die Umfrage bleibt unter der Wurzel.
Die Umfrage verlinkt den Entwurf erst nach dem Senden (E11, angekündigt im Vorwort).
