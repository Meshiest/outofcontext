import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { DrawEditor } from './DrawEditor';

// Was an invented `max-w-md` (448px), a width the game column never has. Framed at the real
// measure instead (see storybookFrames), which the canvas sizes itself from.
const meta = {
  title: 'Games/Draw/DrawEditor',
  component: DrawEditor,
  parameters: { layout: 'padded' },
  args: {
    description: 'A cat riding a bicycle down a steep hill',
    colors: true,
    onSubmit: () => {},
  },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof DrawEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Timed drawing mode: the countdown starts on the first stroke. */
export const Timed: Story = {
  args: { timeLimit: 30 },
};

export const WithoutColors: Story = {
  args: { colors: false },
};

/** The phone measure, where the palette and tool row have to fit across 343px. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
