import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/components/lib/cn';

export type MessageVariant = 'info' | 'success' | 'warning' | 'error';

interface VariantStyle {
  /** Font Awesome glyph class. */
  glyph: string;
  /** Icon color (token). */
  icon: string;
}

const VARIANTS: Record<MessageVariant, VariantStyle> = {
  info: { glyph: 'fa-circle-info', icon: 'text-info' },
  success: { glyph: 'fa-circle-check', icon: 'text-positive' },
  warning: { glyph: 'fa-triangle-exclamation', icon: 'text-warning' },
  error: { glyph: 'fa-circle-xmark', icon: 'text-negative' },
};

export interface MessageProps extends Omit<ComponentPropsWithRef<'div'>, 'content' | 'children'> {
  /** Tone of the message. Defaults to `info`. */
  variant?: MessageVariant;
  /** Bold heading line. */
  header?: ReactNode;
  /** Body content -- string or node. */
  content?: ReactNode;
  /** Show a close control. */
  dismissible?: boolean;
  /** Called when the close control is activated. */
  onDismiss?: () => void;
  /**
   * Accessible name for the close control. Provide a translated string when `dismissible`;
   * kept as a prop (not hardcoded copy) so it flows through i18n.
   */
  dismissLabel?: string;
}

/**
 * Message -- inline feedback (invalid lobby code, invalid name, etc.). A pressed-smooth card
 * (like Card) rather than a colored panel: the raised surface carries the message, and a larger
 * variant-colored Font Awesome icon sits depressed into an inset well on the left. `error`
 * announces assertively (role="alert"); the others announce politely (role="status").
 */
export function Message({
  variant = 'info',
  header,
  content,
  dismissible = false,
  onDismiss,
  dismissLabel,
  className,
  ...rest
}: MessageProps) {
  const v = VARIANTS[variant];
  const hasHeader = header != null && header !== '';
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('surface-raised flex items-center gap-3.5 rounded-md p-4 text-text', className)}
      {...rest}
    >
      <i
        aria-hidden="true"
        className={cn('fa-solid icon-sunken shrink-0 text-4xl opacity-80', v.glyph, v.icon)}
      />
      <div className="min-w-0 flex-1">
        {hasHeader && <div className="font-sans font-bold text-text">{header}</div>}
        {content != null && content !== '' && (
          <div className={cn('text-text', hasHeader && 'mt-1')}>{content}</div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-mr-1 -mt-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-text/10 hover:text-text"
        >
          <i aria-hidden="true" className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
}
