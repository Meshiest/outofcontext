import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DRAWING_PALETTE } from '@/data/theme';
import { DrawingCanvas } from './DrawingCanvas';

const meta = {
  title: 'Widgets/Doodle/DrawingCanvas',
  component: DrawingCanvas,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DrawingCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  render: function DrawableCanvas() {
    const [color] = useState<string>(DRAWING_PALETTE[10]);
    return (
      <div className="w-[320px]">
        <DrawingCanvas color={color} strokeWidth={6} />
      </div>
    );
  },
};
