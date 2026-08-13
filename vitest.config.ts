import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      // istanbul, not v8: openchemlib is a very heavy dependency and v8 precise
      // coverage profiles every call inside it (see rules/testing.md).
      provider: 'istanbul',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
