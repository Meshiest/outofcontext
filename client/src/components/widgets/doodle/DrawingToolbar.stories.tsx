import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { cn } from '@/components/lib/cn';
import { Card } from '@/components/ui/Card/Card';
import { GAME_COLUMN_DESKTOP, LOBBY_COLUMN } from '@/pages/lobby/layout';
import { DrawingToolbar } from './DrawingToolbar';

const meta = {
  title: 'Widgets/Doodle/DrawingToolbar',
  component: DrawingToolbar,
  parameters: { layout: 'fullscreen' },
  args: {
    strokeCount: 2,
    onUndo: () => {},
    onRedo: () => {},
    onDone: () => {},
  },
  decorators: [
    // The real Card the toolbar lives in, at the width it actually gets. The toolbar spans the
    // whole Doodle card - which is the lobby's game column, not the narrower height-capped canvas -
    // so Undo/Redo and Done sit as far apart here as they do in a game.
    (Story) => (
      <Card className={cn('mx-auto', LOBBY_COLUMN, GAME_COLUMN_DESKTOP)}>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof DrawingToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Something has been drawn: both actions are available. */
export const Default: Story = {};

/** Nothing drawn yet - Undo and Done are both disabled. */
export const NothingDrawn: Story = { args: { strokeCount: 0 } };

/** The turn timer expired: the canvas is locked, so Undo is disabled but Done still submits. */
export const Locked: Story = { args: { strokeCount: 3, isReadOnly: true } };

/** A stroke has been undone, so it can be put back. */
export const Redoable: Story = { args: { strokeCount: 1, redoCount: 2 } };
