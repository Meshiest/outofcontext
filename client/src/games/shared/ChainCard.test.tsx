import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChainCard } from './ChainCard';
import { REACTION_IDS } from './reactions';

const NO_COUNTS = { heart: 0, laugh: 0, thumbsUp: 0, skull: 0, brain: 0 };
const NONE_MINE = {
  heart: false,
  laugh: false,
  thumbsUp: false,
  skull: false,
  brain: false,
};

describe('ChainCard', () => {
  it('renders its chain content', () => {
    render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={vi.fn()}>
        <p>chain body</p>
      </ChainCard>,
    );
    expect(screen.getByText('chain body')).toBeInTheDocument();
  });

  it('offers every reaction, each as its own toggle', () => {
    render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={vi.fn()}>
        <p>body</p>
      </ChainCard>,
    );
    // One control per reaction: a player may hold one of EACH, so they are not a single choice.
    expect(screen.getAllByRole('button')).toHaveLength(REACTION_IDS.length);
  });

  it('reports which reaction was pressed', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={onReact}>
        <p>body</p>
      </ChainCard>,
    );
    await user.click(screen.getByRole('button', { name: /^Big brain/ }));
    expect(onReact).toHaveBeenCalledWith('brain');
  });

  it('marks the reactions this player already left', () => {
    render(
      <ChainCard
        index={0}
        counts={{ ...NO_COUNTS, heart: 3 }}
        mine={{ ...NONE_MINE, heart: true }}
        canReact
        onReact={vi.fn()}
      >
        <p>body</p>
      </ChainCard>,
    );
    expect(screen.getByRole('button', { name: /^Love it/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Big brain/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows a read-only tally with no controls when the viewer cannot react', () => {
    render(
      <ChainCard
        index={0}
        counts={{ ...NO_COUNTS, heart: 4 }}
        mine={NONE_MINE}
        canReact={false}
        onReact={vi.fn()}
      >
        <p>body</p>
      </ChainCard>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByLabelText('Love it: 4')).toBeInTheDocument();
  });

  /** aria-label overrides content, so a bare label would announce the reaction with no count. */
  it('announces the tally, matching the read-only variant', async () => {
    const user = userEvent.setup();
    render(
      <ChainCard
        index={0}
        counts={{ ...NO_COUNTS, heart: 4 }}
        mine={NONE_MINE}
        canReact
        onReact={vi.fn()}
      >
        <p>body</p>
      </ChainCard>,
    );
    expect(screen.getByRole('button', { name: 'Love it: 4' })).toBeInTheDocument();

    // The optimistic count is announced too, not just rendered.
    await user.click(screen.getByRole('button', { name: 'Love it: 4' }));
    expect(screen.getByRole('button', { name: 'Love it: 5' })).toBeInTheDocument();
  });

  it('responds to a press immediately, before the server confirms', async () => {
    const user = userEvent.setup();
    // onReact does nothing here: the props never change, standing in for a server yet to reply.
    render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={vi.fn()}>
        <p>body</p>
      </ChainCard>,
    );
    const heart = screen.getByRole('button', { name: /^Love it/ });
    expect(heart).toHaveAttribute('aria-pressed', 'false');

    await user.click(heart);

    // Pressed state and the count both move without waiting for a round trip.
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect(heart).toHaveTextContent('1');
    // Only the pressed reaction changes.
    expect(screen.getByRole('button', { name: /^Big brain/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('hands control back to the server state once it arrives', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={vi.fn()}>
        <p>body</p>
      </ChainCard>,
    );
    await user.click(screen.getByRole('button', { name: /^Love it/ }));

    // The server confirms with the real count, which must not be double-counted on top of the guess.
    rerender(
      <ChainCard
        index={0}
        counts={{ ...NO_COUNTS, heart: 1 }}
        mine={{ ...NONE_MINE, heart: true }}
        canReact
        onReact={vi.fn()}
      >
        <p>body</p>
      </ChainCard>,
    );
    const heart = screen.getByRole('button', { name: /^Love it/ });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect(heart).toHaveTextContent('1');
  });

  it("takes the reaction's filled skin once pressed, not just a tinted glyph", async () => {
    const user = userEvent.setup();
    render(
      <ChainCard index={0} counts={NO_COUNTS} mine={NONE_MINE} canReact onReact={vi.fn()}>
        <p>body</p>
      </ChainCard>,
    );
    const heart = screen.getByRole('button', { name: /^Love it/ });
    expect(heart.className).toContain('btn-neutral');
    expect(heart.className).not.toContain('btn-negative');

    await user.click(heart);

    // Pressed swaps the whole skin, so it reads as the same kind of control as any other coloured
    // button rather than a basic one wearing a tinted icon.
    expect(heart.className).toContain('btn-negative');
    expect(heart.className).not.toContain('btn-neutral');
  });
});
