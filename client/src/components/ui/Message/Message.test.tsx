import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Message } from './Message';

describe('Message', () => {
  it('renders header and content', () => {
    render(
      <Message variant="error" header="Invalid Lobby Code" content="This lobby does not exist." />,
    );
    expect(screen.getByText('Invalid Lobby Code')).toBeInTheDocument();
    expect(screen.getByText('This lobby does not exist.')).toBeInTheDocument();
  });

  it('announces errors assertively via role=alert', () => {
    render(<Message variant="error" content="boom" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('announces non-errors politely via role=status', () => {
    render(<Message variant="info" content="fyi" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the variant icon with its color', () => {
    const { container } = render(<Message variant="success" content="ok" />);
    const icon = container.querySelector('i.fa-solid');
    expect(icon?.className).toContain('fa-circle-check');
    expect(icon?.className).toContain('text-positive');
  });

  it('renders no dismiss button by default', () => {
    render(<Message variant="info" content="fyi" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onDismiss when the close control is clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <Message
        variant="error"
        header="Invalid name"
        content="Try another."
        dismissible
        dismissLabel="Dismiss"
        onDismiss={onDismiss}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders header-only and content-only forms', () => {
    const { rerender } = render(<Message variant="info" header="Header only" />);
    expect(screen.getByText('Header only')).toBeInTheDocument();

    rerender(<Message variant="info" content="Content only" />);
    expect(screen.getByText('Content only')).toBeInTheDocument();
  });
});
