import { afterEach, describe, it, expect, vi } from 'vitest';
import { logEvent, logPageView, initAnalytics } from './analytics';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  delete (window as { gtag?: unknown }).gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
  document.querySelector('script[src*="googletagmanager"]')?.remove();
});

describe('logEvent', () => {
  it('no-ops when gtag is absent', () => {
    expect(() => logEvent('turn_event')).not.toThrow();
  });

  it('forwards the event name and params to gtag when present', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    logEvent('wait_event', { duration: 5 });
    expect(gtag).toHaveBeenCalledWith('event', 'wait_event', { duration: 5 });
  });

  it('forwards undefined params unchanged', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    logEvent('turn_event');
    expect(gtag).toHaveBeenCalledWith('event', 'turn_event', undefined);
  });
});

describe('logPageView', () => {
  it('no-ops when gtag is absent', () => {
    expect(() => logPageView('/games')).not.toThrow();
  });

  it('fires a page_view event with the path when gtag is present', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    logPageView('/games', 'Games');
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/games',
      page_title: 'Games',
    });
  });
});

describe('initAnalytics', () => {
  it('no-ops (no gtag, no script) when VITE_GA_MEASUREMENT_ID is unset in tests', () => {
    initAnalytics();
    expect(window.gtag).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });

  /**
   * Google Signals and ad-personalization sharing default to ON in gtag. This site has opted out of
   * both since the Universal Analytics days, and the opt-out is invisible in the UI - only this test
   * would catch its removal. The `set` calls must also precede `config`, or they miss the hits gtag
   * sends as part of configuring the property.
   */
  it('opts out of google signals and ad personalization before configuring the property', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    vi.resetModules();
    const { initAnalytics: init } = await import('./analytics');

    init();

    const calls = (window.dataLayer ?? []) as unknown[][];
    expect(calls).toContainEqual(['set', 'allow_google_signals', false]);
    expect(calls).toContainEqual(['set', 'allow_ad_personalization_signals', false]);

    const setAt = calls.map((c, i) => (c[0] === 'set' ? i : -1)).filter((i) => i >= 0);
    const config = calls.findIndex((c) => c[0] === 'config');
    expect(config).toBeGreaterThan(Math.max(...setAt));
    expect(calls[config]).toEqual(['config', 'G-TEST123', { send_page_view: false }]);
  });
});
