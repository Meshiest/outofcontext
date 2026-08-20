import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameProgress } from './GameProgress';

describe('GameProgress', () => {
  it('renders a progressbar with the rounded percentage', () => {
    render(<GameProgress progress={0.734} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '73');
    expect(screen.getByText('73%')).toBeInTheDocument();
  });

  it('renders nothing when complete', () => {
    const { container } = render(<GameProgress progress={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders 0% at the start', () => {
    render(<GameProgress progress={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
