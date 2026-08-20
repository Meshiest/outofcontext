import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedResults } from './RedactedResults';
import type { RedactedChain } from './redactedUtils';

const nameTable = { p1: 'Alice', p2: 'Bob', p3: 'Carol' };

const chains: RedactedChain[] = [
  [
    {
      data: {
        line: [
          { type: 'punctuation', value: 'The ' },
          { type: 'word', value: 'ancient' },
          { type: 'punctuation', value: ' map led them astray.' },
        ],
      },
      editors: ['p1', 'p2', 'p3'],
    },
    {
      data: { line: [{ type: 'punctuation', value: 'And they never returned.' }] },
      editors: ['p2', 'p3', 'p1'],
    },
  ],
  [
    {
      data: {
        line: [
          { type: 'punctuation', value: 'A robot learned to ' },
          { type: 'word', value: 'dream' },
          { type: 'punctuation', value: '.' },
        ],
      },
      editors: ['p3', 'p1', 'p2'],
    },
  ],
];

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same results list at the 375px phone column.
const meta = {
  title: 'Games/Redacted/RedactedResults',
  component: RedactedResults,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    chains,
    nameTable,
    playerState: 'READING',
    onReact: () => {},
    isDone: false,
    onToggleDone: () => {},
  },
} satisfies Meta<typeof RedactedResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reading: Story = {};

/** Spectator view: static like counts, no Done Reading button. */
export const Spectator: Story = { args: { playerState: null } };

/** Reading at the phone measure, where the reaction bar shares a much narrower card. */
export const Mobile: Story = { decorators: [mobileGameColumn] };
