import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import '@/i18n';
import { trpc } from '@/trpc/trpc';
import { createLinks } from '@/trpc/links';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { NameEntry } from './NameEntry';

// NameEntry reads the transport contexts (name mutation, lobby info, route code). The same stack as
// JoinLobbyModal's story; subscriptions fail quietly with no dev server but the form still renders.
function StoryProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createLinks() }));
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <MemoryRouter initialEntries={['/lobby/wxyz']}>
            <Routes>
              <Route path="/lobby/:code" element={<LobbyProvider>{children}</LobbyProvider>} />
            </Routes>
          </MemoryRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const meta = {
  title: 'Pages/Lobby/NameEntry',
  component: NameEntry,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof NameEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
