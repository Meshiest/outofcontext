import { describe, it, expect, vi } from 'vitest';
import { Draw } from '../draw';
import { makeMockLobby } from './mockLobby';
import {
  KNOWN_DRAWING_ID,
  MALFORMED_IDS,
  MISSING_DRAWING_ID,
  legacyVectorDrawing,
} from './sampleImage';

// The store is filesystem-backed; these tests care about the id gate, not disk. `isDrawingId` stays
// real (it is pure), only `exists` is stubbed to a known set.
vi.mock('../../Drawings.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../Drawings.js')>();
  const stored = new Set([
    'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
  ]);
  return { ...actual, exists: (id: string) => stored.has(id) };
});


function makeGame(players: string[], numLinks: number): Draw {
  const config = {
    players: players.length,
    numLinks,
    colors: false,
    timeLimit: 0,
  };
  const g = new Draw(makeMockLobby() as never, config as never, players);
  g.start();
  return g;
}

describe('Draw', () => {
  it('forces numLinks to an odd number', () => {
    const g = makeGame(['p1', 'p2', 'p3'], 4);
    expect(g.config.numLinks).toBe(3);
    const g2 = makeGame(['p1', 'p2', 'p3'], 5);
    expect(g2.config.numLinks).toBe(5);
  });

  it('alternates description then image links', () => {
    const g = makeGame(['p1', 'p2', 'p3'], 3);
    const chain = g.chains.find((c) => c.editor)!;
    const editor = chain.editor;

    // First link must be a description (chain length 0 -> even -> desc).
    g.handleMessage(editor, 'draw:image', KNOWN_DRAWING_ID); // wrong type, ignored
    expect(chain.chain.length).toBe(0);
    g.handleMessage(editor, 'draw:desc', 'a red house');
    expect(chain.chain[0]).toEqual({ type: 'desc', data: 'a red house' });

    // Next expected type is image.
    const next = g.chains.find((c) => c.editor && c.chain.length === 1);
    if (next) {
      g.handleMessage(next.editor, 'draw:desc', 'ignored'); // wrong type
      expect(next.chain.length).toBe(1);
      g.handleMessage(next.editor, 'draw:image', KNOWN_DRAWING_ID);
      expect(next.chain[1]).toEqual({ type: 'image', data: KNOWN_DRAWING_ID });
    }
  });

  it('rejects anything that is not the id of a stored drawing', () => {
    const g = makeGame(['p1', 'p2', 'p3'], 3);
    const chain = g.chains.find((c) => c.editor)!;
    // advance to an image slot
    g.handleMessage(chain.editor, 'draw:desc', 'prompt');
    const imgChain = g.chains.find((c) => c.editor && c.chain.length % 2 === 1);
    if (imgChain) {
      const editor = imgChain.editor;
      for (const bad of MALFORMED_IDS) {
        g.handleMessage(editor, 'draw:image', bad);
      }
      // The pre-raster vector payload: accepted by the old array-shaped check, rejected now.
      g.handleMessage(editor, 'draw:image', legacyVectorDrawing);
      // Well-formed but dangling - a client cannot make everyone else render a hole.
      g.handleMessage(editor, 'draw:image', MISSING_DRAWING_ID);
      g.handleMessage(editor, 'draw:image', { data: KNOWN_DRAWING_ID });
      expect(imgChain.chain.length).toBe(1); // unchanged
    }
  });

  it('blanks legacy vector drawings when restoring a pre-raster save', () => {
    const g = makeGame(['p1', 'p2', 'p3'], 3);
    const saved = g.save() as { chains: { chain: unknown[] }[] };
    // Hand-build a save of the shape written before drawings became images.
    saved.chains[0].chain = [
      { type: 'desc', data: 'a red house' },
      { type: 'image', data: legacyVectorDrawing },
    ];

    const restored = makeGame(['p1', 'p2', 'p3'], 3);
    restored.restore(saved);

    // The unrenderable payload is gone, but the link (and the description beside it) survive.
    expect(restored.chains[0].chain).toEqual([
      { type: 'desc', data: 'a red house' },
      { type: 'image', data: '' },
    ]);
  });

  it('keeps valid drawings intact when restoring', () => {
    const g = makeGame(['p1', 'p2', 'p3'], 3);
    const saved = g.save() as { chains: { chain: unknown[] }[] };
    saved.chains[0].chain = [
      { type: 'desc', data: 'a red house' },
      { type: 'image', data: KNOWN_DRAWING_ID },
    ];

    const restored = makeGame(['p1', 'p2', 'p3'], 3);
    restored.restore(saved);

    expect(restored.chains[0].chain[1]).toEqual({ type: 'image', data: KNOWN_DRAWING_ID });
  });
});
