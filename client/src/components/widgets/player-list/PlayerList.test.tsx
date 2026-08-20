import '@/i18n';
import { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PlayerList, type PlayerListHandle, type PlayerListProps } from './PlayerList';
import type { Player, Spectator } from './types';

const players: Player[] = [
  { id: 'u1', playerId: 'p1', name: 'Ada', connected: true },
  { id: 'u2', playerId: 'p2', name: 'Bo', connected: true },
];
const spectators: Spectator[] = [{ id: 's1', name: 'Cy' }, { id: 's2' }];

function setup(overrides: Partial<PlayerListProps> = {}) {
  const props: PlayerListProps = {
    players,
    spectators,
    admin: 'u1',
    currentUserId: 'u1',
    isSpectator: false,
    canJoinPlayers: false,
    lobbyState: 'WAITING',
    gameState: { icons: {} },
    ...overrides,
  };
  return render(<PlayerList {...props} />);
}

describe('PlayerList', () => {
  it('renders both tables and the heading', () => {
    setup();
    expect(screen.getByText('Lobby members')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Spectators')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Cy')).toBeInTheDocument();
  });

  it('shows admin toggles only for the admin (emote toggle always)', () => {
    setup({ currentUserId: 'u1', admin: 'u1' });
    expect(screen.getByRole('button', { name: 'Toggle emotes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grant admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove players' })).toBeInTheDocument();
  });

  it('hides admin toggles for non-admins', () => {
    setup({ currentUserId: 'u2', admin: 'u1' });
    expect(screen.getByRole('button', { name: 'Toggle emotes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grant admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove players' })).not.toBeInTheDocument();
  });

  it('opens the emote bar when the emote toggle is clicked', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByRole('button', { name: 'smile' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle emotes' }));
    expect(screen.getByRole('button', { name: 'smile' })).toBeInTheDocument();
  });

  it('keeps the toggle in the players table header but renders the popup outside it (not clipped)', async () => {
    const user = userEvent.setup();
    setup();
    const playersTable = screen.getByText('Players').closest('table');
    expect(playersTable).not.toBeNull();
    expect(playersTable).toContainElement(screen.getByRole('button', { name: 'Toggle emotes' }));
    await user.click(screen.getByRole('button', { name: 'Toggle emotes' }));
    // The emote popup renders outside the table, so the table's overflow:hidden cannot clip it.
    expect(playersTable).not.toContainElement(screen.getByRole('button', { name: 'smile' }));
  });

  it('keeps grant and remove modes mutually exclusive', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Grant admin' }));
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove players' }));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
  });

  it('shows a replace button to spectators on a disconnected player row', () => {
    const onReplace = vi.fn();
    setup({
      currentUserId: 's1',
      isSpectator: true,
      players: [{ id: 'u2', playerId: 'p2', name: 'Bo', connected: false }],
      onReplace,
    });
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });

  it('shows the Spectate action to a player', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Spectate' })).toBeInTheDocument();
  });

  it('animates an emote when showEmote is called via the ref', () => {
    const ref = createRef<PlayerListHandle>();
    const { container } = setup({ ref });
    act(() => ref.current?.showEmote('u1', 'smile'));
    expect(container.querySelector('.ooc-emote')).toBeInTheDocument();
    expect(container.querySelector('.fa-face-smile')).toBeInTheDocument();
  });
});
