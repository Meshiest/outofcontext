import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import { GameInfoCard } from './GameInfoCard';

// The real shape and the real copy: the card reads every string from the `game-story` namespace, so
// a hand-written fixture would render a card of blanks.
const sampleMeta: GameMeta = GAMES.story;

const meta = {
  title: 'Pages/GameInfoCard',
  component: GameInfoCard,
  parameters: { layout: 'centered' },
  args: { gameKey: 'story', meta: sampleMeta },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameInfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  // Open every accordion section so the expanded state is captured statically.
  play: ({ canvasElement }) => {
    canvasElement
      .querySelectorAll<HTMLButtonElement>('[data-accordion-header]')
      .forEach((button) => button.click());
  },
};
