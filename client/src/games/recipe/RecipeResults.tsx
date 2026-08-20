import { useTranslation } from 'react-i18next';
import { ChainCard } from '@/games/shared/ChainCard';
import { DoneReadingButton } from '@/games/shared/DoneReadingButton';
import { ResultsViewer } from '@/games/shared/ResultsViewer';
import { RecipeCard } from './RecipeCard';
import type { CompiledRecipe } from './types';
import { reactionsForChain, type ReactionId } from '@/games/shared/reactions';

export interface RecipeResultsProps {
  /** All compiled recipes (one per recipe chain). */
  recipes: CompiledRecipe[];
  /** Like tally per recipe, index-aligned with `recipes`. */
  reactions?: Record<string, number[]>;
  /** Whether this viewer has liked recipe[i], index-aligned with `recipes`. */
  reacted?: Record<string, boolean[]>;
  /** This player's game state, or null for spectators (spectators cannot like). */
  playerState: string | null;
  /** playerId -> display name for author attribution. */
  nameTable: Record<string, string>;
  /** Like / unlike recipe at `index`. */
  onReact: (index: number, reaction: ReactionId) => void;
  /** Whether this player has marked themselves done reading. */
  isDone: boolean;
  onToggleDone: () => void;
}

/**
 * The READING phase: a titled list where each compiled recipe is a likeable ChainCard, plus the
 * Done Reading toggle (shown only for active readers, not spectators).
 */
export function RecipeResults({
  recipes,
  reactions,
  reacted,
  playerState,
  nameTable,
  onReact,
  isDone,
  onToggleDone,
}: RecipeResultsProps) {
  const { t } = useTranslation('game-recipe');
  const canLike = Boolean(playerState);

  return (
    <>
      <ResultsViewer title={t('resultsTitle')}>
        {recipes.map((recipe, i) => (
          <ChainCard
            key={i}
            index={i}
            counts={reactionsForChain(reactions, reacted, i).counts}
            mine={reactionsForChain(reactions, reacted, i).mine}
            canReact={canLike}
            onReact={(r) => onReact(i, r)}
          >
            <RecipeCard recipe={recipe} nameTable={nameTable} />
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
