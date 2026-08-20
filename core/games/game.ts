import type { Lobby } from '../Lobby.js';
import type { GameState, PlayerState } from '@shared/types';
import type { ServerEventName, GameMessageType } from '@shared/events';

// Resolved gamemode object (union of every game's gamemode shape after config resolution).
export interface ResolvedGameMode {
  continuous?: boolean;
  captions?: boolean;
  show_drawings?: boolean;
  show_captions?: boolean;
  censor?: 'player' | 'random' | 'none';
  truncate?: 'player' | 'random' | 'none';
}

// The config values handed to a game constructor after `Lobby.configVals()` resolves the raw
// gameInfo config. It is a loose "bag" because the resolved shape differs per game; each game reads
// only the fields relevant to it. Games also mutate a few of these at construction time.
export interface ResolvedGameConfig {
  players: number;
  numStories: number;
  numPieces: number;
  numRecipes: number;
  numSteps: number;
  numWords: number;
  numLinks: number;
  contextLen: number;
  anonymous: boolean;
  colors: boolean;
  battleRoyale: boolean;
  timeLimit: number;
  ink: number;
  edits: number;
  duration: number;
  /** Wurderer: which kill-word list to draw from (a key of WORD_LISTS). */
  wordList: string;
  gamemode: ResolvedGameMode;
}

// Base class for every game. Subclasses override the lifecycle + message hooks; the defaults here
// are no-ops. Emits go through the lobby's per-member event channels, which the SSE subscriptions
// stream to clients.
export class Game {
  lobby: Lobby;
  config: ResolvedGameConfig;
  players: string[];

  constructor(lobby: Lobby, config: ResolvedGameConfig, players: string[]) {
    this.lobby = lobby;
    this.config = config;
    this.players = players;
  }

  emitTo(pid: string, event: ServerEventName, ...args: unknown[]): void {
    this.lobby.emitPlayer(pid, event, ...args);
  }

  emit(event: ServerEventName, ...args: unknown[]): void {
    this.lobby.emitPlayers(event, ...args);
  }

  // Broadcast overall game state, then each player's individual state.
  sendGameInfo(): void {
    this.lobby.emitAll('game:info', this.getState());
    for (const player of this.players) {
      this.emitTo(player, 'game:player:info', this.getPlayerState(player));
    }
  }

  /**
   * The game's players who are currently connected.
   *
   * `this.players` is fixed when the game starts and deliberately KEEPS players who drop: their seat
   * is held so they can reclaim it. That makes it the wrong list to hand work to - a booted player
   * would sit on it forever - so anything that assigns turns should ask for this instead.
   *
   * Falls back to the full roster when the lobby exposes none, which is the case for the unit-test
   * stub; there, every player counts as present.
   */
  connectedPlayers(): string[] {
    const roster = (this.lobby as { players?: Array<{ playerId: string; connected: boolean }> })
      .players;
    if (!Array.isArray(roster)) return this.players;
    const connected = new Set(roster.filter((p) => p.connected).map((p) => p.playerId));
    return this.players.filter((p) => connected.has(p));
  }

  /** Called when a player connects or drops mid-game. Games that hand out turns should re-deal. */
  onPlayersChanged(): void {}

  // receive input from a player, potentially a spectator
  handleMessage(_pid: string, _type: GameMessageType, _data: unknown): void {}

  restore(_blob: unknown): void {}

  save(): unknown {
    return undefined;
  }

  start(): void {}

  // force stop the game
  stop(): void {}

  // clean up after the game finishes
  cleanup(): void {}

  // player state given a player (spectators do not receive player state)
  getPlayerState(pid: string): PlayerState {
    return { state: '', id: pid };
  }

  getState(): GameState {
    return { icons: {} };
  }
}
