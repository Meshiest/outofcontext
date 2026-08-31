import { router, publicProcedure, adminProcedure } from '../trpc.js';
import { appError } from '../../errors.js';
import { gameMessageSchema } from '../schemas.js';
import { isGameEvent } from '../events.js';
import type { ServerEvent } from '../../../core/Member.js';

export const gameRouter = router({
  start: adminProcedure.mutation(({ ctx }) => {
    ctx.member.interact();
    ctx.lobby.startGame();
    if (ctx.lobby.game)
      console.log(
        new Date(),
        `-- [lobby ${ctx.lobby.code}] started game ${ctx.lobby.selectedGame}`,
      );
  }),

  end: adminProcedure.mutation(({ ctx }) => {
    ctx.member.interact();
    console.log(
      new Date(),
      `-- [lobby ${ctx.lobby.code}] ended game ${ctx.lobby.selectedGame}`,
    );
    ctx.lobby.endGame('ended');
  }),

  message: publicProcedure
    .input(gameMessageSchema)
    .mutation(({ ctx, input }) => {
      const member = ctx.member;
      if (!member.lobby) throw appError('LOBBY_NOT_FOUND');
      member.interact();
      const lobby = member.lobby;
      lobby.attempt(() => lobby.gameMessage(member.id, input.type, input.data));
    }),

  // Server->client game state push over SSE (game:info + game:player:info + {game}:result).
  onState: publicProcedure.subscription(async function* (opts) {
    const member = opts.ctx.member;
    const lobby = member.lobby;

    // handshake: current game + this player's state
    if (lobby && lobby.game) {
      yield {
        event: 'game:info',
        args: [lobby.game.getState()],
      } satisfies ServerEvent;
      const player = lobby.players.find((p) => p.id === member.id);
      if (player) {
        yield {
          event: 'game:player:info',
          args: [lobby.game.getPlayerState(player.playerId)],
        } satisfies ServerEvent;
      }
    }

    for await (const ev of member.subscribe(opts.signal)) {
      if (isGameEvent(ev.event)) yield ev;
    }
  }),
});
