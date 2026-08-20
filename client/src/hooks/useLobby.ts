import { useCallback } from 'react';
import { trpc } from '@/trpc/trpc';
import { useLobbyInfo } from '@/contexts/LobbyContext';
import type { LobbyInfo } from '@shared/types';

export type LobbyState = 'LOADING' | 'NO_LOBBY' | 'LOBBY_WAITING' | 'PLAYING';

export interface UseLobby {
  lobbyInfo: LobbyInfo | null;
  code: string | null;
  lobbyState: LobbyState;
  validLobby: boolean;
  isSpectator: boolean;
  /** True while a `lobby.create` mutation is in flight; settles (incl. on error) so callers do not stick. */
  creatingLobby: boolean;

  /** Fire the create mutation; `onCode` receives the new lobby code the server returns (authoritative). */
  createLobby: (onCode?: (code: string) => void) => void;
  joinLobby: (code: string) => void;
  leaveLobby: () => void;
  spectate: () => void;
  replaceMember: (playerId: string) => void;
}

/**
 * Lobby membership state + the join/leave/spectate/replace actions. Server->client updates arrive
 * via the lobby.onInfo subscription owned by LobbyProvider; this hook only reads that state and
 * issues actions.
 */
export function useLobby(): UseLobby {
  const { lobbyInfo, code, playerId } = useLobbyInfo();

  const createMutation = trpc.lobby.create.useMutation();
  const joinMutation = trpc.lobby.join.useMutation();
  const leaveMutation = trpc.lobby.leave.useMutation();
  const spectateMutation = trpc.lobby.spectate.useMutation();
  const replaceMutation = trpc.lobby.replace.useMutation();

  const createLobby = useCallback(
    (onCode?: (code: string) => void) =>
      createMutation.mutate(undefined, { onSuccess: (data) => onCode?.(data.code) }),
    [createMutation],
  );
  const joinLobby = useCallback(
    (joinCode: string) => joinMutation.mutate(joinCode),
    [joinMutation],
  );
  const leaveLobby = useCallback(() => leaveMutation.mutate(), [leaveMutation]);
  const spectate = useCallback(() => spectateMutation.mutate(), [spectateMutation]);
  const replaceMember = useCallback(
    (targetPlayerId: string) => replaceMutation.mutate(targetPlayerId),
    [replaceMutation],
  );

  let lobbyState: LobbyState;
  if (code == null) lobbyState = 'NO_LOBBY';
  else if (lobbyInfo == null) lobbyState = 'LOADING';
  else if (lobbyInfo.state === 'PLAYING') lobbyState = 'PLAYING';
  else lobbyState = 'LOBBY_WAITING';

  const isSpectator = lobbyInfo?.spectators.some((s) => s.id === playerId) ?? false;

  return {
    lobbyInfo,
    code,
    lobbyState,
    validLobby: lobbyInfo != null,
    isSpectator,
    creatingLobby: createMutation.isPending,
    createLobby,
    joinLobby,
    leaveLobby,
    spectate,
    replaceMember,
  };
}
