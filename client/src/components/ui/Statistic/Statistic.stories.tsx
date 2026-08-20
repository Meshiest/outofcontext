import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import { Card } from '@/components/ui/Card/Card';
import { configCopy } from '@/lib/gameCopy';
import { configValue, deriveConfigText } from '@/pages/lobby/configUtils';
import { Statistic, StatisticLabel, StatisticValue } from './Statistic';

const meta = {
  title: 'Data Display/Statistic',
  component: Statistic,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The three states `components/widgets/Timer` renders: raw seconds with a pluralized unit under a
 * minute, M:SS with "remaining" above it, and a clamped zero once the turn is over. Every one is a
 * tabular-nums Statistic in a polite live region, so the value can tick without the digits jittering
 * or the announcement interrupting.
 */
function TimerStats() {
  const { t } = useTranslation('common');

  return (
    <div className="flex gap-10">
      <Statistic className="tabular-nums" aria-live="polite">
        <StatisticValue>30</StatisticValue>
        <StatisticLabel>{t('timer.second', { count: 30 })}</StatisticLabel>
      </Statistic>
      <Statistic className="tabular-nums" aria-live="polite">
        <StatisticValue>1:30</StatisticValue>
        <StatisticLabel>{t('timer.remaining')}</StatisticLabel>
      </Statistic>
      <Statistic className="tabular-nums" aria-live="polite">
        <StatisticValue>0</StatisticValue>
        <StatisticLabel>{t('timer.expired')}</StatisticLabel>
      </Statistic>
    </div>
  );
}

/**
 * What non-admins see in `pages/lobby/GameConfigPanel`: the lobby's settings as a wrapping row of
 * stats inside a Card, one per config field of the selected game. Values run through the same
 * `configValue`/`deriveConfigText` helpers the panel uses (so `#numPlayers` resolves against the
 * player count and a bool reads Yes/No), and labels are the game's `config.<field>.text` copy.
 */
function GameConfigStats() {
  const { t, i18n } = useTranslation('lobby');
  const gameMeta: GameMeta = GAMES.story;
  const labels = { yes: t('config.yes'), no: t('config.no'), unknown: t('config.unknown') };
  // A lobby that has overridden two fields; the rest fall back to the game's defaults.
  const config: Record<string, unknown> = { numLinks: 8, anonymous: 'true' };
  const playerCount = 6;

  return (
    <Card>
      <div className="flex flex-row flex-wrap items-center justify-center gap-4 p-4">
        {Object.entries(gameMeta.config).map(([name, cfg]) => (
          <Statistic key={name}>
            <StatisticValue>
              {deriveConfigText(
                cfg,
                configValue(config, cfg, name),
                playerCount,
                labels,
                (option) => configCopy(i18n, 'story', `${name}.options.${option}`) || null,
              )}
            </StatisticValue>
            <StatisticLabel>{configCopy(i18n, 'story', `${name}.text`)}</StatisticLabel>
          </Statistic>
        ))}
      </div>
    </Card>
  );
}

/** Countdown display, as the Timer widget composes it. */
export const TurnTimer: Story = {
  render: () => <TimerStats />,
};

/** Read-only lobby config, as GameConfigPanel composes it for non-admins. */
export const GameConfigSummary: Story = {
  parameters: { layout: 'padded' },
  render: () => <GameConfigStats />,
};
