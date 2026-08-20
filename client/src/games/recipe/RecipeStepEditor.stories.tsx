import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeStepEditor } from './RecipeStepEditor';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same editor at the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeStepEditor',
  component: RecipeStepEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    theme: "Grandma's Midnight Tacos",
    stepIndex: 2,
    totalSteps: 4,
    isLastLink: false,
    onSubmit: (step: string) => console.log('step', step),
  },
} satisfies Meta<typeof RecipeStepEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The empty field already shows the ITEM requirement (submit stays disabled until the instruction
 * contains the literal token ITEM).
 */
export const Default: Story = {};

/** The final step - the submit becomes a positive "Finish". */
export const LastLink: Story = {
  args: { isLastLink: true, stepIndex: 4 },
};

/** The phone measure, where the theme heading and the ITEM hint each take an extra line. */
export const Mobile: Story = {
  decorators: [mobileGameColumn],
};
