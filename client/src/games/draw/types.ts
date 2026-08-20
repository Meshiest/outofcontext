import type { DrawingImage } from '@shared/drawing';
import type { GameState, PlayerState } from '@shared/types';

/**
 * A single link in a Draw (Scribble) chain: either a text description of what to draw, or a
 * drawing. Chains alternate `desc` <-> `image`, always starting (and, when the chain has an odd
 * length, ending) with a `desc`.
 */
export type DrawLink = { type: 'desc'; data: string } | { type: 'image'; data: DrawingImage };

/** One compiled chain entry: the link plus the player id of whoever authored it ('' when anonymous). */
export interface DrawEntry {
  link: DrawLink;
  editor: string;
}

/** A compiled Draw chain (alternating description / image entries), as sent via 'draw:result'. */
export type DrawChain = DrawEntry[];

/**
 * Draw-specific game state. Extends the base with the client-only `timeLimit` (drives the Doodle
 * countdown; there is no server-side timer) and the `colors` palette flag.
 */
export interface DrawGameState extends GameState {
  timeLimit?: number;
  colors?: boolean;
}

/**
 * Draw-specific player state. During EDITING the server sends `link` as a single-element array
 * (contextLen = 1); DrawGame unwraps it to its first element before choosing an editor.
 */
export interface DrawPlayerState extends PlayerState {
  link?: DrawLink[];
  /** READING / WAITING: reaction id -> whether this player left it on chain[i]. */
  reacted?: Record<string, boolean[]>;
  isLastLink?: boolean;
}
