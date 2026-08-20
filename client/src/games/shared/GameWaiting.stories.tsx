import type { Meta, StoryObj } from '@storybook/react-vite';
import { desktopGameColumn } from '@/games/storybookFrames';
import { GameWaiting } from './GameWaiting';

// Framed at the 760px game column it fills (see storybookFrames). No mobile twin: the loader is
// centred and the only thing that changes between phone and desktop is the `lg:min-h-[65dvh]`,
// which keys off the viewport rather than this frame - use the toolbar viewport control for that.
const meta = {
  title: 'Games/Shared/GameWaiting',
  component: GameWaiting,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { message: 'Waiting on Other Authors' },
} satisfies Meta<typeof GameWaiting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingOnAuthors: Story = {};

export const StoriesBeingWritten: Story = {
  args: { message: 'Stories are Being Written' },
};

export const CollectingIntel: Story = {
  args: { message: 'Wurderers Collecting Intel' },
};
