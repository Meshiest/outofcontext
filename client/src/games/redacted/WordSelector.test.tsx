import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WordSelector } from './WordSelector';
import type { WordSegment } from './redactedUtils';

const words: WordSegment[] = [
  { type: 'word', index: 0, value: 'alpha', available: false },
  { type: 'punctuation', index: 0, value: ' ', available: false },
  { type: 'word', index: 1, value: 'beta', available: false },
];

describe('WordSelector', () => {
  it('renders only words as clickable buttons (punctuation is inert)', () => {
    render(
      <WordSelector words={words} selectedIndexes={[]} maxSelectable={2} onToggle={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('toggles a word on click', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <WordSelector words={words} selectedIndexes={[]} maxSelectable={2} onToggle={onToggle} />,
    );
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('does not add beyond the max, but still allows deselecting a selected word', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <WordSelector words={words} selectedIndexes={[0]} maxSelectable={1} onToggle={onToggle} />,
    );

    // beta is unselected and the budget is full -> clicking it must not toggle
    await user.click(screen.getByRole('button', { name: /beta/i }));
    expect(onToggle).not.toHaveBeenCalled();

    // alpha is already selected -> clicking it removes it
    await user.click(screen.getByRole('button', { name: /alpha/i }));
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('shows the redacting count', () => {
    render(
      <WordSelector words={words} selectedIndexes={[0]} maxSelectable={2} onToggle={vi.fn()} />,
    );
    expect(screen.getByText(/Redacting 1\/2 words/)).toBeInTheDocument();
  });

  it('keeps a word the same width whether or not it is censored', () => {
    // Padding from `.redacted` alone would widen a censored word and shove the rest of the line
    // along under the cursor.
    const { container, rerender } = render(
      <WordSelector words={words} selectedIndexes={[]} maxSelectable={2} onToggle={vi.fn()} />,
    );
    const before = container.querySelectorAll('[role="button"]')[0].className;
    rerender(
      <WordSelector words={words} selectedIndexes={[0]} maxSelectable={2} onToggle={vi.fn()} />,
    );
    const after = container.querySelectorAll('[role="button"]')[0].className;
    expect(before).toContain('px-[0.12em]');
    expect(after).toContain('px-[0.12em]');
  });

  it('renders the line in the editorial serif, like every other story text', () => {
    const { container } = render(
      <WordSelector words={words} selectedIndexes={[]} maxSelectable={2} onToggle={vi.fn()} />,
    );
    expect(container.querySelector('.story-body')).toBeInTheDocument();
    // No <code>: this is prose being tampered with, and the element forced a monospace face.
    expect(container.querySelector('code')).toBeNull();
  });
});
