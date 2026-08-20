import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';

// Keep the client test build's __APP_VERSION__ in sync with the Vite define (root package version).
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, './package.json'), 'utf8'),
) as { version: string };

// Single Vitest config for the whole repo. Vitest 4 removed workspace files; both environments are
// declared as projects here, so one `vitest run` covers client (jsdom) + backend (node).
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        define: {
          __APP_VERSION__: JSON.stringify(rootPkg.version),
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './client/src'),
            '@shared': path.resolve(__dirname, './shared'),
            '@server': path.resolve(__dirname, './server'),
            '@gameInfo': path.resolve(__dirname, './gameInfo.ts'),
          },
        },
        test: {
          name: 'client',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./client/src/test/setup.ts'],
          include: ['client/src/**/*.test.{ts,tsx}'],
          css: true,
        },
      },
      {
        resolve: {
          alias: {
            '@shared': path.resolve(__dirname, './shared'),
          },
        },
        test: {
          name: 'backend',
          globals: true,
          environment: 'node',
          include: ['core/**/*.test.{ts,js}', 'test/**/*.test.{ts,js}'],
        },
      },
    ],
  },
});
