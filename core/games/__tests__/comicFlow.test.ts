import { describe, it, expect, vi } from 'vitest';
import { Comic } from '../comic';
import { makeMockLobby } from './mockLobby';
import { KNOWN_DRAWING_ID } from './sampleImage';

vi.mock('../../Drawings.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../Drawings.js')>();
  const stored = new Set(['a1b2c3d4e5f60718293a4b5c6d7e8f90']);
  return { ...actual, exists: (id: string) => stored.has(id) };
});

/** Play a Dilettante game to completion, then ask for results the way the client does. */
describe('Comic results flow', () => {
  it('delivers comic:result once every chain is finished', () => {
    const players = ['p1', 'p2', 'p3'];
    const lobby = makeMockLobby();
    const config = {
      players: players.length,
      numPieces: players.length,
      numLinks: 2,
      anonymous: false,
      colors: false,
      gamemode: { continuous: false, captions: false, show_drawings: true, show_captions: false },
    };
    const g = new Comic(lobby as never, config as never, players);
    g.start();

    // Every player draws until the game reports complete.
    for (let round = 0; round < 20 && g.getGameProgress() < 1; round++) {
      for (const chain of g.chains.filter((c) => c.editor)) {
        g.handleMessage(chain.editor, 'comic:line', { drawing: KNOWN_DRAWING_ID });
      }
    }

    expect(g.getGameProgress()).toBe(1);
    expect(g.getState().isComplete).toBe(true);

    lobby.emitPlayer.mockClear();
    g.handleMessage('p1', 'comic:result', undefined);

    const call = lobby.emitPlayer.mock.calls.find((c) => c[1] === 'comic:result');
    expect(call, 'comic:result was never emitted').toBeTruthy();
    const chains = call![2] as { link: { drawing: string } }[][];
    expect(chains.length).toBe(players.length);
    expect(chains[0][0].link.drawing).toBe(KNOWN_DRAWING_ID);
  });
});
