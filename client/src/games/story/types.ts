import type { PlayerState } from '@shared/types';

/**
 * One line of a compiled story: the text plus the playerId of the author who wrote it (empty string
 * when the game is anonymous). Mirrors the `{ link, editor }` shape produced by
 * `Story.compileStories()` in core/games/story.ts.
 */
export interface StoryEntry {
  link: string;
  editor: string;
}

/**
 * A single compiled story - the ordered list of its lines. `StoryChain[]` is the full `story:result`
 * payload (one chain per story).
 */
export type StoryChain = StoryEntry[];

/**
 * Story-specific extension of the base `{ id, state }` player state. Which fields are present depends
 * on `state` (see `Story.getPlayerState`): EDITING carries `link` + `isLastLink`; READING / WAITING
 * carry `liked`. All optional so the one type covers every phase.
 */
export interface StoryPlayerState extends PlayerState {
  /** EDITING: the last `contextLen` lines of the chain being extended (empty for the first line). */
  link?: string[];
  /** EDITING: true when the line being written is the final link of the chain. */
  isLastLink?: boolean;
  /** READING / WAITING: reaction id -> whether this player left it on chain[i]. */
  reacted?: Record<string, boolean[]>;
}
