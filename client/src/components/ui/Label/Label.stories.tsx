import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardMeta } from '@/components/ui/Card/Card';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: { layout: 'centered' },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'positive', 'negative', 'warning', 'info', 'neutral'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    attached: {
      control: 'select',
      options: [undefined, 'top left', 'top right', 'bottom left', 'bottom right'],
    },
  },
  args: { children: 'Admin', color: 'primary', size: 'md' },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Label color="primary">Primary</Label>
      <Label color="positive">Ready</Label>
      <Label color="negative">Offline</Label>
      <Label color="warning">Waiting</Label>
      <Label color="info">Info</Label>
      <Label color="neutral">Neutral</Label>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Label size="sm">Small</Label>
      <Label size="md">Medium</Label>
      <Label size="lg">Large</Label>
    </div>
  ),
};

export const WithIcon: Story = { args: { icon: 'shield', children: 'Admin', color: 'positive' } };

/**
 * The attached variant is designed to sit in the corner of a panel, so the specimen uses the real
 * Card rather than a stand-in box.
 */
export const Attached: Story = {
  render: function AttachedLabel() {
    const { t } = useTranslation(['common', 'game-story']);
    return (
      // `relative` is the positioning context the attached variant needs; Card does not set it
      // itself, so the caller adds it.
      <Card className="relative w-80">
        {/* The attached variant only rounds its INNER corner (bottom-left here) and squares the
            rest, which is right against a square container but leaves a square outer corner
            poking past the Card's own rounded-lg one. Matching the container radius is the
            caller's job, so it stays a story-level class rather than a change to Label. */}
        <Label color="positive" icon="shield" attached="top right" className="rounded-tr-lg">
          {t('common:playerList.iconAdmin')}
        </Label>
        <CardContent>
          <CardHeader>{t('game-story:title')}</CardHeader>
          <CardMeta>{t('game-story:subtitle')}</CardMeta>
        </CardContent>
      </Card>
    );
  },
};
