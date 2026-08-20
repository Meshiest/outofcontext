import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import { cn } from '@/components/lib/cn';
import { PageWrapper } from '@/components/widgets/PageWrapper';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { SettingsPanel } from '@/components/widgets/SettingsPanel';
import { Divider } from '@/components/ui/Divider/Divider';
import { Icon } from '@/components/ui/Icon/Icon';
import { Scrollable } from '@/components/ui/Scrollable/Scrollable';
import { GameInfoCard } from './game-list/GameInfoCard';
import { GameDetailPanel } from './game-list/GameDetailPanel';
import { GameSummaryCard } from './game-list/GameSummaryCard';

// A react-router Link styled as a neutral pressed-smooth button. Button renders a real <button>, so
// for an anchor-with-href we reuse the same skin/size classes on the Link directly (no nested
// interactive elements).
const HOME_LINK_CLASS =
  'btn-skin btn-neutral relative inline-flex h-11 w-full select-none items-center justify-center gap-2 rounded-md border px-4 font-sans text-[13px] font-bold uppercase leading-none tracking-[0.1em]';

// Wide buttons pin their icon to the left edge and keep the label centered, matching Button.
const HOME_ICON_CLASS = 'absolute top-1/2 left-4 inline-flex -translate-y-1/2 items-center';

/**
 * The game catalogue, in two layouts.
 *
 * Small screens get a single stacked column of self-contained cards, each keeping its detail behind
 * accordions because there is no room to show it. Desktop has room for both at once, so it splits
 * into a catalogue rail of summary cards and a detail panel for the selected game, with the three
 * accordion sections opened out into a row of panes.
 *
 * Both trees render and CSS picks one: only ever one is displayed, so the hidden layout is out of
 * the accessibility tree, and the breakpoint needs no JS (no matchMedia, no resize listener).
 */
export function GameListPage() {
  const { t } = useTranslation('gameList');
  const games = (Object.entries(GAMES) as Array<[string, GameMeta]>).filter(
    ([, meta]) => !meta.hidden,
  );

  const [selectedKey, setSelectedKey] = useState(() => games[0]?.[0] ?? '');
  const selected = games.find(([key]) => key === selectedKey) ?? games[0];

  return (
    // Preferences are rendered inside the stacked layout rather than by PageWrapper, so they come
    // along on small screens but are absent from the desktop catalogue.
    <PageWrapper hideSettings>
      <div data-testid="game-list-stacked" className="lg:hidden">
        <MenuLayout title={t('title')} subtitle={t('subtitle')}>
          <div className="flex w-full max-w-full flex-col gap-4">
            <Divider>{t('redirect')}</Divider>
            <Link to="/" className={HOME_LINK_CLASS}>
              <span className={HOME_ICON_CLASS}>
                <Icon name="arrow left" size="sm" className="btn-ico" />
              </span>
              {t('home')}
            </Link>
            {games.map(([key, meta]) => (
              <GameInfoCard key={key} gameKey={key} meta={meta} />
            ))}
          </div>
        </MenuLayout>
        <SettingsPanel />
      </div>

      {/* Full-height row so the catalogue and the detail panel scroll independently - a long game's
          detail never pushes the rail out of reach. Each column carries its own horizontal padding
          because an overflow container clips on BOTH axes, which would otherwise shave the cards'
          shadow and clip the selected card's slide. */}
      <div
        data-testid="game-list-split"
        // No bottom padding: the columns scroll, so they should run to the bottom edge rather than
        // stopping short of it with dead space underneath.
        className="mx-auto hidden w-full max-w-[1200px] gap-6 px-4 pt-10 pb-0 lg:flex lg:h-dvh"
      >
        <aside className="flex w-80 shrink-0 flex-col gap-3">
          {/* Outside the scroll area, and shrink-0 so a full catalogue cannot squash it. */}
          <Link to="/" className={cn(HOME_LINK_CLASS, 'shrink-0')}>
            <span className={HOME_ICON_CLASS}>
              <Icon name="arrow left" size="sm" className="btn-ico" />
            </span>
            {t('home')}
          </Link>
          {/* The negative margin cancels the padding, so the cards still line up with the Home
              button while the clip edge sits wide enough to clear their shadow and slide. */}
          <Scrollable
            className="-mx-3 min-h-0 flex-1"
            viewportClassName="h-full overflow-y-auto py-2 pl-3 pr-6"
            contentClassName="flex flex-col gap-3"
          >
            {games.map(([key, meta]) => (
              <GameSummaryCard
                key={key}
                gameKey={key}
                meta={meta}
                selected={key === selectedKey}
                onSelect={setSelectedKey}
              />
            ))}
          </Scrollable>
        </aside>

        <Scrollable
          className="min-w-0 flex-1"
          viewportClassName="h-full overflow-y-auto py-2 pl-3 pr-6"
        >
          {selected && <GameDetailPanel gameKey={selected[0]} meta={selected[1]} />}
        </Scrollable>
      </div>
    </PageWrapper>
  );
}
