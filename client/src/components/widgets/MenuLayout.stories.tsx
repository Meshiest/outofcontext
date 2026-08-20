import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import { Button } from '@/components/ui/Button/Button';
import { Divider } from '@/components/ui/Divider/Divider';
import { GameInfoCard } from '@/pages/game-list/GameInfoCard';
import { AppWordmark } from './AppWordmark';
import { MenuLayout } from './MenuLayout';

/**
 * HomePage's composition: the wordmark as the title, the app tagline as the subtitle, then the two
 * lobby actions and the info links, each section opened by a Divider.
 *
 * The info links are anchors in the app (they navigate), carrying the same pressed-smooth skin the
 * neutral Button renders, so the real Button stands in for them here.
 */
function HomeMenu({ title }: { title: ReactNode }) {
  const { t } = useTranslation('home');

  return (
    <MenuLayout title={title} subtitle={t('subtitle')}>
      <Divider>{t('sections.lobby')}</Divider>
      <div className="flex flex-col gap-2">
        <Button fullWidth variant="positive" icon="plus">
          {t('buttons.create')}
        </Button>
        <Button fullWidth variant="primary" icon="arrow right">
          {t('buttons.join')}
        </Button>
      </div>

      <Divider>{t('sections.info')}</Divider>
      <div className="flex flex-col gap-2">
        <Button fullWidth variant="secondary" icon="info">
          {t('buttons.gameInfo')}
        </Button>
        <Button fullWidth variant="secondary" icon="book open">
          {t('buttons.readCode')}
        </Button>
        <Button fullWidth variant="secondary" icon="bug">
          {t('buttons.requestGame')}
        </Button>
      </div>
    </MenuLayout>
  );
}

/**
 * GameListPage's stacked (small-screen) composition: a Home redirect above a GameInfoCard per game,
 * built from the real gameInfo shapes. Two games here; the page renders every non-hidden one.
 */
function GameListMenu() {
  const { t } = useTranslation('gameList');
  const games = (Object.entries(GAMES) as Array<[string, GameMeta]>)
    .filter(([, meta]) => !meta.hidden)
    .slice(0, 2);

  return (
    <MenuLayout title={t('title')} subtitle={t('subtitle')}>
      <div className="flex w-full max-w-full flex-col gap-4">
        <Divider>{t('redirect')}</Divider>
        <Button fullWidth variant="secondary" icon="arrow left">
          {t('home')}
        </Button>
        {games.map(([key, gameMeta]) => (
          <GameInfoCard key={key} gameKey={key} meta={gameMeta} />
        ))}
      </div>
    </MenuLayout>
  );
}

const meta = {
  title: 'Widgets/MenuLayout',
  component: MenuLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    // The title is a node, not a string: the home screen passes the wordmark component itself.
    title: <AppWordmark />,
  },
} satisfies Meta<typeof MenuLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The landing screen, as HomePage assembles it. */
export const Home: Story = {
  render: ({ title }) => <HomeMenu title={title} />,
};

/**
 * The game catalogue, as GameListPage assembles it below the `lg` breakpoint. Its title is locale
 * copy rather than the wordmark, so this story sets its own instead of taking the arg.
 */
export const GameList: Story = {
  render: () => <GameListMenu />,
};
