import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { GameProgress } from '@/games/shared/GameProgress';
import { GameWaiting } from '@/games/shared/GameWaiting';
import { useGameResults } from '@/games/shared/useGameResults';
import { useNameTable } from '@/games/shared/useNameTable';
import { useTurnEffects } from '@/games/shared/useTurnEffects';
import { StoryEditor } from './StoryEditor';
import { StoryResults } from './StoryResults';
import type { StoryChain, StoryPlayerState } from './types';
import type { ReactionId } from '@/games/shared/reactions';

/**
 * Raconteur - the top-level Story state machine. Reads hot game/player state and the compiled
 * results out of the shared hooks, fires chain-game turn side-effects, and renders the EDITING
 * editor / WAITING loader / READING results. The progress bar stays visible while in progress.
 */
export default function StoryGame() {
  const { t } = useTranslation('game-story');
  const { gameState, playerInfo, sendGameMessage } = useGame();
  const player = playerInfo as StoryPlayerState | null;
  const nameTable = useNameTable();
  const { results: stories } = useGameResults<StoryChain>('story:result');

  useTurnEffects(player?.state);

  const state = player?.state ?? '';
  const icons = gameState?.icons ?? {};
  const isDone = player ? icons[player.id] === 'check' : false;

  const submitLine = (line: string) => sendGameMessage('story:line', line);
  const reactToChain = (index: number, reaction: ReactionId) =>
    sendGameMessage('chain:react', { index, reaction });
  const toggleDone = () => {
    if (player) sendGameMessage('story:done', icons[player.id] !== 'check');
  };

  let body: ReactNode;
  if (state === 'EDITING') {
    body = (
      <StoryEditor
        link={player?.link ?? []}
        isLastLink={player?.isLastLink ?? false}
        onSubmit={submitLine}
      />
    );
  } else if (state === 'WAITING') {
    body = <GameWaiting message={t('waitingOnAuthors')} />;
  } else if (state === 'READING' || (state === '' && stories.length > 0)) {
    body = (
      <StoryResults
        stories={stories}
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
    body = <GameWaiting message={t('storiesBeingWritten')} />;
  }

  return (
    <div>
      {body}
      {gameState && <GameProgress className="lg:hidden" progress={gameState.progress ?? 0} />}
    </div>
  );
}
