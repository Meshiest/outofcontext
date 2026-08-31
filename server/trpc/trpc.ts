import { initTRPC } from '@trpc/server';
import type { Context } from './context.js';
import { AppError, appError } from '../errors.js';
import { metrics } from '../../core/Metrics.js';

const t = initTRPC.context<Context>().create({
  // tRPC ships ping.enabled false, so without this an idle lobby sends nothing between events and
  // proxies drop the stream as dead. reconnectAfterInactivityMs is the client half: it re-opens a
  // stream that was silently black-holed (socket open, no data) instead of hanging until someone acts.
  sse: {
    ping: { enabled: true, intervalMs: 15_000 },
    client: { reconnectAfterInactivityMs: 45_000 },
  },
  // Surface the shared AppErrorCode (from a thrown AppError cause) as error.data.appCode.
  errorFormatter({ shape, error }) {
    const appCode = error.cause instanceof AppError ? error.cause.appCode : null;
    return {
      ...shape,
      data: {
        ...shape.data,
        appCode,
      },
    };
  },
});

export const router = t.router;

/**
 * Counts every call and its outcome. Applied to the base procedure so BOTH publicProcedure and
 * adminProcedure are covered, including calls adminProcedure rejects before the resolver runs -
 * a spike in NOT_ADMIN is exactly the kind of thing worth seeing.
 *
 * `path` is a procedure name from the router, a closed set, so it is safe as a Prometheus label.
 */
const withMetrics = t.middleware(async ({ path, type, next }) => {
  const started = Date.now();
  const result = await next();

  metrics.trpcRequest({
    procedure: path,
    outcome: result.ok ? 'ok' : 'error',
    type,
    durationMs: Date.now() - started,
  });

  if (!result.ok) {
    const cause = result.error.cause;
    metrics.appError({ code: cause instanceof AppError ? cause.appCode : 'UNKNOWN' });
  }

  return result;
});

export const publicProcedure = t.procedure.use(withMetrics);

// Admin-gated procedure: verifies the caller is the lobby admin before the resolver runs, and
// narrows ctx.lobby to non-null.
export const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  const lobby = ctx.member.lobby;
  if (!lobby) throw appError('LOBBY_NOT_FOUND');
  if (lobby.admin !== ctx.member.id) throw appError('NOT_ADMIN');
  return next({ ctx: { ...ctx, lobby } });
});
