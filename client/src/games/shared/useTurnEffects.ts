import { useEffect, useRef } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTurnSound } from '@/data/sounds';
import { logEvent } from '@/lib/analytics';
import { useLobbyInfo } from '@/contexts/LobbyContext';

/**
 * Fires the chain-game turn side-effects (haptics, turn sound, analytics) on transitions INTO a
 * player state. Only the 5 chain games (Story / Comic / Draw / Redacted / Recipe) use this; Assassin
 * has zero turn side-effects and must NOT gain them, so it reads useGameState()/useLobbyInfo()
 * directly instead of calling this hook.
 *
 * Transitions:
 *   -> EDITING : vibrate(40) + play turn sound + log 'wait_event'
 *   -> READING : vibrate([40, 100, 40])
 *   -> WAITING : log 'turn_event'
 *
 * The first non-null state only SEEDS the "playing" flag / previous-state ref; no effects fire on
 * that first render, so turn/wait durations are measured from the second state onward.
 */
export function useTurnEffects(playerState: string | null | undefined): void {
  const { vibrate } = useHaptics();
  const playTurnSound = useTurnSound();
  const { lobbyInfo, code } = useLobbyInfo();
  const prev = useRef<string | null>(null);
  const playing = useRef(false);
  const enteredAt = useRef(0);

  useEffect(() => {
    if (playerState == null) return;

    const context = { game_name: lobbyInfo?.game, lobby_code: code ?? undefined };
    const now = Date.now();

    // Seed on the first non-null state; do not fire effects on the seed itself.
    if (!playing.current) {
      playing.current = true;
      prev.current = playerState;
      enteredAt.current = now;
      return;
    }

    if (playerState === prev.current) return;
    prev.current = playerState;
    const elapsedMs = now - enteredAt.current;
    enteredAt.current = now;

    switch (playerState) {
      case 'EDITING':
        // Entering a turn: the elapsed time was spent waiting for the turn to arrive.
        vibrate(40);
        playTurnSound();
        logEvent('wait_event', { ...context, wait_duration: elapsedMs });
        break;
      case 'READING':
        vibrate([40, 100, 40]);
        break;
      case 'WAITING':
        // Leaving a turn: the elapsed time was spent editing.
        logEvent('turn_event', { ...context, turn_duration: elapsedMs });
        break;
      default:
        break;
    }
  }, [playerState, vibrate, playTurnSound, lobbyInfo, code]);
}
