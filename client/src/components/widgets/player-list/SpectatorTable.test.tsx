import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpectatorTable } from './SpectatorTable';
import type { Spectator } from './types';

describe('SpectatorTable', () => {
  it('renders named spectators', () => {
    const spectators: Spectator[] = [{ id: 's1', name: 'Cy' }];
    render(<SpectatorTable spectators={spectators} currentUserId="s1" />);
    expect(screen.getByText('Cy')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'You' })).toBeInTheDocument();
  });

  it('shows "Pending" for unnamed spectators', () => {
    const spectators: Spectator[] = [{ id: 's2' }];
    render(<SpectatorTable spectators={spectators} currentUserId="s1" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows an empty state when there are no spectators', () => {
    render(<SpectatorTable spectators={[]} currentUserId="s1" />);
    expect(screen.getByText('No spectators')).toBeInTheDocument();
  });
});
