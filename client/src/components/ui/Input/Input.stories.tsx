import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Form/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: {
    placeholder: 'Ethan',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithLabel: Story = {
  args: { label: 'Name', defaultValue: 'Ethan' },
};

export const WithError: Story = {
  args: { label: 'Name', defaultValue: '', error: 'Name is required' },
};

export const WithIcon: Story = {
  args: {
    label: 'Search players',
    icon: <i className="fa-solid fa-magnifying-glass" />,
    placeholder: 'Filter',
  },
};

export const IconRight: Story = {
  args: {
    label: 'Search players',
    icon: <i className="fa-solid fa-magnifying-glass" />,
    iconPosition: 'right',
  },
};

export const NumberType: Story = {
  args: { label: 'Rounds', type: 'number', min: 1, max: 10, defaultValue: 3 },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} size="sm" placeholder="Small" />
      <Input {...args} size="md" placeholder="Medium" />
      <Input {...args} size="lg" placeholder="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  args: { label: 'Name', defaultValue: 'Ethan', disabled: true },
};
