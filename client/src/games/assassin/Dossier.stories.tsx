import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { Dossier } from './Dossier';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same briefing at the 375px phone column.
const meta = {
  title: 'Games/Assassin/Dossier',
  component: Dossier,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof Dossier>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single-target mode: one victim (large negative Label) and a set of kill words. */
export const SingleTarget: Story = {
  args: {
    title: 'crimson wolf',
    battleRoyale: false,
    target: { name: 'Bob', words: ['banana', 'trombone', 'velvet'] },
  },
};

/** Battle-royale mode: a Player / Kill Words table with one row per rival hunter. */
export const BattleRoyale: Story = {
  args: {
    title: 'cobalt fox',
    battleRoyale: true,
    targets: [
      { name: 'Bob', words: ['apple', 'kite'] },
      { name: 'Carol', words: ['ladder', 'saffron'] },
      { name: 'Dave', words: ['pillow', 'quartz'] },
      { name: 'Erin', words: ['zephyr'] },
    ],
  },
};

/** Battle royale at the phone measure - the table has to hold together in 343px. */
export const Mobile: Story = {
  args: BattleRoyale.args,
  decorators: [mobileGameColumn],
};
