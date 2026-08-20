import '@/i18n';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import GAMES from '@gameInfo';
import { GameConfigPanel } from './GameConfigPanel';

afterEach(cleanup);

const story = GAMES.story;

describe('GameConfigPanel', () => {
  it('renders editable fields (labelled by cfg.name) for an admin and emits on change', () => {
    const onConfigChange = vi.fn();
    render(
      <GameConfigPanel
        gameId="story"
        gameMeta={story}
        config={{}}
        playerCount={4}
        isAdmin
        onConfigChange={onConfigChange}
      />,
    );
    expect(screen.getByLabelText('Max Players')).toBeInTheDocument();
    expect(screen.getByLabelText('Story Count')).toBeInTheDocument();

    const linesInput = screen.getByLabelText('Lines per Story');
    fireEvent.change(linesInput, { target: { value: '15' } });
    fireEvent.blur(linesInput); // int fields commit on blur
    expect(onConfigChange).toHaveBeenLastCalledWith('numLinks', 15);
  });

  it('renders read-only stats (labelled by cfg.text) for a non-admin', () => {
    render(
      <GameConfigPanel
        gameId="story"
        gameMeta={story}
        config={{}}
        playerCount={4}
        isAdmin={false}
        onConfigChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.queryByLabelText('Max Players')).not.toBeInTheDocument();
  });

  it('shows a bare value in the read-only stat, not the explanation of it', async () => {
    render(
      <GameConfigPanel
        gameId="redacted"
        gameMeta={GAMES.redacted}
        config={{ ink: 'normal' }}
        playerCount={4}
        isAdmin={false}
        onConfigChange={vi.fn()}
      />,
    );
    // A stat reads as a value. "Normal - 2 middle, 5 end" belongs in the admin's dropdown, where
    // the choice is being made, not in a row of numbers everyone else is scanning.
    // Two redacted fields read "Normal" (Mode and Changes), so match on the set.
    expect(screen.getAllByText('Normal').length).toBeGreaterThan(0);
    expect(screen.queryByText(/2 middle, 5 end/)).toBeNull();
  });

  it('shows the explanation in the admin dropdown, where the choice is made', async () => {
    render(
      <GameConfigPanel
        gameId="redacted"
        gameMeta={GAMES.redacted}
        config={{ ink: 'normal' }}
        playerCount={4}
        isAdmin
        onConfigChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/2 middle, 5 end/)).toBeInTheDocument();
  });

  it('holds an edited value while the server catches up', async () => {
    const user = userEvent.setup();
    const onConfigChange = vi.fn();
    render(
      <GameConfigPanel
        gameId="story"
        gameMeta={GAMES.story}
        config={{ numLinks: 6 }}
        playerCount={4}
        isAdmin
        onConfigChange={onConfigChange}
      />,
    );

    const field = screen.getByLabelText(/Lines per Story/i);
    await user.clear(field);
    await user.type(field, '9');
    await user.tab();

    expect(onConfigChange).toHaveBeenCalledWith('numLinks', 9);
    // The control is driven by server state, which has not echoed yet. Snapping back to 6 here and
    // forward again on lobby:info is the double flicker this guards against.
    expect(field).toHaveValue(9);
  });

  it('yields to the server when it answers with something else', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <GameConfigPanel
        gameId="story"
        gameMeta={GAMES.story}
        config={{ numLinks: 6 }}
        playerCount={4}
        isAdmin
        onConfigChange={vi.fn()}
      />,
    );

    const field = screen.getByLabelText(/Lines per Story/i);
    await user.clear(field);
    await user.type(field, '9');
    await user.tab();
    expect(field).toHaveValue(9);

    // The lobby clamps an out-of-range int rather than accepting it, so the guess must give way to
    // whatever comes back - not wait for an agreement that never arrives.
    rerender(
      <GameConfigPanel
        gameId="story"
        gameMeta={GAMES.story}
        config={{ numLinks: 8 }}
        playerCount={4}
        isAdmin
        onConfigChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/Lines per Story/i)).toHaveValue(8);
  });
});
