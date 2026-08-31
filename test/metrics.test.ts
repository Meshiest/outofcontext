import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  metrics,
  parseCountry,
  parseGameId,
  parsePlayerState,
  setMetricsSink,
  NOOP_METRICS,
  type MetricsSink,
} from '../core/Metrics';
import { appRouter } from '../server/trpc/router';
import { Member } from '../core/Member';
import { Lobby } from '../core/Lobby';
import { createContext } from '../server/trpc/context';
import type { Story } from '../core/games/story';

function recordingSink() {
  return {
    sessionStarted: vi.fn(),
    gameStarted: vi.fn(),
    gameEnded: vi.fn(),
    playerStateEnded: vi.fn(),
    emoteSent: vi.fn(),
    reactionAdded: vi.fn(),
    emoteRateLimited: vi.fn(),
    trpcRequest: vi.fn(),
    appError: vi.fn(),
  } satisfies MetricsSink;
}

describe('parseCountry', () => {
  it('accepts a two-letter code and normalizes case', () => {
    expect(parseCountry('DE')).toBe('DE');
    expect(parseCountry('fr')).toBe('FR');
  });

  /**
   * Cloudflare sends these in the same header as real countries. Recording them would invent a
   * country called "XX" and quietly lump every unresolved visitor into it.
   */
  it('rejects the sentinels Cloudflare sends when there is no country', () => {
    expect(parseCountry('XX')).toBeUndefined();
    expect(parseCountry('T1')).toBeUndefined();
  });

  it('rejects absent or malformed values', () => {
    expect(parseCountry(undefined)).toBeUndefined();
    expect(parseCountry('')).toBeUndefined();
    expect(parseCountry('USA')).toBeUndefined();
    expect(parseCountry('1')).toBeUndefined();
  });

  it('takes the first value when the header repeats', () => {
    expect(parseCountry(['ES', 'FR'])).toBe('ES');
  });
});

describe('parseGameId', () => {
  it('accepts real game ids', () => {
    expect(parseGameId('story')).toBe('story');
    expect(parseGameId('assassin')).toBe('assassin');
  });

  /** Lobby.selectedGame is '' until a game is picked, so this guards the pre-selection state. */
  it('rejects the empty and unknown ids', () => {
    expect(parseGameId('')).toBeUndefined();
    expect(parseGameId('nope')).toBeUndefined();
  });
});

describe('the metrics sink', () => {
  afterEach(() => setMetricsSink(null));

  it('discards everything by default', () => {
    expect(() => metrics.emoteSent({ emote: 'heart' })).not.toThrow();
    expect(setMetricsSink(null)).toBe(NOOP_METRICS);
  });

  /**
   * `metrics` forwards on every call instead of capturing the sink at import time. If it captured,
   * a sink installed after a call site's module loaded would silently never receive anything.
   */
  it('forwards to a sink installed after import, and stops when it is removed', () => {
    const sink = recordingSink();
    setMetricsSink(sink);
    metrics.emoteSent({ emote: 'heart', country: 'DE' });
    expect(sink.emoteSent).toHaveBeenCalledWith({ emote: 'heart', country: 'DE' });

    setMetricsSink(null);
    metrics.emoteSent({ emote: 'laugh' });
    expect(sink.emoteSent).toHaveBeenCalledTimes(1);
  });
});

describe('metrics wiring', () => {
  let sink: ReturnType<typeof recordingSink>;

  beforeEach(() => {
    sink = recordingSink();
    setMetricsSink(sink);
  });
  afterEach(() => setMetricsSink(null));

  async function startedLobby(playerCount: number) {
    const members = Array.from({ length: playerCount }, () => new Member());
    const callers = members.map((m) => appRouter.createCaller({ member: m }));
    const { code } = await callers[0].lobby.create();
    await callers[0].member.setName('p0');
    for (let i = 1; i < members.length; i++) {
      await callers[i].lobby.join(code);
      await callers[i].member.setName(`p${i}`);
    }
    await callers[0].lobby.setGame('story');
    return { members, callers, code };
  }

  /** The server sees a start once, so it reports it once - not once per player in the lobby. */
  it('reports one gameStarted per start, not one per player', async () => {
    const { members, callers } = await startedLobby(3);
    members[0].country = 'DE';
    members[1].country = 'FR';
    // members[2] has no resolvable country and must simply be absent from `countries`.

    await callers[0].game.start();

    expect(sink.gameStarted).toHaveBeenCalledTimes(1);
    const event = sink.gameStarted.mock.calls[0][0];
    expect(event.game).toBe('story');
    expect(event.players).toBe(3);
    // Admin country is singular, so a counter labelled with it still sums to a game count.
    expect(event.country).toBe('DE');
    expect(event.participants.sort()).toEqual(['DE', 'FR']);
  });

  /** Pins the raw-vs-resolved split that GameConfigSettings describes. */
  it('reports the settings a game was started with, split by choices and numbers', async () => {
    const { callers } = await startedLobby(3);
    // An int field takes a NUMBER; setConfig drops a numeric string for anything but #numPlayers.
    await callers[0].lobby.setConfig({ name: 'numLinks', value: 4 });
    await callers[0].lobby.setConfig({ name: 'anonymous', value: 'true' });
    await callers[0].lobby.setConfig({ name: 'contextLen', value: 'three' });

    await callers[0].game.start();

    const { config } = sink.gameStarted.mock.calls[0][0];
    expect(config.choices).toContainEqual({ setting: 'anonymous', value: 'true' });
    expect(config.choices).toContainEqual({ setting: 'contextLen', value: 'three' });
    expect(config.numbers).toContainEqual({ setting: 'numLinks', value: 4 });
    // numStories defaults to '#numPlayers'; the resolved count is reported, not the sentinel.
    expect(config.numbers).toContainEqual({ setting: 'numStories', value: 3 });
    // players is skipped - ooc_game_players already reports exactly this number.
    expect(config.numbers.map((n) => n.setting)).not.toContain('players');
    expect(config.choices.map((c) => c.setting)).not.toContain('players');
  });

  it('reports the end reason and duration, exactly once per game', async () => {
    const { members, callers, code } = await startedLobby(3);
    members[0].country = 'DE';
    await callers[0].game.start();

    await callers[0].game.end();

    expect(sink.gameEnded).toHaveBeenCalledTimes(1);
    const event = sink.gameEnded.mock.calls[0][0];
    expect(event).toMatchObject({ game: 'story', reason: 'ended', country: 'DE' });
    expect(event.durationMs).toBeGreaterThanOrEqual(0);

    // Culling the lobby afterwards must NOT report a second, "abandoned" end for the same game.
    Lobby.cull(code);
    expect(sink.gameEnded).toHaveBeenCalledTimes(1);
  });

  it('reports a game abandoned when its lobby is culled mid-game', async () => {
    const { callers, code } = await startedLobby(3);
    await callers[0].game.start();

    Lobby.cull(code);

    expect(sink.gameEnded).toHaveBeenCalledTimes(1);
    expect(sink.gameEnded.mock.calls[0][0]).toMatchObject({
      game: 'story',
      reason: 'abandoned',
    });
  });

  it('counts a rate-limited emote separately from a sent one', async () => {
    const { members, callers } = await startedLobby(2);
    members[0].lastEmote = 0;

    await callers[0].lobby.emote('heart');
    await expect(callers[0].lobby.emote('meh')).rejects.toThrow();

    expect(sink.emoteSent).toHaveBeenCalledTimes(1);
    expect(sink.emoteRateLimited).toHaveBeenCalledTimes(1);
  });

  /**
   * A lobby has no selected game until someone picks one, and emotes work in that state. The event
   * must still carry the field so the Prometheus sink can label it rather than dropping the sample.
   */
  it('leaves game undefined for an emote sent before a game is picked', async () => {
    const members = [new Member(), new Member()];
    const callers = members.map((m) => appRouter.createCaller({ member: m }));
    const { code } = await callers[0].lobby.create();
    await callers[0].member.setName('p0');
    await callers[1].lobby.join(code);
    await callers[1].member.setName('p1');
    members[0].lastEmote = 0;

    await callers[0].lobby.emote('heart');

    expect(sink.emoteSent).toHaveBeenCalledWith({
      emote: 'heart',
      game: undefined,
      country: undefined,
      rocketcrab: false,
    });
  });

  /**
   * A session is "first contact from a member id". The client mints that id per tab for functional
   * reasons, so this needs no cookie, no IP and no hash - but it must not double count a client
   * that keeps talking, which is the whole risk of counting it in a per-request context.
   */
  it('counts a member id once, however many requests it makes', async () => {
    const member = new Member();
    const caller = appRouter.createCaller({ member });

    await caller.server.info();
    await caller.server.version();
    expect(sink.sessionStarted).not.toHaveBeenCalled();

    // createCaller bypasses createContext, so drive the real path the way a browser does.
    const ctx = createContext({
      req: { headers: { 'x-ooc-member-id': 'fresh-session-id', 'cf-ipcountry': 'DE' }, query: {} },
    } as never);
    expect(sink.sessionStarted).toHaveBeenCalledExactlyOnceWith({ country: 'DE' });

    // Same id again - a reconnect or any later request - must not count a second session.
    createContext({
      req: { headers: { 'x-ooc-member-id': 'fresh-session-id' }, query: {} },
    } as never);
    expect(sink.sessionStarted).toHaveBeenCalledTimes(1);
    expect(ctx.member.id).toBe('fresh-session-id');
  });

  /** A bare probe of /trpc mints a Member too; counting it would inflate visits with scanners. */
  it('does not count a request that sent no member id', async () => {
    createContext({ req: { headers: {}, query: {} } } as never);
    expect(sink.sessionStarted).not.toHaveBeenCalled();
  });

  /** The middleware sits on the base procedure, so admin rejections are counted too. */
  it('counts every tRPC call and surfaces the AppErrorCode of a failure', async () => {
    const { callers } = await startedLobby(2);
    sink.trpcRequest.mockClear();

    await callers[0].server.info();
    expect(sink.trpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({ procedure: 'server.info', outcome: 'ok', type: 'query' }),
    );

    // callers[1] is not the admin, so this is rejected before the resolver runs.
    await expect(callers[1].game.start()).rejects.toThrow();
    expect(sink.trpcRequest).toHaveBeenCalledWith(
      expect.objectContaining({ procedure: 'game.start', outcome: 'error' }),
    );
    expect(sink.appError).toHaveBeenCalledWith({ code: 'NOT_ADMIN' });
  });

  it('labels an emote with the sender country and counts only emotes that pass the rate gate', async () => {
    const { members, callers } = await startedLobby(2);
    members[0].country = 'ES';
    // A fresh Member starts with lastEmote = now, so its first emote falls inside the 400ms gate.
    members[0].lastEmote = 0;

    await callers[0].lobby.emote('heart');
    expect(sink.emoteSent).toHaveBeenCalledWith({
      emote: 'heart',
      game: 'story',
      country: 'ES',
      rocketcrab: false,
    });

    // Second emote inside the 400ms window is rejected, so it must not be counted. It must be a
    // REAL emote name, or zod rejects it at input validation and the rate gate never runs.
    await expect(callers[0].lobby.emote('meh')).rejects.toThrow();
    expect(sink.emoteSent).toHaveBeenCalledTimes(1);
  });

  /**
   * The first state a player is seen in only SEEDS the tracker - there is no earlier instant to
   * measure from - so a start alone records nothing. A real turn has to be played.
   */
  it('records state durations across a played turn', async () => {
    const { members, callers, code } = await startedLobby(3);
    // Every seat, not just one: which player is dealt a chain first is not fixed, so labelling a
    // single member would make the country assertion below depend on the deal.
    for (const m of members) m.country = 'DE';
    await callers[0].game.start();

    expect(sink.playerStateEnded, 'a start alone is only a seed').not.toHaveBeenCalled();

    const lobby = Lobby.lobbies[code];
    const game = lobby.game as Story;
    for (const chain of game.chains.filter((c) => c.editor)) {
      const seat = lobby.players.findIndex((p) => p.playerId === chain.editor);
      await callers[seat].game.message({ type: 'story:line', data: 'a line' });
    }

    const calls = sink.playerStateEnded.mock.calls.map((c) => c[0]);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.game).toBe('story');
      expect(call.durationMs).toBeGreaterThanOrEqual(0);
    }
    // The state reported is the one that ENDED, so submitting a line closes an editing stretch.
    expect(calls.some((c) => c.state === 'editing')).toBe(true);
    // Countries come from the seated member, so at least one event carries the one we set.
    expect(calls.some((c) => c.country === 'DE')).toBe(true);
  });

  /**
   * Reactions are only meaningful once every chain is finished, and only an ADD counts - a toggle
   * off is not a reaction being used. Both rules live in the shared reactToChain, so every chain
   * game inherits them.
   */
  it('counts a reaction added to a finished chain, but not one toggled off', async () => {
    const { callers, code } = await startedLobby(3);
    await callers[0].game.start();

    const lobby = Lobby.lobbies[code];
    const game = lobby.game as Story;

    // Reactions before the game finishes are ignored outright.
    await callers[0].game.message({
      type: 'chain:react',
      data: { index: 0, reaction: 'heart' },
    });
    expect(sink.reactionAdded).not.toHaveBeenCalled();

    // Play the game out so the chains are on screen.
    for (let round = 0; round < 40 && game.getGameProgress() < 1; round++) {
      for (const chain of game.chains.filter((c) => c.editor)) {
        const seat = lobby.players.findIndex((p) => p.playerId === chain.editor);
        await callers[seat].game.message({ type: 'story:line', data: 'a line' });
      }
    }
    expect(game.getGameProgress()).toBe(1);

    await callers[0].game.message({
      type: 'chain:react',
      data: { index: 0, reaction: 'heart' },
    });
    expect(sink.reactionAdded).toHaveBeenCalledExactlyOnceWith({
      reaction: 'heart',
      game: 'story',
      rocketcrab: false,
    });

    // Same player, same reaction again: that is a toggle OFF, not a new reaction.
    await callers[0].game.message({
      type: 'chain:react',
      data: { index: 0, reaction: 'heart' },
    });
    expect(sink.reactionAdded).toHaveBeenCalledTimes(1);
  });

  /** States come from getPlayerState(), a plain string, so an odd one must not mint a new label. */
  it('buckets an unrecognised player state as "other"', () => {
    expect(parsePlayerState('EDITING')).toBe('editing');
    expect(parsePlayerState('reading')).toBe('reading');
    expect(parsePlayerState('DONE')).toBe('done');
    expect(parsePlayerState('')).toBe('other');
    expect(parsePlayerState('SOME_NEW_STATE')).toBe('other');
  });
});
