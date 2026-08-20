import type { HTMLAttributes, Ref } from 'react';
import { cn } from '@/components/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

// Text badge: soft token tint + token text (legible in both themes). Dot badge (no children): the
// solid token color.
const PILL: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-text-muted',
  success: 'bg-positive/15 text-positive',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-negative/15 text-negative',
  info: 'bg-info/15 text-info',
};

const DOT: Record<BadgeVariant, string> = {
  default: 'bg-text-subtle',
  success: 'bg-positive',
  warning: 'bg-warning',
  error: 'bg-negative',
  info: 'bg-info',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Small status indicator (connected/disconnected, admin, reconnecting). With children it is a
 * pill; with no children it collapses to a bare status dot. Spread props (e.g. aria-label) reach the
 * span so a dot can carry an accessible name.
 */
export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ref,
  ...props
}: BadgeProps) {
  if (children == null || children === false) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-block rounded-full',
          size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
          DOT[variant],
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full font-semibold uppercase leading-none tracking-[0.08em]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        PILL[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
