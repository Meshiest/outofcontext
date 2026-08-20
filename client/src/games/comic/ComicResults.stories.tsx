import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { makeSampleDrawing } from '@/components/widgets/doodle/sampleDrawing';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { ComicResults } from './ComicResults';
import type { ComicChain } from './types';

const chains: ComicChain[] = [
  [
    { link: { drawing: makeSampleDrawing(0), caption: 'A cat' }, editor: 'p1' },
    { link: { drawing: makeSampleDrawing(1), caption: 'A hat' }, editor: 'p2' },
  ],
  [
    { link: { drawing: makeSampleDrawing(2), caption: 'A boat' }, editor: 'p2' },
    { link: { drawing: makeSampleDrawing(3), caption: 'A moat' }, editor: 'p1' },
  ],
];

const nameTable = { p1: 'Alice', p2: 'Bob' };

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same results view at the 375px phone column.
const meta = {
  title: 'Games/Comic/ComicResults',
  component: ComicResults,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    chains,
    continuous: false,
    enableCaptions: true,
    nameTable,
    playerState: 'READING',
    onReact: () => {},
    isDone: false,
    onToggleDone: () => {},
  },
} satisfies Meta<typeof ComicResults>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard mode reading: captioned drawings, likeable, with the Done Reading toggle. */
export const Standard: Story = {};

/** Continuous mode: each sequence is one connected stack of drawings. */
export const Continuous: Story = {
  args: { continuous: true },
};

/** Post-game / spectator: like counts are static and there is no Done button. */
export const Spectator: Story = {
  args: { playerState: null },
};

/** Standard mode at the phone measure - drawings, captions and reactions all in 343px. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
