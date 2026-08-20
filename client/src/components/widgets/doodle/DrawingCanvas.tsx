import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import { cn } from '@/components/lib/cn';
import { DRAWING_CANVAS_SIZE, STROKE_MIN } from '@shared/drawing';
import { DRAWING_PALETTE } from '@/data/theme';
import { useRasterDrawing, type StrokeCounts } from './useRasterDrawing';

/**
 * The drawing column's width, shared by the canvas and anything stacked above it.
 *
 * The cap keeps the whole widget on one screen on desktop, with a floor so a short window scrolls
 * rather than collapsing the canvas. It sits on the column's CHILDREN rather than the wrapper
 * because the wrapper also spans the tools column - capping the pair would shrink the drawing by the
 * width of the palette. Applying it to both keeps `above` and the canvas exactly equal, which is
 * what makes the two halves of a continuous composition line up.
 */
const COLUMN = 'w-full lg:max-w-[max(20rem,calc(100dvh-16rem))]';

/** Imperative surface the parent (Doodle) drives. Counts are pushed via onCountsChange, not pulled. */
export interface DrawingHandle {
  exportBlob: () => Promise<Blob | null>;
  clear: () => void;
  importImage: (src: string) => void;
  /** Returns whether any strokes remain (Doodle uses it to cancel the turn timer). */
  undo: () => boolean;
  redo: () => boolean;
}

export interface DrawingCanvasProps {
  /** Active stroke colour. */
  color?: string;
  /** Stroke width in logical canvas units. */
  strokeWidth?: number;
  /** Lock the canvas (timed-draw expiry): pointer input is ignored. */
  isReadOnly?: boolean;
  /** Fired on each stroke's pointer-down (the parent dedupes to start the turn timer). */
  onDrawStart?: () => void;
  /** Called with the live stroke + redo counts whenever either changes. */
  onCountsChange?: (counts: StrokeCounts) => void;
  /**
   * Content shown directly above the canvas and INSIDE its pointer region - the previous artist's
   * drawing, in continuous mode. A stroke may begin here and run down into the canvas, which is how
   * a player lines their marks up with the ones they are continuing.
   */
  above?: ReactNode;
  /**
   * The colour/stroke controls. Passed in rather than rendered beside this component so the grid can
   * place them next to the CURRENT drawing - as a sibling they ended up alongside the whole stack,
   * which in continuous mode left them level with the PREVIOUS artist's drawing instead.
   */
  tools?: ReactNode;
  ref?: Ref<DrawingHandle>;
}

/**
 * A square drawing surface. The element scales with its container, but its backing store is always
 * DRAWING_CANVAS_SIZE square, so what is drawn - and what is exported - is resolution-independent.
 *
 * Sizing: the canvas fills the width it is given, but on desktop it also caps itself against the
 * viewport height so the whole widget fits on one screen. The cap has a floor: once the window is
 * too short to honour it, the canvas stops shrinking and the page scrolls instead. Height is this
 * element's concern alone - the column around it is sized purely by width, so a short window never
 * squeezes the prompt or the results text.
 */
export function DrawingCanvas({
  color = DRAWING_PALETTE[0],
  strokeWidth = STROKE_MIN,
  isReadOnly = false,
  onDrawStart,
  onCountsChange,
  above,
  tools,
  ref,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRasterDrawing({ canvasRef, isReadOnly, onDrawStart, onCountsChange });

  const { setStrokeColor, setStrokeWidth } = drawing;
  useEffect(() => setStrokeColor(color), [color, setStrokeColor]);
  useEffect(() => setStrokeWidth(strokeWidth), [strokeWidth, setStrokeWidth]);

  const { exportBlob, clear, importImage, undo, redo } = drawing;
  useImperativeHandle(ref, () => ({ exportBlob, clear, importImage, undo, redo }), [
    exportBlob,
    clear,
    importImage,
    undo,
    redo,
  ]);

  return (
    // The pointer handlers sit on this wrapper, not on the <canvas>, so a stroke can BEGIN on the
    // `above` content and run down into the canvas. Coordinates are still measured against the
    // canvas rect, so a point started above it simply has a negative y and enters the drawing as
    // the pointer crosses the edge - which is what makes it possible to line a mark up with the one
    // it continues. `touch-none` has to move here with them, or the browser scrolls instead;
    // `select-none` stops the drag from painting a text/image selection over what you are drawing on.
    //
    // Stacked on mobile (tools last, under the canvas). On desktop it is an explicit two-column
    // grid, which is what lets the tools sit beside the CURRENT drawing rather than beside the whole
    // stack: `above` and the canvas share column 2, and the tools take column 1 of the canvas's row.
    <div
      {...drawing.handlers}
      className={cn(
        'relative mx-auto flex w-full touch-none select-none flex-col [-webkit-touch-callout:none]',
        'lg:grid lg:grid-cols-[auto_1fr] lg:items-start',
      )}
    >
      {above != null && <div className={cn(COLUMN, 'lg:col-start-2 lg:row-start-1')}>{above}</div>}
      <div
        className={cn(
          COLUMN,
          'relative aspect-square overflow-hidden lg:col-start-2 lg:row-start-2',
        )}
      >
        <canvas
          ref={canvasRef}
          width={DRAWING_CANVAS_SIZE}
          height={DRAWING_CANVAS_SIZE}
          className={cn('absolute inset-0 size-full bg-white')}
        />
      </div>
      {tools != null && (
        // Inside the pointer region so the grid can place it, but a press on a swatch must not
        // start a stroke - hence swallowing pointerdown before it reaches the handlers above.
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className="order-last lg:order-0 lg:col-start-1 lg:row-start-2"
        >
          {tools}
        </div>
      )}
    </div>
  );
}
