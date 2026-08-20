import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { Button } from '@/components/ui/Button/Button';
import { Header } from '@/components/ui/Header/Header';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { Dossier } from './Dossier';

// AssassinGame is provider/hook-driven (useGame + useLobbyInfo), so it cannot mount in isolation in
// Storybook without the live subscriptions. These stories reproduce its two visible states from the
// same building blocks so the visuals can be reviewed; the wiring/behavior is covered by
// AssassinGame.test.tsx.

/** READING: the dossier plus the "Done" button that finishes intel-gathering. */
function ReadingState() {
  const { t } = useTranslation('game-assassin');
  return (
    <div className="space-y-4">
      <Dossier
        title="crimson wolf"
        battleRoyale={false}
        target={{ name: 'Bob', words: ['banana', 'trombone', 'velvet'] }}
      />
      <Button variant="primary">{t('done')}</Button>
    </div>
  );
}

/** DONE: the "free to Wurder" message and a "Show Dossier" button to re-open the briefing. */
function DoneState() {
  const { t } = useTranslation('game-assassin');
  return (
    <div className="space-y-4">
      <Header className="font-mono font-normal leading-snug">{t('freeToWurder')}</Header>
      <Button variant="basic">{t('showDossier')}</Button>
    </div>
  );
}

// Framed at the real game-column measure (see storybookFrames): the stories below are the 760px
// desktop column, and Mobile is the reading state at the 375px phone column.
const meta = {
  title: 'Games/Assassin/AssassinGame',
  component: ReadingState,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof ReadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reading: Story = { render: () => <ReadingState /> };

export const Done: Story = { render: () => <DoneState /> };

/** The reading state at the phone measure, where the kill words wrap under the target. */
export const Mobile: Story = {
  render: () => <ReadingState />,
  decorators: [mobileGameColumn],
};
