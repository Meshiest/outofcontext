import { router, publicProcedure } from '../trpc.js';
import { appError } from '../../errors.js';
import { nameSchema } from '../schemas.js';
import * as Sanitize from '../../../core/games/util/Sanitize.js';

export const memberRouter = router({
  // Validates 1-15 chars; result is a boolean (not prose), and is also pushed as 'member:nameOk'
  // over the lobby subscription.
  setName: publicProcedure.input(nameSchema).mutation(({ ctx, input }) => {
    const member = ctx.member;
    if (!member.lobby) throw appError('LOBBY_NOT_FOUND');

    member.interact();
    const name = Sanitize.str(input);

    if (name.length > 0 && name.length < 16) {
      member.name = name;
      member.send('member:nameOk', true);
      member.lobby.updateMembers();
      member.lobby.sendLobbyInfo();
      return { ok: true };
    }

    member.send('member:nameOk', false);
    return { ok: false };
  }),
});
