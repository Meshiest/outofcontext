import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/trpc/router';
import { Member } from '../core/Member';
import { Lobby } from '../core/Lobby';
import type { Story } from '../core/games/story';
import { computeServerInfo } from '../server/stats';

/**
 * What happens to a chain game when a player is reaped for inactivity mid-round.
 *
 * Their seat is deliberately kept so they can reclaim it, but their chain must NOT be: a chain held
 * by someone who will never submit it can be dealt to nobody else, and since a new deal only happens
 * on an edit, the round stalls with every remaining player showing as waiting and no editor
 * anywhere.
 */
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
  await callers[0].game.start();

  const lobby = Lobby.lobbies[code];
  return { lobby, members, callers, game: lobby.game as unknown as Story };
}

/** playerIds currently holding a chain. */
const editors = (game: Story) => game.chains.filter((c) => c.editor).map((c) => c.editor);

describe('a player reaped for inactivity mid-game', () => {
  it('hands their chain back so the round keeps going', async () => {
    const { lobby, members, game } = await startedLobby(4);

    const busy = editors(game);
    expect(busy.length).toBeGreaterThan(0);

    // Reap the player holding the first chain, the way the inactivity sweep does.
    const victimPlayerId = busy[0];
    const seat = lobby.players.find((p) => p.playerId === victimPlayerId)!;
    const victim = members.find((m) => m.id === String(seat.id))!;
    Lobby.removePlayer(victim);
    Member.removePlayer(victim);

    // The chain is not still sitting with them...
    expect(editors(game)).not.toContain(victimPlayerId);
    // ...and somebody who is actually present is now on the clock.
    const connected = new Set(
      lobby.players.filter((p) => p.connected).map((p) => p.playerId),
    );
    const active = editors(game);
    expect(active.length).toBeGreaterThan(0);
    for (const editor of active) expect(connected.has(editor)).toBe(true);
  });

  it('leaves somebody editing even when only one player is left', async () => {
    // The anti-repeat rules can rule out every option once enough players have gone. A repeated
    // editor is a worse story; no editor at all is a dead game.
    const { lobby, members, game } = await startedLobby(3);

    for (const member of members.slice(1)) {
      Lobby.removePlayer(member);
      Member.removePlayer(member);
    }

    const survivor = lobby.players.find((p) => p.connected)!;
    expect(editors(game)).toEqual([survivor.playerId]);
  });

  it('deals the returning player back in when they reclaim their seat', async () => {
    const { lobby, members, game } = await startedLobby(4);

    const victimPlayerId = editors(game)[0];
    const seat = lobby.players.find((p) => p.playerId === victimPlayerId)!;
    const victim = members.find((m) => m.id === String(seat.id))!;
    Lobby.removePlayer(victim);
    Member.removePlayer(victim);
    expect(editors(game)).not.toContain(victimPlayerId);

    // They come back and take their old seat.
    const returning = new Member();
    const caller = appRouter.createCaller({ member: returning });
    await caller.lobby.join(lobby.code);
    await caller.member.setName('returned');
    lobby.replacePlayer(returning, victimPlayerId);

    // Re-dealt on arrival rather than left waiting for somebody else to finish a turn.
    expect(lobby.players.find((p) => p.playerId === victimPlayerId)?.connected).toBe(true);
    expect(editors(game)).toContain(victimPlayerId);
  });
});

describe('the inactivity sweep', () => {
  it('tells the client it was kicked before closing the stream', async () => {
    const member = new Member();
    const seen: string[] = [];
    member.socketBus.on('event', (e: { event: string }) => seen.push(e.event));

    // Older than the "really inactive" cutoff, so the sweep takes it whatever its lobby state is.
    member.activity = Date.now() - 5 * 60 * 60 * 1000;
    Member.cullInactive();

    // Without the notice the client only sees the stream drop, which is indistinguishable from a
    // routine reconnect - so it would sit on the reconnect spinner forever.
    expect(seen).toContain('member:kicked');
    expect(member.removed).toBe(true);
    expect(member.connected).toBe(false);
  });

  it('leaves an active member alone', () => {
    const member = new Member();
    const seen: string[] = [];
    member.socketBus.on('event', (e: { event: string }) => seen.push(e.event));

    Member.cullInactive();

    expect(seen).not.toContain('member:kicked');
    expect(member.removed).toBe(false);
  });
});

/**
 * The inactivity sweep itself, not a hand-simulated reap.
 *
 * The tests above stand in for the sweep by calling Lobby.removePlayer + Member.removePlayer, which
 * is what the registered reaper does - so they never exercise Member.cullInactive() and cannot catch
 * it doing something different.
 */
describe('Member.cullInactive', () => {
  /** Four hours clears both the idle threshold and the really-idle one. */
  const LONG_AGO = 4 * 60 * 60 * 1000 + 1000;

  async function idleLobbyWithOneMember() {
    const member = new Member();
    const caller = appRouter.createCaller({ member });
    const { code } = await caller.lobby.create();
    await caller.member.setName('afk');
    return { member, lobby: Lobby.lobbies[code], code };
  }

  it('removes an afk member from their LOBBY, not just the registry', () => {
    Member.setReaper((m) => {
      Lobby.removePlayer(m);
      Member.removePlayer(m);
    });

    return idleLobbyWithOneMember().then(({ member, lobby }) => {
      expect(lobby.members).toContain(member);
      member.activity = Date.now() - LONG_AGO;

      Member.cullInactive();

      // Leaving them on lobby.members keeps the lobby permanently non-empty, so cullEmpty never
      // collects it and computeServerInfo counts a player who was kicked hours ago forever.
      expect(lobby.members).not.toContain(member);
      expect(lobby.empty()).toBe(true);
      expect(member.lobby).toBeUndefined();
    });
  });

  /** The reported symptom: the idle counts stayed put while afk members piled up in lobbies. */
  it('drops the idle counts that /metrics and server.info report', async () => {
    Member.setReaper((m) => {
      Lobby.removePlayer(m);
      Member.removePlayer(m);
    });
    const { member } = await idleLobbyWithOneMember();

    // Deltas, not absolutes: other suites leave lobbies behind, and there is a dev lobby.
    const before = computeServerInfo();
    member.activity = Date.now() - LONG_AGO;

    Member.cullInactive();

    const after = computeServerInfo();
    expect(after.idlePlayers).toBe(before.idlePlayers - 1);
    // The lobby is now empty, so it stops being counted as idle once cullEmpty collects it - but the
    // player must be gone from the count immediately.
    expect(after.idlePlayers).toBeLessThan(before.idlePlayers);
  });
});
