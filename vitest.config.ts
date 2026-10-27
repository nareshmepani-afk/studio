import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: [
      'src/test/**/*.{test,spec}.{ts,tsx}',
      'src/components/studio/__tests__/**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/test/e2e/**', '**/*.e2e.*'],
    pool: 'forks',
    maxForks: 6,
    minForks: 1,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
