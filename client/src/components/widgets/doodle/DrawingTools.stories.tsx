import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { cn } from '@/components/lib/cn';
import { Card } from '@/components/ui/Card/Card';
import { DRAWING_PALETTE } from '@/data/theme';
import { LOBBY_COLUMN } from '@/pages/lobby/layout';
import { DrawingTools } from './DrawingTools';

const meta = {
  title: 'Widgets/Doodle/DrawingTools',
  component: DrawingTools,
  parameters: { layout: 'fullscreen' },
  args: {
    color: DRAWING_PALETTE[0],
    strokeWidth: 3,
    onColorChange: () => {},
    onStrokeWidthChange: () => {},
  },
} satisfies Meta<typeof DrawingTools>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToolsHarness() {
  const [color, setColor] = useState<string>(DRAWING_PALETTE[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  return (
    // The real Card, sized to what the tools actually occupy in each layout. Stacked under the
    // canvas they span the drawing column (LOBBY_COLUMN), which is what makes the swatches wrap the
    // way they do on a phone; from `lg` up DrawingTools becomes the pinned 96px rail beside the
    // canvas, so the frame shrinks to it (`lg:w-fit`) rather than stranding a short column of
    // swatches in a canvas-width box. `overflow-hidden` keeps the rail's divider inside the round.
    <Card className={cn('mx-auto overflow-hidden', LOBBY_COLUMN, 'lg:w-fit')}>
      <DrawingTools
        color={color}
        strokeWidth={strokeWidth}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
      />
    </Card>
  );
}

/**
 * Interactive palette + stroke picker. Resize past the `lg` breakpoint to see it flip from a row
 * (beneath the canvas) to a vertical column (beside it); Doodle's Desktop and Mobile stories show
 * each form in place.
 */
export const Interactive: Story = { render: () => <ToolsHarness /> };
