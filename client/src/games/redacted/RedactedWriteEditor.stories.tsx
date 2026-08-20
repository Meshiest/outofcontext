import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedWriteEditor } from './RedactedWriteEditor';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same editor at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedWriteEditor',
  component: RedactedWriteEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { onSubmit: () => {} },
} satisfies Meta<typeof RedactedWriteEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First line of the story: no context. */
export const FirstLine: Story = {};

/** Continuing the story with the previous (redacted) line as context. */
export const WithContext: Story = {
  args: {
    context: {
      line: [
        { type: 'punctuation', value: 'The vault held a single ' },
        { type: 'word', value: 'photograph' },
        { type: 'punctuation', value: '.' },
      ],
    },
  },
};

/** WithContext at the phone measure, where the ink bar can land mid-wrap. */
export const Mobile: Story = {
  args: WithContext.args,
  decorators: [mobileGameColumn],
};
