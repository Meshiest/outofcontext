import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Form/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  args: {
    placeholder: 'Once upon a time...',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithLabel: Story = {
  args: { label: 'Your line' },
};

export const WithError: Story = {
  args: { label: 'Your line', error: 'This line is too short' },
};

export const WithCharacterCount: Story = {
  args: { label: 'Your line', maxLength: 140, defaultValue: 'A short beginning.' },
};

export const Disabled: Story = {
  args: { label: 'Your line', defaultValue: 'Locked in', disabled: true },
};
