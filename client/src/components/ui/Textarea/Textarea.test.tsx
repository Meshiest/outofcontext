import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a native textarea with its label', () => {
    render(<Textarea label="Your line" />);
    expect(screen.getByLabelText('Your line')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('shows the error message and marks invalid', () => {
    render(<Textarea label="Your line" error="Too short" />);
    const field = screen.getByLabelText('Your line');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Too short');
  });

  it('shows and updates the character count when maxLength is set', async () => {
    const user = userEvent.setup();
    render(<Textarea label="Your line" maxLength={10} />);
    expect(screen.getByText('0/10')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your line'), 'hello');
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('forwards ref to the native textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} label="Your line" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('puts a hint opposite the character counter, on one row', () => {
    const { container } = render(<Textarea label="Line" maxLength={256} hint="0 words" />);
    const hint = screen.getByText('0 words');
    const count = screen.getByText('0/256');
    // Same row, pushed apart - two numbers about one field read as a status line, not a stack.
    expect(hint.parentElement).toBe(count.parentElement);
    expect(hint.parentElement?.className).toContain('justify-between');
    expect(container).toBeTruthy();
  });

  it('gives the row to the error instead, when there is one', () => {
    render(<Textarea label="Line" maxLength={256} hint="0 words" error="Too long" />);
    // A problem outranks a statistic.
    expect(screen.getByRole('alert')).toHaveTextContent('Too long');
    expect(screen.queryByText('0 words')).toBeNull();
  });
});
