import { Loader } from '@/components/ui/Loader/Loader';

export interface GameWaitingProps {
  /** Already-translated status text. Callers pass a `t()`d string (this component does not translate). */
  message: string;
}

/**
 * Large centered loading display shown during a game's WAITING phase and as the generic
 * "game in progress" fallback. On desktop it claims a tall block so it centers vertically in the
 * game pane rather than sitting at the top of it; on mobile it stays compact.
 */
export function GameWaiting({ message }: GameWaitingProps) {
  return (
    <div className="flex w-full items-center justify-center py-12 lg:min-h-[65dvh]">
      <Loader size="xl" centered label={message}>
        {message}
      </Loader>
    </div>
  );
}
