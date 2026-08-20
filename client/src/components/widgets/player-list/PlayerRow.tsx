import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon/Icon';
import { TableRow, TableCell } from '@/components/ui/Table/Table';
import type { Player } from './types';

export interface PlayerRowProps {
  player: Player;
  /** This row is the local user. */
  isCurrentUser?: boolean;
  /** This row is the lobby admin. */
  isAdmin?: boolean;
  /** Optional per-game status icon name. */
  statusIcon?: string;
  /** Emote overlay for this player (positioned after the name). */
  emoteSlot?: ReactNode;
  /** Admin/spectator action buttons for this row (right-aligned). */
  actionSlot?: ReactNode;
}

/**
 * One player row: name, an inline emote overlay, and a right-aligned icon/action cluster (admin
 * shield, "you" marker, game status icon, disconnect X). Disconnected rows tint red, the local
 * user's row tints green.
 */
export function PlayerRow({
  player,
  isCurrentUser = false,
  isAdmin = false,
  statusIcon,
  emoteSlot,
  actionSlot,
}: PlayerRowProps) {
  const { t } = useTranslation('common');
  return (
    <TableRow positive={isCurrentUser} negative={!player.connected}>
      {/* Flex row rather than an absolutely-positioned icon cluster: the cluster reserves its own
          width, so a long name wraps in the space that is actually left instead of running
          underneath the icons. */}
      <TableCell>
        {/* min-h-6 reserves the action buttons' height. A row is naturally 23.25px tall - the name's
            line box - and a button is 24px, so turning on admin or remove mode grew every row by
            that three quarters of a pixel and nudged the whole table. Holding the taller of the two
            heights always means the buttons appear into space that is already there. */}
        <div className="flex min-h-6 items-center gap-2">
          <span className="min-w-0">{player.name}</span>
          {/* Sits directly beside the name (the icon cluster is pushed right by `ml-auto`, not by the
              name growing). Zero-height so the emote overflows evenly above and below and the row
              does not grow taller for the seconds it is on screen. */}
          {emoteSlot != null && <span className="relative h-0 w-8 shrink-0">{emoteSlot}</span>}
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {actionSlot}
            {isAdmin && (
              <Icon name="shield" color="text-text-subtle" label={t('playerList.iconAdmin')} />
            )}
            {isCurrentUser && (
              <Icon name="user" color="text-text-subtle" label={t('playerList.iconSelf')} />
            )}
            {statusIcon && <Icon name={statusIcon} color="text-text-subtle" />}
            {!player.connected && (
              <Icon
                name="times"
                color="text-text-subtle"
                label={t('playerList.iconDisconnected')}
              />
            )}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
