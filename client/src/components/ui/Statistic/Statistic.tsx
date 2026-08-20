import type { HTMLAttributes, Ref } from 'react';
import { cn } from '@/components/lib/cn';

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

/** Centered value + label block (lobby codes, timers, config summaries). */
export function Statistic({ className, ref, ...props }: DivProps) {
  return (
    <div ref={ref} className={cn('flex flex-col items-center text-center', className)} {...props} />
  );
}

/** Large value set in the editorial serif at regular weight (not mono/bold - reads as content). */
export function StatisticValue({ className, ref, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn('font-display text-4xl leading-none text-text', className)}
      {...props}
    />
  );
}

/** Small uppercase eyebrow label below the value (Hanken caps, not mono). */
export function StatisticLabel({ className, ref, ...props }: DivProps) {
  return <div ref={ref} className={cn('field-label mt-1', className)} {...props} />;
}
