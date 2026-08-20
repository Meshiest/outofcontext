import type { LobbyInfo, GameState, PlayerState } from './types';

export interface ClientToServerEvents {
  'member:name': (name: string) => void;
  'lobby:create': () => void;
  'lobby:join': (code: string) => void;
  'lobby:leave': () => void;
  'lobby:info': () => void;
  'lobby:replace': (playerId: string) => void;
  'lobby:emote': (emote: string) => void;
  'lobby:spectate': () => void;
  'lobby:admin:toggle': (targetId: string) => void;
  'lobby:admin:grant': (targetId: string) => void;
  'lobby:game:set': (game: string) => void;
  'lobby:game:config': (name: string, value: unknown) => void;
  'game:start': () => void;
  'game:end': () => void;
  'game:info': () => void;
  'game:message': (type: string, data: unknown) => void;
}

export interface ServerToClientEvents {
  'member:id': (id: string) => void;
  'member:nameOk': (ok: boolean) => void;
  'member:kicked': () => void;
  version: (version: string) => void;
  'lobby:join': (code: string) => void;
  'lobby:leave': () => void;
  'lobby:info': (info: LobbyInfo) => void;
  'lobby:emote': (memberId: string, emote: string) => void;
  'game:info': (state: GameState) => void;
  'game:player:info': (state: PlayerState) => void;

  // Game-specific events (emitted by individual game classes)
  'story:result': (stories: Array<Array<{ link: string; editor: string }>>) => void;
}

/**
 * Server -> client push event names. This is the single source of truth for the discriminant of a
 * pushed event (see the ServerEvent shape in core/Member.ts). Every emit/send/subscription field
 * references this union, never a raw `string`.
 */
export const SERVER_EVENT_NAMES = [
  'member:id',
  'member:nameOk',
  // Sent immediately before the inactivity sweep closes the stream. The member is gone from the
  // registry by then, so reconnecting silently would land the client in a lobby-less session that
  // still looks connected; this is what lets the UI say so and offer a reload.
  'member:kicked',
  'version',
  'lobby:join',
  'lobby:leave',
  'lobby:info',
  'lobby:emote',
  'game:info',
  'game:player:info',
  // Fired the moment a player ADDS a reaction, so every client can animate it. The counts
  // themselves ride along with game:info; this is purely the "it just happened" signal.
  'game:reaction',
  'story:result',
  'comic:result',
  'draw:result',
  'redacted:result',
  'recipe:result',
] as const;

export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];

/**
 * Client -> server game message types (the `type` carried by a `game.message` mutation). Every game
 * handler and the mutation input reference this union, never a raw `string`.
 */
export const GAME_MESSAGE_TYPES = [
  'chain:react',
  'story:line',
  'story:done',
  'story:result',
  'comic:line',
  'comic:done',
  'comic:result',
  'draw:image',
  'draw:desc',
  'draw:done',
  'draw:result',
  'recipe:theme',
  'recipe:line',
  'recipe:done',
  'recipe:result',
  'redacted:line',
  'redacted:truncate',
  'redacted:censor',
  'redacted:repair',
  'redacted:done',
  'redacted:result',
  'assassin:done',
] as const;

export type GameMessageType = (typeof GAME_MESSAGE_TYPES)[number];
