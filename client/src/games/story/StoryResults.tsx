import { useTranslation } from 'react-i18next';
import { ChainCard } from '@/games/shared/ChainCard';
import { DoneReadingButton } from '@/games/shared/DoneReadingButton';
import { ResultsViewer } from '@/games/shared/ResultsViewer';
import { StoryChain } from './StoryChain';
import type { StoryChain as StoryChainData } from './types';
import { reactionsForChain, type ReactionId } from '@/games/shared/reactions';

export interface StoryResultsProps {
  /** All compiled stories (one chain per story). */
  stories: StoryChainData[];
  /** Like tally per story, index-aligned with `stories`. */
  reactions?: Record<string, number[]>;
  /** Whether this viewer has liked story[i], index-aligned with `stories`. */
  reacted?: Record<string, boolean[]>;
  /** This player's game state, or null for spectators (spectators cannot like). */
  playerState: string | null;
  /** playerId -> display name for author attribution. */
  nameTable: Record<string, string>;
  /** Like / unlike story at `index`. */
  onReact: (index: number, reaction: ReactionId) => void;
  /** Whether this player has marked themselves done reading. */
  isDone: boolean;
  /** Toggle the done-reading state. */
  onToggleDone: () => void;
}

/**
 * The READING phase: a titled results list where each story is a likeable ChainCard, plus the
 * Done Reading toggle (shown only for active readers, not spectators).
 */
export function StoryResults({
  stories,
  reactions,
  reacted,
  playerState,
  nameTable,
  onReact,
  isDone,
  onToggleDone,
}: StoryResultsProps) {
  const { t } = useTranslation('game-story');
  const canLike = Boolean(playerState);

  return (
    <>
      <ResultsViewer title={t('storiesTitle')}>
        {stories.map((story, i) => (
          <ChainCard
            key={i}
            index={i}
            counts={reactionsForChain(reactions, reacted, i).counts}
            mine={reactionsForChain(reactions, reacted, i).mine}
            canReact={canLike}
            onReact={(r) => onReact(i, r)}
          >
            <StoryChain entries={story} nameTable={nameTable} />
          </ChainCard>
        ))}
      </ResultsViewer>
      {playerState === 'READING' && (
        <div className="mt-4">
          <DoneReadingButton isDone={isDone} onClick={onToggleDone} />
        </div>
      )}
    </>
  );
}
