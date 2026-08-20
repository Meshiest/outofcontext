import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '@/components/lib/cn';

export interface AccordionItemProps {
  /** Header content (rendered inside the toggle button). */
  title: ReactNode;
  /** Collapsible body content. */
  children: ReactNode;
  /** Open on first render (uncontrolled / standalone use). */
  defaultOpen?: boolean;
  /** Injected by `Accordion` for coordinated (controlled) open state. */
  open?: boolean;
  /** Injected by `Accordion`; called when the header is activated. */
  onToggle?: () => void;
  /** Injected by `Accordion`; matches the parent's bordered treatment. */
  styled?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A single accordion section: a header button (aria-expanded / aria-controls)
 * and a collapsible region. Used standalone it manages its own open state;
 * rendered inside `Accordion` it is controlled by the parent.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  open,
  onToggle,
  styled = false,
  className,
  ref,
}: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const headerId = useId();
  const panelId = useId();

  const handleClick = () => {
    if (isControlled) onToggle?.();
    else setInternalOpen((prev) => !prev);
  };

  return (
    <div
      ref={ref}
      className={cn(styled ? '' : 'border-b border-divider last:border-b-0', className)}
    >
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          data-accordion-header
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={handleClick}
          className={cn(
            'accordion-raise flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left',
            'font-sans text-[15px] font-semibold text-text',
            'focus-visible:relative',
          )}
        >
          <span>{title}</span>
          <i
            aria-hidden="true"
            className={cn(
              'fa-solid fa-chevron-down shrink-0 text-sm text-text-muted transition-transform duration-200 motion-reduce:transition-none',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </h3>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            // `inert`, not `hidden`: `hidden` is display:none, which removes the panel instantly and
            // leaves the grid-rows transition nothing to animate, so closing snapped shut while
            // opening animated. `inert` keeps the box laid out (so it can collapse smoothly) while
            // still taking it out of the tab order and the a11y tree.
            inert={!isOpen}
            className="border-t border-divider px-4 py-3 text-[15px] leading-relaxed text-text"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type AccordionItemElement = ReactElement<AccordionItemProps>;

export interface AccordionProps {
  /** Only one section open at a time. */
  exclusive?: boolean;
  /** Bordered card treatment with rules between sections. */
  styled?: boolean;
  /** Index or indices open on first render (uncontrolled). */
  defaultOpen?: number | number[];
  /** Controlled open indices. Provide with `onToggle`. */
  open?: number[];
  /** Called with the toggled item's index (controlled mode). */
  onToggle?: (index: number) => void;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Groups `AccordionItem`s, coordinating open state (exclusive or multi-open)
 * and arrow-key navigation between headers. Uncontrolled by default; pass
 * `open` + `onToggle` to control it.
 */
export function Accordion({
  exclusive = false,
  styled = false,
  defaultOpen,
  open,
  onToggle,
  className,
  children,
  ref,
}: AccordionProps) {
  const items = Children.toArray(children).filter(isValidElement) as AccordionItemElement[];
  const rootRef = useRef<HTMLDivElement | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  const [openSet, setOpenSet] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (defaultOpen != null) {
      (Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]).forEach((i) => initial.add(i));
    } else {
      items.forEach((child, index) => {
        if (child.props.defaultOpen) initial.add(index);
      });
    }
    return initial;
  });

  const isControlled = open !== undefined;
  const effectiveOpen = isControlled ? new Set(open) : openSet;

  const toggle = (index: number) => {
    if (isControlled) {
      onToggle?.(index);
      return;
    }
    setOpenSet((prev) => {
      const isOpenNow = prev.has(index);
      if (exclusive) return isOpenNow ? new Set<number>() : new Set([index]);
      const next = new Set(prev);
      if (isOpenNow) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-accordion-header]')) return;
    const headers = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-accordion-header]') ?? [],
    );
    const current = headers.indexOf(target as HTMLButtonElement);
    if (current === -1) return;

    let next = -1;
    switch (event.key) {
      case 'ArrowDown':
        next = (current + 1) % headers.length;
        break;
      case 'ArrowUp':
        next = (current - 1 + headers.length) % headers.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = headers.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    headers[next]?.focus();
  };

  return (
    <div
      ref={setRefs}
      onKeyDown={handleKeyDown}
      className={cn(
        styled && 'surface-raised divide-y divide-divider overflow-hidden rounded-lg',
        className,
      )}
    >
      {items.map((child, index) =>
        cloneElement(child, {
          key: child.key ?? index,
          open: effectiveOpen.has(index),
          onToggle: () => toggle(index),
          styled,
        }),
      )}
    </div>
  );
}
