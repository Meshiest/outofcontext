import express from 'express';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import _ from 'lodash';
import cron from 'node-cron';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

import { appRouter } from './server/trpc/router.js';
import { createContext } from './server/trpc/context.js';
import { Member } from './core/Member.js';
import { Lobby } from './core/Lobby.js';
import * as Persistence from './core/Persistence.js';
import * as Drawings from './core/Drawings.js';
import { setMetricsSink } from './core/Metrics.js';
import { createPrometheusMetrics } from './server/metrics/prometheus.js';
import { metricsServerConfig, startMetricsServer } from './server/metrics/server.js';
import { metricsTokenConfig, createMetricsRoute } from './server/metrics/route.js';
import { VERSION } from './server/version.js';
import { DRAWING_MAX_BYTES, parseImageSize } from './shared/drawing.js';
import { createRocketcrab, gameExists } from './server/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Report the format actually stored: a client without WebP encode support uploads PNG instead. */
function sniffImageMime(bytes: Buffer): string {
  return parseImageSize(bytes)?.format === 'png' ? 'image/png' : 'image/webp';
}

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 8080;

// When a member's last SSE stream stays closed past the grace window, reap it: remove it from its
// lobby and the registry. Registered here (not inside core/Member.ts) so Member need not import Lobby
// at runtime.
Member.setReaper(member => {
  Lobby.removePlayer(member);
  Member.removePlayer(member);
});

// The JS bundle alone is 504 KB (155 KB gzipped). Registered FIRST so it wraps the static assets
// and the tRPC routes below.
//
// Note what this does NOT cover: tRPC sets `cache-control: no-transform` on its SSE responses, and
// compression honours that, so subscription traffic is never compressed no matter the threshold.
// That is the correct behaviour (a compressor sitting on a long-lived push stream is a latency
// trap), but it means SSE payload size can only be fixed by sending less - which is why drawings
// travel as blob ids over SSE and their bytes over plain GETs, not inline.
app.use(compression());

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));
// Drawings post as raw bytes to /api/v1/drawing below rather than inside JSON, so nothing on this
// path is large.
app.use(bodyParser.json({ strict: true, limit: '256kb' }));

// Typed contract: tRPC mutations/queries over HTTP + subscriptions over SSE.
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Liveness probe for the container healthcheck and the e2e webServer wait. Deliberately reports
// nothing but "the process is answering" - it is unauthenticated and public, so it must never grow
// into a stats endpoint.
app.get('/api/v1/ok', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// REST compatibility shim: RocketCrab's external caller uses POST /api/v1/rocketcrab. Shares its
// logic with the tRPC procedure.
app.get('/api/v1/lobby/:code', (req: Request, res: Response) => {
  const code = req.params.code.toLowerCase();
  if (Lobby.lobbyExists(code)) {
    res.status(200).json({ message: 'Lobby Exists' });
  } else {
    res.status(404).json({ message: 'Lobby Does Not Exist' });
  }
});

// Drawing blobs. Bytes travel here rather than inside game messages: a drawing is uploaded once,
// and every other player fetches it by id over a cacheable GET instead of receiving a copy inlined
// into the realtime stream (see core/Drawings.ts).
app.post(
  '/api/v1/drawing',
  // Raw bytes, not base64 in JSON - that alone is a third of the upload. The limit is a cheap first
  // gate; isValidDrawingBytes re-checks the real cap along with the format and resolution.
  express.raw({
    type: ['image/webp', 'image/png'],
    limit: DRAWING_MAX_BYTES,
  }),
  (req: Request, res: Response) => {
    // Only someone actually in a lobby may upload, so this is not an open write endpoint.
    const memberId = req.headers['x-ooc-member-id'];
    const member =
      typeof memberId === 'string' ? Member.byId(memberId) : undefined;
    if (!member?.lobby) {
      return res.status(403).json({ message: 'Not in a lobby' });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: 'Expected image bytes' });
    }
    const id = Drawings.store(req.body);
    if (!id) {
      return res.status(422).json({ message: 'Not an acceptable drawing' });
    }
    member.interact();
    return res.json({ id });
  },
);

app.get('/api/v1/drawing/:id', (req: Request, res: Response) => {
  const bytes = Drawings.load(req.params.id);
  if (!bytes) return res.status(404).end();
  // Content-addressed, so the bytes behind an id can never change: cache hard. This is what keeps
  // a results screen full of drawings from re-downloading anything.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', sniffImageMime(bytes));
  return res.end(bytes);
});

app.post('/api/v1/rocketcrab', (req: Request, res: Response) => {
  const { game, version } = req.body as { game?: string; version?: number };
  if (version !== 1)
    return res.status(426).json({ message: 'Unsupported version' });
  if (typeof game !== 'string' || !gameExists(game))
    return res.status(404).json({ message: 'Game not found' });

  const code = createRocketcrab(game);
  return res.json({ code, version: 1 });
});

// Save all current lobbies on shutdown.
function exitHandler(
  options: { cleanup?: boolean; exit?: boolean },
  exitCode?: number,
): void {
  _.each(Lobby.lobbies, lobby => {
    if (lobby._saved) return;
    lobby._saved = true;
    Persistence.saveLobbyState(lobby);

    if (lobby.game) {
      lobby.game.stop();
      lobby.game.cleanup();
    }
  });

  if (options.cleanup) console.log('clean exit');
  if (exitCode || exitCode === 0) console.log('exit code', exitCode);
  if (options.exit) process.exit();
}

process.on('exit', () => exitHandler({ cleanup: true }));
process.on('SIGINT', () => exitHandler({ exit: true }));
process.on('SIGTERM', () => exitHandler({ exit: true }));
process.on('SIGUSR1', () => exitHandler({ exit: true }));
process.on('SIGUSR2', () => exitHandler({ exit: true }));
process.on('uncaughtException', () => exitHandler({ exit: true }));

// Metrics are opt-in: with neither env var set there is no endpoint and the sink stays the no-op.
// See docs/metrics.md. Mounted here, ahead of the SPA fallback, or the fallback swallows the path.
const metricsListener = metricsServerConfig();
const metricsToken = metricsTokenConfig();
if (metricsListener || metricsToken) {
  const { sink, registry } = createPrometheusMetrics();
  setMetricsSink(sink);
  if (metricsListener) startMetricsServer({ registry, ...metricsListener });
  if (metricsToken) app.get('/metrics', createMetricsRoute(registry, metricsToken));
}

// Cull expired saves on startup, then weekly.
Persistence.cullSaves();
Drawings.cullDrawings();
cron.schedule('0 0 4 * * Monday', () => {
  Persistence.cullSaves();
  Drawings.cullDrawings();
});

// Cull empty lobbies and inactive members every minute.
cron.schedule('0 * * * * *', () => Lobby.cullEmpty());
cron.schedule('0 * * * * *', () => Member.cullInactive());

// SPA fallback: the client router handles unknown paths.
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(PORT, () =>
  console.log(`Started ${VERSION} server on :${PORT}!`),
);
