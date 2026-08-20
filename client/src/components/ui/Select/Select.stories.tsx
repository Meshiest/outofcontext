import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const gameOptions = [
  { text: 'Raconteur', value: 'story' },
  { text: 'Dilettante', value: 'comic' },
  { text: 'Scribble', value: 'draw' },
  { text: 'Redacted', value: 'redacted' },
];

const meta = {
  title: 'Form/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: {
    options: gameOptions,
    placeholder: 'Select a game',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPlaceholder: Story = {
  args: { value: '' },
};

export const PreSelected: Story = {
  args: { label: 'Game', value: 'draw' },
};

export const Loading: Story = {
  args: { label: 'Game', loading: true },
};

export const Disabled: Story = {
  args: { label: 'Game', value: 'story', disabled: true },
};

export const WithError: Story = {
  args: { label: 'Game', value: '', error: 'Choose a game to continue' },
};

export const Controlled: Story = {
  render: function ControlledSelect(args) {
    const [value, setValue] = useState('');
    return <Select {...args} label="Game" value={value} onChange={(next) => setValue(next)} />;
  },
};
