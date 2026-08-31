import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { StoryResults } from './StoryResults';
import type { StoryChain } from './types';

const nameTable = { p1: 'Ada', p2: 'Bram' };
const stories: StoryChain[] = [
  [{ link: 'Line one.', editor: 'p1' }],
  [{ link: 'Another story.', editor: 'p2' }],
  [{ link: 'Third tale.', editor: 'p1' }],
];

function renderResults(overrides: Partial<React.ComponentProps<typeof StoryResults>> = {}) {
  const props = {
    stories,
    playerState: 'READING' as string | null,
    nameTable,
    onReact: vi.fn(),
    isDone: false,
    onToggleDone: vi.fn(),
    ...overrides,
  };
  render(<StoryResults {...props} />);
  return props;
}

describe('StoryResults', () => {
  it('renders one chain per story', () => {
    renderResults();
    expect(screen.getByText('Line one.')).toBeInTheDocument();
    expect(screen.getByText('Another story.')).toBeInTheDocument();
    expect(screen.getByText('Third tale.')).toBeInTheDocument();
  });

  it('reports both the story index and which reaction was pressed', async () => {
    const user = userEvent.setup();
    const { onReact } = renderResults();
    // Every card carries the same set of reactions, so position picks the story.
    await user.click(screen.getAllByRole('button', { name: /^Love it/ })[1]);
    expect(onReact).toHaveBeenCalledWith(1, 'heart');
  });

  it('shows the Done Reading toggle while READING and fires onToggleDone', async () => {
    const user = userEvent.setup();
    const { onToggleDone } = renderResults();
    await user.click(screen.getByRole('button', { name: 'Done Reading' }));
    expect(onToggleDone).toHaveBeenCalledTimes(1);
  });

  it('renders a static tally and no Done Reading button for spectators', () => {
    renderResults({ playerState: null });
    expect(screen.queryByRole('button', { name: /^Love it/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Done Reading' })).toBeNull();
    // The counts are still readable, just not pressable.
    expect(screen.getAllByLabelText(/Love it: /).length).toBeGreaterThan(0);
  });
});
