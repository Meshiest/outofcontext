import type { Meta, StoryObj } from '@storybook/react-vite';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedLine } from './RedactedLine';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same line at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedLine',
  component: RedactedLine,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof RedactedLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A line with no redactions reads as normal text. */
export const AllPunctuation: Story = {
  args: {
    segments: [{ type: 'punctuation', value: 'The meeting starts at noon.' }],
  },
};

/** Censored-and-repaired words appear as ink bars (hover to reveal). */
export const MixedCensored: Story = {
  args: {
    segments: [
      { type: 'punctuation', value: 'The ' },
      { type: 'word', value: 'launch' },
      { type: 'punctuation', value: ' codes are ' },
      { type: 'word', value: 'hidden' },
      { type: 'punctuation', value: '.' },
    ],
  },
};

/** A truncated-and-repaired line: the visible portion, then the repaired tail as a bar. */
export const TruncatedRepaired: Story = {
  args: {
    segments: [
      { type: 'punctuation', value: 'They walked into the ' },
      { type: 'word', value: 'abandoned lighthouse' },
    ],
  },
};

/** MixedCensored at the phone measure: this is where the ink bars start breaking across lines. */
export const Mobile: Story = {
  args: MixedCensored.args,
  decorators: [mobileGameColumn],
};
