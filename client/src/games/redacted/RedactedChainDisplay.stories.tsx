import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedChainDisplay } from './RedactedChainDisplay';
import type { RedactedChain } from './redactedUtils';

const nameTable = { p1: 'Alice', p2: 'Bob', p3: 'Carol', p4: 'Dana' };

const chain: RedactedChain = [
  {
    data: {
      line: [
        { type: 'punctuation', value: 'It was a ' },
        { type: 'word', value: 'stormy' },
        { type: 'punctuation', value: ' night.' },
      ],
    },
    editors: ['p1', 'p2', 'p3'],
  },
  {
    data: {
      line: [
        { type: 'punctuation', value: 'The detective found a ' },
        { type: 'word', value: 'bloody glove' },
      ],
    },
    editors: ['p2', 'p3', 'p4'],
  },
  {
    data: { line: [{ type: 'punctuation', value: 'Nobody ever solved the case.' }] },
    editors: ['p3', 'p4', 'p1'],
  },
];

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same chain at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedChainDisplay',
  component: RedactedChainDisplay,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { entries: chain, nameTable, anonymous: false },
} satisfies Meta<typeof RedactedChainDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAttribution: Story = {};

/** Anonymous games hide the author attribution. */
export const Anonymous: Story = { args: { anonymous: true } };

/** The phone measure, where a line plus its ink bars can wrap onto two rows. */
export const Mobile: Story = { decorators: [mobileGameColumn] };
