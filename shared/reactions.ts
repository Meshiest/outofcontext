/**
 * The reactions a player can leave on a finished chain.
 *
 * Shared because both sides must agree on the ids: the server stores and counts them, the client
 * maps them to a glyph and a colour. Each player may leave at most one of EACH reaction per chain,
 * so a reaction is a toggle, not a tally.
 */
export const REACTION_IDS = ['heart', 'laugh', 'thumbsUp', 'skull', 'brain'] as const;

export type ReactionId = (typeof REACTION_IDS)[number];

export function isReactionId(value: unknown): value is ReactionId {
  return typeof value === 'string' && (REACTION_IDS as readonly string[]).includes(value);
}

/** Per-reaction counts for one chain, or per-reaction flags for one player. */
export type ReactionCounts = Record<ReactionId, number[]>;
export type ReactionFlags = Record<ReactionId, boolean[]>;
