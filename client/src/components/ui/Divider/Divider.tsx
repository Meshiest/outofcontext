import type { ReactNode } from 'react';
import { cn } from '@/components/lib/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  /** Optional inline label; when present a horizontal divider becomes line-text-line. */
  children?: ReactNode;
  className?: string;
}

/**
 * Content separator. Horizontal + no children renders a semantic <hr>; with children it renders a
 * labelled line-text-line rule (the eyebrow uses Hanken uppercase, not mono -- mono is reserved for
 * codes). Vertical renders a thin inline rule for side-by-side content.
 */
export function Divider({ orientation = 'horizontal', children, className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          'mx-2 inline-block h-full min-h-4 w-px self-stretch bg-border-soft',
          className,
        )}
      />
    );
  }

  if (children == null) {
    return <hr className={cn('my-4 h-px w-full border-0 bg-border-soft', className)} />;
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('my-4 flex items-center gap-3 text-text-muted', className)}
    >
      <span aria-hidden className="h-px flex-1 bg-border-soft" />
      <span className="text-xs font-semibold uppercase tracking-[0.12em]">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-border-soft" />
    </div>
  );
}
