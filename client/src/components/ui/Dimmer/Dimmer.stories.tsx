import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { Dimmer, type DimmerProps } from './Dimmer';
import { Loader } from '../Loader/Loader';
import { Card, CardContent } from '../Card/Card';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';

const meta = {
  title: 'Overlay & Feedback/Dimmer',
  component: Dimmer,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Dimmer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Page copy underneath the overlay, so the scrim has something to dim. */
function PageBehind() {
  const { t } = useTranslation('common');
  return <p className="p-4">{t('app.tagline')}</p>;
}

/** The most common use: a Loader centred in the scrim while the player waits. */
function LoaderOverlay(args: DimmerProps) {
  const { t } = useTranslation(['lobby', 'game-draw']);
  return (
    <div className="relative h-64">
      <PageBehind />
      <Dimmer {...args}>
        <Loader size="xl" label={t('lobby:loading')}>
          {t('game-draw:waiting')}
        </Loader>
      </Dimmer>
    </div>
  );
}

export const WithLoader: Story = {
  args: { active: true },
  render: (args) => <LoaderOverlay {...args} />,
};

/** The overlay hosts arbitrary content: here the join-lobby form on a real Card. */
function FormOverlay(args: DimmerProps) {
  const { t } = useTranslation('home');
  return (
    <div className="relative h-64">
      <PageBehind />
      <Dimmer {...args}>
        <Card className="w-72">
          <CardContent className="p-6">
            <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <Input
                label={t('join.codeLabel')}
                placeholder={t('join.placeholder')}
                defaultValue="abcd"
                autoComplete="off"
              />
              <Button type="submit" variant="primary" icon="arrow right">
                {t('join.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Dimmer>
    </div>
  );
}

export const WithFormContent: Story = {
  args: { active: true },
  render: (args) => <FormOverlay {...args} />,
};

/**
 * Dismissible overlay, modelled on the connection overlay: the button raises it, and the
 * button inside it (or the Escape key, via onClose) takes it back down.
 */
function ToggleableDemo() {
  const { t } = useTranslation('common');
  const [active, setActive] = useState(false);
  return (
    <div className="relative h-64">
      <Button className="m-4" variant="secondary" icon="undo" onClick={() => setActive(true)}>
        {t('connection.reconnect')}
      </Button>
      <Dimmer active={active} onClose={() => setActive(false)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader size="lg" label={t('connection.lost')}>
            {t('connection.reconnecting')}
          </Loader>
          <Button variant="primary" icon="undo" onClick={() => setActive(false)}>
            {t('connection.refresh')}
          </Button>
        </div>
      </Dimmer>
    </div>
  );
}

export const Toggleable: Story = {
  args: { active: false },
  render: () => <ToggleableDemo />,
};
