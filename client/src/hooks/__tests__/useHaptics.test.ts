import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptics } from '@/hooks/useHaptics';

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as unknown as { vibrate?: unknown }).vibrate;
});

describe('useHaptics', () => {
  it('reports supported and forwards the pattern when navigator.vibrate exists', () => {
    const vibrate = vi.fn();
    (navigator as unknown as { vibrate: unknown }).vibrate = vibrate;

    const { result } = renderHook(() => useHaptics());
    expect(result.current.supported).toBe(true);

    result.current.vibrate([100, 30, 100]);
    expect(vibrate).toHaveBeenCalledWith([100, 30, 100]);
  });

  it('reports unsupported and no-ops when navigator.vibrate is missing', () => {
    delete (navigator as unknown as { vibrate?: unknown }).vibrate;

    const { result } = renderHook(() => useHaptics());
    expect(result.current.supported).toBe(false);
    expect(() => result.current.vibrate(50)).not.toThrow();
  });
});
