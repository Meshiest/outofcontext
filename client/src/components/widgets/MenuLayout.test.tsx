import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MenuLayout } from './MenuLayout';

describe('MenuLayout', () => {
  it('renders the title', () => {
    render(<MenuLayout title="Out Of Context" />);
    expect(screen.getByText('Out Of Context')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<MenuLayout title="Title" subtitle="A subtitle" />);
    expect(screen.getByText('A subtitle')).toBeInTheDocument();
  });

  it('omits the subtitle element when not provided', () => {
    render(<MenuLayout title="Title" />);
    expect(screen.queryByText('A subtitle')).not.toBeInTheDocument();
  });

  it('applies the left-align class when leftAlign is set', () => {
    render(
      <MenuLayout title="Title" leftAlign>
        <span>body</span>
      </MenuLayout>,
    );
    const content = screen.getByText('body').parentElement;
    expect(content).toHaveClass('text-left');
  });

  it('centers the content by default', () => {
    render(
      <MenuLayout title="Title">
        <span>body</span>
      </MenuLayout>,
    );
    const content = screen.getByText('body').parentElement;
    expect(content).toHaveClass('text-center');
  });

  it('renders children', () => {
    render(
      <MenuLayout title="Title">
        <button type="button">Go</button>
      </MenuLayout>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });
});
