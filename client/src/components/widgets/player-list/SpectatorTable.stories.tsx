import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { SpectatorTable } from './SpectatorTable';
import type { Spectator } from './types';

const spectators: Spectator[] = [{ id: 's1', name: 'Devi' }, { id: 's2' }];

const meta = {
  title: 'Widgets/PlayerList/SpectatorTable',
  component: SpectatorTable,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { spectators, currentUserId: 's1' },
} satisfies Meta<typeof SpectatorTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { spectators: [] },
};
