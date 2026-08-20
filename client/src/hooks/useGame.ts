import { useCallback } from 'react';
import { trpc } from '@/trpc/trpc';
import { useGameState } from '@/contexts/GameStateContext';
import type { GameState, PlayerState } from '@shared/types';
import type { GameMessageType } from '@shared/events';

export interface UseGame {
  gameState: GameState | null;
  playerInfo: PlayerState | null;

  startGame: () => void;
  endGame: () => void;
  sendGameMessage: (type: GameMessageType, data?: unknown) => void;
}

/**
 * Game control actions + hot game state. `start`/`end` are admin-gated server-side. `sendGameMessage`
 * carries the single `(type, data)` input the router forwards to the game's handleMessage - games
 * that need multiple values pack them into the one `data`. Game state arrives via the game.onState
 * subscription owned by GameStateProvider.
 */
export function useGame(): UseGame {
  const { gameState, playerInfo } = useGameState();

  const startMutation = trpc.game.start.useMutation();
  const endMutation = trpc.game.end.useMutation();
  const messageMutation = trpc.game.message.useMutation();

  const startGame = useCallback(() => startMutation.mutate(), [startMutation]);
  const endGame = useCallback(() => endMutation.mutate(), [endMutation]);
  const sendGameMessage = useCallback(
    (type: GameMessageType, data?: unknown) => messageMutation.mutate({ type, data }),
    [messageMutation],
  );

  return { gameState, playerInfo, startGame, endGame, sendGameMessage };
}
