import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { ChainCard } from './ChainCard';

const NO_COUNTS = { heart: 0, laugh: 0, thumbsUp: 0, skull: 0, brain: 0 };
const NONE_MINE = { heart: false, laugh: false, thumbsUp: false, skull: false, brain: false };

// Framed at the real game-column measure (see storybookFrames): every results screen puts this card
// in the game column, so the stories below are the 760px desktop column and Mobile is the 375px one.
const meta = {
  title: 'Games/Shared/ChainCard',
  component: ChainCard,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    index: 0,
    counts: NO_COUNTS,
    mine: NONE_MINE,
    canReact: true,
    onReact: () => {},
    children: <p className="story-body">A line somebody wrote, then somebody else continued.</p>,
  },
} satisfies Meta<typeof ChainCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing reacted to yet. */
export const Default: Story = {};

/** A busy chain, with two of the reactions left by this player. */
export const Reacted: Story = {
  args: {
    counts: { heart: 4, laugh: 2, thumbsUp: 1, skull: 0, brain: 3 },
    mine: { ...NONE_MINE, heart: true, brain: true },
  },
};

/** Spectator / post-game: the tally is readable but there is nothing to press. */
export const ReadOnly: Story = {
  args: {
    canReact: false,
    counts: { heart: 4, laugh: 2, thumbsUp: 0, skull: 1, brain: 0 },
  },
};

/** The reacted card at the phone measure, where the five reactions fill most of the card's width. */
export const Mobile: Story = {
  args: Reacted.args,
  decorators: [mobileGameColumn],
};
