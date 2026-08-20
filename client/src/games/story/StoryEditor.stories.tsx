import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { StoryEditor } from './StoryEditor';

// Framed at the real game-column measure (see storybookFrames): the state stories below are the
// 760px desktop column, and Mobile is the same editor at the 375px phone column.
const meta = {
  title: 'Games/Story/StoryEditor',
  component: StoryEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    link: [],
    isLastLink: false,
    onSubmit: (line: string) => console.log('submit', line),
  },
} satisfies Meta<typeof StoryEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No context - the very first line of a new story. */
export const FirstLine: Story = {};

/** One prior author's line for context. */
export const OneContextLine: Story = {
  args: {
    link: ['The old lighthouse had not shone in forty years.'],
  },
};

/** Several prior lines, separated by "Then" dividers. */
export const ThreeContextLines: Story = {
  args: {
    link: [
      'The old lighthouse had not shone in forty years.',
      'One night, a single window lit up.',
      'Nobody in the village would admit to climbing the stairs.',
    ],
  },
};

/** The final link - the submit becomes a positive "Finish". */
export const LastLink: Story = {
  args: {
    isLastLink: true,
    link: ['And so, with the last of the oil, they lit the lamp one final time.'],
  },
};

/** ThreeContextLines at the phone measure, where the context lines wrap several times each. */
export const Mobile: Story = {
  args: ThreeContextLines.args,
  decorators: [mobileGameColumn],
};
