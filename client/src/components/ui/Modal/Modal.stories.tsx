import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

const meta = {
  title: 'Overlay & Feedback/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Title plus body copy. Opened and dismissed by real Buttons; the header close is Modal's own. */
function AboutDemo({ open: initialOpen }: { open: boolean }) {
  const { t } = useTranslation(['home', 'game-story']);
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button variant="secondary" icon="info" onClick={() => setOpen(true)}>
        {t('home:buttons.gameInfo')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('game-story:title')}
        closeLabel={t('home:join.close')}
      >
        <p className="story-body">{t('game-story:description')}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('home:join.close')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** The join-lobby dialog: the shipped form, built from the real Input and Buttons. */
function FormDemo({ open: initialOpen }: { open: boolean }) {
  const { t } = useTranslation('home');
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button variant="primary" icon="arrow right" onClick={() => setOpen(true)}>
        {t('buttons.join')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('join.title')}
        closeLabel={t('join.close')}
        // The only field is a short code, so the dialog is narrower than the default panel.
        className="w-[min(92vw,24rem)]"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
        >
          <Input
            size="lg"
            label={t('join.codeLabel')}
            placeholder={t('join.placeholder')}
            defaultValue="abcd"
            autoComplete="off"
            reserveErrorSpace
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t('join.cancel')}
            </Button>
            <Button type="submit" variant="primary" icon="arrow right">
              {t('join.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Mounts already open. Closes via the action Button, the backdrop, or the Escape key. */
function StartsOpenDemo({ open: initialOpen }: { open: boolean }) {
  const { t } = useTranslation(['home', 'common']);
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button variant="secondary" icon="info" onClick={() => setOpen(true)}>
        {t('home:buttons.gameInfo')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('common:app.pageTitle')}
        closeLabel={t('home:join.close')}
      >
        <p className="story-body">{t('common:app.tagline')}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('home:join.close')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export const TitleAndContent: Story = {
  args: { open: false },
  render: (args) => <AboutDemo open={args.open} />,
};

export const WithForm: Story = {
  args: { open: false },
  render: (args) => <FormDemo open={args.open} />,
};

export const StartsOpen: Story = {
  args: { open: true },
  render: (args) => <StartsOpenDemo open={args.open} />,
};
