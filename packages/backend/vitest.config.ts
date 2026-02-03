import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['src/**/__tests__/**', 'src/generated/**'],
      // Spec targets >80% (Section 30). Increasing incrementally as coverage grows.
      thresholds: { branches: 60, functions: 60, lines: 60, statements: 60 },
    },
  },
});
