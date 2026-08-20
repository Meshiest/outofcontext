import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameState } from '@shared/types';
import type { StoryChain, StoryPlayerState } from './types';

const h = vi.hoisted(() => ({
  gameState: null as GameState | null,
  playerInfo: null as StoryPlayerState | null,
  stories: [] as StoryChain[],
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
  useGameResults: () => ({ results: h.stories, requestResults: vi.fn() }),
}));

vi.mock('@/games/shared/useNameTable', () => ({
  useNameTable: () => ({}),
}));

vi.mock('@/games/shared/useTurnEffects', () => ({
  useTurnEffects: vi.fn(),
}));

import StoryGame from './StoryGame';

beforeEach(() => {
  h.gameState = { icons: {}, progress: 0.5 };
  h.playerInfo = null;
  h.stories = [];
  h.send = vi.fn();
});

describe('StoryGame', () => {
  it('renders the editor in EDITING state', () => {
    h.playerInfo = { id: 'me', state: 'EDITING', link: [], isLastLink: false };
    render(<StoryGame />);
    expect(screen.getByText('Write the first line')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument();
  });

  it('renders the waiting loader in WAITING state', () => {
    h.playerInfo = { id: 'me', state: 'WAITING' };
    render(<StoryGame />);
    expect(screen.getByText('Waiting on Other Authors')).toBeInTheDocument();
  });

  it('renders results in READING state with a Done Reading toggle', () => {
    h.playerInfo = { id: 'me', state: 'READING' };
    h.stories = [[{ link: 'A finished tale.', editor: '' }]];
    render(<StoryGame />);
    expect(screen.getByText('A finished tale.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done Reading' })).toBeInTheDocument();
  });

  it('shows the in-progress fallback when there is no player state yet', () => {
    h.playerInfo = null;
    render(<StoryGame />);
    expect(screen.getByText('Stories are Being Written')).toBeInTheDocument();
  });

  it('renders the progress bar while in progress', () => {
    h.playerInfo = { id: 'me', state: 'WAITING' };
    render(<StoryGame />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('emits story:line when the editor submits a valid line', async () => {
    const user = userEvent.setup();
    h.playerInfo = { id: 'me', state: 'EDITING', link: [], isLastLink: false };
    render(<StoryGame />);
    await user.type(screen.getByRole('textbox'), 'Once upon a time.');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(h.send).toHaveBeenCalledWith('story:line', 'Once upon a time.');
  });
});
