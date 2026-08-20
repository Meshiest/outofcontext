import { useTranslation } from 'react-i18next';
import { ChainCard } from '@/games/shared/ChainCard';
import { DoneReadingButton } from '@/games/shared/DoneReadingButton';
import { ResultsViewer } from '@/games/shared/ResultsViewer';
import { DrawChainDisplay } from './DrawChainDisplay';
import type { DrawChain } from './types';
import { reactionsForChain, type ReactionId } from '@/games/shared/reactions';

export interface DrawResultsProps {
  chains: DrawChain[];
  /** Per-chain like counts (from game state). */
  reactions?: Record<string, number[]>;
  /** Whether this player has liked each chain (from player state). */
  reacted?: Record<string, boolean[]>;
  nameTable: Record<string, string>;
  /** Current player state; null once the game is fully over (liking then becomes read-only). */
  playerState: string | null;
  onReact: (index: number, reaction: ReactionId) => void;
  isDone: boolean;
  onToggleDone: () => void;
}

/**
 * Reading-phase display for Draw. Renders each chain in a ChainCard with a like control, and shows
 * the Done Reading toggle while the player is still in READING.
 */
export function DrawResults({
  chains,
  reactions,
  reacted,
  nameTable,
  playerState,
  onReact,
  isDone,
  onToggleDone,
}: DrawResultsProps) {
  const { t } = useTranslation('game-draw');
  const canLike = Boolean(playerState);

  return (
    <div className="flex flex-col gap-4">
      <ResultsViewer title={t('resultsTitle')}>
        {chains.map((chain, index) => (
          <ChainCard
            key={index}
            index={index}
            counts={reactionsForChain(reactions, reacted, index).counts}
            mine={reactionsForChain(reactions, reacted, index).mine}
            canReact={canLike}
            onReact={(r) => onReact(index, r)}
          >
            <DrawChainDisplay entries={chain} nameTable={nameTable} />
          </ChainCard>
        ))}
      </ResultsViewer>
      {playerState === 'READING' && <DoneReadingButton isDone={isDone} onClick={onToggleDone} />}
    </div>
  );
}
