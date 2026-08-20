import '@/i18n';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameRenderer } from './GameRenderer';

// Flush microtasks + a macrotask inside act() so the lazy import promise resolves and React commits
// the loaded stub without an "update not wrapped in act" warning.
async function flushLazy() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('GameRenderer', () => {
  it('shows the Suspense loading fallback for a known game', async () => {
    render(<GameRenderer game="story" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    await flushLazy();
    // The lazy stub itself renders a waiting status, so a status region remains after it mounts.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('mounts each of the 6 known games without error', async () => {
    for (const game of ['story', 'comic', 'draw', 'redacted', 'recipe', 'assassin']) {
      const { unmount } = render(<GameRenderer game={game} />);
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      await flushLazy();
      unmount();
    }
  });

  it('renders nothing for an unknown game', () => {
    const { container } = render(<GameRenderer game="nosuchgame" />);
    expect(container).toBeEmptyDOMElement();
  });
});
