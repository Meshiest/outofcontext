import { useId, useState, type ChangeEvent, type InputHTMLAttributes, type Ref } from 'react';
import { cn } from '@/components/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Text rendered to the right of the box. Copy comes from the caller. */
  label?: string;
  /** Forwarded to the underlying native checkbox (React 19 ref-as-prop). */
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  label,
  className,
  id,
  disabled,
  checked,
  defaultChecked,
  onChange,
  ref,
  ...rest
}: CheckboxProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const isChecked = isControlled ? checked : internal;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(event.target.checked);
    onChange?.(event);
  };

  return (
    <label
      htmlFor={inputId}
      className={cn(
        // The row is the hit target, so it stays comfortably tappable via its full width; a 44px
        // minimum height only padded dead space above and below the box in stacked settings forms.
        'inline-flex min-h-8 items-center gap-2 select-none',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <input
        {...rest}
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        checked={isControlled ? checked : undefined}
        defaultChecked={isControlled ? undefined : defaultChecked}
        onChange={handleChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'check-box',
          'peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
          isChecked && 'check-box--on',
        )}
      >
        {isChecked && <i className="fa-solid fa-check text-[12px]" />}
      </span>
      {label && <span className="text-text">{label}</span>}
    </label>
  );
}
