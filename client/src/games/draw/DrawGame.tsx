import { useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { GameProgress } from '@/games/shared/GameProgress';
import { GameWaiting } from '@/games/shared/GameWaiting';
import { useGameResults } from '@/games/shared/useGameResults';
import { useNameTable } from '@/games/shared/useNameTable';
import { useTurnEffects } from '@/games/shared/useTurnEffects';
import type { DrawingImage } from '@shared/drawing';
import { DescribeEditor } from './DescribeEditor';
import { DrawEditor } from './DrawEditor';
import { DrawResults } from './DrawResults';
import type { DrawChain, DrawGameState, DrawPlayerState } from './types';
import type { ReactionId } from '@/games/shared/reactions';

/**
 * Draw (Scribble) top-level state machine. Alternates between describing (text) and drawing
 * (canvas): the editor shown during EDITING is chosen by the current link type -- no link or an
 * `image` link means "describe it", a `desc` link means "draw it". Draw is a chain game, so it runs
 * the shared turn side-effects (haptics / sound).
 */
export default function DrawGame() {
  const { t } = useTranslation('game-draw');
  const { gameState, playerInfo, sendGameMessage } = useGame();
  const game = gameState as DrawGameState | null;
  const player = playerInfo as DrawPlayerState | null;

  useTurnEffects(player?.state);
  const nameTable = useNameTable();
  const { results: chains } = useGameResults<DrawChain>('draw:result');

  // The server sends `link` as a single-element array (contextLen = 1); the editor-selection logic
  // reads the first element's `type`.
  const link = player?.link?.[0];

  const submitDescription = useCallback(
    (description: string) => sendGameMessage('draw:desc', description),
    [sendGameMessage],
  );
  const submitImage = useCallback(
    (image: DrawingImage) => sendGameMessage('draw:image', image),
    [sendGameMessage],
  );
  const reactToChain = useCallback(
    (index: number, reaction: ReactionId) => sendGameMessage('chain:react', { index, reaction }),
    [sendGameMessage],
  );

  const state = player?.state ?? '';
  const playerId = player?.id ?? '';
  const isDone = game?.icons?.[playerId] === 'check';
  const toggleDone = useCallback(
    () => sendGameMessage('draw:done', !isDone),
    [sendGameMessage, isDone],
  );

  let body: ReactNode;
  if (state === 'EDITING') {
    if (!link || link.type === 'image') {
      body = (
        <DescribeEditor
          isInitial={!link}
          previousImage={link?.type === 'image' ? link.data : undefined}
          onSubmit={submitDescription}
        />
      );
    } else {
      body = (
        <DrawEditor
          description={link.data}
          timeLimit={game?.timeLimit}
          colors={game?.colors ?? false}
          onSubmit={submitImage}
        />
      );
    }
  } else if (state === 'WAITING') {
    body = <GameWaiting message={t('waiting')} />;
  } else if (state === 'READING' || (!state && chains.length > 0)) {
    body = (
      <DrawResults
        chains={chains}
        reactions={game?.reactions}
        reacted={player?.reacted}
        nameTable={nameTable}
        playerState={player?.state ?? null}
        onReact={reactToChain}
        isDone={isDone}
        onToggleDone={toggleDone}
      />
    );
  } else {
    body = <GameWaiting message={t('creating')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {body}
      <GameProgress className="lg:hidden" progress={game?.progress ?? 0} />
    </div>
  );
}
