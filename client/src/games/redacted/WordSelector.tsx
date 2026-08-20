import type { KeyboardEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import type { WordSegment } from './redactedUtils';

export interface WordSelectorProps {
  /** Interleaved word/punctuation segments (from `wordify`). */
  words: WordSegment[];
  /** Currently-selected word indexes. */
  selectedIndexes: number[];
  /** Max words that may be selected (half the line, capped by ink). */
  maxSelectable: number;
  onToggle: (index: number) => void;
  /** Rendered beside the progress readout - the ink budget, which shares that status line. */
  trailing?: ReactNode;
}

/**
 * Censor mode: renders the line as individually clickable words. Clicking a word toggles a redaction
 * bar over it; once the ink budget is exhausted the remaining unselected words dim and stop
 * responding. Punctuation is inert.
 *
 * Every word carries the same horizontal padding whether or not it is redacted: padding from
 * `.redacted` alone makes a selected word wider, reflowing the line under the cursor mid-click.
 */
export function WordSelector({
  words,
  selectedIndexes,
  maxSelectable,
  onToggle,
  trailing,
}: WordSelectorProps) {
  const { t } = useTranslation('game-redacted');
  const atBudget = selectedIndexes.length >= maxSelectable;

  return (
    <div>
      <div className="story-body my-2 whitespace-pre-wrap break-words leading-relaxed">
        {words.map((seg, i) => {
          if (seg.type !== 'word') {
            return <span key={i}>{seg.value}</span>;
          }

          const selected = selectedIndexes.includes(seg.index);
          const disabled = !selected && atBudget;
          const activate = () => {
            if (!disabled) onToggle(seg.index);
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
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={selected}
              aria-disabled={disabled || undefined}
              aria-label={t('censorWordAria', { word: seg.value })}
              onClick={activate}
              onKeyDown={onKeyDown}
              className={cn(
                'px-[0.12em]',
                selected
                  ? 'redacted'
                  : cn(
                      'cursor-pointer border-b-2 border-border-soft',
                      disabled && 'cursor-not-allowed opacity-40',
                    ),
              )}
            >
              {seg.value}
            </span>
          );
        })}
      </div>
      <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-4">
        <div className="text-sm italic text-text-muted">
          {t('redacting', { used: selectedIndexes.length, max: maxSelectable })}
        </div>
        {trailing}
      </div>
    </div>
  );
}
