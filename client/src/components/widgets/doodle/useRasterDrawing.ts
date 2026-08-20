import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { DRAWING_CANVAS_SIZE, STROKE_MIN } from '@shared/drawing';
import { DRAWING_PALETTE } from '@/data/theme';
import { encodeCanvas } from '@/data/drawings';

/** Total points retained across all strokes; oldest strokes are evicted once exceeded. */
export const MAX_STROKE_POINTS = 4000;

export interface Stroke {
  color: string;
  /** In logical canvas units. */
  width: number;
  points: { x: number; y: number }[];
}

/** Live counts driving toolbar enablement: Undo/Done need `strokes`, Redo needs `redo`. */
export interface StrokeCounts {
  strokes: number;
  redo: number;
}

/**
 * Typed against HTMLElement, not HTMLCanvasElement: the handlers are attached to a wrapper that
 * also contains the previous drawing (continuous mode), so a stroke can start outside the canvas.
 * Coordinates come from the canvas ref regardless of which element the event landed on.
 */
export interface PointerHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

export interface UseRasterDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isReadOnly?: boolean;
  onDrawStart?: () => void;
  /** Fired with both counts whenever either changes. */
  onCountsChange?: (counts: StrokeCounts) => void;
}

export interface UseRasterDrawing {
  handlers: PointerHandlers;
  counts: StrokeCounts;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  /** Remove the newest stroke onto the redo stack. Returns whether any strokes remain. */
  undo: () => boolean;
  /** Put the most recently undone stroke back. Returns whether any remain to redo. */
  redo: () => boolean;
  clear: () => void;
  /** Encode the current bitmap. Null when the browser cannot produce a blob at all. */
  exportBlob: () => Promise<Blob | null>;
  /** Replace the canvas contents with an already-encoded image (a URL or data URL). */
  importImage: (src: string) => void;
  /** Test seam: the live stroke list. Not for production use. */
  debugStrokes: () => Stroke[];
}

/**
 * Freehand drawing on a raster canvas.
 *
 * The canvas backing store is pinned to DRAWING_CANVAS_SIZE square whatever its CSS size, and
 * pointer coordinates are scaled into that space on the way in. That is the whole fix for
 * cross-device drawings: geometry and stroke widths are stored in logical units, so the same
 * drawing renders identically at any display size.
 *
 * Strokes are kept so undo/redo can re-render the bitmap from scratch; only the exported PNG leaves
 * the browser.
 */
export function useRasterDrawing({
  canvasRef,
  isReadOnly = false,
  onDrawStart,
  onCountsChange,
}: UseRasterDrawingOptions): UseRasterDrawing {
  const strokesRef = useRef<Stroke[]>([]);
  // Undone strokes, newest last. Plain records, so putting one back is a push.
  const redoRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  // A seeded image (Doodle's `image` prop in edit mode) sits under the strokes. Held separately so
  // redraw() can repaint it on every stroke instead of wiping it.
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const colorRef = useRef<string>(DRAWING_PALETTE[0]);
  const widthRef = useRef<number>(STROKE_MIN);
  const readOnlyRef = useRef(isReadOnly);
  const onDrawStartRef = useRef(onDrawStart);
  const onCountsChangeRef = useRef(onCountsChange);
  const [counts, setCounts] = useState<StrokeCounts>({ strokes: 0, redo: 0 });

  useEffect(() => {
    readOnlyRef.current = isReadOnly;
    onDrawStartRef.current = onDrawStart;
    onCountsChangeRef.current = onCountsChange;
  });

  const context = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // Assigning width/height also clears the canvas, so only do it when the size is wrong.
    if (canvas.width !== DRAWING_CANVAS_SIZE || canvas.height !== DRAWING_CANVAS_SIZE) {
      canvas.width = DRAWING_CANVAS_SIZE;
      canvas.height = DRAWING_CANVAS_SIZE;
    }
    return canvas.getContext('2d');
  }, [canvasRef]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.points.length === 1) {
      // A tap is a dot: a zero-length line would paint nothing.
      const { x, y } = stroke.points[0];
      ctx.beginPath();
      ctx.arc(x, y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const redraw = useCallback(() => {
    const ctx = context();
    if (!ctx) return;
    // Cleared, not filled white. The canvas element carries a white background in CSS, so it still
    // LOOKS like paper while drawing, but the exported bitmap keeps its alpha - which is what lets a
    // drawing be layered over something other than white.
    ctx.clearRect(0, 0, DRAWING_CANVAS_SIZE, DRAWING_CANVAS_SIZE);
    if (backgroundRef.current) {
      ctx.drawImage(backgroundRef.current, 0, 0, DRAWING_CANVAS_SIZE, DRAWING_CANVAS_SIZE);
    }
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke);
    if (currentRef.current) drawStroke(ctx, currentRef.current);
  }, [context]);

  // Size the backing store on mount, before any stroke arrives.
  useEffect(() => {
    redraw();
  }, [redraw]);

  const publishCounts = useCallback(() => {
    const next = { strokes: strokesRef.current.length, redo: redoRef.current.length };
    setCounts((prev) => (prev.strokes === next.strokes && prev.redo === next.redo ? prev : next));
    onCountsChangeRef.current?.(next);
  }, []);

  const toLogical = (e: PointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) * DRAWING_CANVAS_SIZE) / rect.width,
      y: ((e.clientY - rect.top) * DRAWING_CANVAS_SIZE) / rect.height,
    };
  };

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (readOnlyRef.current) return;
      // A second pointer (palm rest, another finger) must not hijack the stroke in progress.
      if (currentRef.current) return;
      activePointerRef.current = e.pointerId;
      onDrawStartRef.current?.();
      currentRef.current = {
        color: colorRef.current,
        width: widthRef.current,
        points: [toLogical(e)],
      };
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // Unavailable under jsdom.
      }
      redraw();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toLogical reads only refs.
    [redraw],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (readOnlyRef.current) return;
      if (!currentRef.current || e.pointerId !== activePointerRef.current) return;
      currentRef.current.points.push(toLogical(e));
      redraw();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toLogical reads only refs.
    [redraw],
  );

  const finishStroke = useCallback(() => {
    const stroke = currentRef.current;
    currentRef.current = null;
    activePointerRef.current = null;
    if (!stroke) return;
    strokesRef.current.push(stroke);
    // A fresh stroke forks the history, so anything undone is no longer reachable.
    redoRef.current = [];
    let total = strokesRef.current.reduce((sum, s) => sum + s.points.length, 0);
    while (total > MAX_STROKE_POINTS && strokesRef.current.length > 1) {
      const [dropped] = strokesRef.current.splice(0, 1);
      total -= dropped.points.length;
    }
    publishCounts();
    redraw();
  }, [publishCounts, redraw]);

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      // Deliberately not gated on readOnly: if the turn timer locked the canvas mid-stroke, the
      // in-progress stroke must still be committed rather than left dangling.
      if (e.pointerId !== activePointerRef.current) return;
      finishStroke();
    },
    [finishStroke],
  );

  const onPointerCancel = onPointerUp;

  const undo = useCallback(() => {
    const stroke = strokesRef.current.pop();
    if (stroke) redoRef.current.push(stroke);
    publishCounts();
    redraw();
    return strokesRef.current.length > 0;
  }, [publishCounts, redraw]);

  const redo = useCallback(() => {
    const stroke = redoRef.current.pop();
    if (stroke) strokesRef.current.push(stroke);
    publishCounts();
    redraw();
    return redoRef.current.length > 0;
  }, [publishCounts, redraw]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    redoRef.current = [];
    currentRef.current = null;
    backgroundRef.current = null;
    publishCounts();
    redraw();
  }, [publishCounts, redraw]);

  const exportBlob = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    return encodeCanvas(canvas);
  }, [canvasRef]);

  const importImage = useCallback(
    (src: string) => {
      strokesRef.current = [];
      redoRef.current = [];
      currentRef.current = null;
      backgroundRef.current = null;
      publishCounts();
      redraw();
      if (!src) return;
      const image = new Image();
      // Held as the background rather than painted once, so the next redraw (any stroke, undo, or
      // redo) does not wipe it.
      image.onload = () => {
        backgroundRef.current = image;
        redraw();
      };
      image.src = src;
    },
    [publishCounts, redraw],
  );

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    counts,
    setStrokeColor: useCallback((color: string) => {
      colorRef.current = color;
    }, []),
    setStrokeWidth: useCallback((width: number) => {
      widthRef.current = width;
    }, []),
    undo,
    redo,
    clear,
    exportBlob,
    importImage,
    debugStrokes: useCallback(() => strokesRef.current, []),
  };
}
