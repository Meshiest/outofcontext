import { describe, it, expect } from 'vitest';
import { Assassin } from '../assassin';
import { makeMockLobby } from './mockLobby';

function makeGame(players: string[], config: Record<string, unknown>): Assassin {
  return new Assassin(makeMockLobby() as never, config as never, players);
}

const players = ['p1', 'p2', 'p3', 'p4'];

describe('Assassin', () => {
  it('start assigns numWords words to each player', () => {
    const g = makeGame(players, { numWords: 2, battleRoyale: false });
    g.start();
    for (const p of players) {
      expect(g.words[p]).toHaveLength(2);
      expect(g.words[p].every((w) => typeof w === 'string')).toBe(true);
    }
  });

  it('start builds a single circular target chain visiting all players', () => {
    const g = makeGame(players, { numWords: 1, battleRoyale: false });
    g.start();
    const visited = new Set<string>();
    let cur = players[0];
    for (let i = 0; i < players.length; i++) {
      visited.add(cur);
      cur = g.targets[cur];
    }
    expect(visited.size).toBe(players.length);
    expect(cur).toBe(players[0]); // wraps around
    expect(new Set(Object.values(g.targets)).size).toBe(players.length);
  });

  it('start generates a two-word (color + animal) title', () => {
    const g = makeGame(players, { numWords: 1, battleRoyale: false });
    g.start();
    expect(g.title.split(' ').length).toBeGreaterThanOrEqual(2);
  });

  it('handleMessage assassin:done marks the player finished', () => {
    const g = makeGame(players, { numWords: 1, battleRoyale: false });
    g.start();
    g.handleMessage('p1', 'assassin:done', true);
    expect(g.finishedLooking['p1']).toBe(true);
    const st = g.getState() as unknown as { icons: Record<string, string> };
    expect(st.icons['p1']).toBe('check');
    expect(st.icons['p2']).toBe('clock');
  });

  it('battle royale mode targets every other player', () => {
    const g = makeGame(players, { numWords: 2, battleRoyale: true });
    g.start();
    const st = g.getPlayerState('p1') as unknown as {
      target: boolean;
      targets: unknown[];
    };
    expect(st.target).toBe(true);
    expect(st.targets).toHaveLength(players.length - 1);
  });

  it('save/restore round-trips words, targets and title', () => {
    const g = makeGame(players, { numWords: 2, battleRoyale: false });
    g.start();
    const blob = g.save();
    const g2 = makeGame(players, { numWords: 2, battleRoyale: false });
    g2.restore(blob);
    expect(g2.title).toBe(g.title);
    expect(g2.words).toEqual(g.words);
    expect(g2.targets).toEqual(g.targets);
  });
});
