import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { EndGameButton } from './EndGameButton';

/** Click once to arm "Are you sure?"; it auto-resets after 1s. */
const meta = {
  title: 'Widgets/PlayerList/EndGameButton',
  component: EndGameButton,
  parameters: { layout: 'centered' },
  args: { isAdmin: true, lobbyState: 'PLAYING', onEndGame: () => {} },
} satisfies Meta<typeof EndGameButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {};

export const NotAdmin: Story = {
  args: { isAdmin: false },
};
