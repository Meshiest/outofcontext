import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Registry } from 'prom-client';

/**
 * `/metrics` on the MAIN app port, behind a bearer token. For scrapers off this box; ./server.ts is
 * the private-listener alternative for an agent beside the app. See docs/metrics.md.
 *
 * Fails closed both ways: no METRICS_TOKEN means no route at all rather than an unguarded one, and
 * a token too short to resist guessing is refused rather than quietly accepted.
 */

/** Shorter than this on a public path is worth brute forcing. */
const MIN_TOKEN_LENGTH = 16;

/**
 * Compare via fixed-length digests. `timingSafeEqual` throws on a length mismatch, so feeding it
 * raw input would force a length check that leaks the token's length; hashing first makes every
 * comparison the same width regardless of what was sent.
 */
function tokenMatches(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Pull the credential out of `Authorization: Bearer <token>`. */
function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer (.+)$/i.exec(header.trim());
  return match?.[1];
}

/**
 * Read METRICS_TOKEN. Null means the route should not exist. A rejected token is logged, because the
 * failure is otherwise invisible - the endpoint would just 404 and look like a deploy problem.
 */
export function metricsTokenConfig(env: NodeJS.ProcessEnv = process.env): string | null {
  const token = env.METRICS_TOKEN;
  if (!token) return null;
  if (token.length < MIN_TOKEN_LENGTH) {
    console.log(
      new Date(),
      `!- ignoring METRICS_TOKEN: needs at least ${MIN_TOKEN_LENGTH} characters`,
    );
    return null;
  }
  return token;
}

export function createMetricsRoute(registry: Registry, token: string) {
  return (req: Request, res: Response): void => {
    const provided = bearerToken(req.headers.authorization);

    if (!provided || !tokenMatches(provided, token)) {
      // Same response for missing and wrong, so a probe cannot tell a bad token from no token.
      res
        .status(401)
        .set('www-authenticate', 'Bearer')
        .set('cache-control', 'no-store')
        .type('text/plain')
        .send('unauthorized\n');
      return;
    }

    registry
      .metrics()
      .then((body) => {
        // A scrape is a point-in-time reading; Cloudflare or any proxy caching it would serve
        // stale counters and make rate() lie.
        res
          .status(200)
          .set('content-type', registry.contentType)
          .set('cache-control', 'no-store')
          .send(body);
      })
      .catch((err: unknown) => {
        // A failed scrape must never take the game process down with it.
        console.log(new Date(), '!- metrics scrape failed', err);
        res.status(500).set('cache-control', 'no-store').type('text/plain').send('error\n');
      });
  };
}
