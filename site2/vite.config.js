import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(name, import.meta.url));

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: page('index.html'),
        privacy: page('privacy.html'),
        terms: page('terms.html'),
      },
    },
  },
});
