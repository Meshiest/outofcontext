import type { HTMLAttributes, Ref } from 'react';
import { cn } from '@/components/lib/cn';

type ProgressColor = 'primary' | 'positive' | 'negative' | 'warning' | 'info';
type ProgressSize = 'sm' | 'md' | 'lg';

const FILL_COLORS: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-warning',
  info: 'bg-info',
};

const TRACK_HEIGHTS: Record<ProgressSize, string> = {
  sm: 'h-2.5',
  md: 'h-4',
  lg: 'h-5',
};

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
  /** Fill amount, 0-100. Values outside the range are clamped. */
  percent?: number;
  /** Fill color token. */
  color?: ProgressColor;
  /** `true` shows the rounded percent; a string shows that text (and names the bar). */
  label?: string | boolean;
  /** Animated fill, signalling ongoing activity. */
  indicating?: boolean;
  size?: ProgressSize;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Horizontal progress bar. The track carries `role="progressbar"` with `aria-valuenow/min/max`.
 * Extra props (e.g. an `aria-label` for a translated name) land on the track element.
 */
export function Progress({
  percent = 0,
  color = 'primary',
  label = false,
  indicating = false,
  size = 'md',
  className,
  ref,
  ...props
}: ProgressProps) {
  const clamped = Math.round(Math.max(0, Math.min(100, percent)));
  const labelText = label === true ? `${clamped}%` : typeof label === 'string' ? label : null;

  return (
    <div className={cn('w-full', className)}>
      {labelText !== null && (
        <div className="mb-1 text-xs font-medium text-text-muted">{labelText}</div>
      )}
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === 'string' ? label : undefined}
        className={cn('track w-full', TRACK_HEIGHTS[size])}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-out',
            color === 'primary' ? 'track-fill' : FILL_COLORS[color],
            indicating && 'animate-pulse',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
