import { useEffect, useRef } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTurnSound } from '@/data/sounds';

/**
 * Fires the chain-game turn side-effects (haptics, turn sound) on transitions INTO a player state.
 * Only the 5 chain games (Story / Comic / Draw / Redacted / Recipe) use this; Assassin has zero turn
 * side-effects and must NOT gain them, so it reads useGameState()/useLobbyInfo() directly instead of
 * calling this hook.
 *
 * Transitions:
 *   -> EDITING : vibrate(40) + play turn sound
 *   -> READING : vibrate([40, 100, 40])
 *
 * The first non-null state only SEEDS the "playing" flag / previous-state ref, so no effects fire on
 * that first render.
 */
export function useTurnEffects(playerState: string | null | undefined): void {
  const { vibrate } = useHaptics();
  const playTurnSound = useTurnSound();
  const prev = useRef<string | null>(null);
  const playing = useRef(false);

  useEffect(() => {
    if (playerState == null) return;

    // Seed on the first non-null state; do not fire effects on the seed itself.
    if (!playing.current) {
      playing.current = true;
      prev.current = playerState;
      return;
    }

    if (playerState === prev.current) return;
    prev.current = playerState;

    switch (playerState) {
      case 'EDITING':
        vibrate(40);
        playTurnSound();
        break;
      case 'READING':
        vibrate([40, 100, 40]);
        break;
      default:
        break;
    }
  }, [playerState, vibrate, playTurnSound]);
}
