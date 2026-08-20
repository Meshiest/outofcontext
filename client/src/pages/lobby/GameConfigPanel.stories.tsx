import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import GAMES from '@gameInfo';
import { GameConfigPanel } from './GameConfigPanel';

const meta = {
  title: 'Pages/Lobby/GameConfigPanel',
  component: GameConfigPanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
  args: {
    gameId: 'story',
    gameMeta: GAMES.story,
    config: {},
    playerCount: 4,
    isAdmin: true,
    onConfigChange: () => {},
  },
} satisfies Meta<typeof GameConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Admin: Story = {};

export const NonAdminReadOnly: Story = {
  args: { isAdmin: false },
};
