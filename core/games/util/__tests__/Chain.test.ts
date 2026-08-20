import { describe, it, expect } from 'vitest';
import { Chain, type ChainSaveBlob } from '../Chain';

describe('Chain', () => {
  it('initializes an empty chain with the given player count', () => {
    const c = new Chain<string>(4);
    expect(c.numPlayers).toBe(4);
    expect(c.chain).toEqual([]);
    expect(c.editors).toEqual([]);
    expect(c.collaborators).toEqual({});
    expect(c.editor).toBe('');
    expect(c.lastEditor).toBe('');
    expect(c.reactions.heart).toEqual({});
  });

  it('addLink pushes the link, advances editors, and counts collaborators', () => {
    const c = new Chain<string>(2);
    c.editor = 'p1';
    c.addLink('p1', 'first line');

    expect(c.chain).toEqual(['first line']);
    expect(c.editors).toEqual(['p1']);
    expect(c.lastEditor).toBe('p1');
    expect(c.editor).toBe('');
    expect(c.collaborators.p1).toBe(1);

    c.editor = 'p2';
    c.addLink('p2', 'second line');
    expect(c.collaborators.p2).toBe(1);
    expect(c.lastEditor).toBe('p2');
  });

  it('does not count an empty pid as a collaborator (autonomous edits)', () => {
    const c = new Chain<string>(2);
    c.addLink('', 'auto line');
    expect(c.collaborators).toEqual({});
    expect(c.editors).toEqual(['']);
    expect(c.chain).toEqual(['auto line']);
  });

  it('avgEdits divides total contributions by player count', () => {
    const c = new Chain<string>(4);
    c.addLink('p1', 'a');
    c.addLink('p1', 'b');
    c.addLink('p2', 'c');
    expect(c.avgEdits()).toBeCloseTo(3 / 4);
  });

  it('save produces a serializable versioned blob', () => {
    const c = new Chain<string>(3);
    c.addLink('p1', 'x');
    const blob = c.save();
    expect(blob.version).toBe(1);
    expect(blob.numPlayers).toBe(3);
    expect(blob.chain).toEqual(['x']);
    expect(JSON.parse(JSON.stringify(blob))).toEqual(
      JSON.parse(JSON.stringify(blob)),
    );
  });

  it('Chain.restore round-trips save state, including reactions', () => {
    const c = new Chain<string>(3);
    c.addLink('p1', 'x');
    c.addLink('p2', 'y');
    c.reactions.heart.p1 = true;
    c.reactions.skull.p2 = true;
    c.type = 'step';

    const restored = Chain.restore<string>(c.save());
    expect(restored.numPlayers).toBe(3);
    expect(restored.chain).toEqual(['x', 'y']);
    expect(restored.editors).toEqual(['p1', 'p2']);
    expect(restored.collaborators).toEqual({ p1: 1, p2: 1 });
    expect(restored.reactions.heart).toEqual({ p1: true });
    expect(restored.reactions.skull).toEqual({ p2: true });
    expect(restored.type).toBe('step');
  });

  it('reads a pre-reactions save, carrying its likes over as hearts', () => {
    // Saves written before reactions existed store a single `likes` map; those were hearts, and a
    // lobby restored mid-read must not lose them.
    const legacy = {
      version: 1 as const,
      numPlayers: 2,
      collaborators: { p1: 1 },
      lastEditor: 'p1',
      editor: '',
      chain: ['x'],
      editors: ['p1'],
      likes: { p1: true, p2: true },
    } as unknown as Parameters<typeof Chain.restore<string>>[0];

    const restored = Chain.restore<string>(legacy);
    expect(restored.reactions.heart).toEqual({ p1: true, p2: true });
    expect(restored.reactions.brain).toEqual({});
  });
});

describe('restoring a save blob with missing fields', () => {
  // Production stack trace this guards:
  //   TypeError: Cannot read property '<playerId>' of undefined
  //     at Recipe.handleMessage (core/games/recipe:...)
  // A chain restored without `collaborators` looked fine until the next edit read it by player id.
  // The blob is JSON off disk, so its shape cannot be enforced by the type system.
  const partial = { version: 1, numPlayers: 3 } as unknown as ChainSaveBlob<string>;

  it('defaults every absent field instead of storing undefined', () => {
    const c = Chain.restore<string>(partial);
    expect(c.collaborators).toEqual({});
    expect(c.chain).toEqual([]);
    expect(c.editors).toEqual([]);
    expect(c.editor).toBe('');
    expect(c.lastEditor).toBe('');
  });

  it('survives the edit that used to throw', () => {
    const c = Chain.restore<string>(partial);
    // This is the read that crashed: collaborators[pid] on an undefined map.
    expect(() => {
      c.collaborators['player5439'] = (c.collaborators['player5439'] || 0) + 1;
    }).not.toThrow();
    expect(() => c.addLink('player5439', 'a line')).not.toThrow();
    expect(c.collaborators['player5439']).toBe(2);
  });

  it('keeps avgEdits a real number when numPlayers is absent', () => {
    const c = Chain.restore<string>({ version: 1 } as unknown as ChainSaveBlob<string>);
    c.addLink('p1', 'x');
    // NaN here would make redistribute's under-contributed filter reject every player.
    expect(Number.isNaN(c.avgEdits())).toBe(false);
  });
});
