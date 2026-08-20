import { useMemo } from 'react';
import { useLobbyInfo } from '@/contexts/LobbyContext';
import type { PlayerInfo } from '@shared/types';

/**
 * Build a playerId -> display-name map from a lobby's player slots. Pure and exported so tests (and
 * non-hook callers) can exercise the mapping without a provider.
 */
export function buildNameTable(players: PlayerInfo[] | undefined): Record<string, string> {
  const table: Record<string, string> = {};
  for (const player of players ?? []) {
    table[player.playerId] = player.name;
  }
  return table;
}

/**
 * playerId -> name mapping derived from the current lobby info. Games read this to attribute chain
 * links / dossiers to human names. Empty object until lobby info arrives.
 */
export function useNameTable(): Record<string, string> {
  const { lobbyInfo } = useLobbyInfo();
  return useMemo(() => buildNameTable(lobbyInfo?.players), [lobbyInfo?.players]);
}
