import { useCallback, useEffect } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useGame } from '@/hooks/useGame';
import type { GameMessageType } from '@shared/events';

/** How long to wait before asking again, when a request went unanswered. */
const RETRY_MS = 2500;

/** Stop after this many unanswered attempts (~20s); past that, retrying is not the problem. */
const MAX_ATTEMPTS = 8;

export interface UseGameResults<T> {
  /** The latest result payload for `resultEvent`, or an empty array before it arrives. */
  results: T[];
  /** Re-request the results from the server (the result-event name doubles as a request message). */
  requestResults: () => void;
}

/**
 * Reads the latest {game}:result payload out of the shared game-state context and exposes a
 * `requestResults()` that (re-)requests it. A result-event name (e.g. 'story:result') is ALSO a
 * valid game message type used to REQUEST results, so the same string drives both directions.
 *
 * Asks as soon as the game reports `isComplete`, and keeps asking until the answer arrives.
 *
 * The condition is "complete but empty-handed", deliberately NOT a fired-once latch. Two failures
 * come from that:
 *
 *  - A latch that survives the round never re-arms, so the SECOND game in a lobby asks for nothing
 *    and the viewer spins forever. Reloading the page hid it, because a fresh mount starts clear.
 *  - The push channel has no delivery guarantee: `Member.send` emits on an EventEmitter with no
 *    buffering, so a reply that arrives while no subscription is attached is dropped with nothing
 *    to resend it.
 *
 * Retrying stops the moment results land, and gives up after MAX_ATTEMPTS so a genuinely broken
 * state cannot turn into an endless poll.
 */
export function useGameResults<T>(resultEvent: GameMessageType): UseGameResults<T> {
  const { gameState, results } = useGameState();
  const { sendGameMessage } = useGame();

  const requestResults = useCallback(
    () => sendGameMessage(resultEvent),
    [sendGameMessage, resultEvent],
  );

  const isComplete = gameState?.isComplete ?? false;
  const payload = (results[resultEvent]?.[0] as T[] | undefined) ?? [];
  const havePayload = payload.length > 0;

  useEffect(() => {
    if (!isComplete || havePayload) return;
    requestResults();
    let attempts = 0;
    const id = setInterval(() => {
      if (++attempts >= MAX_ATTEMPTS) {
        clearInterval(id);
        return;
      }
      requestResults();
    }, RETRY_MS);
    return () => clearInterval(id);
  }, [isComplete, havePayload, requestResults]);

  return { results: payload, requestResults };
}
