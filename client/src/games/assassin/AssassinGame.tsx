import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGame } from '@/hooks/useGame';
import { useLobbyInfo } from '@/contexts/LobbyContext';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import { GameWaiting } from '../shared/GameWaiting';
import { Dossier } from './Dossier';
import type { AssassinGameState, AssassinPlayerState, ResolvedTarget } from './types';

/**
 * Wurderer - the most minimal game: no editing, no results, no like system, no progress bar. Players
 * read a dossier (target + kill words), mark themselves done, and may re-open it. Assassin has NO turn
 * vibration/sound, so this deliberately uses the plain useGame()/useLobbyInfo() hooks and
 * NOT the chain-game useGameState/useTurnEffects machinery.
 */
export default function AssassinGame() {
  const { t } = useTranslation('game-assassin');
  const { gameState, playerInfo, sendGameMessage } = useGame();
  const { lobbyInfo } = useLobbyInfo();

  const player = playerInfo as AssassinPlayerState | null;
  const game = gameState as AssassinGameState | null;
  const battleRoyale = game?.battleRoyale ?? false;

  // playerId -> display name, so target ids resolve to human names for the dossier.
  const nameTable = useMemo(() => {
    const table: Record<string, string> = {};
    for (const p of lobbyInfo?.players ?? []) table[p.playerId] = p.name;
    return table;
  }, [lobbyInfo?.players]);

  if (player?.state === 'READING') {
    const single: ResolvedTarget | undefined =
      battleRoyale || player.target == null
        ? undefined
        : { name: nameTable[player.target] ?? player.target, words: player.words ?? [] };

    const targets: ResolvedTarget[] | undefined = battleRoyale
      ? (player.targets ?? []).map((entry) => ({
          name: nameTable[entry.target] ?? entry.target,
          words: entry.words,
        }))
      : undefined;

    return (
      <div className="space-y-4">
        <Dossier
          title={player.title}
          target={single}
          targets={targets}
          battleRoyale={battleRoyale}
        />
        <div className="flex justify-center">
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => sendGameMessage('assassin:done', true)}
          >
            {t('done')}
          </Button>
        </div>
      </div>
    );
  }

  if (player?.state === 'DONE') {
    return (
      <div className="space-y-4">
        <Header className="text-center font-mono font-normal leading-snug">
          {t('freeToWurder')}
        </Header>
        <div className="flex justify-center">
          {/* `secondary`, not `variant="basic"` - the latter is the ghost skin, which is flat and
              transparent and reads as text rather than a control. */}
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => sendGameMessage('assassin:done', false)}
          >
            {t('showDossier')}
          </Button>
        </div>
      </div>
    );
  }

  // Pre-assignment / transitional moment (state neither READING nor DONE): a large centered loader so
  // the screen is never blank.
  return <GameWaiting message={t('waiting')} />;
}
