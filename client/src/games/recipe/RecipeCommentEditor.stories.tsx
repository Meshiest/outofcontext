import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RecipeCommentEditor } from './RecipeCommentEditor';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same editor at the 375px phone column.
const meta = {
  title: 'Games/Recipe/RecipeCommentEditor',
  component: RecipeCommentEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    existingComments: [],
    isLastLink: false,
    onSubmit: (comment: string) => console.log('comment', comment),
  },
} satisfies Meta<typeof RecipeCommentEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First review of the recipe - no others yet. */
export const Default: Story = {};

/** Later reviewers see the comments already written, split by "And" dividers. */
export const WithExisting: Story = {
  args: {
    existingComments: ['Five stars, would simmer again.', 'The traffic cone was a bold choice.'],
  },
};

/** WithExisting at the phone measure, where the longer review wraps onto two lines. */
export const Mobile: Story = {
  args: WithExisting.args,
  decorators: [mobileGameColumn],
};
