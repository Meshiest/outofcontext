import { cn } from '@/components/lib/cn';
import { STROKE_MAX, STROKE_MIN, STROKE_STEPS } from '@shared/drawing';

export interface StrokeWidthSliderProps {
  /** Current stroke width, in logical canvas units. */
  value: number;
  /** Called with the new width. */
  onChange: (value: number) => void;
  /** Accessible name for the range input (translated by the caller). */
  'aria-label'?: string;
  className?: string;
}

const STEP = (STROKE_MAX - STROKE_MIN) / (STROKE_STEPS - 1);
const STOPS = Array.from({ length: STROKE_STEPS }, (_, index) => index);
// Preview-dot diameters in CSS pixels; a fixed visual scale, NOT logical canvas units.
const DOT_SIZES = [8, 14, 20, 26, 32] as const;

/**
 * Brush-thickness picker (STROKE_MIN-STROKE_MAX, five stops). The five growing dots are the visual;
 * a tall, transparent native range sits on top so it stays a real, accessible slider (pointer drag
 * and keyboard, `role="slider"`).
 */
export function StrokeWidthSlider({
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: StrokeWidthSliderProps) {
  const activeStop = Math.max(
    0,
    Math.min(STROKE_STEPS - 1, Math.round((value - STROKE_MIN) / STEP)),
  );

  return (
    <div
      className={cn(
        'stroke-well relative h-14 w-52 focus-within:ring-2 focus-within:ring-primary/50 lg:h-52 lg:w-12',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 lg:flex-col lg:px-0 lg:py-2">
        {STOPS.map((n) => {
          const active = n === activeStop;
          return (
            <span key={n} aria-hidden="true" className="grid size-8 place-items-center">
              <span
                className={cn('stroke-dot rounded-full', active && 'stroke-dot--active')}
                style={{ width: DOT_SIZES[n], height: DOT_SIZES[n] }}
              />
            </span>
          );
        })}
      </div>
      <input
        type="range"
        min={STROKE_MIN}
        max={STROKE_MAX}
        step={STEP}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        // Transparent hit area over the dots. On desktop the well is vertical, so the range is
        // flipped with `writing-mode` (the native way to orient a range input) and drags top-to-
        // bottom, matching the small-to-large dot order.
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 lg:[writing-mode:vertical-lr]"
      />
    </div>
  );
}
