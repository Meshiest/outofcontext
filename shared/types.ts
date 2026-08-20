/** Lobby states as used by Lobby.lobbyState */
export type LobbyState = 'WAITING' | 'PLAYING';

/** A connected member (maps to core/Member.ts) */
export interface MemberInfo {
  id: string;
  name: string | false;
}

/** A player slot in a lobby (maps to Lobby.genLobbyInfo().players) */
export interface PlayerInfo {
  id: string; // member id, or -1 if disconnected
  playerId: string; // stable game-scoped player id
  connected: boolean;
  name: string;
}

export interface SpectatorInfo {
  id: string;
  name: string;
}

/** The lobby info payload emitted via 'lobby:info' (maps to Lobby.genLobbyInfo()) */
export interface LobbyInfo {
  game: string;
  state: LobbyState;
  config: Record<string, unknown>;
  admin: string;
  gameState: GameState;
  members: MemberInfo[];
  players: PlayerInfo[];
  spectators: SpectatorInfo[];
}

/** Base game state (maps to Game.getState()) */
export interface GameState {
  icons: Record<string, string>;
  progress?: number;
  /** Reaction id -> per-chain count. */
  reactions?: Record<string, number[]>;
  isComplete?: boolean;
}

/** Base player state (maps to Game.getPlayerState()) */
export interface PlayerState {
  id: string;
  state: string;
}

/** Game identifier keys matching gameInfo.ts keys and GAMES in core/Lobby.ts */
export type GameId = 'story' | 'comic' | 'draw' | 'redacted' | 'recipe' | 'assassin';

/** Config field types used in gameInfo.ts */
export type ConfigFieldType = 'int' | 'bool' | 'list';

/** A single config field definition from gameInfo.ts */
export interface ConfigFieldDef {
  type: ConfigFieldType;
  min?: number;
  max?: number;
  defaults: string | number;
  hidden?: boolean;
  /** List options. `name` is both the stored id and the locale key; `value` is what the game gets. */
  options?: Array<{
    name: string;
    value: unknown;
  }>;
}

/**
 * A game's shape from gameInfo.ts. Copy is deliberately not part of it: titles, descriptions and
 * every label are looked up from the `game-<id>` locale namespace using the ids defined here.
 */
export interface GameMeta {
  hidden?: boolean;
  config: Record<string, ConfigFieldDef>;
}
