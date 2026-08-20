import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Out Of Context E2E suite.
 *
 * How the app is served for tests: the backend (`npm start`, tsx main.ts) serves the built client from
 * `public/` on PORT 8080 AND hosts tRPC (`/trpc`) + the REST shims (`/api/...`) + the SPA fallback. So
 * a single origin - http://localhost:8080 - is the baseURL for everything.
 *
 * The `webServer` below builds the client then boots the backend. Set `E2E_NO_BUILD=1` to skip the
 * client build and assume a prebuilt `public/` (faster local re-runs). Either way the ROOT deps and
 * the CLIENT deps must already be installed (`npm ci` at the root, `npm ci` in `client/`).
 */
const webServerCommand = process.env.E2E_NO_BUILD
  ? 'npm start'
  : 'npm --prefix client run build && npm start';

export default defineConfig({
  testDir: './e2e',
  // Multi-client tests open several browser contexts each; keep them serial-ish by default to avoid
  // starving the single dev server. Bump `workers` on CI hardware that can take it.
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each test drives a full multi-player play-through; give them room.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // The two layouts to cover: 375px (mobile, single column) and 1280px (desktop, side-rail).
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
  ],

  webServer: {
    command: webServerCommand,
    url: 'http://localhost:8080/api/v1/info',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
