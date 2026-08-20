import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Statistic, StatisticValue, StatisticLabel } from '@/components/ui/Statistic/Statistic';

export interface TimerProps {
  /** Epoch milliseconds the countdown started at. Omit for a static display of `duration`. */
  startTime?: number;
  /** Total countdown length, in seconds. */
  duration: number;
  className?: string;
}

/** Format a whole-second count as `M:SS`. */
function toClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Countdown display (value + label) for timed game turns. Ticks every 500ms while `startTime` is
 * set, clamps at zero, shows raw seconds under a minute and `M:SS` above it, and reads "Time's up"
 * once expired. With no `startTime` it renders `duration` as a static value (no interval).
 * Colours come from theme tokens, so it flips for dark mode without `dark:` variants.
 */
export function Timer({ startTime, duration, className }: TimerProps) {
  const { t } = useTranslation('common');
  // Held in state and refreshed by the interval: reading Date.now() during render would be impure.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startTime === undefined) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [startTime, duration]);

  // Clamped at 0 because `now` can legitimately PREDATE `startTime`: it is captured once at mount,
  // and this component is mounted as soon as the turn opens while the countdown only starts on the
  // player's first stroke. Between those two moments the interval is not running, so `now` stays at
  // its mount value, and an unclamped elapsed goes negative - rendering MORE than the full duration
  // (a 30s turn flashing 35) until the first tick corrected it.
  //
  // `floor`, not `round`: a countdown should read the full duration for the whole first second and
  // hit zero exactly at the end. Rounding dropped it to duration-1 after only half a second.
  const elapsed = startTime === undefined ? 0 : Math.max(0, Math.floor((now - startTime) / 1000));
  const remaining = Math.max(0, duration - elapsed);

  let value: string;
  let label: string;
  if (startTime !== undefined && remaining <= 0) {
    value = '0';
    label = t('timer.expired');
  } else if (remaining <= 60) {
    value = String(remaining);
    label = t('timer.second', { count: remaining });
  } else {
    value = toClock(remaining);
    label = t('timer.remaining');
  }

  return (
    <Statistic className={cn('tabular-nums', className)} aria-live="polite">
      <StatisticValue>{value}</StatisticValue>
      <StatisticLabel>{label}</StatisticLabel>
    </Statistic>
  );
}
