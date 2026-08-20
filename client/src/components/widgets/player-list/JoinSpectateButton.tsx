import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

export interface JoinSpectateButtonProps {
  /** Current user is an active player. */
  isPlayer: boolean;
  /** Current user is a spectator. */
  isSpectator: boolean;
  /** Spectators may still join as players (lobby not full / waiting). */
  canJoinPlayers: boolean;
  onSpectate?: () => void;
  onJoinPlayers?: () => void;
  /** Leave the lobby (navigates home; the parent supplies navigation). */
  onLeave?: () => void;
}

/**
 * The bottom-of-list join/spectate/leave actions. A player sees "Spectate"; a spectator sees
 * "Join players" (when allowed) and "Leave". Purely presentational - handlers come from the parent.
 */
export function JoinSpectateButton({
  isPlayer,
  isSpectator,
  canJoinPlayers,
  onSpectate,
  onJoinPlayers,
  onLeave,
}: JoinSpectateButtonProps) {
  const { t } = useTranslation('common');

  if (isPlayer) {
    return (
      <Button variant="secondary" onClick={onSpectate}>
        {t('playerList.spectate')}
      </Button>
    );
  }

  if (isSpectator) {
    return (
      <div className="flex justify-center gap-2">
        {canJoinPlayers && (
          <Button variant="positive" onClick={onJoinPlayers}>
            {t('playerList.joinPlayers')}
          </Button>
        )}
        {/* Leaving is the way back out, not a second green call to action - taking a seat is. */}
        <Button variant="secondary" icon="arrow left" onClick={onLeave}>
          {t('playerList.leave')}
        </Button>
      </div>
    );
  }

  return null;
}
