import type { KeyboardEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import type { WordSegment } from './redactedUtils';

export interface TruncateSelectorProps {
  /** Interleaved word/punctuation segments (from `wordify`). */
  words: WordSegment[];
  /** How many trailing words are currently marked for truncation. */
  truncateCount: number;
  /** Max words that may be truncated (half the line, capped by ink). */
  maxTruncatable: number;
  onSelect: (count: number) => void;
  /** Rendered beside the progress readout - the ink budget, which shares that status line. */
  trailing?: ReactNode;
}

/**
 * Truncate mode: clicking a word redacts everything from that word to the end of the line. Only the
 * latter half of words (and only while ink remains) are clickable, matching the server constraint
 * `i >= floor(wordCount / 2)`.
 *
 * The truncated tail is ONE bar, not a bar per word. Redacting each word separately left the spaces
 * between them uncovered, so a truncation read as a row of separate blocks rather than the single
 * strike-through of the rest of the line that it actually is. The individual words stay inside that
 * bar as transparent hit targets, which keeps them clickable - moving the truncation point earlier
 * means clicking a word that is already covered.
 */
export function TruncateSelector({
  words,
  truncateCount,
  maxTruncatable,
  onSelect,
  trailing,
}: TruncateSelectorProps) {
  const { t } = useTranslation('game-redacted');
  const count = words.filter((w) => w.type === 'word').length;

  const isRedacted = (seg: WordSegment) =>
    seg.type === 'word' && truncateCount >= count - seg.index;

  // Where the bar starts: the first segment at or after the earliest redacted word. Everything from
  // there to the end of the line goes inside it, separators included.
  const firstRedacted = words.findIndex(isRedacted);
  const tailStart = truncateCount > 0 && firstRedacted >= 0 ? firstRedacted : words.length;

  const renderSegment = (seg: WordSegment, i: number, inBar: boolean): ReactNode => {
    if (seg.type !== 'word') return <span key={i}>{seg.value}</span>;

    const clickable = seg.available;
    const activate = () => {
      if (clickable) onSelect(count - seg.index);
    };
    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    };

    return (
      <span
        key={i}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? t('truncateFromAria', { word: seg.value }) : undefined}
        onClick={activate}
        onKeyDown={clickable ? onKeyDown : undefined}
        className={cn(
          'px-[0.12em]',
          // Inside the bar the word is only a hit target: the colour that hides it comes from the
          // bar itself, so it must not paint a background of its own or the joins show as seams.
          !inBar && clickable && 'cursor-pointer border-b-2 border-border-soft',
          inBar && clickable && 'cursor-pointer',
        )}
      >
        {seg.value}
      </span>
    );
  };

  return (
    <div>
      <div className="story-body my-2 whitespace-pre-wrap break-words leading-relaxed">
        {words.slice(0, tailStart).map((seg, i) => renderSegment(seg, i, false))}
        {tailStart < words.length && (
          <span className="redacted">
            {words.slice(tailStart).map((seg, i) => renderSegment(seg, tailStart + i, true))}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-4">
        <div className="text-sm italic text-text-muted">
          {t('redacting', { used: truncateCount, max: maxTruncatable })}
        </div>
        {trailing}
      </div>
    </div>
  );
}
