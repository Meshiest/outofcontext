import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Button } from '../Button/Button';

const meta = {
  title: 'Form/Form',
  component: Form,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const gameOptions = [
  { text: 'Raconteur', value: 'story' },
  { text: 'Scribble', value: 'draw' },
];

export const WithFields: Story = {
  render: (args) => (
    <Form {...args} onSubmit={(e) => e.preventDefault()}>
      <Input label="Name" defaultValue="Ethan" />
      <Input label="Lobby code" defaultValue="ABCD" />
      <Button type="submit">Join</Button>
    </Form>
  ),
};

export const WithSelect: Story = {
  render: (args) => (
    <Form {...args} onSubmit={(e) => e.preventDefault()}>
      <Input label="Name" defaultValue="Ethan" />
      <Select label="Game" placeholder="Select a game" options={gameOptions} />
      <Button type="submit">Start</Button>
    </Form>
  ),
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <Form {...args} onSubmit={(e) => e.preventDefault()}>
      <Input label="Name" defaultValue="Ethan" />
      <Button type="submit" loading>
        Join
      </Button>
    </Form>
  ),
};

export const ErrorState: Story = {
  args: { error: true },
  render: (args) => (
    <Form {...args} onSubmit={(e) => e.preventDefault()}>
      <Input label="Lobby code" defaultValue="ZZZZ" error="This lobby does not exist" />
      <Button type="submit">Join</Button>
    </Form>
  ),
};
