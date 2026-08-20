import { type FormHTMLAttributes, type Ref } from 'react';
import { cn } from '@/components/lib/cn';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  /** When true, dims the form with an overlay and marks it busy. */
  loading?: boolean;
  /** Marks the form as being in an error state (exposed as a `data-error` hook). */
  error?: boolean;
  /** Forwarded to the underlying native form (React 19 ref-as-prop). */
  ref?: Ref<HTMLFormElement>;
}

export function Form({
  loading = false,
  error = false,
  className,
  children,
  ref,
  ...rest
}: FormProps) {
  return (
    <form
      {...rest}
      ref={ref}
      data-error={error || undefined}
      aria-busy={loading || undefined}
      className={cn('relative flex flex-col gap-4', className)}
    >
      {children}
      {loading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-bg/60"
        >
          <i aria-hidden="true" className="fa-solid fa-spinner fa-spin text-2xl text-primary" />
        </div>
      )}
    </form>
  );
}
