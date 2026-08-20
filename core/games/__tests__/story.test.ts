import { describe, it, expect } from 'vitest';
import { Story } from '../story';
import { makeMockLobby } from './mockLobby';

function makeGame(
  players: string[],
  config: Record<string, unknown>,
): Story {
  return new Story(makeMockLobby() as never, config as never, players);
}

function baseConfig(over: Record<string, unknown> = {}) {
  return {
    players: 3,
    numStories: 3,
    numLinks: 3,
    contextLen: 1,
    anonymous: false,
    ...over,
  };
}

// Drive every chain to completion by having whichever player currently holds a chain submit a line.
function fill(g: Story): void {
  let guard = 0;
  while (g.getGameProgress() < 1 && guard++ < 1000) {
    const chain = g.chains.find((c) => c.editor);
    if (!chain) break;
    g.handleMessage(chain.editor, 'story:line', 'a line of story');
  }
}

describe('Story', () => {
  it('start creates numStories chains and assigns initial editors', () => {
    const g = makeGame(['p1', 'p2', 'p3'], baseConfig());
    g.start();
    expect(g.chains).toHaveLength(3);
    const editors = g.chains.filter((c) => c.editor).map((c) => c.editor);
    expect(editors.length).toBeGreaterThan(0);
  });

  it('findChainForPlayer returns undefined when no chain is available', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 1 }));
    g.start();
    // The single 1-link chain is claimed; no chain left for a fresh player.
    fill(g);
    expect(g.findChainForPlayer('p2')).toBeUndefined();
  });

  it('story:line adds a link and advances progress', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 2 }));
    g.start();
    const editor = g.chains[0].editor;
    expect(g.getGameProgress()).toBe(0);
    g.handleMessage(editor, 'story:line', 'hello there');
    expect(g.chains[0].chain).toContain('hello there');
    expect(g.getGameProgress()).toBe(0.5);
  });

  it('chain:react validates the index strictly < chains.length', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 2 }));
    g.start();
    fill(g);
    expect(g.getGameProgress()).toBe(1);

    // Out-of-range index equal to length must not throw and must not record a reaction.
    expect(() =>
      g.handleMessage('p1', 'chain:react', { index: g.chains.length, reaction: 'heart' }),
    ).not.toThrow();
    expect(g.chains[0].reactions.heart['p1']).toBeFalsy();

    // In-range index toggles it.
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'heart' });
    expect(g.chains[0].reactions.heart['p1']).toBe(true);
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'heart' });
    expect(g.chains[0].reactions.heart['p1']).toBe(false);
  });

  it('chain:react ignores an unknown reaction id', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 2 }));
    g.start();
    fill(g);
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'not-a-reaction' });
    // Nothing recorded under any reaction.
    expect(Object.values(g.chains[0].reactions).every((b) => Object.keys(b).length === 0)).toBe(
      true,
    );
  });

  it('lets a player hold one of EACH reaction on the same chain', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 2 }));
    g.start();
    fill(g);

    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'heart' });
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'skull' });
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'brain' });

    expect(g.chains[0].reactions.heart['p1']).toBe(true);
    expect(g.chains[0].reactions.skull['p1']).toBe(true);
    expect(g.chains[0].reactions.brain['p1']).toBe(true);
    // Counts are per reaction, and one player can only ever contribute one to each.
    const state = g.getState();
    expect(state.reactions?.heart[0]).toBe(1);
    expect(state.reactions?.skull[0]).toBe(1);
    expect(state.reactions?.laugh[0]).toBe(0);
  });

  it('ignores reactions until every chain is finished', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 1, numLinks: 2 }));
    g.start();
    expect(g.getGameProgress()).toBeLessThan(1);
    g.handleMessage('p1', 'chain:react', { index: 0, reaction: 'heart' });
    expect(g.chains[0].reactions.heart['p1']).toBeFalsy();
  });

  it('save/restore round-trips chain state', () => {
    const g = makeGame(['p1', 'p2'], baseConfig({ numStories: 2, numLinks: 2 }));
    g.start();
    g.handleMessage(g.chains.find((c) => c.editor)!.editor, 'story:line', 'first');

    const blob = g.save();
    const g2 = makeGame(['p1', 'p2'], baseConfig({ numStories: 2, numLinks: 2 }));
    g2.restore(blob);

    expect(g2.chains.map((c) => c.chain)).toEqual(g.chains.map((c) => c.chain));
    expect(g2.getGameProgress()).toBe(g.getGameProgress());
  });
});
