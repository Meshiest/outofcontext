import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { StoryChain } from './StoryChain';

const nameTable = { p1: 'Ada', p2: 'Bram', p3: 'Cleo' };

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same chain at the 375px phone column.
const meta = {
  title: 'Games/Story/StoryChain',
  component: StoryChain,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    nameTable,
    entries: [
      { link: 'The old lighthouse had not shone in forty years.', editor: 'p1' },
      { link: 'One night, a single window lit up.', editor: 'p2' },
      { link: 'Nobody in the village would admit to climbing the stairs.', editor: 'p3' },
    ],
  },
} satisfies Meta<typeof StoryChain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A multi-line story with author attribution below each line. */
export const MultiLine: Story = {};

/** Anonymous game: empty editor ids hide attribution. */
export const Anonymous: Story = {
  args: {
    entries: [
      { link: 'The old lighthouse had not shone in forty years.', editor: '' },
      { link: 'One night, a single window lit up.', editor: '' },
    ],
  },
};

/** The same story at the phone measure: every line wraps, so the attribution rhythm changes. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
