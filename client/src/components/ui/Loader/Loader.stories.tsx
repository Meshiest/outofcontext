import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { Loader, type LoaderProps } from './Loader';
import { Card, CardContent } from '../Card/Card';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';

const meta = {
  title: 'Overlay & Feedback/Loader',
  component: Loader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    inline: { control: 'boolean' },
    centered: { control: 'boolean' },
  },
  args: { size: 'md' },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Spinner with no caption: `label` is the accessible name screen readers announce. */
function SpinnerDemo(args: LoaderProps) {
  const { t } = useTranslation('lobby');
  return <Loader {...args} label={t('loading')} />;
}

export const Spinner: Story = {
  render: (args) => <SpinnerDemo {...args} />,
};

/** Caption text below the spinner replaces the accessible name. */
function WithTextDemo(args: LoaderProps) {
  const { t } = useTranslation('game-draw');
  return <Loader {...args}>{t('waiting')}</Loader>;
}

export const WithText: Story = {
  render: (args) => <WithTextDemo {...args} />,
};

function SizesDemo() {
  const { t } = useTranslation('lobby');
  return (
    <div className="flex items-end gap-8">
      <Loader size="sm" label={t('loading')} />
      <Loader size="md" label={t('loading')} />
      <Loader size="lg" label={t('loading')} />
      <Loader size="xl" label={t('loading')} />
    </div>
  );
}

export const Sizes: Story = {
  render: () => <SizesDemo />,
};

/** Inline and centred inside a real Card, the surface it usually sits on. */
function InlineCenteredDemo(args: LoaderProps) {
  const { t } = useTranslation('common');
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Loader {...args}>{t('connection.reconnecting')}</Loader>
      </CardContent>
    </Card>
  );
}

export const InlineCentered: Story = {
  args: { inline: true, centered: true },
  render: (args) => <InlineCenteredDemo {...args} />,
};

/**
 * A form waiting on the server: the busy overlay is the real Loader, so the spinner matches
 * every other loading state in the app instead of being a one-off icon.
 */
function FormLoadingDemo() {
  const { t } = useTranslation(['home', 'lobby']);
  return (
    <Card className="w-80">
      <CardContent className="relative p-6">
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <Input
            label={t('home:join.codeLabel')}
            placeholder={t('home:join.placeholder')}
            defaultValue="abcd"
            autoComplete="off"
            disabled
          />
          <Button type="submit" variant="primary" icon="arrow right" disabled>
            {t('home:join.submit')}
          </Button>
        </form>
        <Loader
          size="lg"
          label={t('lobby:loading')}
          className="absolute inset-0 justify-center rounded-lg bg-bg/60"
        />
      </CardContent>
    </Card>
  );
}

export const FormLoading: Story = {
  render: () => <FormLoadingDemo />,
};
