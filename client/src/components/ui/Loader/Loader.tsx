import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '@/components/lib/cn';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

const SPINNER_SIZE: Record<LoaderSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
  xl: 'h-16 w-16 border-4',
};

const TEXT_SIZE: Record<LoaderSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Spinner scale. */
  size?: LoaderSize;
  /** Flow inline (content width) instead of block. */
  inline?: boolean;
  /** Horizontally center the loader within its container. */
  centered?: boolean;
  /**
   * Accessible name announced by screen readers when no visible `children` text
   * is present. Supply a translated string; the component hardcodes no copy.
   */
  label?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Animated spinner (pure CSS, no dependency) with optional caption text below.
 * The spin honours `prefers-reduced-motion` via the global reduced-motion rule.
 */
export function Loader({
  size = 'md',
  inline = false,
  centered = false,
  label,
  children,
  className,
  ref,
  ...rest
}: LoaderProps) {
  const hasText = children != null && children !== false;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={!hasText && label ? label : undefined}
      className={cn(
        'flex-col items-center gap-2',
        inline && !centered ? 'inline-flex' : 'flex',
        centered && 'mx-auto w-fit',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block animate-spin rounded-full border-solid border-surface-2 border-t-primary',
          SPINNER_SIZE[size],
        )}
      />
      {hasText && (
        <span className={cn('font-sans text-text-muted', TEXT_SIZE[size])}>{children}</span>
      )}
    </div>
  );
}
