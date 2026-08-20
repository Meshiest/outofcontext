import { cn } from '@/components/lib/cn';
import { Doodle } from '@/components/widgets/doodle/Doodle';
import { Attribution } from '@/games/shared/Attribution';
import type { ComicEntry } from './types';

export interface ComicChainProps {
  /** The ordered entries of one drawing sequence. */
  entries: ComicEntry[];
  /** Continuous (single connected drawing) mode. */
  continuous: boolean;
  /** Whether captions were collected and should be shown above each drawing. */
  enableCaptions: boolean;
  /** playerId -> display name, for author attribution. */
  nameTable: Record<string, string>;
}

/**
 * Renders a single completed Dilettante sequence. Two layouts:
 * - continuous: the drawings stack with no gaps so their edges connect into one long composition.
 *   An author overlay is shown when the sequence is not anonymous.
 * - standard: each entry is a caption (editorial serif, when captions are enabled) above its drawing,
 *   with the author attributed right-aligned below.
 */
export function ComicChain({ entries, continuous, enableCaptions, nameTable }: ComicChainProps) {
  if (continuous) {
    const showAuthor = Boolean(entries[0]?.editor);
    return (
      <div className="flex flex-col">
        {entries.map((entry, i) => (
          // The drawings butt together into one composition, so only the OUTER corners round -
          // rounding every panel would cut notches into the joins.
          <Doodle
            key={i}
            readOnly
            className={cn(i === 0 && 'rounded-t-lg', i === entries.length - 1 && 'rounded-b-lg')}
            image={entry.link.drawing}
            author={showAuthor ? nameTable[entry.editor] : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => (
        <div key={i}>
          {enableCaptions && (
            <p className="story-body mb-2 text-center text-text">{entry.link.caption}</p>
          )}
          <Doodle readOnly className="rounded-lg" image={entry.link.drawing} />
          {nameTable[entry.editor] && (
            <Attribution name={nameTable[entry.editor]} className="mt-1" />
          )}
        </div>
      ))}
    </div>
  );
}
