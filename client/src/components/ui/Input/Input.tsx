import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/components/lib/cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Optional label rendered above the field and associated via htmlFor. */
  label?: string;
  /** `true` marks the field invalid; a string also renders as the message below. Copy comes from the caller. */
  error?: boolean | string;
  /**
   * Always occupy the error line, even with no error, so the field's height never changes. Use in a
   * dialog or other tight layout that would otherwise resize the moment a message appears.
   */
  reserveErrorSpace?: boolean;
  /** Rendered icon node. Kept as a ReactNode so Input stays independent of the icon-name map. */
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  size?: InputSize;
  /** Forwarded to the underlying native input (React 19 ref-as-prop). */
  ref?: Ref<HTMLInputElement>;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 px-2.5 text-sm',
  md: 'h-11 px-3 text-base',
  lg: 'h-12 px-3.5 text-lg',
};

export function Input({
  label,
  error,
  reserveErrorSpace = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  className,
  id,
  ref,
  ...rest
}: InputProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error);
  const hasErrorMessage = typeof error === 'string' && error.length > 0;
  const hasIcon = Boolean(icon);
  const iconLeft = hasIcon && iconPosition === 'left';
  const iconRight = hasIcon && iconPosition === 'right';
  // Merge (not clobber) any caller-supplied aria-describedby with the error message id.
  const describedBy =
    [rest['aria-describedby'], hasErrorMessage ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-text-subtle',
              iconLeft ? 'left-3' : 'right-3',
            )}
          >
            {icon}
          </span>
        )}
        <input
          {...rest}
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            'field w-full transition-[border-color]',
            sizeClasses[size],
            iconLeft && 'pl-9',
            iconRight && 'pr-9',
            invalid && 'border-negative focus-visible:border-negative',
          )}
        />
      </div>
      {hasErrorMessage ? (
        <p id={errorId} role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : (
        reserveErrorSpace && (
          <p aria-hidden="true" className="text-sm">
            &nbsp;
          </p>
        )
      )}
    </div>
  );
}
