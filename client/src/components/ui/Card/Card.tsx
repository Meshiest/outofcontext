import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/components/lib/cn';

type DivProps = ComponentPropsWithRef<'div'>;

/** Card -- outer container. Pressed-smooth surface panel (`surface-raised` in index.css). */
export function Card({ className, children, ...rest }: DivProps) {
  return (
    <div className={cn('surface-raised rounded-lg text-text', className)} {...rest}>
      {children}
    </div>
  );
}

export interface CardContentProps extends DivProps {
  /** Footer treatment: top ink rule + muted surface, smaller muted text. */
  extra?: boolean;
}

/** CardContent -- a padded content region; `extra` renders the footer variant. */
export function CardContent({ extra = false, className, children, ...rest }: CardContentProps) {
  return (
    <div
      className={cn(
        'px-4 py-3',
        extra &&
          'card-footer rounded-b-lg border-t border-divider bg-surface-2 py-2.5 text-sm text-text-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** CardExtra -- named shorthand for `<CardContent extra>`. */
export function CardExtra({ className, children, ...rest }: DivProps) {
  return (
    <CardContent extra className={className} {...rest}>
      {children}
    </CardContent>
  );
}

/** CardHeader -- the title line. Editorial serif (font-display) at heading size. */
export function CardHeader({ className, children, ...rest }: DivProps) {
  return (
    <div
      className={cn('font-display text-2xl font-normal leading-tight text-text', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** CardMeta -- muted, smaller subtitle beneath the header. */
export function CardMeta({ className, children, ...rest }: DivProps) {
  return (
    <div className={cn('mt-1 font-sans text-sm text-text-muted', className)} {...rest}>
      {children}
    </div>
  );
}

/** CardDescription -- standard body copy inside the card. */
export function CardDescription({ className, children, ...rest }: DivProps) {
  return (
    <div className={cn('mt-2 text-text', className)} {...rest}>
      {children}
    </div>
  );
}
