import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { ChainCard } from '@/games/shared/ChainCard';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeCard } from './RecipeCard';
import type { CompiledRecipe } from './types';

const nameTable = { p1: 'Ada', p2: 'Bram', p3: 'Cleo', p4: 'Dev' };

const recipe: CompiledRecipe = {
  theme: "Grandma's Midnight Tacos",
  author: 'p1',
  steps: [
    { link: 'Warm a rubber duck over low heat until fragrant.', editors: ['p1', 'p2'] },
    { link: 'Fold in three traffic cones and a single sock.', editors: ['p2', 'p3'] },
    { link: 'Serve immediately with a garnish of an old boot.', editors: ['p3', 'p4'] },
  ],
  comments: [
    { link: 'Five stars, would simmer again.', editor: 'p4' },
    { link: 'Needs more sock.', editor: 'p2' },
  ],
};

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same card at the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeCard',
  component: RecipeCard,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { recipe, nameTable },
} satisfies Meta<typeof RecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A full compiled recipe, rendered inside the results ChainCard it normally lives in. */
export const Default: Story = {
  render: (args) => (
    <ChainCard
      index={0}
      counts={{ heart: 3, laugh: 0, thumbsUp: 0, skull: 0, brain: 0 }}
      mine={{ heart: false, laugh: false, thumbsUp: false, skull: false, brain: false }}
      canReact
      onReact={() => {}}
    >
      <RecipeCard {...args} />
    </ChainCard>
  ),
};

/** Anonymous game: no theme or step author attribution, comments read "Anonymous". */
export const Anonymous: Story = {
  args: {
    recipe: {
      theme: 'A Secret Stew',
      author: '',
      steps: [
        { link: 'Boil an unmarked jar until it stops rattling.', editors: ['', ''] },
        { link: 'Season with a whisper of an old boot.', editors: ['', ''] },
      ],
      comments: [{ link: 'Mysterious and delicious.', editor: '' }],
    },
  },
  render: (args) => (
    <ChainCard
      index={0}
      counts={{ heart: 0, laugh: 0, thumbsUp: 0, skull: 0, brain: 0 }}
      mine={{ heart: false, laugh: false, thumbsUp: false, skull: false, brain: false }}
      canReact
      onReact={() => {}}
    >
      <RecipeCard {...args} />
    </ChainCard>
  ),
};

/** The full recipe at the phone measure, where each step runs to three or four lines. */
export const Mobile: Story = {
  render: Default.render,
  decorators: [mobileGameColumn],
};
