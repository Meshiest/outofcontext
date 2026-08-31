import { describe, it, expect, afterEach, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createPrometheusMetrics } from '../server/metrics/prometheus';
import { metricsTokenConfig, createMetricsRoute } from '../server/metrics/route';

const TOKEN = 'a-token-long-enough-to-pass';

describe('metricsTokenConfig', () => {
  /** The endpoint rides the public app port, so an absent secret must mean no route, not no check. */
  it('returns null when METRICS_TOKEN is unset', () => {
    expect(metricsTokenConfig({})).toBeNull();
    expect(metricsTokenConfig({ METRICS_TOKEN: '' })).toBeNull();
  });

  /** A hand-typed short token on a public path is worth brute forcing, so refuse it at boot. */
  it('refuses a token too short to resist guessing, and says so', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(metricsTokenConfig({ METRICS_TOKEN: 'short' })).toBeNull();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('accepts a long enough token', () => {
    expect(metricsTokenConfig({ METRICS_TOKEN: TOKEN })).toBe(TOKEN);
  });
});

describe('the token-gated /metrics route', () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  });

  async function request(headers: Record<string, string> = {}) {
    const { registry, sink } = createPrometheusMetrics();
    sink.emoteSent({ emote: 'heart', game: 'story', country: 'DE', rocketcrab: false });

    const app = express();
    app.get('/metrics', createMetricsRoute(registry, TOKEN));
    // The SPA fallback in main.ts sits after the route; mirror it so a 404 here would be a real
    // ordering bug rather than an artifact of the test app being smaller than the real one.
    app.use((_req, res) => void res.status(404).send('spa'));

    server = app.listen(0);
    await new Promise<void>((resolve) => server!.once('listening', resolve));
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/metrics`, { headers });
    return { res, body: await res.text() };
  }

  it('serves the registry with a valid bearer token', async () => {
    const { res, body } = await request({ authorization: `Bearer ${TOKEN}` });
    expect(res.status).toBe(200);
    expect(body).toContain(
      'ooc_emotes_sent_total{emote="heart",game="story",country="DE",rocketcrab="false"} 1',
    );
  });

  /** A cached scrape serves stale counters, which makes rate() lie. Cloudflare fronts this port. */
  it('forbids caching the scrape', async () => {
    const { res } = await request({ authorization: `Bearer ${TOKEN}` });
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects a missing, malformed, or wrong token identically', async () => {
    for (const headers of [
      {},
      { authorization: TOKEN },
      { authorization: 'Basic ' + TOKEN },
      { authorization: 'Bearer wrong-but-exactly-same-len' },
      { authorization: 'Bearer ' + TOKEN + 'x' },
    ]) {
      const { res, body } = await request(headers);
      expect(res.status, JSON.stringify(headers)).toBe(401);
      expect(body).not.toContain('ooc_emotes_sent_total');
    }
  });

  it('advertises bearer auth on rejection', async () => {
    const { res } = await request();
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('accepts a lowercase bearer scheme', async () => {
    const { res } = await request({ authorization: `bearer ${TOKEN}` });
    expect(res.status).toBe(200);
  });
});
