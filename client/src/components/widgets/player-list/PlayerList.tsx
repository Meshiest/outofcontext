import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Button } from '@/components/ui/Button/Button';
import { Divider } from '@/components/ui/Divider/Divider';
import { AdminControls } from './AdminControls';
import { EmoteBar } from './EmoteBar';
import { EmoteDisplay } from './EmoteDisplay';
import { EndGameButton } from './EndGameButton';
import { JoinSpectateButton } from './JoinSpectateButton';
import { PlayerTable } from './PlayerTable';
import { SpectatorTable } from './SpectatorTable';
import { useEmoteAnimation } from './useEmoteAnimation';
import type { GameState, LobbyState, Player, Spectator } from './types';

// The header toggles stay square (icon-only) but sit tighter than the default `sm` icon button, so
// they fit the table header row without crowding its rules.
const HEADER_TOGGLE_SIZE = 'size-7 text-xs';

/** Imperative surface the transport layer calls when a `lobby:emote` arrives. */
export interface PlayerListHandle {
  showEmote: (memberId: string, emote: string) => void;
}

export interface PlayerListProps {
  players: Player[];
  spectators: Spectator[];
  /** Admin's id. */
  admin: string;
  /** Local user's id. */
  currentUserId: string;
  isSpectator: boolean;
  canJoinPlayers: boolean;
  lobbyState: LobbyState;
  gameState?: GameState;
  // Presentational: all side effects are delegated to the parent.
  onSendEmote?: (emote: string) => void;
  onGrantAdmin?: (id: string) => void;
  onRemovePlayer?: (id: string) => void;
  onSpectate?: () => void;
  onJoinPlayers?: () => void;
  onReplace?: (playerId: string) => void;
  onEndGame?: () => void;
  onLeave?: () => void;
  ref?: Ref<PlayerListHandle>;
}

/**
 * The lobby member list: a Players table and a Spectators table, plus emote sending/animation,
 * admin controls, and join/spectate/leave/end-game actions. Presentational and layout-agnostic -
 * the parent positions it (side rail on desktop, collapsible section on mobile) and supplies every
 * handler. Incoming emotes are fed in by calling `showEmote` on the ref.
 */
export function PlayerList({
  players,
  spectators,
  admin,
  currentUserId,
  isSpectator,
  canJoinPlayers,
  lobbyState,
  gameState,
  onSendEmote,
  onGrantAdmin,
  onRemovePlayer,
  onSpectate,
  onJoinPlayers,
  onReplace,
  onEndGame,
  onLeave,
  ref,
}: PlayerListProps) {
  const { t } = useTranslation('common');
  const [showEmotes, setShowEmotes] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const { emotes, showEmote } = useEmoteAnimation();
  // The emote popup is portaled, so it positions itself against this toggle.
  const emoteToggleRef = useRef<HTMLButtonElement>(null);
  const closeEmotes = useCallback(() => setShowEmotes(false), []);

  useImperativeHandle(ref, () => ({ showEmote }), [showEmote]);

  const isAdmin = currentUserId === admin;
  const isPlayer = players.some((p) => p.id === currentUserId);

  const handleGrant = useCallback(
    (id: string) => {
      onGrantAdmin?.(id);
      setAdminMode(false);
    },
    [onGrantAdmin],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onRemovePlayer?.(id);
      setRemoveMode(false);
    },
    [onRemovePlayer],
  );

  const renderEmote = (member: Player | Spectator): ReactNode => {
    const active = emotes[member.id];
    return active ? (
      <EmoteDisplay key={active.key} emote={active.emote} exiting={active.exiting} />
    ) : null;
  };

  const renderActions = (player: Player): ReactNode => {
    const notSelf = player.id !== currentUserId;
    return (
      <>
        {isSpectator && !player.connected && (
          <Button
            size="sm"
            compact
            variant="secondary"
            className="h-6 px-1.5"
            onClick={() => onReplace?.(player.playerId)}
          >
            {t('playerList.join')}
          </Button>
        )}
        <AdminControls
          playerId={player.id}
          // Gate on isAdmin too: the header toggles only set these modes, nothing clears them if the
          // user stops being admin (e.g. hands off admin, then Spectates), which would otherwise leave
          // stale, server-rejected row buttons.
          isAdminMode={isAdmin && adminMode && notSelf && player.connected}
          isRemoveMode={isAdmin && removeMode && notSelf && player.connected}
          onGrantAdmin={handleGrant}
          onRemovePlayer={handleRemove}
        />
      </>
    );
  };

  const headerToggles = (
    <>
      <Button
        ref={emoteToggleRef}
        iconButton
        size="sm"
        icon="chat"
        aria-label={t('playerList.emotesToggle')}
        color={showEmotes ? 'green' : undefined}
        variant={showEmotes ? 'primary' : 'basic'}
        className={cn(HEADER_TOGGLE_SIZE, !showEmotes && 'text-positive')}
        onClick={() => setShowEmotes((v) => !v)}
      />
      {isAdmin && (
        <Button
          iconButton
          size="sm"
          icon="shield"
          aria-label={t('playerList.grantToggle')}
          color={adminMode ? 'blue' : undefined}
          variant={adminMode ? 'primary' : 'basic'}
          className={cn(HEADER_TOGGLE_SIZE, !adminMode && 'text-primary')}
          onClick={() => {
            setAdminMode((v) => !v);
            setRemoveMode(false);
          }}
        />
      )}
      {isAdmin && (
        <Button
          iconButton
          size="sm"
          icon="times"
          aria-label={t('playerList.removeToggle')}
          color={removeMode ? 'red' : undefined}
          variant={removeMode ? 'primary' : 'basic'}
          className={cn(HEADER_TOGGLE_SIZE, !removeMode && 'text-negative')}
          onClick={() => {
            setRemoveMode((v) => !v);
            setAdminMode(false);
          }}
        />
      )}
    </>
  );

  return (
    // One gap value throughout, matching the parent rail's gap up to the preferences panel.
    <div className="flex flex-col gap-3">
      {/* On desktop the list is its own titled side rail, so the section divider is redundant; it
          only earns its place on mobile where the list is one stacked section among several. */}
      <Divider className="lg:hidden">{t('playerList.heading')}</Divider>
      <div className="relative">
        <PlayerTable
          players={players}
          currentUserId={currentUserId}
          adminId={admin}
          gameIcons={gameState?.icons}
          headerActions={headerToggles}
          renderActions={renderActions}
          renderEmote={renderEmote}
        />
        <EmoteBar
          isOpen={showEmotes}
          anchorRef={emoteToggleRef}
          onRequestClose={closeEmotes}
          onSendEmote={(emote) => onSendEmote?.(emote)}
        />
      </div>
      <SpectatorTable
        spectators={spectators}
        currentUserId={currentUserId}
        renderEmote={renderEmote}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <JoinSpectateButton
          isPlayer={isPlayer}
          isSpectator={isSpectator}
          canJoinPlayers={canJoinPlayers}
          onSpectate={onSpectate}
          onJoinPlayers={onJoinPlayers}
          onLeave={onLeave}
        />
        <EndGameButton isAdmin={isAdmin} lobbyState={lobbyState} onEndGame={onEndGame} />
      </div>
    </div>
  );
}
