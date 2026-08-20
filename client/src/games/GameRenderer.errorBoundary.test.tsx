import '@/i18n';
import { render, screen, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

// Simulate the real failure this boundary exists for: a stale chunk after a deploy, where the
// dynamic import rejects. Only Raconteur is broken, so the recovery case has a working game to
// switch to.
vi.mock('./story/StoryGame', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

// A game that loads fine, stubbed because the real one needs the game/lobby providers this test
// does not mount - it would throw and be caught by the very boundary under test, which would make
// "did the boundary reset?" untestable. Returning a string keeps it JSX-free inside a hoisted factory.
vi.mock('./assassin/AssassinGame', () => ({ default: () => 'second game mounted' }));

import { GameRenderer } from './GameRenderer';

async function flushLazy() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  // React logs the caught error; silence it so a passing run stays readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GameRenderer error boundary', () => {
  it('shows the waiting fallback instead of crashing when a game chunk fails to load', async () => {
    render(<GameRenderer game="story" />);
    await flushLazy();

    // The boundary's fallback, not a blank screen and not a thrown render.
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not latch: a different game still mounts after one failed', async () => {
    // The `key={game}` on the boundary is what makes this work - without it `hasError` stays true
    // and every subsequent game in the session renders the fallback forever.
    const { rerender } = render(<GameRenderer game="story" />);
    await flushLazy();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<GameRenderer game="assassin" />);
    await flushLazy();

    // Asserted on the second game's own output: the error fallback is itself a GameWaiting with a
    // status role, so a role-based check cannot tell a recovered mount from a latched boundary.
    expect(screen.getByText('second game mounted')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).toBeNull();
  });
});
