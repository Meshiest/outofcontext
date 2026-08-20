import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { GameSelector } from './GameSelector';

afterEach(cleanup);

describe('GameSelector', () => {
  it('lists every non-hidden game and emits the chosen key', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<GameSelector value="" onSelect={onSelect} />);

    await user.click(screen.getByRole('combobox'));
    // gameInfo ships 6 visible games; none are hidden.
    expect(screen.getAllByRole('option')).toHaveLength(6);
    expect(screen.getByRole('option', { name: 'Raconteur' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Scribble' }));
    expect(onSelect).toHaveBeenCalledWith('draw');
  });

  it('reflects the currently selected game', () => {
    render(<GameSelector value="story" onSelect={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Raconteur');
  });
});
