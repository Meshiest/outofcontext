import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { useEmoteAnimation } from './useEmoteAnimation';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useEmoteAnimation', () => {
  it('adds an emote for a player', () => {
    const { result } = renderHook(() => useEmoteAnimation());
    act(() => result.current.showEmote('p1', 'smile'));
    expect(result.current.emotes.p1.emote).toBe('smile');
  });

  it('replaces the previous emote for the same player', () => {
    const { result } = renderHook(() => useEmoteAnimation());
    act(() => result.current.showEmote('p1', 'smile'));
    const firstKey = result.current.emotes.p1.key;
    act(() => result.current.showEmote('p1', 'frown'));
    expect(result.current.emotes.p1.emote).toBe('frown');
    expect(result.current.emotes.p1.key).not.toBe(firstKey);
  });

  it('removes an emote after 3 seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEmoteAnimation());
    act(() => result.current.showEmote('p1', 'smile'));
    expect(result.current.emotes.p1).toBeDefined();
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.emotes.p1).toBeUndefined();
  });

  it('clears pending timers on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = renderHook(() => useEmoteAnimation());
    act(() => result.current.showEmote('p1', 'smile'));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
