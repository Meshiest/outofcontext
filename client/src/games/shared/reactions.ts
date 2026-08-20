import { REACTION_IDS, type ReactionId } from '@shared/reactions';

/**
 * Glyph, pressed-state skin, and text accent for each reaction. The ids and their meaning are
 * shared; the look is ours.
 *
 * `color` is a filled button skin, so a pressed reaction is the same kind of control as any other
 * coloured button rather than a basic one wearing a tinted glyph. `tint` is only for the read-only
 * tally, which is text rather than a button.
 */
export const REACTION_STYLE: Record<
  ReactionId,
  { icon: string; color: 'red' | 'blue' | 'green' | 'slate' | 'pink'; tint: string }
> = {
  heart: { icon: 'heart', color: 'red', tint: 'text-negative' },
  laugh: { icon: 'face laugh squint', color: 'blue', tint: 'text-info' },
  thumbsUp: { icon: 'thumbs up', color: 'green', tint: 'text-positive' },
  skull: { icon: 'skull', color: 'slate', tint: 'text-text-muted' },
  brain: { icon: 'brain', color: 'pink', tint: 'text-pink' },
};

export { REACTION_IDS, type ReactionId };

/**
 * Slice the per-chain reaction arrays down to one chain.
 *
 * The wire carries `reactions[reactionId][chainIndex]` (counts) and `reacted[reactionId][chainIndex]`
 * (this player's flags); a card only cares about its own index.
 */
export function reactionsForChain(
  counts: Record<string, number[]> | undefined,
  mine: Record<string, boolean[]> | undefined,
  index: number,
): { counts: Record<ReactionId, number>; mine: Record<ReactionId, boolean> } {
  return {
    counts: Object.fromEntries(
      REACTION_IDS.map((id) => [id, counts?.[id]?.[index] ?? 0]),
    ) as Record<ReactionId, number>,
    mine: Object.fromEntries(
      REACTION_IDS.map((id) => [id, Boolean(mine?.[id]?.[index])]),
    ) as Record<ReactionId, boolean>,
  };
}
