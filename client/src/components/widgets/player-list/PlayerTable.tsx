import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/Table/Table';
import { PlayerRow } from './PlayerRow';
import type { Player } from './types';

export interface PlayerTableProps {
  players: Player[];
  /** Local user's id. */
  currentUserId: string;
  /** Admin's id. */
  adminId: string;
  /** playerId -> game status icon name. */
  gameIcons?: Record<string, string>;
  /** Header-cell controls (emote / admin / remove toggles), right-aligned + vertically centered. */
  headerActions?: ReactNode;
  /** Per-player admin action buttons. */
  renderActions?: (player: Player) => ReactNode;
  /** Per-player emote overlay. */
  renderEmote?: (player: Player) => ReactNode;
}

/** The "Players" table: a header row (title + toggle controls), then one `PlayerRow` per player. */
export function PlayerTable({
  players,
  currentUserId,
  adminId,
  gameIcons = {},
  headerActions,
  renderActions,
  renderEmote,
}: PlayerTableProps) {
  const { t } = useTranslation('common');
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell className="relative">
            {t('playerList.players')}
            {headerActions != null && (
              <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {headerActions}
              </span>
            )}
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.length === 0 ? (
          <TableRow>
            <TableCell>
              <i className="text-text-muted">{t('playerList.noPlayers')}</i>
            </TableCell>
          </TableRow>
        ) : (
          players.map((player) => (
            <PlayerRow
              key={player.playerId}
              player={player}
              isCurrentUser={player.id === currentUserId}
              isAdmin={player.id === adminId}
              statusIcon={gameIcons[player.playerId]}
              emoteSlot={renderEmote?.(player)}
              actionSlot={renderActions?.(player)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
