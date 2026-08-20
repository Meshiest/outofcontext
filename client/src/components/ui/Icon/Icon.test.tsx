// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Icon } from './Icon';

afterEach(cleanup);

describe('Icon', () => {
  it('renders a Font Awesome glyph for a known name', () => {
    const { container } = render(<Icon name="check" />);
    const el = container.querySelector('i.fa-solid');
    expect(el).not.toBeNull();
    expect(el?.className).toContain('fa-check');
  });

  it('applies the size class', () => {
    const { container } = render(<Icon name="shield" size="md" />);
    expect(container.querySelector('i')?.className).toContain('text-base');
  });

  it('applies a color utility class', () => {
    const { container } = render(<Icon name="heart" color="text-negative" />);
    expect(container.querySelector('i')?.className).toContain('text-negative');
  });

  it('renders nothing for an unknown name', () => {
    const { container } = render(<Icon name="totally-unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<Icon name="clock" />);
    expect(container.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes an img role when given an aria-label', () => {
    const { container } = render(<Icon name="clock" aria-label="Time left" />);
    const el = container.querySelector('i');
    expect(el?.getAttribute('role')).toBe('img');
    expect(el?.getAttribute('aria-hidden')).toBeNull();
    expect(el?.getAttribute('aria-label')).toBe('Time left');
  });
});
