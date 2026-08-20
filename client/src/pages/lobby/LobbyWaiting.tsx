import { useTranslation } from 'react-i18next';
import type { GameMeta, LobbyInfo } from '@shared/types';
import GAMES from '@gameInfo';
import { cn } from '@/components/lib/cn';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { SettingsPanel } from '@/components/widgets/SettingsPanel';
import { Scrollable } from '@/components/ui/Scrollable/Scrollable';
import { Divider } from '@/components/ui/Divider/Divider';
import { GameInfoCard } from '@/pages/game-list/GameInfoCard';
import { useLobbyAdmin } from '@/hooks/useLobbyAdmin';
import { useGame } from '@/hooks/useGame';
import { gameCopy } from '@/lib/gameCopy';
import { LobbyHeader } from './LobbyHeader';
import { GameSelector } from './GameSelector';
import { GameConfigPanel } from './GameConfigPanel';
import { StartGameButton } from './StartGameButton';
import { LobbyPlayerList } from './LobbyPlayerList';
import { GAME_COLUMN_DESKTOP, LOBBY_COLUMN } from './layout';
import { invalidConfig } from './configUtils';

export interface LobbyWaitingProps {
  lobbyInfo: LobbyInfo;
  playerId: string;
  /** Route lobby code (for the header display). */
  code: string;
}

/**
 * The waiting room. Owns the responsive composition: a stacked single column on mobile (game card ->
 * config -> player list) and, on desktop, the settings column beside a persistent player-list side
 * rail. Shows the game info card when a game is selected, else the lobby-code header. Game selection
 * and config editing are admin-only; everyone else sees read-only config stats.
 *
 * As on the playing screen, the heading renders in one of two places depending on width (only ever
 * one at a time, via `display`): across the top on mobile, or above the player list in the left rail
 * on desktop.
 */
export function LobbyWaiting({ lobbyInfo, playerId, code }: LobbyWaitingProps) {
  const { t, i18n } = useTranslation('lobby');
  const { isAdmin, setGame, setConfig } = useLobbyAdmin();
  const { startGame } = useGame();

  const gameMeta = GAMES[lobbyInfo.game as keyof typeof GAMES] as GameMeta | undefined;
  const playerCount = lobbyInfo.players.length;
  const title = gameMeta ? gameCopy(i18n, lobbyInfo.game, 'title') : t('noGame.title');
  const subtitle = gameMeta ? gameCopy(i18n, lobbyInfo.game, 'subtitle') : t('noGame.subtitle');

  const heading = <MenuLayout className="mb-0 max-w-none" title={title} subtitle={subtitle} />;

  const main = (
    <div className="flex flex-col gap-4">
      {gameMeta ? (
        <div>
          <Divider>{t('sections.gameInfo')}</Divider>
          <GameInfoCard gameKey={lobbyInfo.game} meta={gameMeta} />
        </div>
      ) : (
        <LobbyHeader code={code} />
      )}

      {isAdmin && (
        <div className="text-left">
          <Divider>{t('sections.gameSettings')}</Divider>
          <div className="flex flex-col gap-4">
            <GameSelector value={lobbyInfo.game} onSelect={setGame} />
            {gameMeta && (
              <>
                <GameConfigPanel
                  gameId={lobbyInfo.game}
                  gameMeta={gameMeta}
                  config={lobbyInfo.config}
                  playerCount={playerCount}
                  isAdmin
                  onConfigChange={setConfig}
                />
                <StartGameButton
                  disabled={invalidConfig(lobbyInfo, gameMeta)}
                  onStart={startGame}
                />
              </>
            )}
          </div>
        </div>
      )}

      {!isAdmin && gameMeta && (
        <div>
          <Divider>{t('sections.gameSetup')}</Divider>
          <GameConfigPanel
            gameId={lobbyInfo.game}
            gameMeta={gameMeta}
            config={lobbyInfo.config}
            playerCount={playerCount}
            isAdmin={false}
            onConfigChange={setConfig}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
      {/* Desktop: members + preferences are a full-height sticky LEFT rail whose heading stays put
          while only the content below it scrolls; the content column takes the remaining width. See
          LobbyPlaying for the h-dvh / min-h-0 / px reasoning. Mobile: content first, then the rail
          below - both capped at LOBBY_COLUMN so every section lines up at the same width. */}
      <div
        className={cn(
          'order-2 mx-auto flex flex-col gap-3',
          LOBBY_COLUMN,
          'lg:sticky lg:top-0 lg:order-1 lg:mx-0 lg:h-dvh lg:w-80 lg:max-w-none lg:shrink-0 lg:pt-14 lg:pb-0',
        )}
      >
        <div className="hidden lg:block lg:shrink-0">{heading}</div>
        {/* The wider right padding is the scrollbar's gutter - the drawn track needs to clear the
            content rather than sit on top of it. */}
        <Scrollable
          className="lg:min-h-0 lg:flex-1"
          viewportClassName="lg:h-full lg:overflow-y-auto lg:pl-2 lg:pr-6"
          contentClassName="flex flex-col gap-3"
        >
          <LobbyPlayerList lobbyInfo={lobbyInfo} playerId={playerId} lobbyState="WAITING" />
          <SettingsPanel className="mt-0 max-w-none" />
        </Scrollable>
      </div>
      <div
        className={cn(
          'order-1 mx-auto',
          LOBBY_COLUMN,
          'lg:order-2 lg:mx-0 lg:min-w-0 lg:flex-1 lg:pt-14',
          GAME_COLUMN_DESKTOP,
        )}
      >
        <div className="lg:hidden">{heading}</div>
        {main}
      </div>
    </div>
  );
}
