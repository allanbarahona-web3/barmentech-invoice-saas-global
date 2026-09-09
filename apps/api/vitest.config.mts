import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      'test/**/*.integration.spec.ts',
      'test/**/*.e2e-spec.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['test/setup/load-test-environment.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts'],
    },
  },
});
