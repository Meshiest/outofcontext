import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes progressbar role with aria value range', () => {
    render(<Progress percent={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets the fill width proportional to percent', () => {
    render(<Progress percent={40} />);
    const fill = screen.getByRole('progressbar').firstElementChild;
    expect(fill).toHaveStyle({ width: '40%' });
  });

  it('clamps percent to the 0-100 range', () => {
    const { rerender } = render(<Progress percent={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    rerender(<Progress percent={-25} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows the rounded percent when label is true', () => {
    render(<Progress percent={71.6} label />);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '72');
  });

  it('renders a string label and names the bar', () => {
    render(<Progress percent={10} label="Round 1" />);
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Round 1');
  });

  it('applies the color class to the fill', () => {
    render(<Progress percent={50} color="positive" />);
    const fill = screen.getByRole('progressbar').firstElementChild;
    expect(fill?.className).toContain('bg-positive');
  });
});
