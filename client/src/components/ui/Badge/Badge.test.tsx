// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Badge } from './Badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders a text pill', () => {
    render(<Badge variant="success">Connected</Badge>);
    const badge = screen.getByText('Connected');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-positive');
  });

  it('applies the variant class', () => {
    render(<Badge variant="error">Offline</Badge>);
    expect(screen.getByText('Offline').className).toContain('text-negative');
  });

  it('collapses to a dot with no children', () => {
    const { container } = render(<Badge variant="success" aria-label="Connected" />);
    const dot = container.firstElementChild as HTMLElement;
    expect(dot.textContent).toBe('');
    expect(dot.className).toContain('bg-positive');
    expect(dot.getAttribute('aria-label')).toBe('Connected');
  });
});
