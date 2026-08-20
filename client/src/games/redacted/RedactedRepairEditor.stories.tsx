import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedRepairEditor } from './RedactedRepairEditor';
import type { RedactedCensorLink, RedactedTruncateLink } from './redactedUtils';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same repair form at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedRepairEditor',
  component: RedactedRepairEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { onSubmitCensor: () => {}, onSubmitTruncate: () => {} },
} satisfies Meta<typeof RedactedRepairEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const censorLink: RedactedCensorLink = {
  type: 'tamper',
  kind: 'censor',
  data: {
    line: [
      { type: 'string', value: 'The ' },
      { type: 'count', index: 1, key: 0, value: 5 },
      { type: 'string', value: ' agent hid the ' },
      { type: 'count', index: 5, key: 1, value: 8 },
      { type: 'string', value: '.' },
    ],
    indexes: [1, 5],
  },
};

const truncateLink: RedactedTruncateLink = {
  type: 'tamper',
  kind: 'truncate',
  data: { line: 'They opened the door and saw', length: 18, count: 3 },
};

/** Decensor: one input per numbered blank. */
export const Censor: Story = { args: { link: censorLink } };

/** Repair a truncated line: fill in the redacted tail. */
export const Truncate: Story = { args: { link: truncateLink } };

/** Decensor at the phone measure, where the numbered blanks and their inputs stack. */
export const Mobile: Story = {
  args: { link: censorLink },
  decorators: [mobileGameColumn],
};
