import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'error', 'info'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: { children: 'Connected', variant: 'success', size: 'md' },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Idle</Badge>
      <Badge variant="success">Connected</Badge>
      <Badge variant="warning">Reconnecting</Badge>
      <Badge variant="error">Disconnected</Badge>
      <Badge variant="info">Spectator</Badge>
    </div>
  ),
};

export const Dots: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge variant="success" aria-label="Connected" />
      <Badge variant="warning" aria-label="Reconnecting" />
      <Badge variant="error" aria-label="Disconnected" />
      <Badge variant="default" aria-label="Idle" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};
