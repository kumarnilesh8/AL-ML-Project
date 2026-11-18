import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@bp/domain': r('./packages/domain/src/index.ts'),
      '@bp/rating': r('./packages/rating/src/index.ts'),
      '@bp/matching': r('./packages/matching/src/index.ts'),
      '@': r('./apps/web/src'),
      'server-only': r('./apps/web/test/server-only-stub.ts'),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/web/src/**/*.test.ts'],
    environment: 'node',
    // Integration tests share one database; run files one at a time.
    fileParallelism: false,
  },
});
