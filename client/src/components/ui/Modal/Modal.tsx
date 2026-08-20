import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type Ref } from 'react';
import { cn } from '@/components/lib/cn';
import { Button } from '@/components/ui/Button/Button';

export interface ModalProps {
  /** Drives the native dialog's `showModal()` / `close()`. */
  open: boolean;
  /** Requested close: backdrop click, Escape (native `cancel`), or the close button. */
  onClose?: () => void;
  /** Heading content. When present it labels the dialog. */
  title?: ReactNode;
  /**
   * Accessible name for the dialog when no `title` is given. Supply a
   * translated string; the component hardcodes no copy.
   */
  ariaLabel?: string;
  /** Accessible label for the close button (translated). Omit to hide the button. */
  closeLabel?: string;
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDialogElement>;
}

/**
 * Dialog built on the native `<dialog>` element: focus trapping, Escape-to-close
 * and top-layer stacking come from the platform. The `open` prop is the source
 * of truth; `onClose` is a request to close (parent flips `open`).
 */
export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  closeLabel,
  className,
  children,
  ref,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const downTargetRef = useRef<EventTarget | null>(null);
  const titleId = useId();

  const setRefs = (node: HTMLDialogElement | null) => {
    dialogRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDialogElement | null }).current = node;
  };

  // Reflect the `open` prop onto the native dialog. showModal/close are absent
  // under jsdom, so fall back to toggling the `open` attribute for testability.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  // Escape fires the dialog's `cancel` event; keep close controlled via `onClose`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose?.();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    downTargetRef.current = event.target;
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    // A backdrop close requires BOTH the mousedown and the click(up) to land on the dialog itself (not
    // the inner panel). Checking only the up target would close on a drag that starts inside the panel
    // (e.g. selecting text in an input) and releases over the backdrop.
    if (event.target === dialogRef.current && downTargetRef.current === dialogRef.current)
      onClose?.();
  };

  return (
    <dialog
      ref={setRefs}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      aria-labelledby={title != null ? titleId : undefined}
      aria-label={title == null ? ariaLabel : undefined}
      className={cn(
        'surface-raised m-auto w-[min(92vw,32rem)] max-w-full rounded-lg p-0 text-text shadow-lg',
        'backdrop:bg-scrim',
        'opacity-0 translate-y-1 transition-[opacity,transform,overlay,display] duration-100 ease-out',
        '[transition-behavior:allow-discrete] open:opacity-100 open:translate-y-0',
        'starting:open:opacity-0 starting:open:translate-y-1',
        'motion-reduce:transition-none motion-reduce:translate-y-0',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        {(title != null || closeLabel) && (
          <div className="flex items-start justify-between gap-4">
            {title != null ? (
              <h2 id={titleId} className="text-2xl leading-tight">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {closeLabel && onClose && (
              <Button
                iconButton
                size="sm"
                variant="basic"
                icon="times"
                aria-label={closeLabel}
                onClick={onClose}
                className="-mr-2 -mt-2"
              />
            )}
          </div>
        )}
        <div>{children}</div>
      </div>
    </dialog>
  );
}
