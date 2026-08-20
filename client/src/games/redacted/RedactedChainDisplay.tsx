import { Attribution } from '@/games/shared/Attribution';
import { RedactedLine } from './RedactedLine';
import type { RedactedChain } from './redactedUtils';

export interface RedactedChainDisplayProps {
  /** The compiled lines of one story (writer/tamperer/repairer per line). */
  entries: RedactedChain;
  nameTable: Record<string, string>;
  /** When true, author attribution is hidden (matches the lobby's "Hide Authors" config). */
  anonymous: boolean;
}

/**
 * Renders a single finished Redacted story as a sequence of lines, each with the signature redaction
 * bars and up to three author attributions (the line's writer, its tamperer, and its repairer).
 */
export function RedactedChainDisplay({ entries, nameTable, anonymous }: RedactedChainDisplayProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => {
        const segments = Array.isArray(entry.data.line) ? entry.data.line : [];
        const authors = entry.editors
          .map((id) => nameTable[id])
          .filter((name): name is string => Boolean(name))
          .join(', ');
        const showAttribution = !anonymous && Boolean(entry.editors[0]) && authors.length > 0;

        return (
          <div key={i} className="px-1">
            {/* End of the game: the repairs are the payoff, so they are shown marked rather
                than left under ink. */}
            <RedactedLine segments={segments} revealed />
            {showAttribution && <Attribution name={authors} className="mt-1" />}
          </div>
        );
      })}
    </div>
  );
}
