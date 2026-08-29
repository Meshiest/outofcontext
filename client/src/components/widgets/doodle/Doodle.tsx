import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/components/lib/cn';
import { Card } from '@/components/ui/Card/Card';
import { STROKE_MIN } from '@shared/drawing';
import { drawingUrl, uploadDrawing } from '@/data/drawings';
import { DRAWING_PALETTE } from '@/data/theme';
import { Timer } from '../Timer';
import { DrawingCanvas, type DrawingHandle } from './DrawingCanvas';
import { DrawingToolbar } from './DrawingToolbar';
import { DrawingTools } from './DrawingTools';
import { ReadOnlyDrawing } from './ReadOnlyDrawing';
import type { StrokeCounts } from './useRasterDrawing';

export interface DoodleProps {
  /** View-only mode: render `image` with no drawing controls. */
  readOnly?: boolean;
  /** Drawing id to display (read-only) or seed the canvas with (edit). */
  image?: string;
  /** Show the colour palette + stroke slider. */
  colors?: boolean;
  /** Turn length in seconds; when set, the countdown starts on the first stroke. 0 disables. */
  timer?: number;
  /** Force the Done button disabled. */
  disabled?: boolean;
  /** Attribution shown over a read-only drawing. */
  author?: string;
  /** Merged onto the editor's card (or the frame, when readOnly) - corner rounding, squared edges. */
  className?: string;
  /** Called with the uploaded drawing's id once Done has finished submitting. */
  onSave?: (image: string) => void;
  /** Called when the upload fails, so the game can surface translated copy. */
  onSaveError?: (error: unknown) => void;
  /**
   * Content rendered directly above the canvas, inside the same card and the same pointer region -
   * the previous artist's drawing in continuous mode. Sharing the card is what keeps the surface
   * gradient continuous across both, and sharing the pointer region is what lets a stroke start on
   * the drawing above and run down into this one.
   */
  above?: ReactNode;
}

/**
 * Top-level drawing widget. In read-only mode it renders a finished drawing (`ReadOnlyDrawing`).
 * In edit mode it composes `DrawingCanvas` + `DrawingToolbar` (with an optional colour palette). A
 * `timer` is displayed as soon as the turn opens, begins counting down on the first stroke, and on
 * expiry locks the canvas while leaving Done available.
 */
export function Doodle({
  readOnly = false,
  image,
  colors = false,
  timer = 0,
  disabled = false,
  author,
  className,
  onSave,
  onSaveError,
  above,
}: DoodleProps) {
  const [color, setColor] = useState<string>(DRAWING_PALETTE[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_MIN);
  const [counts, setCounts] = useState<StrokeCounts>({ strokes: 0, redo: 0, baked: 0 });
  // Done does network work, so it has an in-flight state. Without this a slow upload looks like a
  // dead button and invites a second press.
  const [submitting, setSubmitting] = useState(false);
  const [timerStart, setTimerStart] = useState<number | undefined>(undefined);
  const [locked, setLocked] = useState(false);

  const handleRef = useRef<DrawingHandle>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timerStartedRef = useRef(false);

  const resetTimer = useCallback(() => {
    timerStartedRef.current = false;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
    setTimerStart(undefined);
    setLocked(false);
  }, []);

  const handleDrawStart = useCallback(() => {
    if (!timer || timerStartedRef.current) return;
    timerStartedRef.current = true;
    setTimerStart(Date.now());
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLocked(true), timer * 1000);
  }, [timer]);

  const handleDone = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const blob = await handleRef.current?.exportBlob();
      if (!blob) throw new Error('canvas produced no image');
      // The bytes go up on their own; only the id reaches the game message.
      const id = await uploadDrawing(blob);
      onSave?.(id);
      handleRef.current?.clear();
      resetTimer();
    } catch (error) {
      // Leave the drawing on the canvas so the player can simply press Done again.
      onSaveError?.(error);
    } finally {
      setSubmitting(false);
    }
  }, [onSave, onSaveError, resetTimer, submitting]);

  const handleUndo = useCallback(() => {
    // Undoing back to an empty canvas means the turn never really started, so drop the timer too.
    const remaining = handleRef.current?.undo() ?? false;
    if (timerStartedRef.current && !remaining) resetTimer();
  }, [resetTimer]);

  const handleRedo = useCallback(() => {
    handleRef.current?.redo();
  }, []);

  // Seed / replace the canvas when the image prop changes (edit mode).
  useEffect(() => {
    if (readOnly) return;
    handleRef.current?.importImage(image ? drawingUrl(image) : '');
  }, [image, readOnly]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (readOnly) {
    return <ReadOnlyDrawing image={image} author={author} className={className} />;
  }

  return (
    // Fills its column: the game column itself is what caps the width on desktop, so the prompt,
    // this widget, and the progress bar all line up at one width.
    <div className="mx-auto flex w-full flex-col gap-2">
      {/* Shown from the start, not conjured on the first stroke: the player needs to know how long
          the turn is BEFORE committing to a drawing. With no `startTime` the Timer renders the full
          duration statically and runs no interval, then counts down once the first stroke sets it. */}
      {timer > 0 && <Timer startTime={timerStart} duration={timer} />}
      <Card className={cn('overflow-hidden', className)}>
        {/* Tools sit UNDER the canvas on small screens and BESIDE it (left, vertical) on desktop.
            DrawingCanvas owns that placement, because on desktop it has to land beside the current
            drawing specifically rather than beside the whole stack. */}
        <DrawingCanvas
          ref={handleRef}
          color={color}
          strokeWidth={strokeWidth}
          isReadOnly={locked}
          onDrawStart={handleDrawStart}
          onCountsChange={setCounts}
          above={above}
          tools={
            colors ? (
              <DrawingTools
                color={color}
                strokeWidth={strokeWidth}
                onColorChange={setColor}
                onStrokeWidthChange={setStrokeWidth}
              />
            ) : undefined
          }
        />
        <DrawingToolbar
          strokeCount={counts.strokes}
          bakedCount={counts.baked}
          isReadOnly={locked}
          disabled={disabled}
          submitting={submitting}
          redoCount={counts.redo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDone={() => void handleDone()}
        />
      </Card>
    </div>
  );
}
