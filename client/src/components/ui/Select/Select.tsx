import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/components/lib/cn';

export interface SelectOption {
  text: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  /** Called with the selected value. */
  onChange?: (value: string) => void;
  /** Placeholder shown until a value is chosen. Copy comes from the caller. */
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Label rendered above the control and associated via htmlFor. */
  label?: string;
  /** `true` marks the field invalid; a string also renders as the message below. */
  error?: boolean | string;
  /** Name for a hidden input, so the value posts in a native form. */
  name?: string;
  id?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A fully custom dropdown (select-only combobox). The native <select> popup cannot be themed, so
 * this renders its own listbox styled to the pressed-smooth theme. Keyboard: Up/Down/Home/End move
 * the active option, Enter/Space select, Escape closes; click-outside closes. ARIA: combobox trigger
 * + listbox + aria-activedescendant. A hidden input mirrors the value for native form posts.
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  loading = false,
  disabled = false,
  label,
  error,
  name,
  id,
  className,
  ref,
}: SelectProps) {
  const reactId = useId();
  const buttonId = id ?? reactId;
  const listId = `${buttonId}-list`;
  const errorId = `${buttonId}-error`;
  const optId = (i: number) => `${buttonId}-opt-${i}`;

  const invalid = Boolean(error);
  const hasErrorMessage = typeof error === 'string' && error.length > 0;
  const isDisabled = disabled || loading;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const current = isControlled ? value : internal;
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Merge the internal measuring ref with the caller's forwarded ref.
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = node;
  };

  const openMenu = () => {
    if (isDisabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    if (!isControlled) setInternal(opt.value);
    onChange?.(opt.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // The listbox is portaled to <body>, so it is outside rootRef; treat it as inside too.
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  // Position the portaled listbox against the trigger, flipping up when there is more room above.
  // Re-measure on scroll/resize so it tracks the trigger while open.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 4;
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(256, Math.max(120, (openUp ? spaceAbove : spaceBelow) - gap - 8));
      setMenuStyle(
        openUp
          ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + gap, maxHeight }
          : { left: r.left, width: r.width, top: r.bottom + gap, maxHeight },
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={rootRef}>
      {label && (
        <label htmlFor={buttonId} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={setTriggerRef}
          type="button"
          id={buttonId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optId(activeIndex) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={hasErrorMessage ? errorId : undefined}
          aria-busy={loading || undefined}
          disabled={isDisabled}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
          className={cn(
            'field flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-base',
            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
            invalid && 'border-negative',
          )}
        >
          <span className={cn('truncate', !selected && 'text-text-subtle')}>
            {selected ? selected.text : placeholder}
          </span>
          <i
            aria-hidden="true"
            className={cn(
              'fa-solid shrink-0 text-sm text-text-subtle transition-transform',
              loading ? 'fa-spinner fa-spin' : 'fa-chevron-down',
              open && !loading && 'rotate-180',
            )}
          />
        </button>

        {open &&
          createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              style={{ position: 'fixed', ...menuStyle }}
              className="surface-raised z-50 overflow-auto rounded-md p-1 shadow-lg"
            >
              {options.map((opt, index) => {
                const isSelected = opt.value === current;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={opt.value}
                    id={optId(index)}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(index)}
                    className={cn(
                      'dropdown-option flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-base',
                      isActive && 'dropdown-option--active',
                      !isActive && isSelected && 'dropdown-option--selected',
                    )}
                  >
                    <span className="truncate">{opt.text}</span>
                    {isSelected && (
                      // Active option inherits the chip's light color; otherwise the check reads primary.
                      <i
                        aria-hidden="true"
                        className={cn('fa-solid fa-check text-sm', !isActive && 'text-primary')}
                      />
                    )}
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}
        {name && <input type="hidden" name={name} value={current ?? ''} />}
      </div>

      {hasErrorMessage && (
        <p id={errorId} role="alert" className="text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
