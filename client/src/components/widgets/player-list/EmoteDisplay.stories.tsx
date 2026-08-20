import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmoteDisplay } from './EmoteDisplay';

const meta = {
  title: 'Widgets/PlayerList/EmoteDisplay',
  component: EmoteDisplay,
  parameters: { layout: 'centered' },
  args: { emote: 'heart' },
  decorators: [
    (Story) => (
      <div className="relative h-16 w-16">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmoteDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Animating: Story = {};

export const Exiting: Story = {
  args: { exiting: true },
};
