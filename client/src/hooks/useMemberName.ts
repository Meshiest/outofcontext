import { useCallback } from 'react';
import type { AppErrorCode } from '@shared/errors';
import { trpc } from '@/trpc/trpc';
import { appErrorCode } from '@/lib/appError';

export interface UseMemberName {
  /**
   * Submit a name. `onAccepted` runs only once the server has ACCEPTED it.
   *
   * The callback exists because reclaiming a seat (`lobby.replace`) requires the member to already
   * have a name server-side. Firing both mutations together does not work: the client batches them
   * into one request and tRPC resolves a batch concurrently, so replace could land first, find no
   * name, and silently drop the player to a nameless spectator.
   */
  submitName: (name: string, onAccepted?: () => void) => void;
  nameLoading: boolean;
  /** null before a submission resolves, then whether the last submitted name was accepted. */
  nameValid: boolean | null;
  /**
   * Code from a REJECTED submission, as opposed to a valid-but-refused name. The common case is
   * LOBBY_NOT_FOUND: the lobby was culled while the player sat on the name screen, which otherwise
   * failed silently and left them typing into a lobby that no longer existed.
   */
  nameError: AppErrorCode | null;
}

/**
 * Name entry flow. The setName mutation both returns `{ ok }` and pushes `member:nameOk` over the
 * lobby subscription; this hook reads the direct mutation result for the form.
 */
export function useMemberName(): UseMemberName {
  const setNameMutation = trpc.member.setName.useMutation();

  const submitName = useCallback(
    (name: string, onAccepted?: () => void) =>
      setNameMutation.mutate(name, {
        onSuccess: (data) => {
          if (data.ok) onAccepted?.();
        },
      }),
    [setNameMutation],
  );

  return {
    submitName,
    nameLoading: setNameMutation.isPending,
    nameValid: setNameMutation.data?.ok ?? null,
    nameError: appErrorCode(setNameMutation.error),
  };
}
