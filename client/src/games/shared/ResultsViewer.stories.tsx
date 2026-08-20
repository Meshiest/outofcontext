import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { ResultsViewer } from './ResultsViewer';

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the same wrapper at the 375px phone column.
const meta = {
  title: 'Games/Shared/ResultsViewer',
  component: ResultsViewer,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { title: 'Stories', children: null },
} satisfies Meta<typeof ResultsViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithContent: Story = {
  args: {
    children: (
      <>
        <p className="text-text">Once upon a time, a lobby of friends wrote a story together.</p>
        <p className="text-text">And then the story kept going, one line at a time.</p>
      </>
    ),
  },
};

/** No content yet: shows the loading spinner. */
export const Loading: Story = {};

/**
 * WithContent at the phone measure. Note that the desktop scroll region is a `lg:` rule, which keys
 * off the viewport rather than this frame - use the toolbar viewport control to exercise that.
 */
export const Mobile: Story = {
  args: WithContent.args,
  decorators: [mobileGameColumn],
};
