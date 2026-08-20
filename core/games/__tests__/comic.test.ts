import { describe, it, expect, vi } from 'vitest';
import { Comic } from '../comic';
import { makeMockLobby } from './mockLobby';
import {
  KNOWN_DRAWING_ID,
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


function makeGame(
  players: string[],
  gamemode: Record<string, boolean>,
): Comic {
  const config = {
    players: players.length,
    numPieces: players.length,
    numLinks: 3,
    anonymous: false,
    colors: false,
    gamemode: {
      continuous: false,
      captions: false,
      show_drawings: true,
      show_captions: false,
      ...gamemode,
    },
  };
  const g = new Comic(makeMockLobby() as never, config as never, players);
  g.start();
  return g;
}

function editorOf(g: Comic): string {
  return g.chains.find((c) => c.editor)!.editor;
}

describe('Comic', () => {
  it('accepts a valid drawing and adds a link', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: false });
    const editor = editorOf(g);
    const before = g.chains.find((c) => c.editor === editor)!.chain.length;
    g.handleMessage(editor, 'comic:line', { drawing: KNOWN_DRAWING_ID });
    const chain = g.chains.find((c) => c.editors.includes(editor))!;
    expect(chain.chain.length).toBe(before + 1);
  });

  it('rejects a drawing that is not an id', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: false });
    const editor = editorOf(g);
    g.handleMessage(editor, 'comic:line', { drawing: 'not-an-image' });
    // The editor still holds the (unchanged) chain.
    expect(g.chains.find((c) => c.editor === editor)).toBeTruthy();
  });

  it('rejects the pre-raster vector payload', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: false });
    const editor = editorOf(g);
    g.handleMessage(editor, 'comic:line', { drawing: legacyVectorDrawing });
    expect(g.chains.find((c) => c.editor === editor)).toBeTruthy();
  });

  it('rejects a well-formed id with no drawing behind it', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: false });
    const editor = editorOf(g);
    g.handleMessage(editor, 'comic:line', { drawing: MISSING_DRAWING_ID });
    expect(g.chains.find((c) => c.editor === editor)).toBeTruthy();
  });

  it('when captions are enabled, validates the caption string', () => {
    const g = makeGame(['p1', 'p2', 'p3'], {
      captions: true,
      show_captions: true,
    });
    const editor = editorOf(g);
    // too-long caption is rejected -> editor still holds the chain
    g.handleMessage(editor, 'comic:line', {
      drawing: KNOWN_DRAWING_ID,
      caption: 'x'.repeat(300),
    });
    expect(g.chains.find((c) => c.editor === editor)).toBeTruthy();

    // a valid caption is accepted
    g.handleMessage(editor, 'comic:line', {
      drawing: KNOWN_DRAWING_ID,
      caption: 'a fine caption',
    });
    const chain = g.chains.find((c) => c.editors.includes(editor))!;
    expect(chain.chain[chain.chain.length - 1].caption).toBe('a fine caption');
  });

  it('when captions are disabled, rejects messages carrying a caption', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: false });
    const editor = editorOf(g);
    g.handleMessage(editor, 'comic:line', {
      drawing: KNOWN_DRAWING_ID,
      caption: 'should be rejected',
    });
    expect(g.chains.find((c) => c.editor === editor)).toBeTruthy();
  });

  it('blanks legacy vector drawings when restoring a pre-raster save', () => {
    const g = makeGame(['p1', 'p2', 'p3'], { captions: true, show_captions: true });
    const saved = g.save() as { chains: { chain: unknown[] }[] };
    // Hand-build a save of the shape written before drawings became images.
    saved.chains[0].chain = [
      { drawing: legacyVectorDrawing, caption: 'a cat' },
      { drawing: KNOWN_DRAWING_ID, caption: 'a hat' },
    ];

    const restored = makeGame(['p1', 'p2', 'p3'], { captions: true, show_captions: true });
    restored.restore(saved);

    // The unrenderable drawing is blanked; its caption, and the valid drawing, are untouched.
    expect(restored.chains[0].chain).toEqual([
      { drawing: '', caption: 'a cat' },
      { drawing: KNOWN_DRAWING_ID, caption: 'a hat' },
    ]);
  });
});
