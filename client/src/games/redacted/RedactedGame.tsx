import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { useGameResults } from '../shared/useGameResults';
import { useTurnEffects } from '../shared/useTurnEffects';
import { useNameTable } from '../shared/useNameTable';
import { GameWaiting } from '../shared/GameWaiting';
import { GameProgress } from '../shared/GameProgress';
import { RedactedWriteEditor } from './RedactedWriteEditor';
import { RedactedTamperEditor } from './RedactedTamperEditor';
import { RedactedRepairEditor } from './RedactedRepairEditor';
import { RedactedResults } from './RedactedResults';
import type {
  RedactedChain,
  RedactedGameState,
  RedactedGamemode,
  RedactedPlayerState,
} from './redactedUtils';

const NO_GAMEMODE: RedactedGamemode = { censor: 'none', truncate: 'none' };

/**
 * Top-level Redacted state machine. Routes the EDITING phase to the write / tamper / repair editor by
 * the shape of the player's `link`, shows the shared waiting loader in WAITING, and the results
 * viewer in READING (or for spectators once results have arrived). The progress bar tracks below.
 */
export default function RedactedGame() {
  const { t } = useTranslation('game-redacted');
  const { gameState: rawGameState, playerInfo: rawPlayer, sendGameMessage } = useGame();
  const { results: chains } = useGameResults<RedactedChain>('redacted:result');
  const nameTable = useNameTable();

  const gameState = rawGameState as RedactedGameState | null;
  const playerInfo = rawPlayer as RedactedPlayerState | null;
  const state = playerInfo?.state ?? '';

  useTurnEffects(state || null);

  const renderPhase = () => {
    if (state === 'EDITING' && playerInfo) {
      const link = playerInfo.link;

      if (!link) {
        return <RedactedWriteEditor onSubmit={(line) => sendGameMessage('redacted:line', line)} />;
      }

      if (link.type === 'line') {
        return (
          <RedactedTamperEditor
            line={link.data}
            ink={gameState?.ink ?? 0}
            gamemode={gameState?.gamemode ?? NO_GAMEMODE}
            onCensor={(indexes) => sendGameMessage('redacted:censor', indexes)}
            onTruncate={(count) => sendGameMessage('redacted:truncate', count)}
          />
        );
      }

      if (link.type === 'tamper') {
        return (
          <RedactedRepairEditor
            link={link}
            onSubmitCensor={(pairs) => sendGameMessage('redacted:repair', pairs)}
            onSubmitTruncate={(text) => sendGameMessage('redacted:repair', text)}
          />
        );
      }

      if (link.type === 'repair') {
        return (
          <RedactedWriteEditor
            context={link.data}
            onSubmit={(line) => sendGameMessage('redacted:line', line)}
          />
        );
      }
    }

    if (state === 'READING' || (!state && chains.length > 0)) {
      const isDone = gameState ? gameState.icons[playerInfo?.id ?? ''] === 'check' : false;
      return (
        <RedactedResults
          chains={chains}
          reactions={gameState?.reactions}
          reacted={playerInfo?.reacted}
          nameTable={nameTable}
          playerState={state || null}
          onReact={(index, reaction) => sendGameMessage('chain:react', { index, reaction })}
          isDone={isDone}
          onToggleDone={() => sendGameMessage('redacted:done', !isDone)}
        />
      );
    }

    if (state === 'WAITING') {
      return <GameWaiting message={t('waitingOnPlayers')} />;
    }

    return <GameWaiting message={t('evidenceTampered')} />;
  };

  return (
    <div>
      {renderPhase()}
      {gameState && <GameProgress className="lg:hidden" progress={gameState.progress ?? 0} />}
    </div>
  );
}
