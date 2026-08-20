import '@/i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TruncateSelector } from './TruncateSelector';
import type { WordSegment } from './redactedUtils';

// 4 words (a b c d); only the latter half (c, d) is available.
const words: WordSegment[] = [
  { type: 'word', index: 0, value: 'a', available: false },
  { type: 'punctuation', index: 0, value: ' ', available: false },
  { type: 'word', index: 1, value: 'b', available: false },
  { type: 'punctuation', index: 1, value: ' ', available: false },
  { type: 'word', index: 2, value: 'c', available: true },
  { type: 'punctuation', index: 2, value: ' ', available: false },
  { type: 'word', index: 3, value: 'd', available: true },
];

describe('TruncateSelector', () => {
  it('makes only the latter-half (available) words clickable', () => {
    render(
      <TruncateSelector words={words} truncateCount={0} maxTruncatable={2} onSelect={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('sets the truncate count to (wordCount - index) on click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <TruncateSelector words={words} truncateCount={0} maxTruncatable={2} onSelect={onSelect} />,
    );
    await user.click(screen.getByRole('button', { name: /from: c$/i }));
    expect(onSelect).toHaveBeenCalledWith(2); // 4 words - index 2
  });

  it('shows the redacting count', () => {
    render(
      <TruncateSelector words={words} truncateCount={2} maxTruncatable={2} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Redacting 2\/2 words/)).toBeInTheDocument();
  });

  it('covers the truncated tail with ONE bar, spaces included', () => {
    const { container } = render(
      <TruncateSelector words={words} truncateCount={2} maxTruncatable={2} onSelect={vi.fn()} />,
    );
    // One redaction element, not one per word: separate bars leave the spaces between them
    // uncovered and read as a row of blocks rather than a single strike-through.
    const bars = container.querySelectorAll('.redacted');
    expect(bars).toHaveLength(1);
    // ...and the words are inside it rather than beside it, so they stay clickable.
    expect(bars[0].querySelectorAll('[role="button"]').length).toBeGreaterThan(0);
  });

  it('draws no bar at all when nothing is truncated', () => {
    const { container } = render(
      <TruncateSelector words={words} truncateCount={0} maxTruncatable={2} onSelect={vi.fn()} />,
    );
    expect(container.querySelectorAll('.redacted')).toHaveLength(0);
  });

  it('still reports a click on an already-covered word, to move the cut earlier', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <TruncateSelector words={words} truncateCount={2} maxTruncatable={2} onSelect={onSelect} />,
    );
    const inBar = container.querySelector('.redacted [role="button"]') as HTMLElement;
    fireEvent.click(inBar);
    expect(onSelect).toHaveBeenCalled();
  });
});
