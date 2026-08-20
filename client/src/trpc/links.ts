import { httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import type { TRPCLink } from '@trpc/client';
import type { AppRouter } from '@server/trpc/router';
import { getMemberId } from './memberId';

// Base path the Express tRPC middleware is mounted at (main.ts), proxied to :8080 in dev.
const TRPC_URL = '/trpc';

/**
 * Link chain for the tRPC client. `splitLink` routes `.subscription` operations to the SSE link
 * (`httpSubscriptionLink`, an EventSource) and everything else (queries/mutations) to the batched
 * HTTP link.
 *
 * Member identity is attached differently per transport because EventSource cannot set headers:
 * - HTTP: `x-ooc-member-id` request header.
 * - SSE:  `?memberId=` query param. tRPC's `getUrl()` preserves a query string already present on
 *   the base url and appends `/<path>` before it, so `"/trpc?memberId=X"` becomes
 *   `"/trpc/lobby.onInfo?memberId=X"` - exactly what server/trpc/context.ts reads.
 */
export function createLinks(): TRPCLink<AppRouter>[] {
  return [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: () => `${TRPC_URL}?memberId=${encodeURIComponent(getMemberId())}`,
      }),
      false: httpBatchLink({
        url: TRPC_URL,
        headers: () => ({ 'x-ooc-member-id': getMemberId() }),
      }),
    }),
  ];
}
