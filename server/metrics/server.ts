import http from 'node:http';
import type { Registry } from 'prom-client';

/**
 * `/metrics` on its OWN listener, not the app's Express server. nginx and Cloudflare only front the
 * app port, so this is private by default with no auth code to get wrong - and it binds 127.0.0.1
 * unless METRICS_HOST says otherwise, so exposing it off-box stays a deliberate act. Unset
 * METRICS_PORT and no listener is created. See docs/metrics.md.
 *
 * Stays a bare listener on purpose: a real authenticator later goes in front of this port.
 */

const DEFAULT_HOST = '127.0.0.1';
const METRICS_PATH = '/metrics';

export interface MetricsServerOptions {
  registry: Registry;
  port: number;
  host?: string;
}

export function startMetricsServer({
  registry,
  port,
  host = DEFAULT_HOST,
}: MetricsServerOptions): http.Server {
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== METRICS_PATH) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found\n');
      return;
    }

    registry
      .metrics()
      .then((body) => {
        res.writeHead(200, { 'content-type': registry.contentType }).end(body);
      })
      .catch((err: unknown) => {
        // A scrape failing must never take the game process down with it.
        console.log(new Date(), '!- metrics scrape failed', err);
        res.writeHead(500, { 'content-type': 'text/plain' }).end('error\n');
      });
  });

  server.listen(port, host, () => {
    console.log(new Date(), `-- metrics on http://${host}:${port}${METRICS_PATH}`);
  });

  return server;
}

/**
 * Read METRICS_PORT / METRICS_HOST. A port that is absent, unparseable, or out of range all mean
 * "do not listen" rather than falling back to a guessed one.
 */
export function metricsServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): { port: number; host: string } | null {
  const raw = env.METRICS_PORT;
  if (!raw) return null;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.log(new Date(), `!- ignoring invalid METRICS_PORT ${JSON.stringify(raw)}`);
    return null;
  }
  return { port, host: env.METRICS_HOST || DEFAULT_HOST };
}
