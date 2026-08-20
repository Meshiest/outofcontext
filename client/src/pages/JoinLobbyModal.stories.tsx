import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import '@/i18n';
import { trpc } from '@/trpc/trpc';
import { createLinks } from '@/trpc/links';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { JoinLobbyModal } from './JoinLobbyModal';

// Same transport-integrated stack as HomePage: the modal reads connection + streamer-mode state and
// validates codes through tRPC. Loading / error states are interaction-driven (see the test file).
function StoryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createLinks() }));
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <MemoryRouter>
            <LobbyProvider>{children}</LobbyProvider>
          </MemoryRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const meta = {
  title: 'Pages/JoinLobbyModal',
  component: JoinLobbyModal,
  parameters: { layout: 'fullscreen' },
  args: {
    onClose: () => {},
  },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof JoinLobbyModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
};

export const Closed: Story = {
  args: { open: false },
};
