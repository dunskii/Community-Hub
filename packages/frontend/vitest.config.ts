import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts'],
    css: {
      include: [], // Don't process CSS in tests
    },
    coverage: {
      provider: 'v8',
      exclude: ['src/**/__tests__/**'],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});
