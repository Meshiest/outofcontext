import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Scrollable } from './Scrollable';

/**
 * jsdom reports 0 for every layout box, so the overflow geometry has to be stubbed. These override
 * the prototype getters for the duration of a test.
 */
function stubGeometry({
  clientHeight,
  scrollHeight,
}: {
  clientHeight: number;
  scrollHeight: number;
}) {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(clientHeight);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight);
}

function thumb(container: HTMLElement): HTMLElement | null {
  return container.querySelector('.ooc-scroll-thumb');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Scrollable', () => {
  it('renders its children inside the viewport', () => {
    render(<Scrollable>content</Scrollable>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('draws no thumb when the content fits', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 400 });
    const { container } = render(<Scrollable>content</Scrollable>);
    expect(thumb(container)).toBeNull();
  });

  it('draws a thumb sized to the overflow ratio once the content is taller', () => {
    // Half the content is visible, so the thumb takes half the track.
    stubGeometry({ clientHeight: 400, scrollHeight: 800 });
    const { container } = render(<Scrollable>content</Scrollable>);
    expect(thumb(container)?.style.height).toBe('200px');
    expect(thumb(container)?.style.transform).toBe('translateY(0px)');
  });

  it('moves the thumb to the bottom of the track when scrolled to the end', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 800 });
    const { container } = render(<Scrollable>content</Scrollable>);
    const viewport = container.querySelector('.ooc-scroll-viewport') as HTMLElement;

    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(400);
    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    // Scrolled fully: thumb sits at trackHeight - thumbHeight = 400 - 200.
    expect(thumb(container)?.style.transform).toBe('translateY(200px)');
  });

  it('never shrinks the thumb below its minimum, however long the content', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 100000 });
    const { container } = render(<Scrollable>content</Scrollable>);
    expect(parseFloat(thumb(container)?.style.height ?? '0')).toBeGreaterThanOrEqual(28);
  });

  it('hides the overlay from assistive tech (the viewport is the real scroller)', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 800 });
    const { container } = render(<Scrollable>content</Scrollable>);
    expect(container.querySelector('.ooc-scroll-track')).toHaveAttribute('aria-hidden', 'true');
  });

  it('scrolls the viewport when the thumb is dragged', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 800 });
    const setScrollTop = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(setScrollTop);
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(0);

    const { container } = render(<Scrollable>content</Scrollable>);
    const track = container.querySelector('.ooc-scroll-track') as HTMLElement;
    const thumbEl = thumb(container) as HTMLElement;

    // Track spans 0..400; thumb is 200 tall, so travel is 200.
    track.getBoundingClientRect = () => ({ top: 0, height: 400 }) as DOMRect;
    thumbEl.getBoundingClientRect = () => ({ top: 0, height: 200 }) as DOMRect;

    act(() => {
      thumbEl.dispatchEvent(
        new PointerEvent('pointerdown', { clientY: 0, bubbles: true, cancelable: true }),
      );
      thumbEl.dispatchEvent(new PointerEvent('pointermove', { clientY: 100, bubbles: true }));
    });

    // Dragged halfway down the travel -> half of (scrollHeight - clientHeight).
    expect(setScrollTop).toHaveBeenLastCalledWith(200);
  });

  it('jumps to the clicked position when the bare track is pressed', () => {
    stubGeometry({ clientHeight: 400, scrollHeight: 800 });
    const setScrollTop = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(setScrollTop);
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockReturnValue(0);

    const { container } = render(<Scrollable>content</Scrollable>);
    const track = container.querySelector('.ooc-scroll-track') as HTMLElement;
    track.getBoundingClientRect = () => ({ top: 0, height: 400 }) as DOMRect;

    act(() => {
      track.dispatchEvent(
        new PointerEvent('pointerdown', { clientY: 400, bubbles: true, cancelable: true }),
      );
    });

    // Clicking the bottom of the track centres the thumb there, i.e. scrolls to the end.
    expect(setScrollTop).toHaveBeenLastCalledWith(400);
  });
});
