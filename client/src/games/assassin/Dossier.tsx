import { useTranslation } from 'react-i18next';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { Card, CardContent, CardHeader, CardMeta } from '@/components/ui/Card/Card';
import { Label } from '@/components/ui/Label/Label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/Table/Table';
import type { ResolvedTarget } from './types';

export interface DossierProps {
  /** Operation codename (game data, e.g. "crimson wolf"). Rendered verbatim in monospace. */
  title: string;
  /** Single-target mode payload (present when `battleRoyale` is false). */
  target?: ResolvedTarget;
  /** Battle-royale payload: one entry per rival hunter (present when `battleRoyale` is true). */
  targets?: ResolvedTarget[];
  battleRoyale: boolean;
}

/**
 * The mission briefing. Single-target mode shows a card with the target's name (large negative Label)
 * and the kill words. Battle-royale mode shows a Player / Kill Words table, one row per target. Target
 * names and kill words are game data - rendered verbatim; all chrome copy flows through i18n.
 */
export function Dossier({ title, target, targets, battleRoyale }: DossierProps) {
  const { t } = useTranslation('game-assassin');

  return (
    <div className="space-y-4">
      {/* The briefing reads as a title block, so it is centred as one. `justify-center` as well as
          `text-center` because the icon makes Header a flex row. */}
      <div className="text-center">
        <Header
          className="justify-center"
          icon={<i aria-hidden="true" className="fa-solid fa-crosshairs" />}
        >
          {battleRoyale ? t('dossierTitlePlural') : t('dossierTitle')}
        </Header>
        <HeaderSubheader>{t('dossierSubtitle')}</HeaderSubheader>
      </div>

      <Header className="text-center font-mono leading-tight">
        {t('operation')}
        <br />
        <span>{title}</span>
      </Header>

      {battleRoyale ? (
        <Table unstackable>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('tablePlayer')}</TableHeaderCell>
              <TableHeaderCell>{t('tableKillWords')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(targets ?? []).map((entry) => (
              <TableRow key={entry.name}>
                <TableCell>{entry.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {entry.words.map((word) => (
                      <Label key={word}>{word}</Label>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent>
            <CardHeader>{t('targetHeader')}</CardHeader>
            <CardMeta>{t('targetMeta')}</CardMeta>
            <div className="mt-2">
              <Label color="negative" size="lg" data-testid="assassin-target">
                {target?.name}
              </Label>
            </div>
          </CardContent>
          <CardContent>
            <CardHeader>{t('weaponsHeader')}</CardHeader>
            <CardMeta>{t('weaponsMeta')}</CardMeta>
            <div className="mt-2 flex flex-wrap gap-1" data-testid="assassin-words">
              {(target?.words ?? []).map((word) => (
                <Label key={word}>{word}</Label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
