// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Select } from './Select';

afterEach(cleanup);

const options = [
  { text: 'Raconteur', value: 'story' },
  { text: 'Scribble', value: 'draw' },
];

describe('Select', () => {
  it('shows the placeholder until a value is chosen', () => {
    render(<Select label="Game" options={options} placeholder="Select a game" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Select a game');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens the listbox and lists options', async () => {
    const user = userEvent.setup();
    render(<Select label="Game" options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Raconteur' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Scribble' })).toBeInTheDocument();
  });

  it('fires onChange with the selected value and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Game" options={options} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Scribble' }));
    expect(onChange).toHaveBeenCalledWith('draw');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveTextContent('Scribble');
  });

  it('supports keyboard open + selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Game" options={options} onChange={onChange} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}'); // open, active = selected/0
    await user.keyboard('{ArrowDown}'); // active = 1
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('draw');
  });

  it('disables the trigger when disabled', () => {
    render(<Select label="Game" options={options} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('disables and marks busy when loading', () => {
    render(<Select label="Game" options={options} loading />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-busy', 'true');
  });

  it('marks invalid and renders an error message', () => {
    render(<Select label="Game" options={options} error="Required" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('forwards ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Select ref={ref} label="Game" options={options} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
