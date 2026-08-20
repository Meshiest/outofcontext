import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Data Display/Progress',
  component: Progress,
  parameters: { layout: 'padded' },
  args: { percent: 60, color: 'primary', size: 'md' },
  argTypes: {
    percent: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    color: { control: 'select', options: ['primary', 'positive', 'negative', 'warning', 'info'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'boolean' },
    indicating: { control: 'boolean' },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPercentLabel: Story = {
  args: { percent: 72, label: true },
};

export const WithTextLabel: Story = {
  args: { percent: 33, label: 'Round 1 of 3' },
};

export const Indicating: Story = {
  args: { percent: 45, indicating: true, label: true },
};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Progress percent={25} color="primary" label />
      <Progress percent={50} color="positive" label />
      <Progress percent={70} color="warning" label />
      <Progress percent={85} color="info" label />
      <Progress percent={95} color="negative" label />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Progress percent={60} size="sm" />
      <Progress percent={60} size="md" />
      <Progress percent={60} size="lg" />
    </div>
  ),
};
