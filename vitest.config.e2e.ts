import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    globals: true,
    environment: 'node',

    include: ['test/e2e/**/*.e2e-spec.ts'],

    fileParallelism: false,

    testTimeout: 10_000,
    hookTimeout: 30_000,
  },
});