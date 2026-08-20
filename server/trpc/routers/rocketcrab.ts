import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc.js';
import { rocketcrabSchema } from '../schemas.js';
import { createRocketcrab, gameExists } from '../../stats.js';

export const rocketcrabRouter = router({
  create: publicProcedure
    .input(rocketcrabSchema)
    .mutation(({ input }) => {
      if (input.version !== 1)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'UNSUPPORTED_VERSION',
        });
      if (!gameExists(input.game))
        throw new TRPCError({ code: 'NOT_FOUND', message: 'GAME_NOT_FOUND' });

      const code = createRocketcrab(input.game);
      return { code, version: 1 as const };
    }),
});
