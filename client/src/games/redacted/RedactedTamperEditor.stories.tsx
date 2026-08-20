import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { RedactedTamperEditor } from './RedactedTamperEditor';

// Framed at the real game-column measure (see storybookFrames). Width is load-bearing here: the
// word grid is what the player clicks, and it wraps differently at 343px than at 760px.
const meta = {
  title: 'Games/Redacted/RedactedTamperEditor',
  component: RedactedTamperEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    line: 'The quick brown fox jumps over the lazy dog',
    ink: 25,
    onCensor: () => {},
    onTruncate: () => {},
  },
} satisfies Meta<typeof RedactedTamperEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both modes enabled: the Truncate / Censor toggle is shown. */
export const BothModes: Story = {
  args: { gamemode: { censor: 'player', truncate: 'player' } },
};

/** Censor only: the toggle is hidden and censor is auto-selected. */
export const CensorOnly: Story = {
  args: { gamemode: { censor: 'player', truncate: 'none' } },
};

/** Truncate only: the toggle is hidden and truncate is auto-selected. */
export const TruncateOnly: Story = {
  args: { gamemode: { censor: 'none', truncate: 'player' } },
};

/** BothModes at the phone measure: the line wraps, so the word targets sit on several rows. */
export const Mobile: Story = {
  args: BothModes.args,
  decorators: [mobileGameColumn],
};
