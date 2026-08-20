import { describe, it, expect } from 'vitest';
import { Redacted, getWords, COST } from '../redacted';
import { makeMockLobby } from './mockLobby';

function makeGame(players: string[]): Redacted {
  const config = {
    players: players.length,
    numStories: 2,
    numLinks: 2,
    anonymous: false,
    edits: 1,
    gamemode: { censor: 'player', truncate: 'player' },
    ink: 10,
  };
  const g = new Redacted(makeMockLobby() as never, config as never, players);
  g.start();
  return g;
}

describe('Redacted', () => {
  it('getWords tokenizes words including apostrophes and hyphens', () => {
    expect(getWords("it's a co-op test").map((m) => m[0])).toEqual([
      "it's",
      'a',
      'co-op',
      'test',
    ]);
    expect(getWords('one two three')).toHaveLength(3);
  });

  it('exposes the ink costs (truncate 2, censor 5)', () => {
    expect(COST.truncate).toBe(2);
    expect(COST.censor).toBe(5);
  });

  it('triples numLinks (each line becomes line -> tamper -> repair)', () => {
    const g = makeGame(['p1', 'p2', 'p3', 'p4']);
    expect(g.config.numLinks).toBe(6); // 2 * 3
  });

  it('accepts a first-phase line', () => {
    const g = makeGame(['p1', 'p2', 'p3', 'p4']);
    const chain = g.chains.find((c) => c.editor)!;
    g.handleMessage(chain.editor, 'redacted:line', 'The quick brown fox');
    expect(chain.chain[0]).toEqual({
      type: 'line',
      data: 'The quick brown fox',
    });
  });

  it('save/restore round-trips chain state', () => {
    const g = makeGame(['p1', 'p2', 'p3', 'p4']);
    const chain = g.chains.find((c) => c.editor)!;
    g.handleMessage(chain.editor, 'redacted:line', 'hello world');

    const blob = g.save();
    const g2 = makeGame(['p1', 'p2', 'p3', 'p4']);
    g2.restore(blob);
    expect(g2.chains.map((c) => c.chain)).toEqual(g.chains.map((c) => c.chain));
  });
});
