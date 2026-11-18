import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});

/* Base relative path for GitHub Pages deployment */
