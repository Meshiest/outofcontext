import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { cn } from '@/components/lib/cn';
import { GAME_COLUMN_DESKTOP, LOBBY_COLUMN } from '@/pages/lobby/layout';
import { Doodle } from './Doodle';
import { makeSampleDrawing } from './sampleDrawing';

/**
 * The lobby's own game column, reused verbatim rather than approximated with a story-local width.
 *
 * Doodle has no width of its own - it fills whatever column it is dropped into - so a story that
 * invents a width documents a size the app never renders. `LOBBY_COLUMN` (360px) is what the
 * stacked lobby gives it on a phone and `GAME_COLUMN_DESKTOP` (760px) is the desktop cap; importing
 * both means these stories cannot drift when either constant moves.
 */
const GAME_COLUMN = cn('mx-auto', LOBBY_COLUMN, GAME_COLUMN_DESKTOP);

const meta = {
  title: 'Widgets/Doodle/Doodle',
  component: Doodle,
  // Fullscreen rather than centred: the story supplies the column and centres it with `mx-auto`, so
  // the widget gets the full page width to be capped against instead of Storybook shrink-wrapping
  // the specimen down to whatever the canvas happens to measure.
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className={GAME_COLUMN}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Doodle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The canvas as a desktop player sees it: the drawing column caps itself against the viewport
 * height and the colour palette stands beside it as a vertical rail.
 *
 * The viewport is pinned because that layout is a `lg` media query - it answers to the window, not
 * to the 760px column - so at Storybook's default width the story would show whichever form the
 * panel happened to trip rather than the desktop one it is named for.
 */
export const Desktop: Story = {
  args: { colors: true },
  globals: { viewport: { value: '1280-900' } },
};

/**
 * The same widget in the stacked lobby column on a phone: the canvas fills the column edge to edge
 * and the tools wrap into a row beneath it instead of standing beside it.
 */
export const Mobile: Story = {
  args: { colors: true },
  globals: { viewport: { value: '390-844' } },
};

/** Colours off (a game configured for plain black ink): no palette, no stroke slider. */
export const WithoutPalette: Story = {
  args: { colors: false },
};

/** A finished drawing, rounded the way the results chains frame one. */
export const ReadOnly: Story = {
  args: { readOnly: true, image: makeSampleDrawing(), author: 'Ada', className: 'rounded-lg' },
};

/** Timed turn: the countdown renders immediately and starts running on the first stroke. */
export const Timed: Story = {
  args: { colors: true, timer: 30 },
};

/** Done held disabled by the game (an invalid caption, say) even once something has been drawn. */
export const DoneDisabled: Story = {
  args: { colors: true, disabled: true },
};
