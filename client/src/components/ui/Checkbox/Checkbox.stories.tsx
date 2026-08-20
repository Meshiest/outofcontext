import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Form/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  args: {
    label: 'Enabled',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const WithoutLabel: Story = {
  args: { label: undefined, 'aria-label': 'Enabled' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Controlled: Story = {
  render: function ControlledCheckbox(args) {
    const [on, setOn] = useState(true);
    return <Checkbox {...args} checked={on} onChange={(e) => setOn(e.target.checked)} />;
  },
};
