import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Message } from './Message';

const meta = {
  title: 'Layout/Message',
  component: Message,
  parameters: { layout: 'padded' },
  args: {
    variant: 'info',
    header: 'Heads up',
    content: 'Something worth reading is happening here.',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] },
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { variant: 'info' } };
export const Success: Story = {
  args: {
    variant: 'success',
    header: 'Lobby created',
    content: 'Share the code with your friends.',
  },
};
export const Warning: Story = {
  args: { variant: 'warning', header: 'Almost full', content: 'This lobby is nearly at capacity.' },
};
export const Error: Story = {
  args: { variant: 'error', header: 'Invalid Lobby Code', content: 'This lobby does not exist.' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-3">
      <Message variant="info" header="Info" content="An informational message." />
      <Message variant="success" header="Success" content="Everything worked." />
      <Message variant="warning" header="Warning" content="Proceed with caution." />
      <Message variant="error" header="Error" content="Something went wrong." />
    </div>
  ),
};

export const HeaderOnly: Story = { args: { content: undefined, header: 'Invalid name' } };
export const ContentOnly: Story = {
  args: { header: undefined, content: 'This name is already taken.' },
};

function DismissibleDemo() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button type="button" className="text-primary underline" onClick={() => setOpen(true)}>
        Show message again
      </button>
    );
  }
  return (
    <Message
      variant="error"
      header="Invalid Lobby Code"
      content="This lobby does not exist."
      dismissible
      dismissLabel="Dismiss"
      onDismiss={() => setOpen(false)}
    />
  );
}

export const Dismissible: Story = {
  render: () => <DismissibleDemo />,
};
