import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InkBudget } from './InkBudget';
import { COST } from './redactedUtils';

describe('InkBudget', () => {
  it('shows remaining censor capacity (floor(ink/cost) - used)', () => {
    render(<InkBudget ink={25} cost={COST} used={2} mode="censor" />);
    // capacity = floor(25 / 5) = 5, remaining = 5 - 2 = 3
    expect(screen.getByText(/3\/5 redactions left/)).toBeInTheDocument();
  });

  it('shows remaining truncate capacity using the truncate cost', () => {
    render(<InkBudget ink={25} cost={COST} used={0} mode="truncate" />);
    // capacity = floor(25 / 2) = 12
    expect(screen.getByText(/12\/12 redactions left/)).toBeInTheDocument();
  });

  it('never shows negative remaining', () => {
    render(<InkBudget ink={10} cost={COST} used={5} mode="censor" />);
    // capacity = 2, used 5 -> clamp remaining to 0
    expect(screen.getByText(/0\/2 redactions left/)).toBeInTheDocument();
  });
});
