import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': läuft unter https://hannespix.github.io/vave-discovery/prototyp/ und lokal per `npm run preview`
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
