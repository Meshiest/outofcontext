import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { LobbyInfo } from '@shared/types';

const h = vi.hoisted(() => ({ logEvent: vi.fn() }));

vi.mock('@/lib/analytics', () => ({ logEvent: h.logEvent }));

import { useGameStartAnalytics } from '../useGameStartAnalytics';

const info = (state: LobbyInfo['state'], players = 3): LobbyInfo =>
  ({
    game: 'story',
    state,
    config: {},
    admin: 'a',
    gameState: { icons: {} },
    members: [],
    players: Array.from({ length: players }, (_, i) => ({ id: String(i) })),
    spectators: [],
  }) as unknown as LobbyInfo;

beforeEach(() => h.logEvent.mockClear());

/**
 * The event is edge-triggered, and every case below is a way the naive `state === 'PLAYING'` check
 * gets it wrong: lobby:info is re-pushed on every emote, join and turn, and a player can arrive at a
 * lobby that is already mid-game.
 */
describe('useGameStartAnalytics', () => {
  it('logs playing_game on the WAITING -> PLAYING edge', () => {
    const { rerender } = renderHook(({ i }) => useGameStartAnalytics(i, 'ABCD'), {
      initialProps: { i: info('WAITING') },
    });

    rerender({ i: info('PLAYING') });

    expect(h.logEvent).toHaveBeenCalledTimes(1);
    expect(h.logEvent).toHaveBeenCalledWith('playing_game', {
      game_name: 'story',
      player_count: 3,
      lobby_code: 'ABCD',
    });
  });

  it('does not re-log when a later info push repeats the PLAYING state', () => {
    const { rerender } = renderHook(({ i }) => useGameStartAnalytics(i, 'ABCD'), {
      initialProps: { i: info('WAITING') },
    });

    rerender({ i: info('PLAYING') });
    rerender({ i: info('PLAYING', 4) });

    expect(h.logEvent).toHaveBeenCalledTimes(1);
  });

  it('stays silent for a player who joins a lobby already playing', () => {
    renderHook(({ i }) => useGameStartAnalytics(i, 'ABCD'), {
      initialProps: { i: info('PLAYING') },
    });

    expect(h.logEvent).not.toHaveBeenCalled();
  });

  it('logs again when a second game starts in the same lobby', () => {
    const { rerender } = renderHook(({ i }) => useGameStartAnalytics(i, 'ABCD'), {
      initialProps: { i: info('WAITING') },
    });

    rerender({ i: info('PLAYING') });
    rerender({ i: info('WAITING') });
    rerender({ i: info('PLAYING') });

    expect(h.logEvent).toHaveBeenCalledTimes(2);
  });
});
