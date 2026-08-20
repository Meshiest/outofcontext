import '@/i18n';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { ConfigFieldDef } from '@shared/types';
import { ConfigField } from './ConfigField';

afterEach(cleanup);

const intCfg: ConfigFieldDef = {
  type: 'int',
  min: 2,
  max: 10,
  defaults: 5,
};

const intNumPlayers: ConfigFieldDef = {
  type: 'int',
  min: 4,
  max: 256,
  defaults: '#numPlayers',
};

const boolCfg: ConfigFieldDef = {
  type: 'bool',
  defaults: 'false',
};

// Field and option ids must be real: the labels are read from the game's locale namespace by id,
// so an invented id renders a blank control.
const listCfg: ConfigFieldDef = {
  type: 'list',
  defaults: 'regular',
  options: [
    { name: 'regular', value: 1 },
    { name: 'two', value: 2 },
  ],
};

describe('ConfigField / IntConfig', () => {
  it('clamps an out-of-range entry to [min, max]', () => {
    const onChange = vi.fn();
    render(
      <ConfigField
        gameId="story"
        name="numLinks"
        cfg={intCfg}
        rawValue={5}
        playerCount={4}
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Lines per Story');
    // The int field commits (clamped) on blur, not on every keystroke, so a low leading digit is not
    // snapped up mid-entry.
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('numLinks', 10);
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('numLinks', 2);
  });

  it('lets a multi-digit value with a low leading digit be typed without snapping to min', () => {
    const onChange = vi.fn();
    render(
      <ConfigField
        gameId="story"
        name="numLinks"
        cfg={intCfg}
        rawValue={5}
        playerCount={4}
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Lines per Story') as HTMLInputElement;
    // Field has min 2; typing toward "15" must not clamp the interim "1" up to 2 mid-entry.
    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('1');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('numLinks', 10); // 15 -> clamped to max 10 on commit
  });

  it('shows the minimum warning when #numPlayers resolves below min', () => {
    render(
      <ConfigField
        gameId="story"
        name="players"
        cfg={intNumPlayers}
        rawValue="#numPlayers"
        playerCount={2}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Minimum: 4')).toBeInTheDocument();
  });

  it('shows the maximum warning when the value exceeds max', () => {
    render(
      <ConfigField
        gameId="story"
        name="players"
        cfg={intNumPlayers}
        rawValue={300}
        playerCount={2}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Maximum: 256')).toBeInTheDocument();
  });

  it('emits #numPlayers from the highlighted player-count button', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfigField
        gameId="story"
        name="players"
        cfg={intNumPlayers}
        rawValue={5}
        playerCount={5}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Use current player count' }));
    expect(onChange).toHaveBeenCalledWith('players', '#numPlayers');
  });
});

describe('ConfigField / BoolConfig', () => {
  it('toggles between Enabled and Disabled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfigField
        gameId="story"
        name="anon"
        cfg={boolCfg}
        rawValue="false"
        playerCount={4}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Enabled' }));
    expect(onChange).toHaveBeenCalledWith('anon', 'true');
  });
});

describe('ConfigField / ListConfig', () => {
  it('renders every option and emits the option name', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfigField
        gameId="story"
        name="contextLen"
        cfg={listCfg}
        rawValue="regular"
        playerCount={4}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: '1 Line' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2 Lines' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: '2 Lines' }));
    expect(onChange).toHaveBeenCalledWith('contextLen', 'two');
  });
});
