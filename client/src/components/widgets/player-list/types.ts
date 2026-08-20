/** Shared prop types for the PlayerList widget family. Presentational: no transport coupling. */

export interface Player {
  /** Connection/session id (matches the local user's own id when it is you). */
  id: string;
  /** Stable per-seat id (used for game icons and replace). */
  playerId: string;
  name: string;
  connected: boolean;
}

export interface Spectator {
  id: string;
  /** Absent until the spectator has entered a name ("Pending"). */
  name?: string;
}

export type LobbyState = 'WAITING' | 'PLAYING';

/** Per-game state surface PlayerList reads: a map of playerId -> status icon name. */
export interface GameState {
  icons: Record<string, string>;
}
