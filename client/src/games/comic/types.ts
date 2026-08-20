import type { DrawingImage } from '@shared/drawing';
import type { GameState, PlayerState } from '@shared/types';

/**
 * One drawing link in a Comic chain: the drawing plus an optional caption. Mirrors the
 * `{ drawing, caption }` objects stored by `Comic.handleMessage` (core/games/comic.ts). In the
 * EDITING context the server blanks `drawing`/`caption` per the showDrawings/showCaptions flags.
 */
export interface ComicLink {
  drawing: DrawingImage;
  caption?: string;
}

/**
 * One entry of a compiled Comic chain - a link plus the playerId of its author ('' when anonymous).
 * Mirrors the `{ link, editor }` shape produced by `Story.compileStories()`.
 */
export interface ComicEntry {
  link: ComicLink;
  editor: string;
}

/** A single compiled Comic sequence. `ComicChain[]` is the full `comic:result` payload. */
export type ComicChain = ComicEntry[];

/**
 * Comic-specific extension of the base `{ id, state }` player state. Which fields are present depends
 * on `state` (see `Comic.getPlayerState`): EDITING carries `link` + `isLastLink`; READING / WAITING
 * carry `liked`. All optional so the one type covers every phase.
 */
export interface ComicPlayerState extends PlayerState {
  /** EDITING: the last `contextLen` links of the chain being extended (empty for the first drawing). */
  link?: ComicLink[];
  /** EDITING: true when the drawing being made is the final link of the chain. */
  isLastLink?: boolean;
  /** READING / WAITING: reaction id -> whether this player left it on chain[i]. */
  reacted?: Record<string, boolean[]>;
}

/**
 * Comic-specific extension of the base game state. Adds the mode flags the server emits in
 * `Comic.getState` and drives how the editor / results render.
 */
export interface ComicGameState extends GameState {
  colors?: boolean;
  continuous?: boolean;
  enableCaptions?: boolean;
  showCaptions?: boolean;
  showDrawings?: boolean;
}

/** The mode flags threaded from `ComicGame` down to the editor / results components. */
export interface ComicModeFlags {
  continuous: boolean;
  enableCaptions: boolean;
  showCaptions: boolean;
  showDrawings: boolean;
  colors: boolean;
}
