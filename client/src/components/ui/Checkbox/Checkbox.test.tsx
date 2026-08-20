import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders an unchecked checkbox with its label', () => {
    render(<Checkbox label="Enabled" />);
    const box = screen.getByRole('checkbox', { name: 'Enabled' });
    expect(box).not.toBeChecked();
  });

  it('toggles when the box is clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Enabled" />);
    const box = screen.getByRole('checkbox', { name: 'Enabled' });
    await user.click(box);
    expect(box).toBeChecked();
  });

  it('toggles when the label text is clicked', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Enabled" />);
    await user.click(screen.getByText('Enabled'));
    expect(screen.getByRole('checkbox', { name: 'Enabled' })).toBeChecked();
  });

  it('fires onChange with the new state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Enabled" onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Enabled' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Enabled" disabled />);
    const box = screen.getByRole('checkbox', { name: 'Enabled' });
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('forwards ref to the native checkbox', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} label="Enabled" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
