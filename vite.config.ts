// defineConfig comes from vitest/config so the `test` block is typed. It is a
// superset of vite's defineConfig; the build behaves exactly as before.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ga/demo-map/',
  test: {
    // The utils build DOM nodes and read document.baseURI, so they need a DOM.
    environment: 'jsdom',
    // Pin the document URL so relative-URL resolution is reproducible and does
    // not depend on the jsdom default. Mirrors the deployed base path.
    environmentOptions: {
      jsdom: { url: 'https://example.org/ga/demo-map/' },
    },
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
