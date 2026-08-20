import { describe, it, expect, vi } from 'vitest';
import { appRouter } from '../server/trpc/router';
import { Member } from '../core/Member';
import { Lobby } from '../core/Lobby';
import type { Comic } from '../core/games/comic';

const DRAWING_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

vi.mock('../core/Drawings.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../core/Drawings.js')>();
  return { ...actual, exists: (id: string) => id === 'a1b2c3d4e5f60718293a4b5c6d7e8f90' };
});

interface Ev {
  event: string;
  args: unknown[];
}

/**
 * Open a live SSE subscription and keep collecting into an array, the way a real client does.
 *
 * This is the part a `createCaller` test usually skips, and it is exactly where a delivery bug
 * would hide: `Member.send` emits on an EventEmitter with NO buffering, so anything pushed while
 * no subscription is attached is dropped on the floor rather than queued.
 */
function collect(member: Member, sink: Ev[]) {
  const controller = new AbortController();
  const done = (async () => {
    try {
      for await (const ev of member.subscribe(controller.signal)) {
        sink.push(ev as Ev);
      }
    } catch {
      // aborted
    }
  })();
  return { stop: () => { controller.abort(); return done; } };
}

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('results delivery over a live subscription', () => {
  it('delivers comic:result to a player who asks after the game completes', async () => {
    const members = [new Member(), new Member(), new Member()];
    const callers = members.map((m) => appRouter.createCaller({ member: m }));

    const { code } = await callers[0].lobby.create();
    await callers[0].member.setName('p0');
    for (let i = 1; i < members.length; i++) {
      await callers[i].lobby.join(code);
      await callers[i].member.setName(`p${i}`);
    }

    // Streams open BEFORE the game runs, as they would in a real session.
    const sinks: Ev[][] = members.map(() => []);
    const streams = members.map((m, i) => collect(m, sinks[i]));
    await tick();

    await callers[0].lobby.setGame('comic');
    await callers[0].game.start();
    await tick();

    const lobby = Lobby.lobbies[code];
    const game = lobby.game as unknown as Comic;

    // Play until every chain is full.
    for (let round = 0; round < 30 && game.getGameProgress() < 1; round++) {
      for (const chain of game.chains.filter((c) => c.editor)) {
        const editor = chain.editor;
        const seat = lobby.players.findIndex((p) => p.playerId === editor);
        await callers[seat].game.message({
          type: 'comic:line',
          data: { drawing: DRAWING_ID },
        });
      }
      await tick();
    }
    expect(game.getGameProgress()).toBe(1);

    // Every player should have seen a game:info marking the game complete - that is the signal the
    // client uses to decide to ask for results.
    const sawComplete = sinks.map((s) =>
      s.some((e) => e.event === 'game:info' && (e.args[0] as { isComplete?: boolean }).isComplete),
    );
    expect(sawComplete, 'not every player was told the game finished').toEqual(
      members.map(() => true),
    );

    // Now ask, exactly as useGameResults does.
    for (const c of callers) await c.game.message({ type: 'comic:result', data: undefined });
    await tick();

    const gotResults = sinks.map((s) => s.filter((e) => e.event === 'comic:result').length);
    for (const [i] of members.entries()) {
      await streams[i].stop();
    }

    expect(gotResults, 'a player asked for results and never received them').toEqual(
      members.map(() => 1),
    );
  });
});
