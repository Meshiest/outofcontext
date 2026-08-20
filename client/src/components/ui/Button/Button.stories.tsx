import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'positive', 'negative', 'basic'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: { control: 'select', options: [undefined, 'green', 'red', 'blue', 'orange', 'grey'] },
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    compact: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  args: { children: 'Create', variant: 'primary', size: 'md' },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Leave' } };
export const Positive: Story = {
  args: { variant: 'positive', children: 'Start Game', icon: 'play circle' },
};
export const Negative: Story = {
  args: { variant: 'negative', children: 'End Game', icon: 'times' },
};
export const Basic: Story = { args: { variant: 'basic', children: 'Undo', icon: 'undo' } };

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="positive">Positive</Button>
      <Button variant="negative">Negative</Button>
      <Button variant="basic">Basic</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button icon="check">Done</Button>
      <Button icon="undo" iconPosition="left" variant="basic">
        Undo
      </Button>
      <Button icon="heart" iconPosition="right" color="red">
        Like
      </Button>
      <Button icon="pencil" compact aria-label="Edit" />
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: 'Creating' } };
export const Disabled: Story = { args: { disabled: true, children: 'Done', icon: 'check' } };
export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Join Lobby' },
  parameters: { layout: 'padded' },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark flex gap-3 rounded-lg bg-bg p-8">
      <Button variant="primary">Primary</Button>
      <Button variant="positive">Positive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="basic">Basic</Button>
    </div>
  ),
};
