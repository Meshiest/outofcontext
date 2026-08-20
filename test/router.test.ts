import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/trpc/router';
import { Member } from '../core/Member';
import { AppError } from '../server/errors';

function caller(member: Member) {
  return appRouter.createCaller({ member });
}

// Extract the AppErrorCode from a thrown TRPCError (its cause is our AppError).
async function appCodeOf(fn: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await fn();
    return undefined;
  } catch (e) {
    const cause = (e as { cause?: unknown }).cause;
    return cause instanceof AppError ? cause.appCode : undefined;
  }
}

// Open an onInfo stream and collect the first `count` events, then stop. Breaking out of the
// for-await returns the generator, which runs its cleanup (closing the member's stream).
async function handshake(
  member: Member,
  count: number,
): Promise<{ event: string; args: unknown[] }[]> {
  const events: { event: string; args: unknown[] }[] = [];
  for await (const ev of await caller(member).lobby.onInfo()) {
    events.push(ev as { event: string; args: unknown[] });
    if (events.length >= count) break;
  }
  return events;
}

describe('tRPC router', () => {
  it('create -> exists -> join happy path', async () => {
    const a = new Member();
    const ca = caller(a);
    const { code } = await ca.lobby.create();
    expect(await ca.lobby.exists(code)).toBe(true);

    const b = new Member();
    const joined = await caller(b).lobby.join(code);
    expect(joined.code).toBe(code);
  });

  it('join on a missing lobby throws LOBBY_NOT_FOUND', async () => {
    expect(await appCodeOf(() => caller(new Member()).lobby.join('zzzz'))).toBe(
      'LOBBY_NOT_FOUND',
    );
  });

  it('setName returns ok true for a valid name and false for empty', async () => {
    const a = new Member();
    const ca = caller(a);
    await ca.lobby.create();
    expect(await ca.member.setName('Ada')).toEqual({ ok: true });
    expect(await ca.member.setName('   ')).toEqual({ ok: false });
  });

  it('admin mutations reject non-admins and allow the admin (auth-bypass fix)', async () => {
    const a = new Member();
    const ca = caller(a);
    const { code } = await ca.lobby.create();
    await ca.member.setName('Ada'); // a becomes the admin

    const b = new Member();
    const cb = caller(b);
    await cb.lobby.join(code);
    await cb.member.setName('Bo'); // b is a player, NOT admin

    // A non-admin caller cannot drive any admin-gated mutation.
    expect(await appCodeOf(() => cb.lobby.setGame('story'))).toBe('NOT_ADMIN');
    expect(await appCodeOf(() => cb.game.start())).toBe('NOT_ADMIN');
    expect(await appCodeOf(() => cb.game.end())).toBe('NOT_ADMIN');
    expect(await appCodeOf(() => cb.lobby.grantAdmin(a.id))).toBe('NOT_ADMIN');
    expect(
      await appCodeOf(() => cb.lobby.setConfig({ name: 'numLinks', value: 5 })),
    ).toBe('NOT_ADMIN');

    // The admin succeeds.
    await ca.lobby.setGame('story');
    expect(a.lobby?.selectedGame).toBe('story');
  });

  it('emote enforces the 400ms server-side rate limit', async () => {
    const a = new Member();
    const ca = caller(a);
    await ca.lobby.create();
    await ca.member.setName('Ada');
    a.lastEmote = 0; // allow the first emote
    await ca.lobby.emote('smile');
    expect(await appCodeOf(() => ca.lobby.emote('meh'))).toBe('RATE_LIMITED');
  });

  // A page reload opens a NEW onInfo stream for the SAME persisted member id, so whatever the client
  // needs to restore its state must be replayed by the handshake - not only pushed at the moment it
  // first changed.
  it('replays lobby membership AND the accepted name on a reconnect (refresh auto-rejoins)', async () => {
    const a = new Member();
    const ca = caller(a);
    await ca.lobby.create();
    await ca.member.setName('Ada');

    const events = await handshake(a, 5);
    const names = events.map((e) => e.event);
    expect(names).toContain('lobby:join');
    expect(names).toContain('lobby:info');
    // Without this the client sits on `nameOk === null` and shows name entry despite holding a seat.
    expect(events.find((e) => e.event === 'member:nameOk')?.args[0]).toBe(true);
  });

  it('does not claim a name on the handshake for a member that has not set one', async () => {
    const a = new Member();
    const ca = caller(a);
    await ca.lobby.create();

    // Only the four unconditional handshake events are emitted; taking exactly those proves no
    // member:nameOk is among them (a named member emits it as the fifth).
    const events = await handshake(a, 4);
    expect(events.map((e) => e.event)).toEqual([
      'member:id',
      'version',
      'lobby:join',
      'lobby:info',
    ]);
  });

  it('server.info returns the aggregated stats shape', async () => {
    const info = await caller(new Member()).server.info();
    expect(info).toHaveProperty('clients');
    expect(info).toHaveProperty('gameDistribution');
    expect(typeof info.lobbies).toBe('number');
  });

  it('rocketcrab.create builds a lobby for a valid game and rejects unknown ones', async () => {
    const res = await caller(new Member()).rocketcrab.create({
      game: 'story',
      version: 1,
    });
    expect(res.code.startsWith('rc')).toBe(true);
    expect(res.version).toBe(1);

    await expect(
      caller(new Member()).rocketcrab.create({ game: 'nope', version: 1 }),
    ).rejects.toThrow();
  });
});
