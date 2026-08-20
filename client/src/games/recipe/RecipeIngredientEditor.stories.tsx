import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeIngredientEditor } from './RecipeIngredientEditor';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same editor at the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeIngredientEditor',
  component: RecipeIngredientEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    existingIngredients: [],
    isLastLink: false,
    onSubmit: (ingredient: string) => console.log('ingredient', ingredient),
  },
} satisfies Meta<typeof RecipeIngredientEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First ingredient of the recipe - no others yet. */
export const Default: Story = {};

/** Later ingredients show what other players already added, split by "And" dividers. */
export const WithExisting: Story = {
  args: {
    existingIngredients: ['a rubber duck', 'three traffic cones', 'a single sock'],
  },
};

/** The final contributor - the submit becomes a positive "Finish". */
export const LastLink: Story = {
  args: {
    isLastLink: true,
    existingIngredients: ['a rubber duck'],
  },
};

/** WithExisting at the phone measure, where the "And" dividers stack much taller. */
export const Mobile: Story = {
  args: WithExisting.args,
  decorators: [mobileGameColumn],
};
