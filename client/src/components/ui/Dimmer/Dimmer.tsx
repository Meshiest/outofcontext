import { useEffect, useRef, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cn } from '@/components/lib/cn';

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface DimmerProps extends HTMLAttributes<HTMLDivElement> {
  /** When false the overlay is not rendered. */
  active: boolean;
  /**
   * Called when Escape is pressed while active. When omitted, Escape does
   * nothing (e.g. a non-dismissible loading overlay).
   */
  onClose?: () => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Full-screen fixed overlay that dims the page and centres its children.
 * While active it moves focus into the overlay, keeps Tab focus inside it, and
 * restores focus to the previously focused element when it deactivates.
 */
export function Dimmer({ active, onClose, children, className, ref, ...rest }: DimmerProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    overlayRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    overlayRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [active]);

  if (!active) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (onClose) {
        event.stopPropagation();
        onClose();
      }
      return;
    }
    if (event.key !== 'Tab') return;

    const node = overlayRef.current;
    if (!node) return;
    const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      node.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeEl = document.activeElement;
    if (event.shiftKey && (activeEl === first || activeEl === node)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={setRefs}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        // bg-scrim, not bg-ink: `--ink` is the redaction fill, which is deliberately a WHITEOUT in
        // dark mode, so dimming with it lit the screen up instead of darkening it.
        'fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
