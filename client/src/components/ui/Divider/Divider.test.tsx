// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Divider } from './Divider';

afterEach(cleanup);

describe('Divider', () => {
  it('renders an <hr> when horizontal with no label', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('hr')).not.toBeNull();
  });

  it('renders the label text when provided', () => {
    render(<Divider>Lobby</Divider>);
    expect(screen.getByText('Lobby')).not.toBeNull();
  });

  it('exposes a separator role with the label', () => {
    render(<Divider>Lobby</Divider>);
    const separator = screen.getByRole('separator');
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal');
    expect(separator.textContent).toContain('Lobby');
  });

  it('renders a vertical separator', () => {
    render(<Divider orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
  });
});
