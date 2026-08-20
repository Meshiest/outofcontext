import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// The client version is the ROOT package version (matches server/version.ts, which reads the same
// file), so the version-mismatch auto-reload only fires on a genuine deploy skew, not every dev run.
const rootPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Inject the version as a literal so the client bundle never imports package.json.
    // Declared for TS in src/vite-env.d.ts.
    __APP_VERSION__: JSON.stringify(rootPkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      // Type-only usage (the AppRouter type). Aliased for parity with tsconfig so any accidental
      // value import fails loudly at build time rather than resolving to nothing.
      '@server': path.resolve(__dirname, '../server'),
      // Root-level game metadata (shared by server + client). Single file, so the alias is exact.
      '@gameInfo': path.resolve(__dirname, '../gameInfo.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // tRPC mutations/queries (HTTP) + subscriptions (SSE) -> Express backend.
      '/trpc': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // REST compatibility shims (rocketcrab, lobby exists, info).
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Land production output where Express already serves static files + SPA fallback.
    outDir: '../public',
    emptyOutDir: true,
  },
});
