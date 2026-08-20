import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { makeSampleDrawing } from '@/components/widgets/doodle/sampleDrawing';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { DescribeEditor } from './DescribeEditor';

// Was an invented `max-w-md` (448px), a width the game column never has. Framed at the real
// measure instead (see storybookFrames).
const meta = {
  title: 'Games/Draw/DescribeEditor',
  component: DescribeEditor,
  parameters: { layout: 'padded' },
  args: {
    isInitial: true,
    onSubmit: () => {},
  },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof DescribeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First link: prompt for a fresh idea, no previous drawing. */
export const Initial: Story = {};

/** Describing the previous player's drawing. */
export const WithPreviousImage: Story = {
  args: {
    isInitial: false,
    previousImage: makeSampleDrawing(),
  },
};

/** WithPreviousImage at the phone measure, where the drawing shrinks to fit 343px. */
export const Mobile: Story = {
  args: WithPreviousImage.args,
  decorators: [mobileGameColumn],
};
