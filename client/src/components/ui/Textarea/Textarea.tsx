import {
  useId,
  useState,
  type ChangeEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  type Ref,
} from 'react';
import { cn } from '@/components/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label rendered above the field and associated via htmlFor. */
  label?: string;
  /** `true` marks the field invalid; a string also renders as the message below. Copy comes from the caller. */
  error?: boolean | string;
  /**
   * Secondary readout shown opposite the character counter - a word count, say.
   *
   * It shares the counter's row rather than sitting on its own line below, so the two numbers
   * describing the same field read as one status line instead of stacking. An error message takes
   * that slot when there is one, since a problem outranks a statistic.
   */
  hint?: ReactNode;
  /** Forwarded to the underlying native textarea (React 19 ref-as-prop). */
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  maxLength,
  value,
  defaultValue,
  onChange,
  rows = 4,
  ref,
  ...rest
}: TextareaProps) {
  const reactId = useId();
  const textareaId = id ?? reactId;
  const errorId = `${textareaId}-error`;
  const countId = `${textareaId}-count`;
  const invalid = Boolean(error);
  const hasErrorMessage = typeof error === 'string' && error.length > 0;
  const showCount = typeof maxLength === 'number';

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(String(defaultValue ?? ''));
  const currentLength = (isControlled ? String(value ?? '') : internal).length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternal(event.target.value);
    onChange?.(event);
  };

  const describedBy =
    [rest['aria-describedby'], hasErrorMessage ? errorId : null, showCount ? countId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={textareaId} className="field-label">
          {label}
        </label>
      )}
      <textarea
        {...rest}
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          'field w-full resize-y px-3 py-2 text-base transition-[border-color]',
          invalid && 'border-negative focus-visible:border-negative',
        )}
      />
      <div className="flex items-start justify-between gap-3">
        {hasErrorMessage ? (
          <p id={errorId} role="alert" className="text-sm text-negative">
            {error}
          </p>
        ) : (
          <span className="text-sm text-text-subtle">{hint}</span>
        )}
        {showCount && (
          <span id={countId} aria-live="polite" className="text-sm tabular-nums text-text-subtle">
            {`${currentLength}/${maxLength}`}
          </span>
        )}
      </div>
    </div>
  );
}
