import { cn } from '@/components/lib/cn';
import { Icon } from '@/components/ui/Icon/Icon';
import './emoteAnimation.css';

export interface EmoteDisplayProps {
  /** Emote icon name (a key in the Icon map / EMOTE_MAP). */
  emote: string;
  /** When true, snap to invisible (superseded by a newer emote). */
  exiting?: boolean;
}

/**
 * A single animated emote, positioned over a player's name. Slides in, holds, and slides out over
 * 3s (see emoteAnimation.css). Rendered by PlayerList from `useEmoteAnimation` state.
 */
export function EmoteDisplay({ emote, exiting = false }: EmoteDisplayProps) {
  return (
    <span className={cn('ooc-emote text-3xl text-text-muted', exiting && 'ooc-emote--exiting')}>
      <Icon name={emote} />
    </span>
  );
}
