import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { LobbyInfo } from '@shared/types';

const mocks = vi.hoisted(() => ({
  isAdmin: true,
  setGame: vi.fn(),
  setConfig: vi.fn(),
  startGame: vi.fn(),
}));

vi.mock('@/hooks/useLobbyAdmin', () => ({
  useLobbyAdmin: () => ({
    isAdmin: mocks.isAdmin,
    setGame: mocks.setGame,
    setConfig: mocks.setConfig,
    toggleAdmin: vi.fn(),
    grantAdmin: vi.fn(),
  }),
}));
vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    startGame: mocks.startGame,
    endGame: vi.fn(),
    gameState: null,
    playerInfo: null,
    sendGameMessage: vi.fn(),
  }),
}));
vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => ({ streamerMode: false }),
}));
vi.mock('./LobbyPlayerList', () => ({
  LobbyPlayerList: () => <div data-testid="player-list" />,
}));
vi.mock('@/components/widgets/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="settings" />,
}));

import { LobbyWaiting } from './LobbyWaiting';

function makeLobby(overrides: Partial<LobbyInfo> = {}): LobbyInfo {
  return {
    game: 'story',
    state: 'WAITING',
    config: {},
    admin: 'p1',
    gameState: { icons: {} },
    members: [],
    players: [
      { id: 'p1', playerId: 'p1', connected: true, name: 'Ada' },
      { id: 'p2', playerId: 'p2', connected: true, name: 'Bo' },
    ],
    spectators: [],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.isAdmin = true;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LobbyWaiting', () => {
  it('shows the game info card and admin controls when a game is selected (admin)', () => {
    const { container } = render(
      <LobbyWaiting lobbyInfo={makeLobby()} playerId="p1" code="wxyz" />,
    );
    expect(container.querySelector('[data-game="story"]')).toBeInTheDocument();
    expect(screen.queryByText('WXYZ')).not.toBeInTheDocument();
    // Admin-only controls: the GameSelector (its "Game" label) and Start Game.
    expect(screen.getByText('Game')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    expect(screen.getByTestId('player-list')).toBeInTheDocument();
  });

  it('shows read-only config and hides admin controls for a non-admin', () => {
    mocks.isAdmin = false;
    render(<LobbyWaiting lobbyInfo={makeLobby()} playerId="p2" code="wxyz" />);
    // Read-only stat labels (cfg.text) instead of editable fields.
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.queryByText('Game')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Game' })).not.toBeInTheDocument();
  });

  it('shows the lobby code header when no game is selected', () => {
    render(<LobbyWaiting lobbyInfo={makeLobby({ game: '' })} playerId="p1" code="wxyz" />);
    // The code renders as per-character keycaps exposed as a single aria-label.
    expect(screen.getByLabelText('WXYZ')).toBeInTheDocument();
    // No game info card without a selected game.
    expect(screen.queryByRole('button', { name: 'Start Game' })).not.toBeInTheDocument();
  });
});
