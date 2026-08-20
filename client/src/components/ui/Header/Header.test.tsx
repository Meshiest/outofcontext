import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { Header, HeaderSubheader } from './Header';

describe('Header', () => {
  it('defaults to an h2 element', () => {
    render(<Header>Title</Header>);
    const heading = screen.getByRole('heading', { name: 'Title' });
    expect(heading.tagName).toBe('H2');
  });

  it('renders the requested heading level via the as prop', () => {
    render(<Header as="h4">Section</Header>);
    const heading = screen.getByRole('heading', { level: 4, name: 'Section' });
    expect(heading.tagName).toBe('H4');
  });

  it('renders a decorative icon before the text', () => {
    render(<Header icon={<svg data-testid="icon" />}>Write the first line</Header>);
    const heading = screen.getByRole('heading', { name: 'Write the first line' });
    expect(heading).toBeInTheDocument();
    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    // The icon lives in an aria-hidden wrapper so it is not part of the accessible name.
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a custom className', () => {
    render(<Header className="custom-header">Title</Header>);
    expect(screen.getByRole('heading').className).toContain('custom-header');
  });

  it('forwards a ref to the heading element', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Header ref={ref}>Title</Header>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('renders a muted subheader', () => {
    render(<HeaderSubheader>You must draw this:</HeaderSubheader>);
    const sub = screen.getByText('You must draw this:');
    expect(sub).toBeInTheDocument();
    expect(sub.className).toContain('text-text-muted');
  });
});
