import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import { cn } from '@/components/lib/cn';
import {
  Card,
  CardContent,
  CardDescription,
  CardExtra,
  CardHeader,
  CardMeta,
} from '@/components/ui/Card/Card';
import { Accordion, AccordionItem } from '@/components/ui/Accordion/Accordion';
import { configCopy, gameCopy, gameCopyList } from '@/lib/gameCopy';
import { GameMetaRow } from './GameMetaRow';

export interface GameInfoCardProps {
  /** The gameInfo key (e.g. "story"). Selects the game's locale namespace and tags the card. */
  gameKey: string;
  /** The game's shape; its config drives the Configurations list. */
  meta: GameMeta;
  className?: string;
}

/**
 * A single game's info panel: title + description, a styled accordion (More Info / How to Play /
 * Configurations), and a footer of play time, player range, and difficulty. Rendered on the game
 * list and reused above the lobby settings when a game is selected.
 */
export function GameInfoCard({ gameKey, meta, className }: GameInfoCardProps) {
  const { t, i18n } = useTranslation('gameList');
  const configEntries = Object.entries(meta.config).filter(([, cfg]) => !cfg.hidden);
  const subtitle = gameCopy(i18n, gameKey, 'subtitle');

  return (
    <Card data-game={gameKey} className={cn('w-full text-left', className)}>
      <CardContent>
        <CardHeader className="text-center">{gameCopy(i18n, gameKey, 'title')}</CardHeader>
        {subtitle && <CardMeta className="text-center">{subtitle}</CardMeta>}
        <CardDescription>{gameCopy(i18n, gameKey, 'description')}</CardDescription>
      </CardContent>

      <div className="px-4 pb-3">
        <Accordion styled>
          <AccordionItem title={t('sections.moreInfo')}>
            {gameCopy(i18n, gameKey, 'more')}
          </AccordionItem>
          <AccordionItem title={t('sections.howTo')}>
            <ol className="m-0 list-decimal space-y-1 pl-5">
              {gameCopyList(i18n, gameKey, 'howTo').map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </AccordionItem>
          <AccordionItem title={t('sections.configurations')}>
            <ul className="m-0 list-none space-y-1 p-0">
              {configEntries.map(([key]) => (
                <li key={key}>
                  <b>{configCopy(i18n, gameKey, `${key}.name`)}</b>
                  {`: ${configCopy(i18n, gameKey, `${key}.info`)}`}
                </li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </div>

      {/* pb matches the card's horizontal inset so the footer row is not tighter to the bottom edge
          than it is to the sides. */}
      <CardExtra className="pb-4">
        <GameMetaRow gameKey={gameKey} meta={meta} />
      </CardExtra>
    </Card>
  );
}
