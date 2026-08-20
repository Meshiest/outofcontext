import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { GameState, LobbyInfo } from '@shared/types';

const mocks = vi.hoisted(() => ({
  endGame: vi.fn(),
  gameState: null as GameState | null,
}));

vi.mock('@/games/GameRenderer', () => ({
  GameRenderer: ({ game }: { game: string }) => (
    <div data-testid="game-renderer" data-game={game} />
  ),
}));
vi.mock('@/components/widgets/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="settings" />,
}));
vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    gameState: mocks.gameState,
    endGame: mocks.endGame,
    startGame: vi.fn(),
    playerInfo: null,
    sendGameMessage: vi.fn(),
  }),
}));
vi.mock('@/hooks/useEmotes', () => ({
  useEmotes: () => ({ sendEmote: vi.fn(), emoteEvents: [] }),
}));
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({ spectate: vi.fn(), replaceMember: vi.fn() }),
}));
vi.mock('@/hooks/useLobbyAdmin', () => ({
  useLobbyAdmin: () => ({ grantAdmin: vi.fn(), toggleAdmin: vi.fn() }),
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { LobbyPlaying } from './LobbyPlaying';

function makeLobby(overrides: Partial<LobbyInfo> = {}): LobbyInfo {
  return {
    game: 'story',
    state: 'PLAYING',
    config: {},
    admin: 'u1',
    gameState: { icons: {} },
    members: [],
    players: [{ id: 'u1', playerId: 'p1', connected: true, name: 'Ada' }],
    spectators: [],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.gameState = null;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LobbyPlaying', () => {
  it('renders the GameRenderer with the active game', () => {
    render(<LobbyPlaying lobbyInfo={makeLobby()} playerId="u1" />);
    const renderer = screen.getByTestId('game-renderer');
    expect(renderer).toHaveAttribute('data-game', 'story');
  });

  it('lets the admin end the game with a two-click confirm', async () => {
    const user = userEvent.setup();
    render(<LobbyPlaying lobbyInfo={makeLobby()} playerId="u1" />);

    await user.click(screen.getByRole('button', { name: 'End game' }));
    expect(screen.getByRole('button', { name: 'Are you sure?' })).toBeInTheDocument();
    expect(mocks.endGame).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Are you sure?' }));
    expect(mocks.endGame).toHaveBeenCalledTimes(1);
  });

  it('does not show End game to a non-admin', () => {
    render(<LobbyPlaying lobbyInfo={makeLobby()} playerId="u2" />);
    expect(screen.queryByRole('button', { name: 'End game' })).not.toBeInTheDocument();
  });

  it('reflects game state (icons) pushed via game:info', () => {
    mocks.gameState = { icons: { p1: 'pencil' } };
    const { container } = render(<LobbyPlaying lobbyInfo={makeLobby()} playerId="u1" />);
    expect(container.querySelector('.fa-pencil')).toBeInTheDocument();
  });
});
