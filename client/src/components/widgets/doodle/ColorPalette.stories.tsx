import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DRAWING_PALETTE } from '@/data/theme';
import { ColorPalette } from './ColorPalette';

const meta = {
  title: 'Widgets/Doodle/ColorPalette',
  component: ColorPalette,
  parameters: { layout: 'centered' },
  args: { selected: DRAWING_PALETTE[4], onSelect: () => {} },
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function InteractivePalette() {
    const [selected, setSelected] = useState<string>(DRAWING_PALETTE[4]);
    return (
      <div className="w-60">
        <ColorPalette selected={selected} onSelect={setSelected} />
      </div>
    );
  },
};
