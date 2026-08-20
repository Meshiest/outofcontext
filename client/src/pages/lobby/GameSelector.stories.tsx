import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { GameSelector } from './GameSelector';

const meta = {
  title: 'Pages/Lobby/GameSelector',
  component: GameSelector,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
  args: { value: '', onSelect: () => {} },
} satisfies Meta<typeof GameSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoGameSelected: Story = {};

export const GameSelected: Story = {
  args: { value: 'story' },
};
