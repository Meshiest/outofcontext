import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RedactedLine } from './RedactedLine';
import type { RedactedLineSegment } from './redactedUtils';

const segments: RedactedLineSegment[] = [
  { type: 'punctuation', value: 'The ' },
  { type: 'word', value: 'secret' },
  { type: 'punctuation', value: ' is out.' },
];

describe('RedactedLine', () => {
  it('renders one element per segment', () => {
    const { container } = render(<RedactedLine segments={segments} />);
    expect(container.querySelectorAll('span')).toHaveLength(3);
  });

  it('applies the .redacted class only to word segments', () => {
    const { container } = render(<RedactedLine segments={segments} />);
    const codes = Array.from(container.querySelectorAll('span'));
    const redacted = codes.filter((c) => c.classList.contains('redacted'));
    expect(redacted).toHaveLength(1);
    expect(redacted[0]).toHaveTextContent('secret');
  });

  it('treats count segments as redacted and string segments as plain', () => {
    const { container } = render(
      <RedactedLine
        segments={[
          { type: 'string', value: 'plain' },
          { type: 'count', value: 3 },
        ]}
      />,
    );
    const codes = Array.from(container.querySelectorAll('span'));
    expect(codes[0].classList.contains('redacted')).toBe(false);
    expect(codes[1].classList.contains('redacted')).toBe(true);
  });

  it('hides the bars by default, which is the game', () => {
    const { container } = render(<RedactedLine segments={[{ type: 'word', value: 'secret' }]} />);
    const bar = container.querySelector('.redacted')!;
    expect(bar).not.toHaveAttribute('data-revealed');
  });

  it('reveals them when asked, so the end of the game can be read', () => {
    // The server sends a repaired word as a `word` segment precisely so it can be pointed out as a
    // replacement. Leaving it under ink at the end meant nobody found out what the story became.
    const { container } = render(
      <RedactedLine revealed segments={[{ type: 'word', value: 'secret' }]} />,
    );
    const bar = container.querySelector('.redacted')!;
    expect(bar).toHaveAttribute('data-revealed', 'true');
    expect(bar).toHaveTextContent('secret');
  });

  it('leaves plain segments alone either way', () => {
    const { container } = render(
      <RedactedLine revealed segments={[{ type: 'punctuation', value: 'hello ' }]} />,
    );
    expect(container.querySelector('.redacted')).toBeNull();
  });
});
