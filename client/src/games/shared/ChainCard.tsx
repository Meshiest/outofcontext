import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { useReactionFloats } from '@/contexts/GameStateContext';
import { ReactionBar } from './ReactionBar';
import type { ReactionId } from './reactions';

export interface ChainCardProps {
  /** Position in the results list - identifies which chain a live reaction belongs to. */
  index: number;
  /** Count per reaction for this chain. */
  counts: Record<ReactionId, number>;
  /** Whether this player has left each reaction. */
  mine: Record<ReactionId, boolean>;
  /** Whether the viewer may react (false -> read-only tally). */
  canReact: boolean;
  onReact: (reaction: ReactionId) => void;
  children: ReactNode;
}

/**
 * Result card for a single chain / story: the game-specific content with the reaction bar beneath
 * it, where it reads as a response to what was just read rather than a header above it.
 */
export function ChainCard({ index, counts, mine, canReact, onReact, children }: ChainCardProps) {
  const floats = useReactionFloats(index);
  return (
    <Card className="mb-4">
      <CardContent>
        <div>{children}</div>
        <div className="mt-3">
          <ReactionBar
            counts={counts}
            mine={mine}
            canReact={canReact}
            onReact={onReact}
            floats={floats}
          />
        </div>
      </CardContent>
    </Card>
  );
}
