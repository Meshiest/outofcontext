import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { GameProgress } from '@/games/shared/GameProgress';
import { GameWaiting } from '@/games/shared/GameWaiting';
import { useGameResults } from '@/games/shared/useGameResults';
import { useNameTable } from '@/games/shared/useNameTable';
import { useTurnEffects } from '@/games/shared/useTurnEffects';
import { RecipeThemeEditor } from './RecipeThemeEditor';
import { RecipeStepEditor } from './RecipeStepEditor';
import { RecipeIngredientEditor } from './RecipeIngredientEditor';
import { RecipeCommentEditor } from './RecipeCommentEditor';
import { RecipeResults } from './RecipeResults';
import type { CompiledRecipe, RecipeLink, RecipePlayerState } from './types';
import type { ReactionId } from '@/games/shared/reactions';

/**
 * Hodgepodge - the top-level Recipe state machine. Reads hot game/player state and compiled results
 * from the shared hooks, fires chain-game turn side-effects, and renders EDITING (routed to the
 * correct editor by `link.type`) / WAITING / READING. The progress bar stays visible while in play.
 */
export default function RecipeGame() {
  const { t } = useTranslation('game-recipe');
  const { gameState, playerInfo, sendGameMessage } = useGame();
  const player = playerInfo as RecipePlayerState | null;
  const nameTable = useNameTable();
  const { results: recipes } = useGameResults<CompiledRecipe>('recipe:result');

  useTurnEffects(player?.state);

  const state = player?.state ?? '';
  const icons = gameState?.icons ?? {};
  const isDone = player ? icons[player.id] === 'check' : false;

  const submitTheme = (theme: string) => sendGameMessage('recipe:theme', theme);
  const submitLine = (line: string) => sendGameMessage('recipe:line', line);
  const reactToChain = (index: number, reaction: ReactionId) =>
    sendGameMessage('chain:react', { index, reaction });
  const toggleDone = () => {
    if (player) sendGameMessage('recipe:done', icons[player.id] !== 'check');
  };

  let body: ReactNode;
  if (state === 'EDITING') {
    body = renderEditor(player?.link, submitTheme, submitLine, t('developing'));
  } else if (state === 'WAITING') {
    body = <GameWaiting message={t('waiting')} />;
  } else if (state === 'READING' || (state === '' && recipes.length > 0)) {
    body = (
      <RecipeResults
        recipes={recipes}
        reactions={gameState?.reactions}
        reacted={player?.reacted}
        playerState={player?.state ?? null}
        nameTable={nameTable}
        onReact={reactToChain}
        isDone={isDone}
        onToggleDone={toggleDone}
      />
    );
  } else {
    body = <GameWaiting message={t('developing')} />;
  }

  return (
    <div>
      {body}
      {gameState && <GameProgress className="lg:hidden" progress={gameState.progress ?? 0} />}
    </div>
  );
}

/**
 * Routes an EDITING link to its editor. The `null`-type fallback shows the generic waiting state.
 * `isLastLink` (Finish vs Sign) is derived from the link itself: the server does not emit a top-level
 * `isLastLink`, but the step link carries `index`/`total`, so the final step is `index === total`.
 * Ingredient/comment links carry no last-signal, so those phases always show "Sign".
 */
function renderEditor(
  link: RecipeLink | undefined,
  submitTheme: (theme: string) => void,
  submitLine: (line: string) => void,
  waitingMessage: string,
): ReactNode {
  switch (link?.type) {
    case 'theme':
      return <RecipeThemeEditor onSubmit={submitTheme} />;
    case 'step':
      return (
        <RecipeStepEditor
          theme={link.theme}
          stepIndex={link.index}
          totalSteps={link.total}
          isLastLink={link.index === link.total}
          onSubmit={submitLine}
        />
      );
    case 'ingredient':
      return (
        <RecipeIngredientEditor
          existingIngredients={link.ingredients}
          isLastLink={false}
          onSubmit={submitLine}
        />
      );
    case 'comment':
      return (
        <RecipeCommentEditor
          existingComments={link.comments}
          isLastLink={false}
          onSubmit={submitLine}
        />
      );
    default:
      return <GameWaiting message={waitingMessage} />;
  }
}
