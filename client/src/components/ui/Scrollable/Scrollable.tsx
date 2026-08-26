import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '@/components/lib/cn';

/** Shortest the thumb is allowed to get, so it stays readable in a very long list. */
const MIN_THUMB = 28;

export interface ScrollableProps {
  /** Classes for the outer positioning wrapper (sizing lives here, e.g. `lg:min-h-0 lg:flex-1`). */
  className?: string;
  /** Classes for the scrolling element itself (overflow + padding). */
  viewportClassName?: string;
  /** Classes for the content box inside the viewport (layout, e.g. `flex flex-col gap-3`). */
  contentClassName?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A scrolling region with a drawn scrollbar instead of the browser's.
 *
 * The native bar is hidden and a thumb is drawn over the content from the scroll offsets, which
 * lifts the styling ceiling: `::-webkit-scrollbar` is Chrome/Safari-only and Firefox allows nothing
 * but two flat colours, so a native bar can never match the theme everywhere. The thumb is draggable
 * and the track is click-to-jump, so replacing the native bar costs no behaviour.
 *
 * The thumb is only rendered when the content actually overflows, so a viewport that scrolls at one
 * breakpoint and flows at another (`lg:overflow-y-auto`) needs no extra handling - at the breakpoint
 * where it does not scroll there is no overflow to measure and nothing is drawn.
 */
export function Scrollable({
  className,
  viewportClassName,
  contentClassName,
  children,
  ref,
}: ScrollableProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  const setViewportRef = (node: HTMLDivElement | null) => {
    viewportRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    // The 1px slack keeps sub-pixel layout rounding from drawing a thumb that cannot move.
    if (scrollHeight <= clientHeight + 1) {
      setThumb((prev) => (prev === null ? prev : null));
      return;
    }
    // The thumb travels inside the track, which is inset 2px top and bottom (.ooc-scroll-track), so
    // its reach is the track height, not the viewport's: against clientHeight it overshoots the track
    // bottom at max scroll, and since every ancestor has visible overflow that adds a stray page
    // scrollbar. The `- 4` fallback matches the 2px+2px inset for the first paint, before the track
    // element exists.
    const trackHeight = trackRef.current?.clientHeight ?? clientHeight - 4;
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * clientHeight);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (trackHeight - height);
    setThumb((prev) =>
      prev && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { top, height },
    );
  }, []);

  /** Map a pointer position on the track to the scroll offset that centres the thumb there. */
  const scrollToPointer = useCallback((clientY: number, grabOffset: number) => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const { scrollHeight, clientHeight } = el;
    const trackRect = track.getBoundingClientRect();
    const thumbHeight = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * clientHeight);
    const travel = trackRect.height - thumbHeight;
    if (travel <= 0) return;
    const offset = clientY - trackRect.top - grabOffset;
    const ratio = Math.min(1, Math.max(0, offset / travel));
    el.scrollTop = ratio * (scrollHeight - clientHeight);
  }, []);

  const handleThumbPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      // Grab offset keeps the thumb from jumping so its top snaps under the cursor.
      const grabOffset = event.clientY - event.currentTarget.getBoundingClientRect().top;
      const target = event.currentTarget;
      target.setPointerCapture?.(event.pointerId);

      const onMove = (e: PointerEvent) => scrollToPointer(e.clientY, grabOffset);
      const onUp = () => {
        target.releasePointerCapture?.(event.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
      };
      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    },
    [scrollToPointer],
  );

  /** Clicking the bare track jumps to that position, centring the thumb on the cursor. */
  const handleTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = viewportRef.current;
      if (!el) return;
      const thumbHeight = Math.max(
        MIN_THUMB,
        (el.clientHeight / el.scrollHeight) * el.clientHeight,
      );
      scrollToPointer(event.clientY, thumbHeight / 2);
    },
    [scrollToPointer],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    measure();

    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    // Watch the content too: the viewport's own box does not change when items are added to it.
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
      if (contentRef.current) observer.observe(contentRef.current);
    }

    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);

  return (
    <div className={cn('relative', className)}>
      <div ref={setViewportRef} className={cn('ooc-scroll-viewport', viewportClassName)}>
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </div>
      {thumb && (
        <div
          ref={trackRef}
          aria-hidden="true"
          className="ooc-scroll-track"
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className="ooc-scroll-thumb"
            style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }}
            onPointerDown={handleThumbPointerDown}
          />
        </div>
      )}
    </div>
  );
}
