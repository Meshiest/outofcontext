import { cn } from '@/components/lib/cn';
import type { RedactedLineSegment } from './redactedUtils';

export interface RedactedLineProps {
  /** Rendered line segments. Word/count segments become redaction bars; punctuation/string stay plain. */
  segments: RedactedLineSegment[];
  /**
   * Show what the bars are covering, marked with the redaction underline rather than hidden behind
   * ink. This is the end-of-game reading: the server sends a repaired word as a `word` segment
   * precisely so it can be pointed out as a replacement, and covering it up there means nobody ever
   * finds out what the story turned into. Mid-game context previews leave it off - hiding them is
   * the game.
   */
  revealed?: boolean;
  className?: string;
}

/**
 * The core distinctive Redacted visual: a line where tampered words are shown as the signature
 * `.redacted` ink bar (whiteout in dark mode) and everything else renders as normal text.
 * Whitespace inside punctuation is preserved so the words flow naturally.
 */
export function RedactedLine({ segments, revealed = false, className }: RedactedLineProps) {
  return (
    <div className={cn('story-body my-1 whitespace-pre-wrap break-words leading-[1.9]', className)}>
      {segments.map((seg, i) => {
        const isRedacted = seg.type === 'word' || seg.type === 'count';
        return (
          <span
            key={i}
            className={cn(isRedacted && 'redacted')}
            data-revealed={isRedacted && revealed ? 'true' : undefined}
          >
            {seg.value ?? ''}
          </span>
        );
      })}
    </div>
  );
}
