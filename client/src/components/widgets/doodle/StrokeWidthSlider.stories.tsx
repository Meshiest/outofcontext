import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StrokeWidthSlider } from './StrokeWidthSlider';

const meta = {
  title: 'Widgets/Doodle/StrokeWidthSlider',
  component: StrokeWidthSlider,
  parameters: { layout: 'centered' },
  args: { value: 3, onChange: () => {} },
} satisfies Meta<typeof StrokeWidthSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function InteractiveSlider() {
    const [width, setWidth] = useState(3);
    return <StrokeWidthSlider value={width} onChange={setWidth} aria-label="Stroke width" />;
  },
};
