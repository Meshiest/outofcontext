import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PlayerRow } from './PlayerRow';
import type { Player } from './types';

const base: Player = { id: 'u1', playerId: 'p1', name: 'Ada', connected: true };

function renderRow(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  );
}

describe('PlayerRow', () => {
  it('renders the player name', () => {
    renderRow(<PlayerRow player={base} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('shows the admin shield for the admin', () => {
    renderRow(<PlayerRow player={base} isAdmin />);
    expect(screen.getByRole('img', { name: 'Admin' })).toBeInTheDocument();
  });

  it('shows the user icon for the current user', () => {
    renderRow(<PlayerRow player={base} isCurrentUser />);
    expect(screen.getByRole('img', { name: 'You' })).toBeInTheDocument();
  });

  it('renders a game status icon when provided', () => {
    const { container } = renderRow(<PlayerRow player={base} statusIcon="pencil" />);
    expect(container.querySelector('.fa-pencil')).toBeInTheDocument();
  });

  it('shows the disconnect icon and negative styling when disconnected', () => {
    renderRow(<PlayerRow player={{ ...base, connected: false }} />);
    expect(screen.getByRole('img', { name: 'Disconnected' })).toBeInTheDocument();
    expect(screen.getByText('Ada').closest('tr')).toHaveClass('bg-negative/15');
  });

  it('applies positive styling for the current user', () => {
    renderRow(<PlayerRow player={base} isCurrentUser />);
    expect(screen.getByText('Ada').closest('tr')).toHaveClass('bg-positive/15');
  });
});
