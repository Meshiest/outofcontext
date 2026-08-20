import type { Meta, StoryObj } from '@storybook/react-vite';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedLinePreview } from './RedactedLinePreview';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same context line at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedLinePreview',
  component: RedactedLinePreview,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof RedactedLinePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain context line (fully revealed). */
export const Plain: Story = {
  args: { line: [{ type: 'punctuation', value: 'The previous author left a clue.' }] },
};

/** Context with redacted words the next writer must build on. */
export const WithRedactions: Story = {
  args: {
    line: [
      { type: 'punctuation', value: 'Meet me by the ' },
      { type: 'word', value: 'old oak' },
      { type: 'punctuation', value: ' at dawn.' },
    ],
  },
};

/** WithRedactions at the phone measure. */
export const Mobile: Story = {
  args: WithRedactions.args,
  decorators: [mobileGameColumn],
};
