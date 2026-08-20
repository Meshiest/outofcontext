import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn } from '@/games/storybookFrames';
import { DoneReadingButton } from './DoneReadingButton';

// Framed at the 760px game column it sits at the foot of (see storybookFrames). No mobile twin:
// the button is `w-full sm:w-auto`, and `sm:` keys off the viewport rather than this frame, so a
// narrower frame would only recentre the same auto-width button. Use the toolbar viewport control
// to see it go full-width.
const meta = {
  title: 'Games/Shared/DoneReadingButton',
  component: DoneReadingButton,
  parameters: { layout: 'centered' },
  decorators: [desktopGameColumn],
  args: { isDone: false, onClick: () => {} },
} satisfies Meta<typeof DoneReadingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StillReading: Story = { args: { isDone: false } };

export const Done: Story = { args: { isDone: true } };
