import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { trpc } from '@/trpc/trpc';
import { createLinks } from '@/trpc/links';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { GameStateProvider } from '@/contexts/GameStateContext';
import { AppRoutes } from '@/router';
import { ConnectionOverlay } from '@/components/ConnectionOverlay';

/**
 * Provider hierarchy (outer -> inner):
 *   trpc.Provider + QueryClientProvider  -> typed client + TanStack Query cache
 *   PreferencesProvider                  -> dark mode / streamer mode / sound / name (localStorage)
 *   BrowserRouter                        -> routing (LobbyProvider hooks may read route params)
 *   LobbyProvider                        -> cold membership + connection + version (lobby.onInfo SSE)
 *   GameStateProvider                    -> hot game state (game.onState SSE), split to isolate churn
 * The client + queryClient are created once (useState initializer) so they survive re-renders.
 */
function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient({ links: createLinks() }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <BrowserRouter>
            <LobbyProvider>
              <GameStateProvider>
                <AppRoutes />
                <ConnectionOverlay />
              </GameStateProvider>
            </LobbyProvider>
          </BrowserRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
