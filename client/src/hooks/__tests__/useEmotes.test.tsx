import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const h = vi.hoisted(() => ({ mutate: vi.fn(), logEvent: vi.fn() }));

vi.mock('@/trpc/trpc', () => ({
  trpc: { lobby: { emote: { useMutation: () => ({ mutate: h.mutate }) } } },
}));
vi.mock('@/contexts/LobbyContext', () => ({ useEmoteEvents: () => [] }));
vi.mock('@/lib/analytics', () => ({ logEvent: h.logEvent }));

import { useEmotes } from '../useEmotes';

beforeEach(() => {
  h.mutate.mockClear();
  h.logEvent.mockClear();
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

/** The analytics call sits behind the rate gate, so it must count sends, not button presses. */
describe('useEmotes analytics', () => {
  it('logs emote_event for a sent emote', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote('heart'));

    expect(h.logEvent).toHaveBeenCalledWith('emote_event', { emote: 'heart' });
  });

  it('does not log an emote the rate gate dropped', () => {
    const { result } = renderHook(() => useEmotes());

    act(() => result.current.sendEmote('heart'));
    act(() => result.current.sendEmote('laugh'));

    expect(h.logEvent).toHaveBeenCalledTimes(1);
  });
});
