import { useTranslation } from 'react-i18next';
import type { GameMeta, LobbyInfo } from '@shared/types';
import GAMES from '@gameInfo';
import { cn } from '@/components/lib/cn';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { SettingsPanel } from '@/components/widgets/SettingsPanel';
import { Scrollable } from '@/components/ui/Scrollable/Scrollable';
import { GameRenderer } from '@/games/GameRenderer';
import { GameProgress } from '@/games/shared/GameProgress';
import { useGame } from '@/hooks/useGame';
import { gameCopy } from '@/lib/gameCopy';
import { LobbyPlayerList } from './LobbyPlayerList';
import { GAME_COLUMN_DESKTOP, LOBBY_COLUMN, RAIL_INSET } from './layout';

export interface LobbyPlayingProps {
  lobbyInfo: LobbyInfo;
  playerId: string;
}

/**
 * The active-game screen. The title/subtitle come from the running game's metadata; the game renders
 * full-bleed on mobile with the player list below it, and beside it as a side rail on desktop. The
 * admin's End Game control (two-click confirm) is provided by the wired PlayerList.
 *
 * The heading is rendered in one of two places depending on width (only ever one at a time, via
 * `display`): across the top on mobile, or inside the left rail above the player list on desktop -
 * which hands the game column that vertical space, so a tall widget like the drawing canvas can fit
 * on one screen.
 */
export function LobbyPlaying({ lobbyInfo, playerId }: LobbyPlayingProps) {
  const { t, i18n } = useTranslation('lobby');
  const { gameState } = useGame();
  const gameMeta = GAMES[lobbyInfo.game as keyof typeof GAMES] as GameMeta | undefined;

  const heading = (
    <MenuLayout
      className="mb-0 max-w-none"
      title={gameMeta ? gameCopy(i18n, lobbyInfo.game, 'title') : t('loading')}
      subtitle={gameMeta ? gameCopy(i18n, lobbyInfo.game, 'subtitle') : undefined}
    />
  );

  return (
    <div className="mx-auto flex w-full flex-col px-4">
      <div className="lg:hidden">{heading}</div>
      {/* justify-center: the game column is capped, so without it the rail + content sit flush left
          with all the slack pooled on the right. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
        {/* Desktop: members + preferences are a full-height sticky LEFT rail whose heading and
            progress bar stay put while only the content below them scrolls, so the game keeps the
            whole remaining width. Sizing it `h-dvh` (not `max-h-dvh`) with a `min-h-0` scroll child
            is what keeps the rail's own scrollbar off when it fits. Mobile: game first, then the
            rail below - both capped at LOBBY_COLUMN so the sections line up at one width. */}
        <div
          className={cn(
            'order-2 mx-auto flex flex-col gap-3',
            LOBBY_COLUMN,
            'lg:sticky lg:top-0 lg:order-1 lg:mx-0 lg:h-dvh lg:w-80 lg:max-w-none lg:shrink-0 lg:pt-14 lg:pb-0',
          )}
        >
          <div className={cn('hidden lg:block lg:shrink-0', RAIL_INSET)}>{heading}</div>
          {/* Desktop copy of the turn progress. Guarded on a numeric progress rather than defaulting
              to 0, so games that expose none (Assassin) do not show a permanently empty bar.
              RAIL_INSET matches the scroll container below, so the bar ends where the table does. */}
          {typeof gameState?.progress === 'number' && (
            <GameProgress
              className={cn('hidden lg:block lg:shrink-0', RAIL_INSET)}
              progress={gameState.progress}
            />
          )}
          {/* px on the scroll container, not the page: an overflow container clips on BOTH axes, so
              without horizontal breathing room it shaves the tables' ambient shadow off at the edge.
              The wider right padding is the scrollbar's gutter - the drawn track needs to clear the
              content, not sit on top of it. */}
          <Scrollable
            className="lg:min-h-0 lg:flex-1"
            viewportClassName={cn('lg:h-full lg:overflow-y-auto', RAIL_INSET)}
            contentClassName="flex flex-col gap-3"
          >
            <LobbyPlayerList
              lobbyInfo={lobbyInfo}
              playerId={playerId}
              lobbyState="PLAYING"
              gameState={gameState ?? undefined}
            />
            <SettingsPanel className="mt-0 max-w-none" />
          </Scrollable>
        </div>
        <div
          className={cn(
            'order-1 mx-auto',
            LOBBY_COLUMN,
            // pt matches the rail's, clearing the fixed lobby-code / admin chips pinned at the top.
            'lg:order-2 lg:mx-0 lg:min-w-0 lg:flex-1 lg:pt-14',
            GAME_COLUMN_DESKTOP,
          )}
        >
          <GameRenderer game={lobbyInfo.game} />
        </div>
      </div>
    </div>
  );
}
