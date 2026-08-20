import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const h = vi.hoisted(() => ({
  // Stands in for the server's answer to setName.
  result: { ok: true } as { ok: boolean },
  calls: [] as string[],
}));

vi.mock('@/trpc/trpc', () => ({
  trpc: {
    member: {
      setName: {
        useMutation: () => ({
          mutate: (name: string, opts?: { onSuccess?: (d: { ok: boolean }) => void }) => {
            h.calls.push(name);
            opts?.onSuccess?.(h.result);
          },
          isPending: false,
          data: undefined,
          error: null,
        }),
      },
    },
  },
}));
vi.mock('@/lib/appError', () => ({ appErrorCode: () => null }));

import { useMemberName } from '../useMemberName';

beforeEach(() => {
  h.calls = [];
  h.result = { ok: true };
});

/**
 * The callback gating is the whole point of this hook, and it guards a race that is easy to
 * reintroduce: reclaiming a seat requires a name to exist server-side first, but the client batches
 * mutations and tRPC resolves a batch CONCURRENTLY - so a caller that fires replace alongside
 * setName can have replace land first, find no name, and drop the player to a nameless spectator.
 * Callers therefore chain off `onAccepted`, and it must fire only on an accepted name.
 */
describe('useMemberName', () => {
  it('runs onAccepted once the server accepts the name', () => {
    const onAccepted = vi.fn();
    const { result } = renderHook(() => useMemberName());

    act(() => result.current.submitName('Ada', onAccepted));

    expect(h.calls).toEqual(['Ada']);
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it('does NOT run onAccepted when the name is refused', () => {
    h.result = { ok: false };
    const onAccepted = vi.fn();
    const { result } = renderHook(() => useMemberName());

    act(() => result.current.submitName('Ada', onAccepted));

    // A taken name must not proceed to the seat-reclaim step.
    expect(h.calls).toEqual(['Ada']);
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it('submits fine with no callback', () => {
    const { result } = renderHook(() => useMemberName());
    act(() => result.current.submitName('Ada'));
    expect(h.calls).toEqual(['Ada']);
  });
});
