import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { JoinSpectateButton } from './JoinSpectateButton';

describe('JoinSpectateButton', () => {
  it('shows Spectate for a player', async () => {
    const user = userEvent.setup();
    const onSpectate = vi.fn();
    render(
      <JoinSpectateButton
        isPlayer
        isSpectator={false}
        canJoinPlayers={false}
        onSpectate={onSpectate}
      />,
    );
    const button = screen.getByRole('button', { name: 'Spectate' });
    await user.click(button);
    expect(onSpectate).toHaveBeenCalledTimes(1);
  });

  it('shows Join players and Leave for a spectator who may join', async () => {
    const user = userEvent.setup();
    const onJoinPlayers = vi.fn();
    const onLeave = vi.fn();
    render(
      <JoinSpectateButton
        isPlayer={false}
        isSpectator
        canJoinPlayers
        onJoinPlayers={onJoinPlayers}
        onLeave={onLeave}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Join players' }));
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onJoinPlayers).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('shows only Leave for a spectator who cannot join', () => {
    render(<JoinSpectateButton isPlayer={false} isSpectator canJoinPlayers={false} />);
    expect(screen.queryByRole('button', { name: 'Join players' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  // Joining is the encouraged action; leaving is the way back out, not a second equal call
  // to action.
  it('makes Join players the green button and Leave a plain one with a back arrow', () => {
    const { container } = render(
      <JoinSpectateButton isPlayer={false} isSpectator canJoinPlayers />,
    );
    expect(screen.getByRole('button', { name: 'Join players' })).toHaveClass('btn-positive');

    const leave = screen.getByRole('button', { name: 'Leave' });
    expect(leave).not.toHaveClass('btn-positive');
    expect(leave).not.toHaveClass('text-positive');
    expect(container.querySelector('.fa-arrow-left')).toBeInTheDocument();
  });

  it('renders nothing for a non-player non-spectator', () => {
    const { container } = render(
      <JoinSpectateButton isPlayer={false} isSpectator={false} canJoinPlayers={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
