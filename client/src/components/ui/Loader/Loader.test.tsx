/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { Loader } from './Loader';

// The project's vitest config does not (yet) wire RTL auto-cleanup, so do it here.
afterEach(cleanup);

describe('Loader', () => {
  it('renders a status region with a spinner', () => {
    const { container } = render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).toBeTruthy();
    // The spinner is the aria-hidden animated element.
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toBeTruthy();
    expect(spinner?.className).toContain('animate-spin');
  });

  it('renders caption text below the spinner when children are provided', () => {
    render(<Loader>Waiting on Other Players</Loader>);
    expect(screen.getByText('Waiting on Other Players')).toBeTruthy();
  });

  it('uses label as the accessible name only when there is no visible text', () => {
    const { rerender } = render(<Loader label="Loading" />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Loading');

    rerender(<Loader label="Loading">Please wait</Loader>);
    // Visible text supersedes the aria-label.
    expect(screen.getByRole('status').getAttribute('aria-label')).toBeNull();
  });

  it('applies size classes to the spinner', () => {
    const { container } = render(<Loader size="xl" />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner?.className).toContain('h-16');
    expect(spinner?.className).toContain('w-16');
  });

  it('centers when centered and flows inline when inline', () => {
    const { rerender, container } = render(<Loader centered />);
    expect((container.firstChild as HTMLElement).className).toContain('mx-auto');

    rerender(<Loader inline />);
    expect((container.firstChild as HTMLElement).className).toContain('inline-flex');
  });

  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('status');
  });

  it('merges an external className', () => {
    const { container } = render(<Loader className="my-8" />);
    expect((container.firstChild as HTMLElement).className).toContain('my-8');
  });
});
