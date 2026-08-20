import '@/i18n';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { EndGameButton } from './EndGameButton';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('EndGameButton', () => {
  it('is hidden when the user is not admin', () => {
    render(<EndGameButton isAdmin={false} lobbyState="PLAYING" onEndGame={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is hidden when not playing', () => {
    render(<EndGameButton isAdmin lobbyState="WAITING" onEndGame={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('arms a confirmation on first click and ends on the second', async () => {
    const user = userEvent.setup();
    const onEndGame = vi.fn();
    render(<EndGameButton isAdmin lobbyState="PLAYING" onEndGame={onEndGame} />);
    await user.click(screen.getByRole('button', { name: 'End game' }));
    expect(screen.getByRole('button', { name: 'Are you sure?' })).toBeInTheDocument();
    expect(onEndGame).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Are you sure?' }));
    expect(onEndGame).toHaveBeenCalledTimes(1);
  });

  it('auto-resets the confirmation after 1 second', () => {
    vi.useFakeTimers();
    render(<EndGameButton isAdmin lobbyState="PLAYING" onEndGame={() => {}} />);
    // userEvent uses real timers, so drive this case with fireEvent.
    fireEvent.click(screen.getByRole('button', { name: 'End game' }));
    expect(screen.getByRole('button', { name: 'Are you sure?' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button', { name: 'End game' })).toBeInTheDocument();
  });
});
