/** @vitest-environment jsdom */
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Dimmer } from './Dimmer';

afterEach(cleanup);

describe('Dimmer', () => {
  it('renders children when active', () => {
    render(
      <Dimmer active>
        <p>Overlay content</p>
      </Dimmer>,
    );
    expect(screen.getByText('Overlay content')).toBeTruthy();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(
      <Dimmer active={false}>
        <p>Hidden content</p>
      </Dimmer>,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('renders a full-screen overlay element', () => {
    const { container } = render(
      <Dimmer active>
        <span>x</span>
      </Dimmer>,
    );
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dimmer active onClose={onClose}>
        <span>x</span>
      </Dimmer>,
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not throw on Escape when onClose is omitted', () => {
    const { container } = render(
      <Dimmer active>
        <span>x</span>
      </Dimmer>,
    );
    expect(() =>
      fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' }),
    ).not.toThrow();
  });

  it('moves focus into the overlay when it activates', () => {
    const { rerender, container } = render(
      <Dimmer active={false}>
        <span>x</span>
      </Dimmer>,
    );
    rerender(
      <Dimmer active>
        <span>x</span>
      </Dimmer>,
    );
    expect(document.activeElement).toBe(container.firstChild);
  });
});
