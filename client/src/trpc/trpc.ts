import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/trpc/router';

// The single typed client. `AppRouter` is the live server contract type (type-only import, so no
// server runtime is bundled), giving end-to-end inference for every query/mutation/subscription.
export const trpc = createTRPCReact<AppRouter>();
