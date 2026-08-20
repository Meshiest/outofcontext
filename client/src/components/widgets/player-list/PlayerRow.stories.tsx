import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PlayerRow } from './PlayerRow';

const meta = {
  title: 'Widgets/PlayerList/PlayerRow',
  component: PlayerRow,
  parameters: { layout: 'padded' },
  args: { player: { id: 'u1', playerId: 'p1', name: 'Ada', connected: true } },
  decorators: [
    (Story) => (
      <table className="ooc-table w-80">
        <tbody>
          <Story />
        </tbody>
      </table>
    ),
  ],
} satisfies Meta<typeof PlayerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const CurrentUser: Story = {
  args: { isCurrentUser: true },
};

export const Admin: Story = {
  args: { isAdmin: true },
};

export const Disconnected: Story = {
  args: { player: { id: 'u1', playerId: 'p1', name: 'Ada', connected: false } },
};

export const WithStatusIcon: Story = {
  args: { statusIcon: 'pencil' },
};
