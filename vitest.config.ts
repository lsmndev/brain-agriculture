import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    globals: true,
    environment: 'node',

    include: ['src/**/*.spec.ts'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.module.ts',
        'src/main.ts',
        'src/database/**',
      ],
    },
  },
});