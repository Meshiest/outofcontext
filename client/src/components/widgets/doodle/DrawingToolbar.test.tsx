import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DrawingToolbar } from './DrawingToolbar';

function renderToolbar(overrides: Partial<Parameters<typeof DrawingToolbar>[0]> = {}) {
  const props = {
    strokeCount: 0,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onDone: vi.fn(),
    ...overrides,
  };
  render(<DrawingToolbar {...props} />);
  return props;
}

describe('DrawingToolbar', () => {
  it('disables Undo when there are no paths', () => {
    renderToolbar({ strokeCount: 0 });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('disables Done when there are no paths and not read-only', () => {
    renderToolbar({ strokeCount: 0 });
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
  });

  it('fires callbacks when Undo and Done are clicked', async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ strokeCount: 2 });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps Done available when locked (read-only) with paths present', () => {
    renderToolbar({ strokeCount: 3, isReadOnly: true });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('renders only the actions (tools live in DrawingTools)', () => {
    renderToolbar({ strokeCount: 1 });
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Undo',
      'Redo',
      'Done',
    ]);
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('disables Redo until something has been undone', () => {
    renderToolbar({ strokeCount: 2, redoCount: 0 });
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('enables Redo and fires it once a stroke is available to restore', async () => {
    const user = userEvent.setup();
    const props = renderToolbar({ strokeCount: 1, redoCount: 1 });
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(props.onRedo).toHaveBeenCalledTimes(1);
  });

  it('disables Redo while the canvas is locked', () => {
    // The turn timer expired: nothing may be added back either.
    renderToolbar({ strokeCount: 1, redoCount: 2, isReadOnly: true });
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });
});
