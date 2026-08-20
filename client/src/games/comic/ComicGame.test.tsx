import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameState, PlayerState } from '@shared/types';
import type { ComicChain } from './types';

const h = vi.hoisted(() => ({
  gameState: null as GameState | null,
  playerInfo: null as PlayerState | null,
  chains: [] as ComicChain[],
  send: vi.fn(),
  turnEffects: vi.fn(),
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

vi.mock('@/games/shared/useNameTable', () => ({
  useNameTable: () => ({ p1: 'Alice' }),
}));

vi.mock('@/games/shared/useTurnEffects', () => ({
  useTurnEffects: (state: string | null | undefined) => h.turnEffects(state),
}));

vi.mock('@/games/shared/useGameResults', () => ({
  useGameResults: () => ({ results: h.chains, requestResults: vi.fn() }),
}));

import ComicGame from './ComicGame';

/** Any PNG data URL: these tests only check it reaches the component. */
const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const editingGame: GameState = {
  icons: {},
  progress: 0.5,
  continuous: false,
  enableCaptions: false,
  showCaptions: false,
  showDrawings: true,
} as GameState;

beforeEach(() => {
  h.gameState = null;
  h.playerInfo = null;
  h.chains = [];
  h.send = vi.fn();
  h.turnEffects = vi.fn();
});

describe('ComicGame', () => {
  it('shows the editor during EDITING', () => {
    h.gameState = editingGame;
    h.playerInfo = { id: 'p1', state: 'EDITING' } as PlayerState;
    render(<ComicGame />);
    expect(screen.getByText('Draw the beginning!')).toBeInTheDocument();
  });

  it('shows the waiting message during WAITING', () => {
    h.gameState = editingGame;
    h.playerInfo = { id: 'p1', state: 'WAITING' } as PlayerState;
    render(<ComicGame />);
    expect(screen.getByText('Waiting on Other Artists')).toBeInTheDocument();
  });

  it('shows the Sequences results during READING', () => {
    h.gameState = { ...editingGame, progress: 1, isComplete: true, likes: [0] } as GameState;
    h.playerInfo = { id: 'p1', state: 'READING' } as PlayerState;
    h.chains = [[{ link: { drawing: IMAGE }, editor: 'p1' }]];
    render(<ComicGame />);
    expect(screen.getByText('Sequences')).toBeInTheDocument();
  });

  it('shows the drawing fallback before a player state arrives', () => {
    h.gameState = editingGame;
    h.playerInfo = null;
    render(<ComicGame />);
    expect(screen.getByText('Sequences are Being Drawn')).toBeInTheDocument();
  });

  it('feeds the player state to the turn-effects hook', () => {
    h.gameState = editingGame;
    h.playerInfo = { id: 'p1', state: 'EDITING' } as PlayerState;
    render(<ComicGame />);
    expect(h.turnEffects).toHaveBeenCalledWith('EDITING');
  });
});
