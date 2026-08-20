import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon/Icon';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/Table/Table';
import type { Spectator } from './types';

export interface SpectatorTableProps {
  spectators: Spectator[];
  /** Local user's id. */
  currentUserId: string;
  /** Per-spectator emote overlay. */
  renderEmote?: (spectator: Spectator) => ReactNode;
}

/** The "Spectators" table: named spectators (with a "you" marker) or "Pending" for unnamed ones. */
export function SpectatorTable({ spectators, currentUserId, renderEmote }: SpectatorTableProps) {
  const { t } = useTranslation('common');
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t('playerList.spectators')}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spectators.length === 0 ? (
          <TableRow>
            <TableCell>
              <i className="text-text-muted">{t('playerList.noSpectators')}</i>
            </TableCell>
          </TableRow>
        ) : (
          spectators.map((spectator) =>
            spectator.name ? (
              <TableRow key={spectator.id} positive={spectator.id === currentUserId}>
                <TableCell>
                  {/* Flex row so a long name wraps beside the marker instead of under it. */}
                  <div className="flex items-center gap-2">
                    <span className="min-w-0">{spectator.name}</span>
                    {/* Beside the name; zero-height so it never grows the row - see PlayerRow. */}
                    {renderEmote?.(spectator) != null && (
                      <span className="relative h-0 w-8 shrink-0">{renderEmote?.(spectator)}</span>
                    )}
                    {spectator.id === currentUserId && (
                      <span className="ml-auto flex shrink-0 items-center">
                        <Icon
                          name="user"
                          color="text-text-subtle"
                          label={t('playerList.iconSelf')}
                        />
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={spectator.id}>
                <TableCell>
                  <i className="text-text-muted">{t('playerList.pending')}</i>
                </TableCell>
              </TableRow>
            ),
          )
        )}
      </TableBody>
    </Table>
  );
}
