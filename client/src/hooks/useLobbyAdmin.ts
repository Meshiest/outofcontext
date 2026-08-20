import { useCallback } from 'react';
import { trpc } from '@/trpc/trpc';
import { useLobbyInfo } from '@/contexts/LobbyContext';

export interface UseLobbyAdmin {
  isAdmin: boolean;
  setGame: (game: string) => void;
  setConfig: (name: string, value: number | string) => void;
  toggleAdmin: (playerId: string) => void;
  grantAdmin: (playerId: string) => void;
}

/**
 * Admin actions (all admin-gated server-side via adminProcedure). `toggleAdmin` demotes a player to
 * spectator; `grantAdmin` hands over admin.
 */
export function useLobbyAdmin(): UseLobbyAdmin {
  const { lobbyInfo, playerId } = useLobbyInfo();

  const setGameMutation = trpc.lobby.setGame.useMutation();
  const setConfigMutation = trpc.lobby.setConfig.useMutation();
  const toggleAdminMutation = trpc.lobby.toggleAdmin.useMutation();
  const grantAdminMutation = trpc.lobby.grantAdmin.useMutation();

  const setGame = useCallback((game: string) => setGameMutation.mutate(game), [setGameMutation]);
  const setConfig = useCallback(
    (name: string, value: number | string) => setConfigMutation.mutate({ name, value }),
    [setConfigMutation],
  );
  const toggleAdmin = useCallback(
    (targetPlayerId: string) => toggleAdminMutation.mutate(targetPlayerId),
    [toggleAdminMutation],
  );
  const grantAdmin = useCallback(
    (targetPlayerId: string) => grantAdminMutation.mutate(targetPlayerId),
    [grantAdminMutation],
  );

  return {
    isAdmin: lobbyInfo != null && lobbyInfo.admin === playerId,
    setGame,
    setConfig,
    toggleAdmin,
    grantAdmin,
  };
}
