import { router } from './trpc.js';
import { lobbyRouter } from './routers/lobby.js';
import { memberRouter } from './routers/member.js';
import { gameRouter } from './routers/game.js';
import { serverRouter } from './routers/serverInfo.js';
import { rocketcrabRouter } from './routers/rocketcrab.js';

// The single typed contract. The client imports `AppRouter` to infer the whole client API.
export const appRouter = router({
  lobby: lobbyRouter,
  member: memberRouter,
  game: gameRouter,
  server: serverRouter,
  rocketcrab: rocketcrabRouter,
});

export type AppRouter = typeof appRouter;
