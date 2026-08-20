import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { Timer } from './Timer';

const meta = {
  title: 'Widgets/Timer',
  component: Timer,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Timer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under a minute: raw seconds with a pluralized unit. */
export const CountingDownSeconds: Story = {
  args: { startTime: Date.now(), duration: 30 },
};

/** Over a minute: switches to M:SS. */
export const CountingDownClock: Story = {
  args: { startTime: Date.now(), duration: 120 },
};

/** Already elapsed: clamps to zero and reads "Time's up". */
export const Expired: Story = {
  args: { startTime: Date.now() - 60_000, duration: 30 },
};

/** No startTime: static display of the duration, no ticking. */
export const StaticNoStart: Story = {
  args: { duration: 45 },
};
