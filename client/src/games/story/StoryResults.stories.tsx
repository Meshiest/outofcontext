import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { StoryResults } from './StoryResults';
import type { StoryChain } from './types';

const nameTable = { p1: 'Ada', p2: 'Bram', p3: 'Cleo' };

const stories: StoryChain[] = [
  [
    { link: 'The old lighthouse had not shone in forty years.', editor: 'p1' },
    { link: 'One night, a single window lit up.', editor: 'p2' },
  ],
  [
    { link: 'A recipe for disaster started with too much salt.', editor: 'p3' },
    { link: 'And ended with a standing ovation.', editor: 'p1' },
    { link: 'The chef never explained the middle part.', editor: 'p2' },
  ],
  [{ link: 'A one-line story is still a story.', editor: 'p3' }],
];

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same results list at the 375px phone column.
const meta = {
  title: 'Games/Story/StoryResults',
  component: StoryResults,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    stories,
    playerState: 'READING',
    nameTable,
    onReact: (index: number) => console.log('like', index),
    isDone: false,
    onToggleDone: () => console.log('toggle done'),
  },
} satisfies Meta<typeof StoryResults>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reading phase with three stories of varying author counts. */
export const Reading: Story = {};

/** After marking done - the toggle flips to "Still Reading". */
export const Done: Story = {
  args: { isDone: true },
};

/** Spectator view: like counts are static, no Done Reading button. */
export const Spectator: Story = {
  args: { playerState: null },
};

/** Reading at the phone measure, where the reaction bar shares a much narrower card. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
