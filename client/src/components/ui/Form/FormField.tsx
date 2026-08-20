import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/components/lib/cn';

export interface FormFieldProps {
  /** Optional label rendered above the control. Copy comes from the caller. */
  label?: string;
  /** `true` marks the field invalid; a string also renders as the message below. */
  error?: boolean | string;
  /** Explicit id to associate the label with. Falls back to a single child's id or a generated one. */
  htmlFor?: string;
  className?: string;
  children?: ReactNode;
}

type ControlProps = {
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

/**
 * Layout wrapper that pairs a label + error message with a single form control.
 * When the child is a single element, its `id`/`aria-invalid`/`aria-describedby`
 * are wired up automatically so the label and error announce correctly.
 */
export function FormField({ label, error, htmlFor, className, children }: FormFieldProps) {
  const reactId = useId();
  const child = isValidElement<ControlProps>(children)
    ? (children as ReactElement<ControlProps>)
    : null;

  const fieldId = htmlFor ?? child?.props.id ?? reactId;
  const errorId = `${fieldId}-error`;
  const invalid = Boolean(error);
  const hasErrorMessage = typeof error === 'string' && error.length > 0;
  const describedBy =
    cn(child?.props['aria-describedby'], hasErrorMessage ? errorId : undefined) || undefined;

  const control = child
    ? cloneElement(child, {
        id: fieldId,
        'aria-invalid': invalid || child.props['aria-invalid'] || undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      {control}
      {hasErrorMessage && (
        <p id={errorId} role="alert" className="text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
