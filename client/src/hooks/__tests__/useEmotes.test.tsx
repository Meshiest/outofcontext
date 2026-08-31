import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const h = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/trpc/trpc', () => ({
  trpc: { lobby: { emote: { useMutation: () => ({ mutate: h.mutate }) } } },
}));
vi.mock('@/contexts/LobbyContext', () => ({ useEmoteEvents: () => [] }));

import { useEmotes } from '../useEmotes';

beforeEach(() => {
  h.mutate.mockClear();
  vi.useFakeTimers();
});

/**
 * Only the rate gate is worth testing here - the rest of the hook is a pass-through. The gate
 * mirrors the server's own 400ms limit, and a regression is invisible in manual play: the server
 * silently drops the extra emote, so it just occasionally does not appear.
 */
describe('useEmotes rate limiting', () => {
  it('drops a second emote sent inside the window', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote('heart'));
    act(() => result.current.sendEmote('laugh'));

    expect(h.mutate).toHaveBeenCalledTimes(1);
    expect(h.mutate).toHaveBeenCalledWith('heart');
  });

  it('allows the next one once the window has passed', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote('heart'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => result.current.sendEmote('laugh'));

    expect(h.mutate).toHaveBeenCalledTimes(2);
    expect(h.mutate).toHaveBeenLastCalledWith('laugh');
  });

  it('keeps rejecting until the window is actually up', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote('heart'));
    act(() => {
      vi.advanceTimersByTime(399);
    });
    act(() => result.current.sendEmote('laugh'));

    expect(h.mutate).toHaveBeenCalledTimes(1);
  });
});
