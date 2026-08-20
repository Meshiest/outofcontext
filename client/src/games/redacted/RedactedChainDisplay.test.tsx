import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RedactedChainDisplay } from './RedactedChainDisplay';
import type { RedactedChain } from './redactedUtils';

const nameTable = { p1: 'Alice', p2: 'Bob', p3: 'Carol' };

const chain: RedactedChain = [
  {
    data: { line: [{ type: 'punctuation', value: 'Once upon a time.' }] },
    editors: ['p1', 'p2', 'p3'],
  },
  {
    data: { line: [{ type: 'word', value: 'END' }] },
    editors: ['p1', 'p2', 'p3'],
  },
];

describe('RedactedChainDisplay', () => {
  it('renders every entry', () => {
    render(<RedactedChainDisplay entries={chain} nameTable={nameTable} anonymous={false} />);
    expect(screen.getByText('Once upon a time.')).toBeInTheDocument();
    expect(screen.getByText('END')).toBeInTheDocument();
  });

  it('shows the writer/tamperer/repairer attribution when not anonymous', () => {
    render(<RedactedChainDisplay entries={chain} nameTable={nameTable} anonymous={false} />);
    expect(screen.getAllByText(/Alice, Bob, Carol$/)).toHaveLength(2);
  });

  it('hides attribution when anonymous', () => {
    render(<RedactedChainDisplay entries={chain} nameTable={nameTable} anonymous />);
    expect(screen.queryByText(/Alice/)).toBeNull();
  });

  it('tolerates a degenerate string line without crashing', () => {
    const degenerate: RedactedChain = [{ data: { line: '' }, editors: ['', '', ''] }];
    const { container } = render(
      <RedactedChainDisplay entries={degenerate} nameTable={nameTable} anonymous={false} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('shows the repaired words in the finished story', () => {
    const { container } = render(
      <RedactedChainDisplay
        entries={[
          {
            data: {
              line: [
                { type: 'punctuation', value: 'the ' },
                { type: 'word', value: 'banana' },
                { type: 'punctuation', value: ' ran' },
              ],
            },
            editors: ['p1', 'p2', 'p3'],
          },
        ]}
        nameTable={{ p1: 'Ada', p2: 'Bo', p3: 'Cy' }}
        anonymous={false}
      />,
    );
    const bar = container.querySelector('.redacted')!;
    // Marked as a replacement rather than covered up - the reveal IS the payoff of the round.
    expect(bar).toHaveAttribute('data-revealed', 'true');
    expect(bar).toHaveTextContent('banana');
  });
});
