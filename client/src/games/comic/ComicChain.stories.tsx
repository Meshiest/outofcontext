import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { makeSampleDrawing } from '@/components/widgets/doodle/sampleDrawing';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { ComicChain } from './ComicChain';
import type { ComicEntry } from './types';

const entries: ComicEntry[] = [
  {
    link: {
      drawing: makeSampleDrawing(0),
      caption: 'A cat contemplating the void',
    },
    editor: 'p1',
  },
  {
    link: {
      drawing: makeSampleDrawing(1),
      caption: 'The void contemplating back',
    },
    editor: 'p2',
  },
];

const nameTable = { p1: 'Alice', p2: 'Bob' };

// Framed at the real game-column measure (see storybookFrames). It matters more here than anywhere
// else: the drawings scale to the column, so an unframed story shows them at a size no player sees.
const meta = {
  title: 'Games/Comic/ComicChain',
  component: ComicChain,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    entries,
    nameTable,
    continuous: false,
    enableCaptions: true,
  },
} satisfies Meta<typeof ComicChain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard mode: each drawing sits under its caption with the author attributed below. */
export const Standard: Story = {};

/** Drawings-only standard mode (captions collected but not shown). */
export const NoCaptions: Story = {
  args: { enableCaptions: false },
};

/** Continuous mode: the drawings stack edge-to-edge into one connected composition. */
export const Continuous: Story = {
  args: { continuous: true },
};

/** Standard mode at the phone measure - the drawings are roughly half the size they are above. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
