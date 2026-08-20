import { useCallback, useMemo } from 'react';

// Guarded wrapper around the Vibration API. No-ops where unsupported (desktop, iOS Safari) so
// callers never need to feature-detect.

function vibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export interface Haptics {
  vibrate: (pattern: number | number[]) => void;
  supported: boolean;
}

export function useHaptics(): Haptics {
  const supported = useMemo(() => vibrationSupported(), []);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!supported) return;
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore - some browsers throw on certain patterns
      }
    },
    [supported],
  );

  return { vibrate, supported };
}
