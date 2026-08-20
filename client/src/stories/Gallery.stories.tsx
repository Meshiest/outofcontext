import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Label } from '@/components/ui/Label/Label';
import { Divider } from '@/components/ui/Divider/Divider';
import { AppWordmark } from '@/components/widgets/AppWordmark';
// Real copy, straight from the locale the app ships - a specimen showing invented wording
// documents a product that does not exist.
import storyCopy from '@/locales/en/game-story.json';
import redactedCopy from '@/locales/en/game-redacted.json';
import {
  Card,
  CardHeader,
  CardContent,
  CardMeta,
  CardDescription,
  CardExtra,
} from '@/components/ui/Card/Card';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { Message } from '@/components/ui/Message/Message';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { Slider } from '@/components/ui/Slider/Slider';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@/components/ui/Table/Table';
import { Progress } from '@/components/ui/Progress/Progress';
import { Statistic, StatisticValue, StatisticLabel } from '@/components/ui/Statistic/Statistic';
import { Loader } from '@/components/ui/Loader/Loader';
import { Accordion, AccordionItem } from '@/components/ui/Accordion/Accordion';
import { Modal } from '@/components/ui/Modal/Modal';

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="font-display text-2xl text-text">{label}</div>
      <div className="surface-raised flex flex-col gap-4 rounded-lg p-5">{children}</div>
    </section>
  );
}

function Wordmark() {
  const { t } = useTranslation('home');
  const subtitle = t('subtitle');
  return (
    <div className="flex flex-col gap-1">
      {/* The real component, not a copy of it - a specimen that can drift is worse than none. */}
      <div className="font-display text-6xl leading-none">
        <AppWordmark />
      </div>
      <div className="font-display text-xl italic text-text-muted">{subtitle}</div>
    </div>
  );
}

function GalleryView() {
  // Every namespace this specimen borrows copy from - the typed `t` only accepts `ns:key` for
  // namespaces it was created with.
  const { t } = useTranslation([
    'common',
    'home',
    'lobby',
    'settings',
    'errors',
    'gameList',
    'game-common',
    'game-story',
    'game-assassin',
  ]);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header className="flex items-end justify-between gap-8">
        <Wordmark />
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Cell label="Buttons">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="primary">{t('home:buttons.create')}</Button>
            <Button variant="positive" icon="play circle">
              {t('lobby:buttons.startGame')}
            </Button>
            <Button variant="negative" icon="times">
              {t('common:playerList.leave')}
            </Button>
            <Button variant="secondary">{t('common:playerList.spectate')}</Button>
            <Button variant="basic" icon="undo">
              {t('common:doodle.undo')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button loading>{t('lobby:buttons.create')}</Button>
            <Button disabled icon="check">
              {t('common:doodle.done')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button rounded="none">Square</Button>
            <Button rounded="sm">Less round</Button>
            <Button rounded="md">Default</Button>
            <Button rounded="full">Pill</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button iconButton variant="secondary" icon="times" aria-label="Close" />
            <Button iconButton variant="positive" icon="check" aria-label="Confirm" />
            <Button iconButton rounded="full" icon="plus" aria-label="Add" />
            <Button
              iconButton
              rounded="full"
              variant="secondary"
              icon="gear"
              aria-label="Settings"
            />
          </div>
        </Cell>

        <Cell label="Badges, labels & dividers">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge>New</Badge>
            <Badge variant="success">Ready</Badge>
            <Badge variant="warning">Reconnecting</Badge>
            <Badge variant="error">Dropped</Badge>
            <Badge variant="info">Spectator</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Label color="primary">admin</Label>
            <Label color="positive">ready</Label>
            <Label color="warning">typing</Label>
            <Label color="neutral">config</Label>
          </div>
          <Divider>or</Divider>
        </Cell>

        <Cell label="Inputs & controls">
          <Input
            label={t('lobby:nameEntry.label')}
            placeholder={t('lobby:nameEntry.placeholder')}
          />
          <Textarea placeholder={t('game-story:writeFirstLine')} rows={3} />
          <Select
            label={t('game-story:config.contextLen.name')}
            options={Object.entries(
              storyCopy.config.contextLen.options as Record<string, string>,
            ).map(([value, text]) => ({ text, value }))}
            defaultValue="regular"
          />
          <Slider
            label={t('settings:soundVolume.label')}
            min={0}
            max={100}
            step={5}
            defaultValue={70}
            showValue
          />
          <div className="flex flex-col gap-2">
            <Checkbox label={t('settings:darkMode.label')} defaultChecked />
            <Checkbox label={t('settings:streamerMode.label')} />
          </div>
        </Cell>

        <Cell label="Feedback">
          <Message
            variant="warning"
            header={t('errors:NAME_TAKEN')}
            content={t('lobby:nameEntry.subtitle')}
          />
          <Progress percent={62} label="5 / 8" />
          <div className="flex items-center gap-6">
            <Loader size="sm" />
            <Loader>{t('game-common:loading')}</Loader>
          </div>
          <Accordion styled>
            <AccordionItem title={t('gameList:sections.moreInfo')} defaultOpen>
              <p className="story-body text-[17px]">{redactedCopy.more}</p>
            </AccordionItem>
            <AccordionItem title={t('gameList:sections.howTo')}>
              <ol className="m-0 list-decimal space-y-1 pl-5">
                {redactedCopy.howTo.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </AccordionItem>
          </Accordion>
        </Cell>

        <Cell label="Data">
          {/* Wurderer's battle-royale dossier: player + kill words, no score - nothing in this app
              keeps one. Words are Labels because that is exactly how Dossier renders them. */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('game-assassin:tablePlayer')}</TableHeaderCell>
                <TableHeaderCell>{t('game-assassin:tableKillWords')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['Marguerite', ['pineapple', 'obviously']],
                ['You', ['anyway', 'frankly']],
                ['Dev', ['whatever', 'honestly']],
              ].map(([who, words], i) => (
                <TableRow key={who as string} marked={i === 1}>
                  <TableCell>{who as string}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(words as string[]).map((w) => (
                        <Label key={w}>{w}</Label>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center gap-8">
            <Statistic>
              <StatisticValue>VRTQ</StatisticValue>
              <StatisticLabel>{t('lobby:badges.lobbyCode')}</StatisticLabel>
            </Statistic>
            <Statistic>
              <StatisticValue>6</StatisticValue>
              <StatisticLabel>{storyCopy.config.players.text}</StatisticLabel>
            </Statistic>
          </div>
        </Cell>

        <Cell label="Cards & lobby code">
          <Card>
            <CardContent>
              <CardHeader>{storyCopy.title}</CardHeader>
              <CardMeta>{storyCopy.subtitle}</CardMeta>
              <CardDescription>{storyCopy.description}</CardDescription>
            </CardContent>
            <CardExtra>{storyCopy.playTime}</CardExtra>
          </Card>
          <div className="flex gap-2.5">
            {['V', 'R', 'T', 'Q'].map((c, i) => (
              <span key={i} className="keycap h-16 w-12 text-3xl">
                {c}
              </span>
            ))}
          </div>
        </Cell>

        <Cell label="Overlays">
          <div className="flex items-center gap-3">
            <Header as="h3">{t('common:playerList.endGame')}</Header>
          </div>
          <HeaderSubheader>{t('lobby:sections.gameInfo')}</HeaderSubheader>
          <div>
            <Button variant="negative" onClick={() => setModalOpen(true)}>
              {t('common:playerList.endGame')}
            </Button>
          </div>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={t('common:playerList.confirmEndGame')}
            closeLabel={t('common:playerList.leave')}
          >
            <p className="text-text-muted">{storyCopy.description}</p>
            <div className="mt-4 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                {t('game-common:stillReading')}
              </Button>
              <Button variant="negative" onClick={() => setModalOpen(false)}>
                {t('common:playerList.endGame')}
              </Button>
            </div>
          </Modal>
        </Cell>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Gallery',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

/** Every component at a glance, on the theme's paper ground. Flip light/dark in the toolbar. */
export const AllComponents: Story = {
  render: () => <GalleryView />,
};
