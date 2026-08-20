import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeResults } from './RecipeResults';
import type { CompiledRecipe } from './types';

const nameTable = { p1: 'Ada', p2: 'Bram', p3: 'Cleo', p4: 'Dev' };

const recipes: CompiledRecipe[] = [
  {
    theme: "Grandma's Midnight Tacos",
    author: 'p1',
    steps: [
      { link: 'Warm a rubber duck over low heat until fragrant.', editors: ['p1', 'p2'] },
      { link: 'Fold in three traffic cones and a single sock.', editors: ['p2', 'p3'] },
    ],
    comments: [{ link: 'Five stars, would simmer again.', editor: 'p4' }],
  },
  {
    theme: 'Deconstructed Cloud Soup',
    author: 'p3',
    steps: [
      { link: 'Whisk an old boot into a stiff peak.', editors: ['p3', 'p4'] },
      { link: 'Bake a single sock at exactly noon.', editors: ['p4', 'p1'] },
    ],
    comments: [
      { link: 'The boot really ties it together.', editor: 'p2' },
      { link: 'Needs more sock.', editor: 'p1' },
    ],
  },
];

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same results list at the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeResults',
  component: RecipeResults,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    recipes,
    playerState: 'READING',
    nameTable,
    onReact: (index: number) => console.log('like', index),
    isDone: false,
    onToggleDone: () => console.log('toggle done'),
  },
} satisfies Meta<typeof RecipeResults>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reading phase with two compiled recipes. */
export const Reading: Story = {};

/** After marking done - the toggle flips to "Still Reading". */
export const Done: Story = {
  args: { isDone: true },
};

/** Spectator view: static like counts, no Done Reading button. */
export const Spectator: Story = {
  args: { playerState: null },
};

/** Reading at the phone measure, where the step and comment lines wrap much harder. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
