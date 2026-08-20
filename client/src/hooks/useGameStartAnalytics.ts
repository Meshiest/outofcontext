import { useEffect, useRef } from 'react';
import { logEvent } from '@/lib/analytics';
import type { LobbyInfo } from '@shared/types';

/**
 * Fire one GA4 `playing_game` event on the WAITING -> PLAYING edge.
 *
 * Edge-triggered on purpose. Firing on `state === 'PLAYING'` would re-log on every lobby:info push
 * (which arrives on each emote, join and turn), and joining a lobby that is already mid-game is not
 * a game start - so a client that never saw WAITING stays silent.
 *
 * Every player in the lobby logs its own event, as in the pre-rewrite app; `player_count` is what
 * lets a game start be recovered from the N events it produces.
 */
export function useGameStartAnalytics(lobbyInfo: LobbyInfo | null, code: string | null): void {
  const prevState = useRef<LobbyInfo['state'] | null>(null);

  useEffect(() => {
    const state = lobbyInfo?.state ?? null;
    const previous = prevState.current;
    prevState.current = state;

    if (previous === 'WAITING' && state === 'PLAYING' && lobbyInfo) {
      logEvent('playing_game', {
        game_name: lobbyInfo.game,
        player_count: lobbyInfo.players.length,
        lobby_code: code ?? undefined,
      });
    }
  }, [lobbyInfo, code]);
}
