import { router, publicProcedure, adminProcedure } from '../trpc.js';
import { appError } from '../../errors.js';
import { Lobby } from '../../../core/Lobby.js';
import type { ServerEvent } from '../../../core/Member.js';
import * as Persistence from '../../../core/Persistence.js';
import { VERSION } from '../../version.js';
import { LOBBY_EVENTS } from '../events.js';
import {
  emoteSchema,
  gameIdSchema,
  configPatchSchema,
  codeSchema,
  playerIdSchema,
} from '../schemas.js';

export const lobbyRouter = router({
  exists: publicProcedure
    .input(codeSchema)
    .query(({ input }) => Lobby.lobbyExists(input.toLowerCase())),

  create: publicProcedure.mutation(({ ctx }) => {
    const member = ctx.member;
    if (member.lobby) return { code: member.lobby.code };

    member.interact();
    const lobby = new Lobby();
    const code = lobby.code;
    member.lobby = lobby;
    Lobby.lobbies[code] = lobby;
    member.send('lobby:join', code);
    lobby.addMember(member);
    console.log(new Date(), `-- [lobby ${code}] created`);
    return { code };
  }),

  join: publicProcedure.input(codeSchema).mutation(({ ctx, input }) => {
    const member = ctx.member;
    const code = input.toLowerCase();

    if (member.lobby) return { code: member.lobby.code };
    if (!Lobby.lobbyExists(code)) throw appError('LOBBY_NOT_FOUND');

    // load a persisted lobby into memory if needed
    if (!Lobby.lobbies[code]) {
      console.log(new Date(), `-- [lobby ${code}] restored`);
      const saveData = Persistence.restoreLobbyState(code);
      Lobby.lobbies[code] = new Lobby(saveData);
    }

    member.interact();
    member.lobby = Lobby.lobbies[code];
    member.send('lobby:join', code);
    Lobby.lobbies[code].addMember(member);
    return { code };
  }),

  leave: publicProcedure.mutation(({ ctx }) => {
    ctx.member.name = '';
    Lobby.removePlayer(ctx.member);
  }),

  spectate: publicProcedure.mutation(({ ctx }) => {
    if (!ctx.member.lobby) throw appError('LOBBY_NOT_FOUND');
    ctx.member.lobby.toggleSpectate(ctx.member);
  }),

  replace: publicProcedure.input(playerIdSchema).mutation(({ ctx, input }) => {
    if (!ctx.member.lobby) throw appError('LOBBY_NOT_FOUND');
    ctx.member.interact();
    ctx.member.lobby.replacePlayer(ctx.member, input);
  }),

  emote: publicProcedure.input(emoteSchema).mutation(({ ctx, input }) => {
    const member = ctx.member;
    if (!member.lobby) throw appError('LOBBY_NOT_FOUND');
    const now = Date.now();
    if (now - member.lastEmote < 400) throw appError('RATE_LIMITED');
    member.activity = now;
    member.lastEmote = now;
    member.lobby.emitAll('lobby:emote', member.id, input);
  }),

  setGame: adminProcedure.input(gameIdSchema).mutation(({ ctx, input }) => {
    ctx.lobby.setGame(input);
  }),

  setConfig: adminProcedure
    .input(configPatchSchema)
    .mutation(({ ctx, input }) => {
      ctx.member.interact();
      ctx.lobby.attempt(() => ctx.lobby.setConfig(input.name, input.value));
    }),

  // Despite the name, this makes the target player a spectator.
  toggleAdmin: adminProcedure
    .input(playerIdSchema)
    .mutation(({ ctx, input }) => {
      if (input === ctx.member.id) return;
      const target = ctx.lobby.players.find((p) => p.id === input);
      if (target && target.member) ctx.lobby.toggleSpectate(target.member);
    }),

  grantAdmin: adminProcedure
    .input(playerIdSchema)
    .mutation(({ ctx, input }) => {
      if (input === ctx.member.id) return;
      ctx.member.interact();
      const target = ctx.lobby.players.find((p) => p.id === input);
      if (target && target.member) {
        ctx.lobby.admin = String(target.id);
        ctx.lobby.sendLobbyInfo();
      }
    }),

  // Server->client push for this lobby over SSE. On stream end the member is NOT torn down here: the
  // refcount + grace-period reap in Member.subscribe handles it, so a transient EventSource reconnect
  // resumes the same member (this handshake re-runs, re-sending lobby:join/lobby:info) with its seat
  // intact, and only a truly-gone member is reaped (via the registered reaper) after the grace window.
  onInfo: publicProcedure.subscription(async function* (opts) {
    const member = opts.ctx.member;

    // handshake
    yield { event: 'member:id', args: [member.id] } satisfies ServerEvent;
    yield { event: 'version', args: [VERSION] } satisfies ServerEvent;
    if (member.lobby) {
      yield {
        event: 'lobby:join',
        args: [member.lobby.code],
      } satisfies ServerEvent;
      yield {
        event: 'lobby:info',
        args: [member.lobby.genLobbyInfo()],
      } satisfies ServerEvent;
      // Replay the accepted name so a reload auto-rejoins. The client keys its state machine on
      // `nameOk`, which is otherwise only pushed as a reply to member.setName - so without this a
      // refresh (or any stream restart) dropped a member who still holds their seat back onto the
      // name-entry screen. Identity is the persisted member id, so names never need to be unique.
      if (member.name) {
        yield { event: 'member:nameOk', args: [true] } satisfies ServerEvent;
      }
    }

    for await (const ev of member.subscribe(opts.signal)) {
      if (LOBBY_EVENTS.has(ev.event)) yield ev;
    }
  }),
});
