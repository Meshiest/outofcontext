import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({
  vibrate: vi.fn(),
  play: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({ vibrate: h.vibrate, supported: true }),
}));

vi.mock('@/data/sounds', () => ({
  useTurnSound: () => h.play,
}));

vi.mock('@/lib/analytics', () => ({
  logEvent: h.logEvent,
}));

vi.mock('@/contexts/LobbyContext', () => ({
  useLobbyInfo: () => ({
    lobbyInfo: { game: 'story' },
    code: 'abcd',
    playerId: 'p1',
    nameOk: true,
  }),
}));

import { useTurnEffects } from './useTurnEffects';

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(initial: string | null) {
  return renderHook(({ state }) => useTurnEffects(state), {
    initialProps: { state: initial },
  });
}

describe('useTurnEffects', () => {
  it('does not fire effects on the seeding (first non-null) state', () => {
    const { rerender } = setup(null);
    rerender({ state: 'WAITING' }); // first non-null -> seed only
    expect(h.vibrate).not.toHaveBeenCalled();
    expect(h.play).not.toHaveBeenCalled();
    expect(h.logEvent).not.toHaveBeenCalled();
  });

  it('vibrates, plays the turn sound, and logs wait_event on EDITING', () => {
    const { rerender } = setup('WAITING'); // seed
    rerender({ state: 'EDITING' });
    expect(h.vibrate).toHaveBeenCalledWith(40);
    expect(h.play).toHaveBeenCalledTimes(1);
    expect(h.logEvent).toHaveBeenCalledWith(
      'wait_event',
      expect.objectContaining({
        wait_duration: expect.any(Number),
        game_name: 'story',
        lobby_code: 'abcd',
      }),
    );
  });

  it('vibrates the reading pattern on READING', () => {
    const { rerender } = setup('WAITING'); // seed
    rerender({ state: 'READING' });
    expect(h.vibrate).toHaveBeenCalledWith([40, 100, 40]);
    expect(h.play).not.toHaveBeenCalled();
  });

  it('logs turn_event on WAITING (after the seed)', () => {
    const { rerender } = setup('EDITING'); // seed
    rerender({ state: 'WAITING' });
    expect(h.logEvent).toHaveBeenCalledWith(
      'turn_event',
      expect.objectContaining({ turn_duration: expect.any(Number) }),
    );
  });

  it('does not re-fire when the state repeats', () => {
    const { rerender } = setup('WAITING'); // seed
    rerender({ state: 'EDITING' });
    h.vibrate.mockClear();
    h.play.mockClear();
    h.logEvent.mockClear();
    rerender({ state: 'EDITING' }); // same state again
    expect(h.vibrate).not.toHaveBeenCalled();
    expect(h.play).not.toHaveBeenCalled();
    expect(h.logEvent).not.toHaveBeenCalled();
  });
});
