import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      VITE_TIMEZONE: 'Australia/Sydney',
      VITE_DEFAULT_SUBURB: 'Guildford South',
      VITE_API_BASE_URL: '/api/v1',
    },
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
