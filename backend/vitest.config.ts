import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // Декораторам (class-validator и др.) нужна эта библиотека; в сервере её подключает сам Nest.
    setupFiles: ['reflect-metadata'],
    include: ['**/*.spec.ts'],
  },
});
