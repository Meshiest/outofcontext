import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { LobbyInfo } from '@shared/types';

const h = vi.hoisted(() => ({
  info: null as LobbyInfo | null,
  code: null as string | null,
  playerId: 'me',
}));

vi.mock('@/contexts/LobbyContext', () => ({
  useLobbyInfo: () => ({ lobbyInfo: h.info, code: h.code, playerId: h.playerId, nameOk: null }),
}));
vi.mock('@/trpc/trpc', () => {
  const mutation = () => ({ mutate: vi.fn(), isPending: false });
  return {
    trpc: {
      lobby: {
        create: { useMutation: mutation },
        join: { useMutation: mutation },
        leave: { useMutation: mutation },
        spectate: { useMutation: mutation },
        replace: { useMutation: mutation },
      },
    },
  };
});

import { useLobby } from '../useLobby';

function lobby(overrides: Partial<LobbyInfo> = {}): LobbyInfo {
  return {
    game: 'story',
    state: 'WAITING',
    config: {},
    admin: 'someone',
    gameState: { icons: {} },
    members: [],
    players: [],
    spectators: [],
    ...overrides,
  };
}

beforeEach(() => {
  h.info = null;
  h.code = null;
  h.playerId = 'me';
});

/**
 * Only the derived values are worth covering - the actions are one-line pass-throughs to mutations.
 * `lobbyState` is a four-way ladder whose order matters: having a code but no info yet is LOADING,
 * not NO_LOBBY, and that distinction is what keeps the UI from flashing "no such lobby" during the
 * round trip after a join.
 */
describe('useLobby derived state', () => {
  it('is NO_LOBBY with no code', () => {
    const { result } = renderHook(() => useLobby());
    expect(result.current.lobbyState).toBe('NO_LOBBY');
    expect(result.current.validLobby).toBe(false);
  });

  it('is LOADING once a code is known but the info has not arrived', () => {
    h.code = 'abcd';
    const { result } = renderHook(() => useLobby());
    expect(result.current.lobbyState).toBe('LOADING');
  });

  it('is LOBBY_WAITING when the lobby is idle', () => {
    h.code = 'abcd';
    h.info = lobby({ state: 'WAITING' });
    const { result } = renderHook(() => useLobby());
    expect(result.current.lobbyState).toBe('LOBBY_WAITING');
    expect(result.current.validLobby).toBe(true);
  });

  it('is PLAYING when a game is running', () => {
    h.code = 'abcd';
    h.info = lobby({ state: 'PLAYING' });
    const { result } = renderHook(() => useLobby());
    expect(result.current.lobbyState).toBe('PLAYING');
  });

  it('reports isSpectator only when this member is in the spectator list', () => {
    h.code = 'abcd';
    h.info = lobby({ spectators: [{ id: 'someone-else', name: 'Bo' }] });
    expect(renderHook(() => useLobby()).result.current.isSpectator).toBe(false);

    h.info = lobby({ spectators: [{ id: 'me', name: 'Ada' }] });
    expect(renderHook(() => useLobby()).result.current.isSpectator).toBe(true);
  });
});
