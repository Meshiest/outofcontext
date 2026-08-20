import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { TruncateSelector } from './TruncateSelector';
import { COST, wordify, maxTruncate } from './redactedUtils';

// Framed at the real game-column measure (see storybookFrames). Width is the whole story for this
// component: "redact from here to the end" reads very differently once the line wraps.
const meta = {
  title: 'Games/Redacted/TruncateSelector',
  component: TruncateSelector,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: { words: [], truncateCount: 0, maxTruncatable: 0, onSelect: () => {} },
} satisfies Meta<typeof TruncateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const line = 'The quick brown fox jumps over the lazy dog';
const ink = 25;

function InteractiveTruncateSelector() {
  const { words, count } = wordify(line, ink, COST.truncate);
  const max = maxTruncate(count, ink);
  const [truncateCount, setTruncateCount] = useState(0);
  return (
    <TruncateSelector
      words={words}
      truncateCount={truncateCount}
      maxTruncatable={max}
      onSelect={(c) => setTruncateCount((prev) => (prev === c ? 0 : c))}
    />
  );
}

/** Only the latter half of the line is clickable; clicking redacts to the end. */
export const Interactive: Story = { render: () => <InteractiveTruncateSelector /> };

/** The same selector at the phone measure, where the truncated tail spans multiple rows. */
export const Mobile: Story = {
  render: () => <InteractiveTruncateSelector />,
  decorators: [mobileGameColumn],
};
