import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { JoinSpectateButton } from './JoinSpectateButton';

const meta = {
  title: 'Widgets/PlayerList/JoinSpectateButton',
  component: JoinSpectateButton,
  parameters: { layout: 'centered' },
  args: {
    isPlayer: false,
    isSpectator: false,
    canJoinPlayers: false,
    onSpectate: () => {},
    onJoinPlayers: () => {},
    onLeave: () => {},
  },
} satisfies Meta<typeof JoinSpectateButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsPlayer: Story = {
  args: { isPlayer: true },
};

export const AsSpectatorCanJoin: Story = {
  args: { isSpectator: true, canJoinPlayers: true },
};

export const AsSpectatorLocked: Story = {
  args: { isSpectator: true, canJoinPlayers: false },
};
