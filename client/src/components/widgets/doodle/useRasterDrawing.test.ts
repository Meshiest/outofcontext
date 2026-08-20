import '@/test/canvasMock';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DRAWING_CANVAS_SIZE } from '@shared/drawing';
import { useRasterDrawing, MAX_STROKE_POINTS } from './useRasterDrawing';

/** A canvas whose CSS box is half the logical size, so the 2x scale factor is exercised. */
function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: DRAWING_CANVAS_SIZE / 2,
      height: DRAWING_CANVAS_SIZE / 2,
    }) as DOMRect;
  return canvas;
}

function setup(isReadOnly = false) {
  const canvasRef = { current: makeCanvas() as HTMLCanvasElement | null };
  const onDrawStart = vi.fn();
  const view = renderHook(() => useRasterDrawing({ canvasRef, isReadOnly, onDrawStart }));
  return { ...view, canvasRef, onDrawStart };
}

function pointer(clientX: number, clientY: number, pointerId = 1) {
  return { clientX, clientY, pointerId, currentTarget: { setPointerCapture: vi.fn() } } as never;
}

describe('useRasterDrawing', () => {
  it('sizes the backing store to the logical canvas, not the CSS box', () => {
    const { canvasRef } = setup();
    expect(canvasRef.current?.width).toBe(DRAWING_CANVAS_SIZE);
    expect(canvasRef.current?.height).toBe(DRAWING_CANVAS_SIZE);
  });

  it('scales pointer coordinates from CSS pixels into logical units', () => {
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(100, 50));
      result.current.handlers.onPointerUp(pointer(100, 50));
    });
    // The CSS box is half the logical size, so a click at 100,50 lands at 200,100.
    expect(result.current.debugStrokes()[0].points[0]).toEqual({ x: 200, y: 100 });
  });

  it('ignores a second pointer while a stroke is in progress (palm rejection)', () => {
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10, 1));
      result.current.handlers.onPointerDown(pointer(300, 300, 2));
      result.current.handlers.onPointerMove(pointer(320, 320, 2));
      result.current.handlers.onPointerUp(pointer(320, 320, 2));
      result.current.handlers.onPointerMove(pointer(20, 20, 1));
      result.current.handlers.onPointerUp(pointer(20, 20, 1));
    });
    const strokes = result.current.debugStrokes();
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points.every((p) => p.x < 100)).toBe(true);
  });

  it('drops the oldest strokes once the point budget is exceeded', () => {
    const { result } = setup();
    act(() => {
      for (let i = 0; i < 40; i++) {
        result.current.handlers.onPointerDown(pointer(i, i, 1));
        for (let k = 0; k < 60; k++) result.current.handlers.onPointerMove(pointer(i + k, i, 1));
        result.current.handlers.onPointerUp(pointer(i, i, 1));
      }
    });
    const total = result.current
      .debugStrokes()
      .reduce((sum, stroke) => sum + stroke.points.length, 0);
    expect(total).toBeLessThanOrEqual(MAX_STROKE_POINTS);
  });

  it('undo removes the last stroke and reports whether any remain', () => {
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10));
      result.current.handlers.onPointerUp(pointer(10, 10));
      result.current.handlers.onPointerDown(pointer(20, 20));
      result.current.handlers.onPointerUp(pointer(20, 20));
    });
    let remaining = true;
    act(() => {
      remaining = result.current.undo();
    });
    expect(remaining).toBe(true);
    expect(result.current.debugStrokes()).toHaveLength(1);
    act(() => {
      remaining = result.current.undo();
    });
    expect(remaining).toBe(false);
  });

  it('redo puts back the stroke undo removed', () => {
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10));
      result.current.handlers.onPointerUp(pointer(10, 10));
      result.current.handlers.onPointerDown(pointer(20, 20));
      result.current.handlers.onPointerUp(pointer(20, 20));
      result.current.undo();
    });
    expect(result.current.counts).toEqual({ strokes: 1, redo: 1 });
    act(() => {
      result.current.redo();
    });
    expect(result.current.counts).toEqual({ strokes: 2, redo: 0 });
    // The restored stroke is the one that was undone, at its original coordinates.
    expect(result.current.debugStrokes()[1].points[0]).toEqual({ x: 40, y: 40 });
  });

  it('a new stroke forks the history, discarding anything undone', () => {
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10));
      result.current.handlers.onPointerUp(pointer(10, 10));
      result.current.undo();
    });
    expect(result.current.counts.redo).toBe(1);
    act(() => {
      result.current.handlers.onPointerDown(pointer(30, 30));
      result.current.handlers.onPointerUp(pointer(30, 30));
    });
    expect(result.current.counts).toEqual({ strokes: 1, redo: 0 });
  });

  it('publishes both counts together whenever they change', () => {
    const onCountsChange = vi.fn();
    const canvasRef = { current: makeCanvas() as HTMLCanvasElement | null };
    const { result } = renderHook(() => useRasterDrawing({ canvasRef, onCountsChange }));
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10));
      result.current.handlers.onPointerUp(pointer(10, 10));
    });
    expect(onCountsChange).toHaveBeenLastCalledWith({ strokes: 1, redo: 0 });
    act(() => {
      result.current.undo();
    });
    expect(onCountsChange).toHaveBeenLastCalledWith({ strokes: 0, redo: 1 });
  });

  it('ignores pointer input while read-only', () => {
    const { result } = setup(true);
    act(() => {
      result.current.handlers.onPointerDown(pointer(10, 10));
      result.current.handlers.onPointerUp(pointer(10, 10));
    });
    expect(result.current.debugStrokes()).toHaveLength(0);
  });

  it('exports the bitmap as a blob', async () => {
    const { result } = setup();
    const blob = await result.current.exportBlob();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('accepts a stroke that starts above the canvas and runs into it', () => {
    // Continuous mode: the player begins the line on the previous artist's drawing so the two
    // connect. Such a point is simply negative in canvas space and must be kept, not clamped or
    // dropped - clamping would bend the first segment sideways along the top edge.
    const { result } = setup();
    act(() => {
      result.current.handlers.onPointerDown(pointer(100, -60));
      result.current.handlers.onPointerMove(pointer(100, 40));
      result.current.handlers.onPointerUp(pointer(100, 40));
    });
    const [stroke] = result.current.debugStrokes();
    expect(stroke.points[0]).toEqual({ x: 200, y: -120 });
    expect(stroke.points[1]).toEqual({ x: 200, y: 80 });
  });
});
