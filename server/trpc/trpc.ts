import { initTRPC } from '@trpc/server';
import type { Context } from './context.js';
import { AppError, appError } from '../errors.js';

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
export const publicProcedure = t.procedure;

// Admin-gated procedure: verifies the caller is the lobby admin before the resolver runs, and
// narrows ctx.lobby to non-null.
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const lobby = ctx.member.lobby;
  if (!lobby) throw appError('LOBBY_NOT_FOUND');
  if (lobby.admin !== ctx.member.id) throw appError('NOT_ADMIN');
  return next({ ctx: { ...ctx, lobby } });
});
