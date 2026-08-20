import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'UI/Divider',
  component: Divider,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 text-text">
      <p>Above the line</p>
      <Divider />
      <p>Below the line</p>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-80 text-text">
      <p>Players</p>
      <Divider>Lobby</Divider>
      <p>Spectators</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center text-text">
      <span>Story</span>
      <Divider orientation="vertical" />
      <span>Comic</span>
      <Divider orientation="vertical" />
      <span>Draw</span>
    </div>
  ),
};
