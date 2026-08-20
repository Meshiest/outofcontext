import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RedactedResults } from './RedactedResults';
import type { RedactedChain } from './redactedUtils';

const chains: RedactedChain[] = [
  [{ data: { line: [{ type: 'punctuation', value: 'First story.' }] }, editors: ['p1', '', ''] }],
  [{ data: { line: [{ type: 'punctuation', value: 'Second story.' }] }, editors: ['p2', '', ''] }],
];

const baseProps = {
  chains,
  nameTable: { p1: 'Alice', p2: 'Bob' },
  onReact: vi.fn(),
  isDone: false,
  onToggleDone: vi.fn(),
};

describe('RedactedResults', () => {
  it('renders one card per chain', () => {
    render(<RedactedResults {...baseProps} playerState="READING" />);
    expect(screen.getByText('First story.')).toBeInTheDocument();
    expect(screen.getByText('Second story.')).toBeInTheDocument();
  });

  it('shows the Done Reading button while READING and fires like with the chain index', async () => {
    const onReact = vi.fn();
    const user = userEvent.setup();
    render(<RedactedResults {...baseProps} onReact={onReact} playerState="READING" />);

    expect(screen.getByRole('button', { name: /Done Reading/i })).toBeInTheDocument();

    // Every card carries the same reactions, so position picks the chain.
    await user.click(screen.getAllByRole('button', { name: 'Love it' })[1]);
    expect(onReact).toHaveBeenCalledWith(1, 'heart');
  });

  it('renders static like counts (no buttons) and no Done button for spectators', () => {
    render(<RedactedResults {...baseProps} playerState={null} />);
    expect(screen.queryByRole('button', { name: /Done Reading/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Love it' })).toBeNull();
  });
});
