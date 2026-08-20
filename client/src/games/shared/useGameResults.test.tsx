import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameResults } from './useGameResults';
import type { GameState } from '@shared/types';

const h = vi.hoisted(() => ({
  gameState: null as GameState | null,
  results: {} as Record<string, unknown[]>,
  send: vi.fn(),
}));

vi.mock('@/contexts/GameStateContext', () => ({
  useGameState: () => ({
    gameState: h.gameState,
    playerInfo: null,
    results: h.results,
    reactionEvents: [],
  }),
}));

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    gameState: h.gameState,
    playerInfo: null,
    startGame: vi.fn(),
    endGame: vi.fn(),
    sendGameMessage: h.send,
  }),
}));

const state = (isComplete: boolean): GameState =>
  ({ icons: {}, progress: isComplete ? 1 : 0.5, isComplete }) as GameState;

beforeEach(() => {
  h.gameState = null;
  h.results = {};
  h.send.mockClear();
});

describe('useGameResults', () => {
  it('asks for results as soon as the game reports complete', () => {
    h.gameState = state(false);
    const { rerender } = renderHook(() => useGameResults('comic:result'));
    expect(h.send).not.toHaveBeenCalled();

    h.gameState = state(true);
    rerender();
    expect(h.send).toHaveBeenCalledWith('comic:result');
  });

  it('asks once, not on every subsequent render', () => {
    h.gameState = state(true);
    const { rerender } = renderHook(() => useGameResults('comic:result'));
    rerender();
    rerender();
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('asks again for the NEXT game, after a round that already delivered results', () => {
    // The failure this guards: the "already asked" latch persists across games, so the second
    // round's results are never requested and the viewer spins forever - which is exactly what a
    // page refresh papers over, because a fresh mount starts the latch clear.
    h.gameState = state(true);
    const { rerender } = renderHook(() => useGameResults('comic:result'));
    expect(h.send).toHaveBeenCalledTimes(1);

    // A new game starts: the server pushes isComplete false and results are cleared.
    h.gameState = state(false);
    h.results = {};
    rerender();

    // ...and that game finishes too.
    h.gameState = state(true);
    rerender();
    expect(h.send).toHaveBeenCalledTimes(2);
  });

  it('stops asking once the results arrive', () => {
    h.gameState = state(true);
    const { rerender } = renderHook(() => useGameResults('comic:result'));
    expect(h.send).toHaveBeenCalledTimes(1);

    h.results = { 'comic:result': [[{ link: {}, editor: 'p1' }]] };
    rerender();
    rerender();
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('keeps asking while the answer never arrives, then gives up', () => {
    vi.useFakeTimers();
    h.gameState = state(true);
    renderHook(() => useGameResults('comic:result'));
    expect(h.send).toHaveBeenCalledTimes(1);

    // The reply channel has no delivery guarantee, so an unanswered request is retried.
    vi.advanceTimersByTime(2500 * 3);
    expect(h.send.mock.calls.length).toBeGreaterThan(1);

    // ...but not forever.
    vi.advanceTimersByTime(2500 * 50);
    const settled = h.send.mock.calls.length;
    vi.advanceTimersByTime(2500 * 50);
    expect(h.send.mock.calls.length).toBe(settled);
    vi.useRealTimers();
  });
});
