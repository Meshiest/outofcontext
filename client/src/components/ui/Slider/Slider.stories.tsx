import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTranslation } from 'react-i18next';
import { StrokeWidthSlider } from '@/components/widgets/doodle/StrokeWidthSlider';
import { STROKE_MIN } from '@shared/drawing';
import { Slider } from './Slider';

const meta = {
  title: 'Form/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bare track: no label row, uncontrolled from `defaultValue`. */
export const Basic: Story = {
  args: { defaultValue: 40 },
};

/**
 * Notification volume, the app's own Slider usage (widgets/SoundVolumeSlider.tsx): 0-100 in steps
 * of 5, controlled. The settings panel renders its own value row so it can say "45%" and "Muted";
 * `showValue` is the plain built-in version of that.
 */
export const SoundVolume: Story = {
  render: function SoundVolumeStory() {
    const { t } = useTranslation('settings');
    const [percent, setPercent] = useState(45);
    return (
      <Slider
        label={t('soundVolume.label')}
        min={0}
        max={100}
        step={5}
        showValue
        value={percent}
        onChange={(event) => setPercent(Number(event.target.value))}
      />
    );
  },
};

/**
 * Brush thickness is NOT this component: the drawing tools ship StrokeWidthSlider
 * (widgets/doodle/StrokeWidthSlider.tsx), a native range hidden over five growing dots. Shown here
 * next to the plain Slider so the two are not confused for each other.
 */
export const StrokeWidth: Story = {
  name: 'Stroke width (drawing tools)',
  render: function StrokeWidthStory() {
    const { t } = useTranslation('common');
    const [width, setWidth] = useState(STROKE_MIN);
    return (
      <StrokeWidthSlider value={width} onChange={setWidth} aria-label={t('doodle.strokeWidth')} />
    );
  },
};
