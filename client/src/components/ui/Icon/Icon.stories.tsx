import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import { ICON_NAMES } from './icon-map';

const meta: Meta<typeof Icon> = {
  title: 'UI/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    color: {
      control: 'select',
      options: [undefined, 'primary', 'positive', 'negative', 'warning', 'info', 'muted', 'subtle'],
    },
  },
  args: { name: 'pencil', size: 'lg' },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 text-text">
      <Icon name="shield" size="sm" />
      <Icon name="shield" size="md" />
      <Icon name="shield" size="lg" />
      <Icon name="shield" size="xl" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon name="heart" size="lg" color="negative" />
      <Icon name="check" size="lg" color="positive" />
      <Icon name="clock" size="lg" color="warning" />
      <Icon name="shield" size="lg" color="primary" />
      <Icon name="user" size="lg" color="muted" />
    </div>
  ),
};

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 text-text sm:grid-cols-6">
      {ICON_NAMES.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1 text-center">
          <Icon name={name} size="lg" />
          <span className="font-mono text-[10px] text-text-muted">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const UnknownName: Story = { args: { name: 'not-a-real-icon' } };
