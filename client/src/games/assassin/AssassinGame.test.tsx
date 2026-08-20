import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameState, PlayerState, LobbyInfo } from '@shared/types';

const h = vi.hoisted(() => ({
  gameState: null as GameState | null,
  playerInfo: null as PlayerState | null,
  lobbyInfo: null as LobbyInfo | null,
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

vi.mock('@/contexts/LobbyContext', () => ({
  useLobbyInfo: () => ({ lobbyInfo: h.lobbyInfo, code: 'ABCD', playerId: 'p1', nameOk: true }),
}));

import AssassinGame from './AssassinGame';

function lobby(): LobbyInfo {
  return {
    game: 'assassin',
    state: 'PLAYING',
    config: {},
    admin: 'p1',
    gameState: { icons: {} },
    members: [],
    players: [
      { id: '1', playerId: 'p1', connected: true, name: 'Alice' },
      { id: '2', playerId: 'p2', connected: true, name: 'Bob' },
    ],
    spectators: [],
  };
}

beforeEach(() => {
  h.gameState = { icons: {} };
  h.playerInfo = null;
  h.lobbyInfo = lobby();
  h.send = vi.fn();
});

describe('AssassinGame', () => {
  it('emits assassin:done true when Done is clicked in READING state', async () => {
    h.gameState = { icons: {}, battleRoyale: false } as GameState;
    h.playerInfo = {
      id: 'p1',
      state: 'READING',
      title: 'crimson wolf',
      target: 'p2',
      words: ['banana'],
    } as PlayerState;

    const user = userEvent.setup();
    render(<AssassinGame />);

    // Target player id p2 is resolved to the display name from lobby info.
    expect(screen.getByText('Bob')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /done/i }));
    expect(h.send).toHaveBeenCalledWith('assassin:done', true);
  });

  it('emits assassin:done false when Show Dossier is clicked in DONE state', async () => {
    h.playerInfo = { id: 'p1', state: 'DONE', title: 'crimson wolf' } as PlayerState;

    const user = userEvent.setup();
    render(<AssassinGame />);

    await user.click(screen.getByRole('button', { name: /show dossier/i }));
    expect(h.send).toHaveBeenCalledWith('assassin:done', false);
  });

  it('shows the collecting-intel fallback when the player has no assignment yet', () => {
    h.playerInfo = null;
    render(<AssassinGame />);
    expect(screen.getByText('Wurderers Collecting Intel')).toBeInTheDocument();
  });
});
