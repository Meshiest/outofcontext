import type { Meta, StoryObj } from '@storybook/react-vite';
import { desktopRail, mobileGameColumn } from '@/games/storybookFrames';
import { GameProgress } from './GameProgress';

// The odd one out among the game components: it is rendered twice with one copy visible at a time.
// Below `lg` the games render it under their own body, so it gets the 343px game column; from `lg`
// up LobbyPlaying renders it in the 288px members rail instead. The state stories below use the
// rail, Mobile uses the game column - see storybookFrames for where both numbers come from.
const meta = {
  title: 'Games/Shared/GameProgress',
  component: GameProgress,
  parameters: { layout: 'padded' },
  decorators: [desktopRail],
  args: { progress: 0.5 },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
} satisfies Meta<typeof GameProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = { args: { progress: 0 } };

export const Halfway: Story = { args: { progress: 0.5 } };

export const AlmostDone: Story = { args: { progress: 0.99 } };

/** Complete: renders nothing (the bar is hidden once the game finishes). */
export const Complete: Story = { args: { progress: 1 } };

/** The mobile copy of the bar, which sits under the game body in the 343px game column. */
export const Mobile: Story = {
  args: { progress: 0.5 },
  decorators: [mobileGameColumn],
};
