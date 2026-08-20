import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import '@/i18n';
import type { LobbyInfo } from '@shared/types';
import { trpc } from '@/trpc/trpc';
import { createLinks } from '@/trpc/links';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { GameStateProvider } from '@/contexts/GameStateContext';
import { LobbyPlaying } from './LobbyPlaying';

// LobbyPlaying composes the real GameRenderer + wired PlayerList, so it needs the full transport
// stack. Without a dev server the game shows its loading/waiting fallback and the list stays static.
function StoryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createLinks() }));
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <MemoryRouter initialEntries={['/lobby/wxyz']}>
            <LobbyProvider>
              <GameStateProvider>{children}</GameStateProvider>
            </LobbyProvider>
          </MemoryRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const lobbyInfo: LobbyInfo = {
  game: 'story',
  state: 'PLAYING',
  config: {},
  admin: 'u1',
  gameState: { icons: {} },
  members: [],
  players: [
    { id: 'u1', playerId: 'p1', connected: true, name: 'Ada' },
    { id: 'u2', playerId: 'p2', connected: true, name: 'Bo' },
  ],
  spectators: [{ id: 's1', name: 'Cy' }],
};

const meta = {
  title: 'Pages/Lobby/LobbyPlaying',
  component: LobbyPlaying,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
  args: { lobbyInfo, playerId: 'u1' },
} satisfies Meta<typeof LobbyPlaying>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminView: Story = {};

export const NonAdminView: Story = {
  args: { playerId: 'u2' },
};
