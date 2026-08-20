import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameWaiting } from './GameWaiting';

describe('GameWaiting', () => {
  it('renders the provided (already-translated) message', () => {
    render(<GameWaiting message="Waiting on Other Authors" />);
    expect(screen.getByText('Waiting on Other Authors')).toBeInTheDocument();
  });

  it('exposes a live status region', () => {
    render(<GameWaiting message="Stories are Being Written" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
