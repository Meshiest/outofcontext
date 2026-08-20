import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { StartGameButton } from './StartGameButton';

const meta = {
  title: 'Pages/Lobby/StartGameButton',
  component: StartGameButton,
  parameters: { layout: 'centered' },
  args: { disabled: false, onStart: () => {} },
} satisfies Meta<typeof StartGameButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
