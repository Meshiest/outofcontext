// GA4 analytics. The measurement id comes from `VITE_GA_MEASUREMENT_ID` (Vite only exposes
// VITE_-prefixed vars to the client, and bakes them at build time). When the id is absent - dev,
// tests, or an unconfigured deploy - every function here no-ops, so call sites never need to
// feature-detect.

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Load gtag.js and configure GA4 once, with `send_page_view: false` so the SPA fires its own
 * page_view on each route change (see `logPageView`) instead of double-counting the initial load.
 * No-ops when the measurement id is unset or gtag is already loaded.
 *
 * The two `allow_*` flags are OFF deliberately - they turn off Google Signals (cross-device
 * tracking) and ad-personalization sharing, both of which gtag enables by default. This site has
 * opted out of them since the Universal Analytics days; do not drop them to "clean up" the config.
 * They are `set` before `config` so they apply to every hit, including the automatic ones.
 */
export function initAnalytics(): void {
  if (!MEASUREMENT_ID || typeof document === 'undefined' || window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  const gtag = (...args: unknown[]): void => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('set', 'allow_google_signals', false);
  gtag('set', 'allow_ad_personalization_signals', false);
  gtag('config', MEASUREMENT_ID, { send_page_view: false });
}

/** Fire a manual GA4 page_view (SPA navigation). No-ops when gtag is absent. */
export function logPageView(path: string, title?: string): void {
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
  });
}

/**
 * Log an arbitrary GA4 event. No-ops when gtag is absent. GA4 has no `custom_map`, so custom
 * dimensions/metrics are sent as plain event params (game_name, lobby_code, turn_duration,
 * wait_duration, player_count, emote_index) alongside the relevant events.
 */
export function logEvent(name: string, params?: Record<string, unknown>): void {
  window.gtag?.('event', name, params);
}
