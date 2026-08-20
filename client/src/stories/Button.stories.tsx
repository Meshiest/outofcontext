import type { Meta, StoryObj } from '@storybook/react-vite';

function Button({
  label,
  variant = 'primary',
}: {
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const base = 'px-4 py-2 rounded font-semibold transition-colors';
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-surface-2 text-text hover:bg-border-hair',
  };
  return <button className={`${base} ${styles[variant]}`}>{label}</button>;
}

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { label: 'Start Game', variant: 'primary' } };
export const Secondary: Story = { args: { label: 'Leave Lobby', variant: 'secondary' } };
export const DarkMode: Story = {
  args: { label: 'Dark Button', variant: 'secondary' },
  decorators: [
    (Story) => (
      <div className="dark bg-black p-8">
        <Story />
      </div>
    ),
  ],
};
