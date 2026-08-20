import { describe, it, expect } from 'vitest';
import { Recipe } from '../recipe';
import { makeMockLobby } from './mockLobby';

function makeGame(
  players: string[],
  over: Record<string, unknown> = {},
): Recipe {
  const config = {
    players: players.length,
    numRecipes: 1,
    numSteps: 2,
    anonymous: false,
    ...over,
  };
  const g = new Recipe(makeMockLobby() as never, config as never, players);
  g.start();
  return g;
}

describe('Recipe', () => {
  it('start creates step, ingredient and comment chains per recipe', () => {
    const g = makeGame(['p1', 'p2', 'p3']);
    expect(g.chains).toHaveLength(3);
    expect(g.chains.map((c) => c.type).sort()).toEqual([
      'comment',
      'ingredient',
      'step',
    ]);
  });

  it('recipe:theme assigns a theme to a step chain', () => {
    const g = makeGame(['p1', 'p2', 'p3']);
    const step = g.chains.find((c) => c.type === 'step')!;
    g.chains.forEach((c) => (c.editor = ''));
    step.editor = 'p1';

    g.handleMessage('p1', 'recipe:theme', 'Tacos');
    expect(step.theme).toBe('Tacos');
    expect(step.themeEditor).toBe('p1');
  });

  it('recipe:line requires the ITEM placeholder on step chains', () => {
    const g = makeGame(['p1', 'p2', 'p3']);
    const step = g.chains.find((c) => c.type === 'step')!;
    step.theme = 'Tacos';
    step.themeEditor = 'p1';

    g.chains.forEach((c) => (c.editor = ''));
    step.editor = 'p1';
    g.handleMessage('p1', 'recipe:line', 'no hotword here');
    expect(step.chain.length).toBe(0); // rejected, missing ITEM

    step.editor = 'p1';
    g.handleMessage('p1', 'recipe:line', 'cook the ITEM well');
    expect(step.chain).toContain('cook the ITEM well');
  });
});
