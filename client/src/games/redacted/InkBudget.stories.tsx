import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { InkBudget } from './InkBudget';
import { COST } from './redactedUtils';

// Framed at the real game-column measure (see storybookFrames). It is only a one-line readout, but
// the second half of it is the one thing here that wraps on a phone, so the pair earns its keep.
const meta = {
  title: 'Games/Redacted/InkBudget',
  component: InkBudget,
  parameters: { layout: 'centered' },
  decorators: [desktopGameColumn],
  args: { ink: 25, cost: COST, used: 0, mode: 'censor' },
} satisfies Meta<typeof InkBudget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Censor: Story = { args: { mode: 'censor', used: 2 } };

export const Truncate: Story = { args: { mode: 'truncate', used: 3 } };

/** Fully spent: no more redactions available. */
export const Exhausted: Story = { args: { ink: 10, mode: 'censor', used: 2 } };

/** The phone measure, where the per-word cost detail drops onto its own line. */
export const Mobile: Story = {
  args: { mode: 'censor', used: 2 },
  decorators: [mobileGameColumn],
};
