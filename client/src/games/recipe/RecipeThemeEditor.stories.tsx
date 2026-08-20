import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeThemeEditor } from './RecipeThemeEditor';

// Framed at the real game-column measure (see storybookFrames): Default is the 760px desktop
// column, Mobile the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeThemeEditor',
  component: RecipeThemeEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    onSubmit: (theme: string) => console.log('theme', theme),
  },
} satisfies Meta<typeof RecipeThemeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Name the dish that the recipe's instructions will riff on. */
export const Default: Story = {};

/** The phone measure, where the prompt wraps and the field is barely wider than the dish name. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
