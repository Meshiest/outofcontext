import '@/test/canvasMock';
import '@/i18n';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComicEditor } from './ComicEditor';

// Done uploads the bitmap and reports an id; stub the network so these stay UI tests.
vi.mock('@/data/drawings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/drawings')>();
  return { ...actual, uploadDrawing: vi.fn(async () => 'a1b2c3d4e5f60718293a4b5c6d7e8f90') };
});

function drawStroke(canvas: HTMLCanvasElement, pointerId = 1) {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 25, pointerId });
  fireEvent.pointerMove(canvas, { clientX: 30, clientY: 10, pointerId });
  fireEvent.pointerUp(canvas, { clientX: 40, clientY: 20, pointerId });
}

const baseProps = {
  link: [],
  isLastLink: false,
  enableCaptions: false,
  showCaptions: false,
  showDrawings: true,
  continuous: false,
  colors: false,
};

describe('ComicEditor', () => {
  it('passes drawing data and an empty caption on submit when captions are disabled', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<ComicEditor {...baseProps} onSubmit={onSubmit} />);
    const canvas = container.querySelector('canvas')!;

    drawStroke(canvas);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Done uploads before it reports, so the call lands a tick later.
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.drawing).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90');
    expect(arg.caption).toBe('');
  });

  it('disables submit when the caption is invalid and enables it once a valid caption is entered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ComicEditor {...baseProps} enableCaptions showCaptions onSubmit={onSubmit} />,
    );
    const canvas = container.querySelector('canvas')!;
    drawStroke(canvas);

    // A drawn stroke is present but the caption is empty -> Done stays disabled.
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();

    await user.type(screen.getByLabelText('Caption'), 'A funny picture');
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();
  });

  it('submits the caption alongside the drawing when captions are enabled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ComicEditor {...baseProps} enableCaptions showCaptions onSubmit={onSubmit} />,
    );
    const canvas = container.querySelector('canvas')!;
    drawStroke(canvas);
    await user.type(screen.getByLabelText('Caption'), 'A cat');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Done uploads before it reports, so the call lands a tick later.
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.drawing).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90');
    expect(arg.caption).toBe('A cat');
  });

  it('prompts to draw the beginning when there is no context link', () => {
    render(<ComicEditor {...baseProps} onSubmit={vi.fn()} />);
    expect(screen.getByText('Draw the beginning!')).toBeInTheDocument();
  });
});
