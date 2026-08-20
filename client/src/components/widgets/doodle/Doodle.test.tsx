import '@/test/canvasMock';
import '@/i18n';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Doodle } from './Doodle';

// Done uploads the bitmap and reports the resulting id. Stub the network so these tests stay about
// the widget's behaviour, not fetch.
vi.mock('@/data/drawings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/drawings')>();
  return { ...actual, uploadDrawing: vi.fn(async () => 'a1b2c3d4e5f60718293a4b5c6d7e8f90') };
});

/** The id the stubbed upload resolves to. */
const UPLOADED_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function drawStroke(canvas: HTMLCanvasElement, pointerId = 1) {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 25, pointerId });
  fireEvent.pointerMove(canvas, { clientX: 30, clientY: 10, pointerId });
  fireEvent.pointerUp(canvas, { clientX: 40, clientY: 20, pointerId });
}

/** onSave receives the uploaded drawing's id, and only after the upload resolves. */
async function expectSavedImage(onSave: ReturnType<typeof vi.fn>) {
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0]).toBe(UPLOADED_ID);
}

describe('Doodle', () => {
  it('renders the canvas and toolbar in edit mode', () => {
    const { container } = render(<Doodle />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('renders a read-only drawing without a toolbar', () => {
    render(<Doodle readOnly image="" author="Ada" />);
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(screen.getByText('Drawn by Ada')).toBeInTheDocument();
  });

  it('merges className onto the editor card so a caller can square off an edge', () => {
    // ComicEditor relies on this to butt the previous drawing against the live canvas.
    const { container } = render(<Doodle className="rounded-none border-0" />);
    expect(container.querySelector('.rounded-none.border-0')).toBeInTheDocument();
  });

  it('uploads the drawing and calls onSave with its id when Done is pressed', async () => {
    const onSave = vi.fn();
    const { container } = render(<Doodle onSave={onSave} />);
    drawStroke(container.querySelector('canvas')!);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await expectSavedImage(onSave);
  });

  it('enables Undo and Done only once something is drawn', () => {
    const { container } = render(<Doodle />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    drawStroke(container.querySelector('canvas')!);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('enables Redo only after an Undo, and disables it again after redoing', () => {
    const { container } = render(<Doodle />);
    drawStroke(container.querySelector('canvas')!);
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('shows the full time up front and only counts down once drawing starts', () => {
    vi.useFakeTimers();
    const { container } = render(<Doodle timer={30} />);
    // Visible before the first stroke: the player has to know the turn length BEFORE committing to
    // a drawing, not discover it the moment they commit.
    expect(screen.getByText('30')).toBeInTheDocument();

    // Present but not running.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('30')).toBeInTheDocument();

    drawStroke(container.querySelector('canvas')!);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('27')).toBeInTheDocument();
  });

  it('returns the timer to full, and stops it, when undo empties the canvas', () => {
    vi.useFakeTimers();
    const { container } = render(<Doodle timer={30} />);
    drawStroke(container.querySelector('canvas')!);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('27')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    // Nothing is drawn any more, so the turn has not really started: back to the full time, paused.
    expect(screen.getByText('30')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('locks the canvas when the timer expires but keeps Done available', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const { container } = render(<Doodle timer={1} onSave={onSave} />);
    const canvas = container.querySelector('canvas')!;

    drawStroke(canvas, 1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Canvas is now locked: a second stroke is ignored.
    drawStroke(canvas, 2);

    // The lock has happened, so hand the clock back: the upload is a real promise and waitFor
    // cannot make progress against a frozen timer.
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await expectSavedImage(onSave);
  });

  it('ignores a second pointer mid-stroke (palm / multi-touch) and still exports', async () => {
    const onSave = vi.fn();
    const { container } = render(<Doodle onSave={onSave} />);
    const canvas = container.querySelector('canvas')!;
    // Primary stroke starts near the origin.
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 25, pointerId: 1 });
    // A palm / second finger touches down far away mid-stroke and lifts - it must not hijack the
    // stroke in progress. (Which points survive is asserted in useRasterDrawing.test.ts, where the
    // stroke list is visible; here it only has to not break the export.)
    fireEvent.pointerDown(canvas, { clientX: 150, clientY: 150, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 155, clientY: 155, pointerId: 2 });
    fireEvent.pointerUp(canvas, { clientX: 155, clientY: 155, pointerId: 2 });
    // The primary finishes.
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 40, clientY: 20, pointerId: 1 });

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await expectSavedImage(onSave);
  });

  it('finalizes an in-progress stroke when the timer locks mid-stroke (does not drop it)', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const { container } = render(<Doodle timer={1} onSave={onSave} />);
    const canvas = container.querySelector('canvas')!;
    // Start a stroke but do not lift yet.
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 25, pointerId: 1 });
    // The timer expires mid-stroke -> the canvas locks.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // The pointer lifts AFTER the lock: the stroke must still be committed, not swallowed. Done
    // being enabled is the proof - it is disabled at zero strokes.
    fireEvent.pointerUp(canvas, { clientX: 30, clientY: 10, pointerId: 1 });
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toBeEnabled();

    // As above: the upload needs a real clock to resolve against.
    vi.useRealTimers();
    fireEvent.click(done);
    await expectSavedImage(onSave);
  });
});
