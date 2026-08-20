import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmoteBar } from './EmoteBar';

const meta = {
  title: 'Widgets/PlayerList/EmoteBar',
  component: EmoteBar,
  parameters: { layout: 'centered' },
  args: { isOpen: true, onSendEmote: () => {} },
  decorators: [
    (Story) => (
      <div className="relative mt-32">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmoteBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
