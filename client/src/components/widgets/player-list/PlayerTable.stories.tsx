import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PlayerTable } from './PlayerTable';
import type { Player } from './types';

const players: Player[] = [
  { id: 'u1', playerId: 'p1', name: 'Ada', connected: true },
  { id: 'u2', playerId: 'p2', name: 'Bo', connected: false },
];

const meta = {
  title: 'Widgets/PlayerList/PlayerTable',
  component: PlayerTable,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { players, currentUserId: 'u1', adminId: 'u1' },
} satisfies Meta<typeof PlayerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { players: [] },
};
