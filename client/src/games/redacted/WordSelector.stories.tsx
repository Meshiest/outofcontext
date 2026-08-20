import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { WordSelector } from './WordSelector';
import { COST, wordify, maxCensor } from './redactedUtils';

// Framed at the real game-column measure (see storybookFrames). Width is the whole story for this
// component: how the word targets wrap is what the player is clicking through.
const meta = {
  title: 'Games/Redacted/WordSelector',
  component: WordSelector,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { words: [], selectedIndexes: [], maxSelectable: 0, onToggle: () => {} },
} satisfies Meta<typeof WordSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const line = 'The quick brown fox jumps over the lazy dog';
const ink = 25;

function InteractiveWordSelector() {
  const { words, count } = wordify(line, ink, COST.censor);
  const max = maxCensor(count, ink);
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (index: number) =>
    setSelected((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : prev.length < max
          ? [...prev, index]
          : prev,
    );
  return (
    <WordSelector words={words} selectedIndexes={selected} maxSelectable={max} onToggle={toggle} />
  );
}

/** Click words to black them out; the budget stops you once ink runs low. */
export const Interactive: Story = { render: () => <InteractiveWordSelector /> };

/** The same selector at the phone measure, where the line wraps across several rows of targets. */
export const Mobile: Story = {
  render: () => <InteractiveWordSelector />,
  decorators: [mobileGameColumn],
};
