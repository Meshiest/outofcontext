import type { ServerEventName } from '@shared/events';

// Event routing for the two SSE subscriptions. Both read the member's single event stream and each
// forwards only the events it owns (lobby presence vs game state).

// Events surfaced by the lobby.onInfo subscription.
export const LOBBY_EVENTS = new Set<ServerEventName>([
  'member:id',
  'version',
  'member:nameOk',
  'lobby:info',
  'lobby:join',
  'lobby:leave',
  'lobby:emote',
]);

// Events surfaced by the game.onState subscription (game state + any per-game result event).
export function isGameEvent(event: ServerEventName): boolean {
  return (
    event === 'game:info' ||
    event === 'game:player:info' ||
    event === 'game:reaction' ||
    event.endsWith(':result')
  );
}
