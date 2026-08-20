import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import '@/i18n';
import { trpc } from '@/trpc/trpc';
import { createLinks } from '@/trpc/links';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { HomePage } from './HomePage';

// HomePage is transport-integrated (useLobby / useConnection), so a story needs the real provider
// stack. Without a reachable backend the SSE stays unconnected, so the Create / Join buttons show
// their loading treatment - the page shell (title, dividers, info links) renders regardless.
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
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
