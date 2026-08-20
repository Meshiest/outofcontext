import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/Label/Label';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from './Table';

const meta = {
  title: 'Data Display/Table',
  component: Table,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

type Player = { name: string; connected: boolean; you?: boolean };

const players: Player[] = [
  { name: 'Ada', connected: true, you: true },
  { name: 'Grace', connected: true },
  { name: 'Alan', connected: false },
  { name: 'Katherine', connected: true },
];

const spectators: string[] = ['Marguerite', 'Dev'];

type Target = { name: string; words: string[] };

const targets: Target[] = [
  { name: 'Marguerite', words: ['pineapple', 'obviously'] },
  { name: 'Dev', words: ['anyway', 'frankly'] },
  { name: 'Ada', words: ['whatever', 'honestly'] },
];

/**
 * The default treatment: framed, rounded, and raised - the same table the app ships (see the
 * battle-royale dossier in games/assassin/Dossier.tsx, which this mirrors). The `basic` prop drops
 * the frame, but nothing in the app uses it, so the specimen shows what players actually see.
 */
export const Default: Story = {
  render: function DossierTable() {
    const { t } = useTranslation('game-assassin');
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('tablePlayer')}</TableHeaderCell>
            <TableHeaderCell>{t('tableKillWords')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {targets.map((target) => (
            <TableRow key={target.name}>
              <TableCell>{target.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {target.words.map((word) => (
                    <Label key={word}>{word}</Label>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

/**
 * The lobby's player table (widgets/player-list/PlayerTable.tsx): one column headed by the section
 * title, the local player tinted green and a disconnected player tinted red. Names are ordinary
 * text: only the header row carries the tracked uppercase treatment, and it gets that from the
 * `.ooc-table th` rule, not from anything the cells opt into.
 */
export const PlayerList: Story = {
  render: function PlayerListTable() {
    const { t } = useTranslation('common');
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('playerList.players')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            // PlayerRow marks these with icons; the words say the same thing without pulling a
            // whole row component into a Table specimen.
            let marker: string | null = null;
            if (player.you) marker = t('playerList.iconSelf');
            else if (!player.connected) marker = t('playerList.iconDisconnected');
            return (
              <TableRow key={player.name} positive={player.you} negative={!player.connected}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0">{player.name}</span>
                    {marker != null && (
                      <span className="ml-auto shrink-0 text-text-subtle">{marker}</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  },
};

/**
 * Tighter cell padding, shown on the lobby's spectator table
 * (widgets/player-list/SpectatorTable.tsx).
 */
export const Compact: Story = {
  render: function CompactTable() {
    const { t } = useTranslation('common');
    return (
      <Table compact>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('playerList.spectators')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spectators.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
            </TableRow>
          ))}
          {/* A spectator who has not entered a name yet. */}
          <TableRow>
            <TableCell>
              <i className="text-text-muted">{t('playerList.pending')}</i>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  },
};

/**
 * In a narrow container the table does not scroll sideways - cells wrap instead, so a long name
 * never pushes the page wider. The lobby column on a phone is about this wide.
 */
export const Narrow: Story = {
  name: 'Narrow container (cells wrap)',
  render: function NarrowTable() {
    const { t } = useTranslation('game-assassin');
    return (
      <div className="max-w-[260px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('tablePlayer')}</TableHeaderCell>
              <TableHeaderCell>{t('tableKillWords')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Bartholomewthelongwinded</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Label>incomprehensible</Label>
                  <Label>nevertheless</Label>
                </div>
              </TableCell>
            </TableRow>
            {targets.map((target) => (
              <TableRow key={target.name}>
                <TableCell>{target.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {target.words.map((word) => (
                      <Label key={word}>{word}</Label>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};
