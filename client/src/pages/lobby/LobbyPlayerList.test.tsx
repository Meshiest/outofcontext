import '@/i18n';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { EmoteEvent } from '@/contexts/LobbyContext';
import type { LobbyInfo } from '@shared/types';

const mocks = vi.hoisted(() => ({
  showEmote: vi.fn(),
  emoteEvents: [] as EmoteEvent[],
}));

vi.mock('@/components/widgets/player-list/PlayerList', async () => {
  const react = await import('react');
  return {
    PlayerList: function PlayerListMock(props: {
      ref?: React.Ref<{ showEmote: (id: string, emote: string) => void }>;
      players: { name: string }[];
    }) {
      react.useImperativeHandle(props.ref, () => ({ showEmote: mocks.showEmote }), []);
      return <div data-testid="player-list">{props.players.map((p) => p.name).join(',')}</div>;
    },
  };
});
vi.mock('@/hooks/useEmotes', () => ({
  useEmotes: () => ({ sendEmote: vi.fn(), emoteEvents: mocks.emoteEvents }),
}));
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({ spectate: vi.fn(), replaceMember: vi.fn() }),
}));
vi.mock('@/hooks/useLobbyAdmin', () => ({
  useLobbyAdmin: () => ({ grantAdmin: vi.fn(), toggleAdmin: vi.fn() }),
}));
vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({ endGame: vi.fn() }),
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { LobbyPlayerList } from './LobbyPlayerList';

function makeLobby(overrides: Partial<LobbyInfo> = {}): LobbyInfo {
  return {
    game: 'story',
    state: 'WAITING',
    config: {},
    admin: 'u1',
    gameState: { icons: {} },
    members: [],
    players: [
      { id: 'u1', playerId: 'p1', connected: true, name: 'Ada' },
      { id: 'u2', playerId: 'p2', connected: true, name: 'Bo' },
    ],
    spectators: [],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.emoteEvents = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LobbyPlayerList', () => {
  it('forwards the lobby players to the PlayerList', () => {
    render(<LobbyPlayerList lobbyInfo={makeLobby()} playerId="u1" lobbyState="WAITING" />);
    expect(screen.getByTestId('player-list')).toHaveTextContent('Ada,Bo');
  });

  it('feeds a received emote into the list via showEmote', async () => {
    mocks.emoteEvents = [{ playerId: 'p2', emote: 'smile', id: 'e1' }];
    render(<LobbyPlayerList lobbyInfo={makeLobby()} playerId="u1" lobbyState="WAITING" />);
    await waitFor(() => expect(mocks.showEmote).toHaveBeenCalledWith('p2', 'smile'));
  });
});
