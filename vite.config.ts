import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The deployed demo lives under a sub-path (see .github/workflows/pages.yml)
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // *.steps.ts run the rules in the *.feature file beside them (docs/decisions/0007)
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.steps.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,steps}.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
