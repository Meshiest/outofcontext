import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PlayerTable } from './PlayerTable';
import type { Player } from './types';

const players: Player[] = [
  { id: 'u1', playerId: 'p1', name: 'Ada', connected: true },
  { id: 'u2', playerId: 'p2', name: 'Bo', connected: true },
];

describe('PlayerTable', () => {
  it('renders a row per player', () => {
    render(<PlayerTable players={players} currentUserId="u1" adminId="u1" />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Bo')).toBeInTheDocument();
  });

  it('shows an empty state when there are no players', () => {
    render(<PlayerTable players={[]} currentUserId="u1" adminId="u1" />);
    expect(screen.getByText('No players')).toBeInTheDocument();
  });

  it('renders header actions in the players header cell', () => {
    render(
      <PlayerTable
        players={players}
        currentUserId="u1"
        adminId="u1"
        headerActions={<button type="button">toggle</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'toggle' })).toBeInTheDocument();
  });

  it('passes game status icons through to rows', () => {
    const { container } = render(
      <PlayerTable
        players={players}
        currentUserId="u1"
        adminId="u1"
        gameIcons={{ p2: 'pencil' }}
      />,
    );
    expect(container.querySelector('.fa-pencil')).toBeInTheDocument();
  });
});
