import { defineConfig } from 'vitest/config';

// Unit tests run against the pure domain logic (state machine, concurrency
// helpers) — no database required, so they're fast and deterministic.
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    environment: 'node',
  },
});
