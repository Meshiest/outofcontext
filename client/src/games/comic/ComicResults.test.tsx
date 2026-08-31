import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComicResults } from './ComicResults';
import type { ComicChain } from './types';

/** Any PNG data URL: these tests only check it reaches the component. */
const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const chains: ComicChain[] = [
  [{ link: { drawing: IMAGE, caption: 'one' }, editor: 'p1' }],
  [{ link: { drawing: IMAGE, caption: 'two' }, editor: 'p2' }],
];

const baseProps = {
  chains,
  continuous: false,
  enableCaptions: true,
  nameTable: { p1: 'Alice', p2: 'Bob' },
  onReact: vi.fn(),
  isDone: false,
  onToggleDone: vi.fn(),
};

describe('ComicResults', () => {
  it('renders the Sequences title, one card per chain, and a Done Reading button while reading', () => {
    render(<ComicResults {...baseProps} playerState="READING" onReact={vi.fn()} />);
    expect(screen.getByText('Sequences')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done Reading' })).toBeInTheDocument();
    // One reaction bar per chain.
    expect(screen.getAllByRole('button', { name: /^Love it/ })).toHaveLength(2);
  });

  it('reports the chain index and the reaction pressed', async () => {
    const onReact = vi.fn();
    const user = userEvent.setup();
    render(<ComicResults {...baseProps} playerState="READING" onReact={onReact} />);
    await user.click(screen.getAllByRole('button', { name: /^Love it/ })[0]);
    expect(onReact).toHaveBeenCalledWith(0, 'heart');
  });

  it('shows static like counts and no Done button for a spectator (no player state)', () => {
    render(<ComicResults {...baseProps} playerState={null} onReact={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Done Reading' })).toBeNull();
    // A spectator's reactions render as static labels, not buttons.
    expect(screen.queryByRole('button', { name: /^Love it/ })).toBeNull();
    expect(screen.getAllByLabelText(/Love it: /).length).toBeGreaterThan(0);
  });
});
