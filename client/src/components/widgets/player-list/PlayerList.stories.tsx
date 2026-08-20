import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PlayerList } from './PlayerList';
import type { Player, Spectator } from './types';

const players: Player[] = [
  { id: 'u1', playerId: 'p1', name: 'Ada', connected: true },
  { id: 'u2', playerId: 'p2', name: 'Bo', connected: true },
  { id: 'u3', playerId: 'p3', name: 'Cy', connected: true },
];
const spectators: Spectator[] = [{ id: 's1', name: 'Devi' }, { id: 's2' }];

const meta = {
  title: 'Widgets/PlayerList',
  component: PlayerList,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    players,
    spectators,
    admin: 'u1',
    currentUserId: 'u1',
    isSpectator: false,
    canJoinPlayers: false,
    lobbyState: 'WAITING',
    gameState: { icons: {} },
  },
} satisfies Meta<typeof PlayerList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminView: Story = {};

export const NonAdminView: Story = {
  args: { currentUserId: 'u2' },
};

export const EmptyLobby: Story = {
  args: { players: [], spectators: [] },
};

export const WithDisconnectedPlayer: Story = {
  args: {
    isSpectator: true,
    currentUserId: 's1',
    players: [
      { id: 'u1', playerId: 'p1', name: 'Ada', connected: true },
      { id: 'u2', playerId: 'p2', name: 'Bo', connected: false },
    ],
  },
};

export const WithGameIcons: Story = {
  args: {
    lobbyState: 'PLAYING',
    gameState: { icons: { p1: 'pencil', p2: 'book open', p3: 'wait' } },
  },
};
