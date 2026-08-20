import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/components/lib/cn';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface HeaderProps extends ComponentPropsWithRef<'h2'> {
  /** Heading level to render. Defaults to `h2`. */
  as?: HeadingLevel;
  /**
   * Optional leading icon, rendered decoratively to the left of the text. A ReactNode (e.g.
   * `<Icon name="pencil" />`) rather than a name string, so Header stays decoupled from the
   * icon-name map (that lives in the Icon component).
   */
  icon?: ReactNode;
}

/**
 * Header -- page titles, section headers, and game prompts. Renders the chosen heading element
 * (h1-h6); the display serif / weight / size come from the base type scale in index.css, so this
 * component only handles the optional icon layout and className overrides.
 */
export function Header({ as = 'h2', icon, className, children, ...rest }: HeaderProps) {
  const Tag = as;
  return (
    <Tag className={cn(icon != null && 'flex items-center gap-2', className)} {...rest}>
      {icon != null && (
        <span aria-hidden="true" className="inline-flex shrink-0 [&>i]:text-[0.85em]!">
          {icon}
        </span>
      )}
      {children}
    </Tag>
  );
}

/**
 * HeaderSubheader -- a muted supporting line paired with a Header (e.g. "You must draw this:").
 * Sans, normal weight, muted -- resets away from the serif heading styling.
 */
export function HeaderSubheader({ className, children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn('mt-1 font-sans text-base font-normal text-text-muted', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
