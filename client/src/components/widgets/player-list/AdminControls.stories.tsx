import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { AdminControls } from './AdminControls';

const meta = {
  title: 'Widgets/PlayerList/AdminControls',
  component: AdminControls,
  parameters: { layout: 'centered' },
  args: { playerId: 'u1', onGrantAdmin: () => {}, onRemovePlayer: () => {} },
} satisfies Meta<typeof AdminControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RemoveMode: Story = {
  args: { isRemoveMode: true },
};

export const GrantMode: Story = {
  args: { isAdminMode: true },
};
