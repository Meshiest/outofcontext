import {
  useId,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cn } from '@/components/lib/cn';

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Optional label rendered above the track. Copy comes from the caller. */
  label?: string;
  /** Show the current numeric value alongside the label. */
  showValue?: boolean;
  /** Forwarded to the underlying native range input (React 19 ref-as-prop). */
  ref?: Ref<HTMLInputElement>;
}

export function Slider({
  min = 0,
  max = 100,
  step,
  value,
  defaultValue,
  onChange,
  label,
  showValue = false,
  className,
  id,
  ref,
  ...rest
}: SliderProps) {
  const reactId = useId();
  const sliderId = id ?? reactId;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<number>(defaultValue ?? min);
  const current = isControlled ? value : internal;
  const pct = max > min ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100)) : 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternal(Number(event.target.value));
    onChange?.(event);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label htmlFor={sliderId} className="field-label">
              {label}
            </label>
          ) : (
            <span />
          )}
          {showValue && <span className="text-sm tabular-nums text-text-muted">{current}</span>}
        </div>
      )}
      <input
        {...rest}
        ref={ref}
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={handleChange}
        className="slider"
        style={{ '--val': `${pct}%` } as CSSProperties}
      />
    </div>
  );
}
