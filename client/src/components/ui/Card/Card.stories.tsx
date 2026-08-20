import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardHeader, CardMeta, CardDescription, CardExtra } from './Card';
import { Icon } from '@/components/ui/Icon/Icon';

const meta = {
  title: 'Layout/Card',
  component: Card,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <CardDescription>A plain card with a single content region.</CardDescription>
      </CardContent>
    </Card>
  ),
};

export const WithAllParts: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <CardHeader>Raconteur</CardHeader>
        <CardMeta>Write story lines with limited context</CardMeta>
        <CardDescription>
          Each player writes a line seeing only the last, building a chaotic collaborative story.
        </CardDescription>
      </CardContent>
    </Card>
  ),
};

export const WithExtra: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <CardHeader>Redacted</CardHeader>
        <CardMeta>Write, tamper, repair</CardMeta>
      </CardContent>
      <CardExtra className="flex items-center gap-2">
        <Icon name="clock" />
        5-10 min
      </CardExtra>
    </Card>
  ),
};

export const GameInfoCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <CardHeader>Hodgepodge</CardHeader>
        <CardMeta>Collaborative recipe with ITEM placeholders</CardMeta>
        <CardDescription>
          Players contribute steps to a shared recipe, filling in mystery ingredients along the way.
        </CardDescription>
      </CardContent>
      <CardContent extra className="flex items-center gap-2">
        <Icon name="clock" />
        2-256 players
      </CardContent>
    </Card>
  ),
};
