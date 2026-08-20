import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import { Card } from '@/components/ui/Card/Card';
import { configCopy, gameCopy, gameCopyList } from '@/lib/gameCopy';
import { GameMetaRow } from './GameMetaRow';

export interface GameDetailPanelProps {
  /** The gameInfo key of the game being shown; selects its locale namespace. */
  gameKey: string;
  /** The game's shape; its config drives the Configurations list. */
  meta: GameMeta;
}

/** One titled column of the detail row. */
function Pane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col">
      <h3 className="field-label border-b border-divider px-4 py-2.5">{title}</h3>
      <div className="px-4 py-3 text-[15px] leading-relaxed text-text">{children}</div>
    </Card>
  );
}

/**
 * The desktop catalogue's detail panel: the selected game's title at display size over the three
 * sections the stacked mobile card keeps behind accordions. They are stacked full-width rather than
 * columned so each gets a comfortable measure - the point of the desktop layout is that all three
 * are readable at once without opening anything, not that they sit side by side.
 */
export function GameDetailPanel({ gameKey, meta }: GameDetailPanelProps) {
  const { t, i18n } = useTranslation('gameList');
  const configEntries = Object.entries(meta.config).filter(([, cfg]) => !cfg.hidden);
  const subtitle = gameCopy(i18n, gameKey, 'subtitle');

  return (
    <div data-game-detail={gameKey} className="flex flex-col gap-6">
      <header className="text-center">
        <h2 className="font-display text-4xl leading-tight text-text">
          {gameCopy(i18n, gameKey, 'title')}
        </h2>
        {subtitle && <p className="mt-1 font-sans italic text-text-muted">{subtitle}</p>}
        <p className="mx-auto mt-3 max-w-2xl text-text">{gameCopy(i18n, gameKey, 'description')}</p>
        <GameMetaRow
          gameKey={gameKey}
          meta={meta}
          className="mt-4 justify-center text-sm text-text-muted"
        />
      </header>

      <div className="flex flex-col gap-4">
        <Pane title={t('sections.moreInfo')}>{gameCopy(i18n, gameKey, 'more')}</Pane>
        <Pane title={t('sections.howTo')}>
          <ol className="m-0 list-decimal space-y-1 pl-5">
            {gameCopyList(i18n, gameKey, 'howTo').map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </Pane>
        <Pane title={t('sections.configurations')}>
          <ul className="m-0 list-none space-y-1 p-0">
            {configEntries.map(([key]) => (
              <li key={key}>
                <b>{configCopy(i18n, gameKey, `${key}.name`)}</b>
                {`: ${configCopy(i18n, gameKey, `${key}.info`)}`}
              </li>
            ))}
          </ul>
        </Pane>
      </div>
    </div>
  );
}
