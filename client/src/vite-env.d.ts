/// <reference types="vite/client" />

// Injected by Vite `define` (vite.config.ts) / Vitest `define` (vitest.config.ts). The client build
// version, used for the server<->client version-mismatch auto-reload.
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  // GA4 measurement id. Baked in at `vite build` time; absent -> analytics no-op.
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
