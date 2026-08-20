import { useTranslation } from 'react-i18next';
import { ResultsViewer } from '@/games/shared/ResultsViewer';
import { ChainCard } from '@/games/shared/ChainCard';
import { DoneReadingButton } from '@/games/shared/DoneReadingButton';
import { ComicChain } from './ComicChain';
import type { ComicChain as ComicChainData } from './types';
import { reactionsForChain, type ReactionId } from '@/games/shared/reactions';

export interface ComicResultsProps {
  /** The compiled sequences (`comic:result` payload). */
  chains: ComicChainData[];
  /** Per-chain like counts (gameState.likes). */
  reactions?: Record<string, number[]>;
  /** Per-chain "did I like it" flags (playerInfo.liked). */
  reacted?: Record<string, boolean[]>;
  /** Continuous (single connected drawing) mode. */
  continuous: boolean;
  /** Whether captions were collected and should be shown. */
  enableCaptions: boolean;
  /** playerId -> display name. */
  nameTable: Record<string, string>;
  /** Current player state ('' / null for a spectator - likes become static, no Done button). */
  playerState: string | null;
  /** Like / unlike chain[index]. */
  onReact: (index: number, reaction: ReactionId) => void;
  /** Whether this player has finished reading. */
  isDone: boolean;
  /** Toggle this player's done-reading state. */
  onToggleDone: () => void;
}

/**
 * The READING phase for Dilettante: a titled "Sequences" viewer of every chain, each wrapped in a
 * likeable ChainCard, plus the Done-Reading toggle while actively reading. Spectators (no player
 * state) see static like counts and no Done button.
 */
export function ComicResults({
  chains,
  reactions,
  reacted,
  continuous,
  enableCaptions,
  nameTable,
  playerState,
  onReact,
  isDone,
  onToggleDone,
}: ComicResultsProps) {
  const { t } = useTranslation('game-comic');
  const canLike = Boolean(playerState);

  return (
    <div>
      <ResultsViewer title={t('sequencesTitle')}>
        {chains.map((chain, i) => (
          <ChainCard
            key={i}
            index={i}
            counts={reactionsForChain(reactions, reacted, i).counts}
            mine={reactionsForChain(reactions, reacted, i).mine}
            canReact={canLike}
            onReact={(r) => onReact(i, r)}
          >
            <ComicChain
              entries={chain}
              continuous={continuous}
              enableCaptions={enableCaptions}
              nameTable={nameTable}
            />
          </ChainCard>
        ))}
      </ResultsViewer>
      {playerState === 'READING' && (
        <div className="mt-4">
          <DoneReadingButton isDone={isDone} onClick={onToggleDone} />
        </div>
      )}
    </div>
  );
}
