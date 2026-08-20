import { Attribution } from '@/games/shared/Attribution';
import type { StoryEntry } from './types';

export interface StoryChainProps {
  /** The ordered lines of one story. */
  entries: StoryEntry[];
  /** playerId -> display name, for author attribution. */
  nameTable: Record<string, string>;
}

/**
 * Renders a single completed story. Each line is set in the editorial serif (`.story-body` /
 * Newsreader) with the author's name attributed right-aligned below it.
 */
export function StoryChain({ entries, nameTable }: StoryChainProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => (
        <div key={i}>
          <p className="story-body text-text">{entry.link}</p>
          {nameTable[entry.editor] && <Attribution name={nameTable[entry.editor]} />}
        </div>
      ))}
    </div>
  );
}
