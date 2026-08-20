import '@/i18n';
import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Timer } from './Timer';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Timer', () => {
  it('computes remaining seconds from startTime and duration', () => {
    const start = Date.now() - 5_000;
    render(<Timer startTime={start} duration={30} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('seconds')).toBeInTheDocument();
  });

  it('shows the singular unit at one second remaining', () => {
    render(<Timer startTime={Date.now() - 29_000} duration={30} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('switches to M:SS format above 60 seconds', () => {
    render(<Timer startTime={Date.now()} duration={61} />);
    expect(screen.getByText('1:01')).toBeInTheDocument();
    expect(screen.getByText('remaining')).toBeInTheDocument();
  });

  it('clamps expired timers to 0 and shows the expired label', () => {
    render(<Timer startTime={Date.now() - 40_000} duration={30} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText("Time's up")).toBeInTheDocument();
  });

  it('renders a static duration when startTime is missing', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    render(<Timer duration={45} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    // No interval was scheduled, so nothing to clear on the effect path.
    clearSpy.mockClear();
  });

  it('ticks down as time advances', () => {
    vi.useFakeTimers();
    const start = Date.now();
    render(<Timer startTime={start} duration={30} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    // Fake timers advance Date as well, so the interval callback reads the later clock.
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByText('27')).toBeInTheDocument();
  });

  it('clears its interval on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(<Timer startTime={Date.now()} duration={30} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('never shows more than the full duration when the countdown starts late', () => {
    vi.useFakeTimers();
    // Mounted at turn start, static - this is the drawing timer, which only begins on the first
    // stroke. `now` is captured here.
    const { rerender } = render(<Timer duration={30} />);
    expect(screen.getByText('30')).toBeInTheDocument();

    // The player thinks for five seconds, THEN starts drawing.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender(<Timer duration={30} startTime={Date.now()} />);

    // The stale `now` predates startTime, so an unclamped elapsed would render 35.
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('35')).toBeNull();
  });

  it('holds the full duration for the whole first second', () => {
    vi.useFakeTimers();
    const start = Date.now();
    render(<Timer duration={30} startTime={start} />);
    expect(screen.getByText('30')).toBeInTheDocument();

    // Half a second in is still the first second: a countdown should not have moved yet.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText('30')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByText('29')).toBeInTheDocument();
  });
});
