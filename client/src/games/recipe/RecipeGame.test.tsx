import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameState } from '@shared/types';
import type { CompiledRecipe, RecipePlayerState } from './types';

const h = vi.hoisted(() => ({
  gameState: null as GameState | null,
  playerInfo: null as RecipePlayerState | null,
  recipes: [] as CompiledRecipe[],
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

vi.mock('@/games/shared/useNameTable', () => ({ useNameTable: () => ({}) }));

vi.mock('@/games/shared/useGameResults', () => ({
  useGameResults: () => ({ results: h.recipes, requestResults: vi.fn() }),
}));

vi.mock('@/games/shared/useTurnEffects', () => ({ useTurnEffects: () => {} }));

import RecipeGame from './RecipeGame';

beforeEach(() => {
  h.gameState = { icons: {}, progress: 0.5 };
  h.playerInfo = null;
  h.recipes = [];
  h.send = vi.fn();
});

describe('RecipeGame routing', () => {
  it('routes a theme link to the theme editor', () => {
    h.playerInfo = { id: 'p1', state: 'EDITING', link: { type: 'theme' } };
    render(<RecipeGame />);
    expect(screen.getByText('Pick a Theme')).toBeInTheDocument();
  });

  it('routes a step link to the step editor', () => {
    h.playerInfo = {
      id: 'p1',
      state: 'EDITING',
      link: { type: 'step', theme: 'Tacos', index: 1, total: 3 },
    };
    render(<RecipeGame />);
    expect(screen.getByText(/Write an instruction for: Tacos/)).toBeInTheDocument();
  });

  it('routes an ingredient link to the ingredient editor', () => {
    h.playerInfo = {
      id: 'p1',
      state: 'EDITING',
      link: { type: 'ingredient', ingredients: ['salt'] },
    };
    render(<RecipeGame />);
    expect(screen.getByText('Add an Ingredient')).toBeInTheDocument();
    expect(screen.getByText('salt')).toBeInTheDocument();
  });

  it('routes a comment link to the comment editor', () => {
    h.playerInfo = { id: 'p1', state: 'EDITING', link: { type: 'comment', comments: [] } };
    render(<RecipeGame />);
    expect(screen.getByText('Comment on a Recipe')).toBeInTheDocument();
  });

  it('shows the waiting message during the WAITING state', () => {
    h.playerInfo = { id: 'p1', state: 'WAITING' };
    render(<RecipeGame />);
    expect(screen.getByText('Waiting on Other Chefs')).toBeInTheDocument();
  });

  it('shows compiled recipes during the READING state', () => {
    h.playerInfo = { id: 'p1', state: 'READING' };
    h.gameState = { icons: { p1: 'clock' }, progress: 1, isComplete: true };
    h.recipes = [{ theme: 'Grand Gumbo', author: '', steps: [], comments: [] }];
    render(<RecipeGame />);
    expect(screen.getByText('Grand Gumbo')).toBeInTheDocument();
  });
});
