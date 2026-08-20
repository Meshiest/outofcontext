import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders a native input', () => {
    render(<Input placeholder="Ethan" />);
    expect(screen.getByPlaceholderText('Ethan')).toBeInstanceOf(HTMLInputElement);
  });

  it('associates the label with the input', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInstanceOf(HTMLInputElement);
  });

  it('shows the error message and marks the field invalid', () => {
    render(<Input label="Name" error="Name is required" />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('Name is required');
    expect(input).toHaveAttribute('aria-describedby', message.id);
  });

  it('marks invalid without a message when error is boolean', () => {
    render(<Input label="Name" error />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts typed input and fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'abc');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('abc');
  });

  it('forwards ref to the native input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders an icon when provided', () => {
    render(<Input label="Name" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('holds the error line open when reserveErrorSpace is set, so the layout cannot shift', () => {
    const { container, rerender } = render(<Input label="Code" reserveErrorSpace />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    // The placeholder must not be announced - only a real message carries role="alert".
    expect(container.querySelector('p')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<Input label="Code" reserveErrorSpace error="Nope" />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Nope');
  });

  it('renders no error line by default when there is no error', () => {
    const { container } = render(<Input label="Name" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
