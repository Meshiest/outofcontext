import { Progress } from '@/components/ui/Progress/Progress';

export interface GameProgressProps {
  /** Completion fraction, 0..1. */
  progress: number;
  /** Wrapper class, used to pick which breakpoint a given copy of the bar is visible at. */
  className?: string;
}

/**
 * Thin progress bar shown while a game is in progress. Renders nothing once complete
 * (`progress === 1`).
 *
 * Rendered twice, in two places, with only one visible at a time: the games render it under their
 * own body for small screens, and LobbyPlaying renders it above the player list on desktop.
 */
export function GameProgress({ progress, className }: GameProgressProps) {
  if (progress === 1) return null;
  // Floor + cap at 99: the null-guard is exact-equality, but Math.round would show "100%" (a full bar)
  // for progress in [0.995, 1) while a turn is still outstanding on a large board. Only a genuinely
  // complete game (progress === 1, handled above) shows a full bar.
  const percent = Math.min(99, Math.floor(progress * 100));
  return (
    <div className={className}>
      <Progress percent={percent} indicating label={`${percent}%`} />
    </div>
  );
}
