import '@/test/canvasMock';
import { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DRAWING_CANVAS_SIZE } from '@shared/drawing';
import { DrawingCanvas, type DrawingHandle } from './DrawingCanvas';

describe('DrawingCanvas', () => {
  it('pins the backing store to the logical canvas size', () => {
    const { container } = render(<DrawingCanvas />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(DRAWING_CANVAS_SIZE);
    expect(canvas.height).toBe(DRAWING_CANVAS_SIZE);
  });

  it('exposes an imperative handle that exports a blob', async () => {
    const ref = createRef<DrawingHandle>();
    render(<DrawingCanvas ref={ref} />);
    expect(await ref.current?.exportBlob()).toBeInstanceOf(Blob);
    expect(typeof ref.current?.clear).toBe('function');
    expect(typeof ref.current?.importImage).toBe('function');
    expect(typeof ref.current?.undo).toBe('function');
    expect(typeof ref.current?.redo).toBe('function');
  });

  it('keeps the desktop height cap so the widget stays on one screen', () => {
    const { container } = render(<DrawingCanvas />);
    // On the canvas box, NOT the wrapper: the wrapper spans the tools column too, so capping it
    // there would shrink the drawing by the width of the palette.
    const frame = container.querySelector('canvas')?.parentElement;
    expect(frame?.className).toContain('lg:max-w-[max(20rem,calc(100dvh-16rem))]');
  });

  it('caps content above the canvas to the same width, so a continuous pair lines up', () => {
    const { container, getByTestId } = render(
      <DrawingCanvas above={<div data-testid="prev">previous</div>} />,
    );
    const frame = container.querySelector('canvas')!.parentElement!;
    const aboveBox = getByTestId('prev').parentElement!;
    const cap = 'lg:max-w-[max(20rem,calc(100dvh-16rem))]';
    expect(aboveBox.className).toContain(cap);
    expect(frame.className).toContain(cap);
  });

  it('does not let a drag select the artwork it starts on', () => {
    const { container } = render(<DrawingCanvas above={<div>previous</div>} />);
    // Without this a drag from the previous drawing paints a selection highlight over it.
    expect(container.firstElementChild?.className).toContain('select-none');
  });

  it('places the tools beside the CURRENT drawing, not the whole stack', () => {
    const { container, getByTestId } = render(
      <DrawingCanvas
        above={<div data-testid="prev">previous</div>}
        tools={<div data-testid="tools">tools</div>}
      />,
    );
    const canvasBox = container.querySelector('canvas')!.parentElement!;
    const toolsBox = getByTestId('tools').parentElement!;
    const aboveBox = getByTestId('prev').parentElement!;
    // Explicit grid placement: tools share the canvas's row, and `above` sits in the row over it.
    expect(toolsBox.className).toContain('lg:row-start-2');
    expect(canvasBox.className).toContain('lg:row-start-2');
    expect(aboveBox.className).toContain('lg:row-start-1');
    expect(toolsBox.className).toContain('lg:col-start-1');
    expect(canvasBox.className).toContain('lg:col-start-2');
  });

  it('does not start a stroke when a tool is pressed', () => {
    const onDrawStart = vi.fn();
    const { getByTestId } = render(
      <DrawingCanvas onDrawStart={onDrawStart} tools={<button data-testid="swatch">red</button>} />,
    );
    // The tools live inside the pointer region so the grid can place them, so the press has to be
    // swallowed before it reaches the drawing handlers.
    fireEvent.pointerDown(getByTestId('swatch'), { clientX: 5, clientY: 5, pointerId: 1 });
    expect(onDrawStart).not.toHaveBeenCalled();
  });

  it('accepts content above the canvas and shares its pointer region', () => {
    // Continuous mode starts a stroke on the previous artist's drawing and runs it into this
    // canvas, so the handlers must live on an ancestor of BOTH, not on the canvas element.
    const { container, getByTestId } = render(
      <DrawingCanvas above={<div data-testid="prev">previous</div>} />,
    );
    const canvas = container.querySelector('canvas')!;
    // `above` sits in its own grid cell, so the shared pointer region is its grandparent.
    const region = getByTestId('prev').parentElement!.parentElement!;
    expect(region.contains(canvas)).toBe(true);
    expect(region.className).toContain('touch-none');
    expect(canvas.className).not.toContain('touch-none');
  });
});
