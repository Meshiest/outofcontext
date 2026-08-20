import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { useNameTable } from '@/games/shared/useNameTable';
import { useTurnEffects } from '@/games/shared/useTurnEffects';
import { useGameResults } from '@/games/shared/useGameResults';
import { GameWaiting } from '@/games/shared/GameWaiting';
import { GameProgress } from '@/games/shared/GameProgress';
import type { DrawingImage } from '@shared/drawing';
import { ComicEditor } from './ComicEditor';
import { ComicResults } from './ComicResults';
import type { ComicChain, ComicGameState, ComicPlayerState } from './types';
import type { ReactionId } from '@/games/shared/reactions';

/**
 * Top-level Dilettante (Comic) orchestrator: the EDITING / WAITING / READING state machine. Reads
 * hot game state via `useGame`, layers the chain-game turn side-effects via `useTurnEffects`, and
 * pulls the compiled sequences via `useGameResults`. Mode flags (continuous, captions, drawings)
 * come from game state and are threaded into the editor / results.
 */
export default function ComicGame() {
  const { t } = useTranslation('game-comic');
  const { gameState, playerInfo, sendGameMessage } = useGame();

  const player = playerInfo as ComicPlayerState | null;
  const game = gameState as ComicGameState | null;
  useTurnEffects(player?.state);

  const nameTable = useNameTable();
  const { results: chains } = useGameResults<ComicChain>('comic:result');

  const continuous = Boolean(game?.continuous);
  const enableCaptions = Boolean(game?.enableCaptions);
  const showCaptions = Boolean(game?.showCaptions);
  const showDrawings = Boolean(game?.showDrawings);
  const colors = Boolean(game?.colors);

  const progress = game?.progress ?? 0;
  const icons = game?.icons ?? {};

  const playerState = player?.state ?? null;
  const myId = player?.id;
  const isDone = myId ? icons[myId] === 'check' : false;

  const submitDrawing = (data: { drawing: DrawingImage; caption: string }) =>
    sendGameMessage('comic:line', { drawing: data.drawing, caption: data.caption });
  const reactToChain = (index: number, reaction: ReactionId) =>
    sendGameMessage('chain:react', { index, reaction });
  const toggleDone = () => sendGameMessage('comic:done', !isDone);

  let body;
  if (playerState === 'EDITING') {
    body = (
      <ComicEditor
        link={player?.link ?? []}
        isLastLink={Boolean(player?.isLastLink)}
        enableCaptions={enableCaptions}
        showCaptions={showCaptions}
        showDrawings={showDrawings}
        continuous={continuous}
        colors={colors}
        onSubmit={submitDrawing}
      />
    );
  } else if (playerState === 'WAITING') {
    body = <GameWaiting message={t('waitingOnArtists')} />;
  } else if (playerState === 'READING' || (!playerState && chains.length > 0)) {
    body = (
      <ComicResults
        chains={chains}
        reactions={game?.reactions}
        reacted={player?.reacted}
        continuous={continuous}
        enableCaptions={enableCaptions}
        nameTable={nameTable}
        playerState={playerState}
        onReact={reactToChain}
        isDone={isDone}
        onToggleDone={toggleDone}
      />
    );
  } else {
    body = <GameWaiting message={t('sequencesBeingDrawn')} />;
  }

  return (
    <div>
      {body}
      <GameProgress className="lg:hidden" progress={progress} />
    </div>
  );
}
