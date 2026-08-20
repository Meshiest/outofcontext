import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DrawGameState, DrawPlayerState } from './types';

const h = vi.hoisted(() => ({
  gameState: null as DrawGameState | null,
  playerInfo: null as DrawPlayerState | null,
  results: [] as unknown[],
  send: vi.fn(),
}));

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    gameState: h.gameState,
    playerInfo: h.playerInfo,
    startGame: vi.fn(),
    endGame: vi.fn(),
    sendGameMessage: h.send,
  }),
}));

vi.mock('@/games/shared/useGameResults', () => ({
  useGameResults: () => ({ results: h.results, requestResults: vi.fn() }),
}));

vi.mock('@/games/shared/useNameTable', () => ({
  useNameTable: () => ({}),
}));

vi.mock('@/games/shared/useTurnEffects', () => ({
  useTurnEffects: () => {},
}));

import DrawGame from './DrawGame';

/** Any PNG data URL: these tests only check it reaches the component. */
const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

beforeEach(() => {
  h.gameState = { icons: {}, progress: 0.5 };
  h.playerInfo = null;
  h.results = [];
  h.send = vi.fn();
});

describe('DrawGame editor selection', () => {
  it('shows the describe editor when there is no link (initial description)', () => {
    h.playerInfo = { id: 'p1', state: 'EDITING' };
    render(<DrawGame />);
    expect(screen.getByText('What Should be Drawn?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Describe' })).toBeInTheDocument();
  });

  it('shows the describe editor when the link is an image', () => {
    h.playerInfo = {
      id: 'p1',
      state: 'EDITING',
      link: [{ type: 'image', data: IMAGE }],
    };
    render(<DrawGame />);
    expect(screen.getByText('The last player drew...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Describe' })).toBeInTheDocument();
  });

  it('shows the draw editor when the link is a description', () => {
    h.playerInfo = {
      id: 'p1',
      state: 'EDITING',
      link: [{ type: 'desc', data: 'a red balloon' }],
    };
    render(<DrawGame />);
    expect(screen.getByText('You must draw this:')).toBeInTheDocument();
    expect(screen.getByText('a red balloon')).toBeInTheDocument();
    // The draw editor renders the drawing canvas, whose toolbar has a Done control.
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('shows the waiting message during the WAITING state', () => {
    h.playerInfo = { id: 'p1', state: 'WAITING' };
    render(<DrawGame />);
    expect(screen.getByText('Waiting on Other Players')).toBeInTheDocument();
  });
});
