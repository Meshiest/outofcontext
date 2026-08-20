import _ from 'lodash';
import { REACTION_IDS, isReactionId, type ReactionId } from '../../../shared/reactions.js';

/** Who reacted with what, for one chain: reaction id -> player id -> true. */
export type ReactionBuckets = Record<ReactionId, Record<string, boolean>>;

export function emptyReactions(): ReactionBuckets {
  return Object.fromEntries(REACTION_IDS.map((id) => [id, {}])) as ReactionBuckets;
}

/**
 * Toggle a player's reaction from an untrusted `chain:react` payload.
 *
 * Every chain game handles reactions identically, so the validation and the toggle live here rather
 * than being copy-pasted per game. Returns null when the payload is unusable; otherwise reports what
 * changed, including whether this was an ADD - only an add is worth announcing, since a removal has
 * nothing to animate.
 */
export function applyReaction(
  buckets: ReactionBuckets[],
  pid: string,
  data: unknown,
): { index: number; reaction: ReactionId; added: boolean } | null {
  const payload = data as { index?: unknown; reaction?: unknown } | null | undefined;
  const index = payload?.index;
  const reaction = payload?.reaction;
  if (typeof index !== 'number' || !Number.isInteger(index)) return null;
  if (index < 0 || index >= buckets.length) return null;
  if (!isReactionId(reaction)) return null;

  const bucket = buckets[index][reaction];
  const added = !bucket[pid];
  bucket[pid] = added;
  return { index, reaction, added };
}

/** Per-reaction counts across chains, for the shared game state. */
export function countReactions(buckets: ReactionBuckets[]): Record<ReactionId, number[]> {
  return Object.fromEntries(
    REACTION_IDS.map((id) => [id, buckets.map((b) => _.size(_.filter(b[id], (v) => v)))]),
  ) as Record<ReactionId, number[]>;
}

/** Per-reaction flags across chains for one player, for their own player state. */
export function reactionFlags(
  buckets: ReactionBuckets[],
  pid: string,
): Record<ReactionId, boolean[]> {
  return Object.fromEntries(
    REACTION_IDS.map((id) => [id, buckets.map((b) => Boolean(b[id][pid]))]),
  ) as Record<ReactionId, boolean[]>;
}
