import { useTranslation } from 'react-i18next';
import { ResultsViewer } from '../shared/ResultsViewer';
import { ChainCard } from '../shared/ChainCard';
import { DoneReadingButton } from '../shared/DoneReadingButton';
import { RedactedChainDisplay } from './RedactedChainDisplay';
import type { RedactedChain } from './redactedUtils';
import { reactionsForChain, type ReactionId } from '@/games/shared/reactions';

export interface RedactedResultsProps {
  chains: RedactedChain[];
  reactions?: Record<string, number[]>;
  reacted?: Record<string, boolean[]>;
  nameTable: Record<string, string>;
  /** This viewer's player state; null for spectators (who then cannot like). */
  playerState: string | null;
  onReact: (index: number, reaction: ReactionId) => void;
  isDone: boolean;
  onToggleDone: () => void;
}

/** A chain is anonymous when every author id was blanked out server-side (the "Hide Authors" mode). */
function isAnonymous(chain: RedactedChain): boolean {
  return chain.every((entry) => entry.editors.every((id) => !id));
}

/**
 * Reading-phase container for Redacted: one ChainCard per finished story, each rendering a
 * RedactedChainDisplay, plus the Done Reading toggle while the viewer is still READING.
 */
export function RedactedResults({
  chains,
  reactions,
  reacted,
  nameTable,
  playerState,
  onReact,
  isDone,
  onToggleDone,
}: RedactedResultsProps) {
  const { t } = useTranslation('game-redacted');
  const canReact = Boolean(playerState);

  return (
    <div>
      <ResultsViewer title={t('resultsTitle')}>
        {chains.map((chain, i) => (
          <ChainCard
            key={i}
            index={i}
            counts={reactionsForChain(reactions, reacted, i).counts}
            mine={reactionsForChain(reactions, reacted, i).mine}
            canReact={canReact}
            onReact={(r) => onReact(i, r)}
          >
            <RedactedChainDisplay
              entries={chain}
              nameTable={nameTable}
              anonymous={isAnonymous(chain)}
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
