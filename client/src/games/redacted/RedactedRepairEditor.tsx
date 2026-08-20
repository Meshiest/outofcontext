import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Icon } from '@/components/ui/Icon/Icon';
import { wordCount, type RedactedCensorLink, type RedactedTruncateLink } from './redactedUtils';

export interface RedactedRepairEditorProps {
  link: RedactedCensorLink | RedactedTruncateLink;
  onSubmitCensor: (replacements: Array<[number, string]>) => void;
  onSubmitTruncate: (text: string) => void;
}

/** Width (in em) of a censor gap, scaled by the hidden word's length and clamped to 3-12. */
function gapWidthEm(len: unknown): number {
  const n = typeof len === 'number' ? len : Number(len) || 3;
  return Math.max(Math.min(n, 12), 3) * 0.75;
}

/**
 * A redaction the player is filling in.
 *
 * Shared by both repair modes so a gap behaves the same either way: it holds the space the hidden
 * text occupied and swaps to whatever has been typed, in the surrounding text's face, so the
 * sentence can be read back in place. `minWidth` keeps it from collapsing (and from reflowing the
 * line on every keystroke); the bar is free to grow past it for a longer entry.
 */
function RedactionSlot({
  value,
  placeholder,
  minWidth,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  placeholder?: ReactNode;
  minWidth: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <span
      className={cn(
        'redacted inline-block max-w-full align-baseline text-ink-on',
        className ?? 'text-center',
      )}
      style={{ minWidth }}
      aria-label={ariaLabel}
    >
      {value || placeholder}
    </span>
  );
}

/** Repair phase: fill in censored words (one input per gap) or the truncated tail (a free text area). */
export function RedactedRepairEditor({
  link,
  onSubmitCensor,
  onSubmitTruncate,
}: RedactedRepairEditorProps) {
  if (link.kind === 'censor') {
    return <CensorRepair link={link} onSubmit={onSubmitCensor} />;
  }
  return <TruncateRepair link={link} onSubmit={onSubmitTruncate} />;
}

function CensorRepair({
  link,
  onSubmit,
}: {
  link: RedactedCensorLink;
  onSubmit: (replacements: Array<[number, string]>) => void;
}) {
  const { t } = useTranslation('game-redacted');
  const indexes = link.data.indexes;
  const [words, setWords] = useState<string[]>(() => indexes.map(() => ''));

  const setWord = (i: number, value: string) => {
    setWords((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const isWordValid = (w: string) => wordCount(w) === 1 && w.length >= 1 && w.length <= 32;
  const allValid = words.length === indexes.length && words.every(isWordValid);

  const submit = () => {
    if (!allValid) return;
    onSubmit(indexes.map((index, i) => [index, words[i]] as [number, string]));
  };

  return (
    <form
      className="my-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Header as="h4" icon={<Icon name="redo" />}>
        {t('decensorHeader')}
      </Header>

      <div className="story-body whitespace-pre-wrap break-words leading-relaxed">
        {link.data.line.map((seg, i) => {
          if (seg.type === 'count') {
            // A gap's `key` is its ordinal in `indexes` (server side: `idxs.map((d, k) => ...)`),
            // and `words` is parallel to `indexes` - so the key indexes the input feeding this gap.
            const slot = seg.key ?? 0;
            const gapNumber = slot + 1;
            const typed = words[slot]?.trim() ?? '';

            return (
              // The gap number is the placeholder, centred in the bar while it is empty; once a word
              // is filled in there is nothing left to cross-reference, so it goes.
              <RedactionSlot
                key={i}
                value={typed}
                placeholder={gapNumber}
                minWidth={`${gapWidthEm(seg.value)}em`}
                aria-label={t('gapAria', { number: gapNumber })}
              />
            );
          }
          return <span key={i}>{seg.value ?? ''}</span>;
        })}
      </div>

      <div className="flex flex-col gap-3">
        {words.map((word, i) => {
          const tooMany = wordCount(word) > 1;
          return (
            <Input
              key={indexes[i]}
              label={t('wordFieldLabel', { number: i + 1 })}
              value={word}
              maxLength={32}
              onChange={(e) => setWord(i, e.target.value)}
              error={tooMany ? t('tooManyWords') : undefined}
            />
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button type="submit" variant="primary" disabled={!allValid} className="w-full sm:w-auto">
          {t('repair')}
        </Button>
      </div>
    </form>
  );
}

function TruncateRepair({
  link,
  onSubmit,
}: {
  link: RedactedTruncateLink;
  onSubmit: (text: string) => void;
}) {
  const { t } = useTranslation('game-redacted');
  const [text, setText] = useState('');

  const blockLen = Math.max(1, Math.min(Math.floor(link.data.length), 60));
  // Server rejects a repair with no words (`getWords(line).length === 0` in core/games/redacted.ts),
  // silently dropping it with no feedback - so require at least one word here too, or a punctuation/
  // emoji-only entry leaves the player stuck with the button enabled and nothing happening.
  const valid = text.length >= 1 && text.length <= 256 && wordCount(text) >= 1;

  const submit = () => {
    if (!valid) return;
    onSubmit(text);
  };

  return (
    <form
      className="my-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Header as="h4" icon={<Icon name="redo" />}>
        {t('repairHeader')}
      </Header>

      <div className="story-body whitespace-pre-wrap break-words leading-relaxed">
        <span>{link.data.line}</span>
        {/* Left-aligned rather than centred: this one holds the tail of a sentence, not a single
            word, so it should continue the line rather than sit centred in its own box. */}
        <RedactionSlot value={text} minWidth={`${blockLen}ch`} className="text-left" />
      </div>

      <Textarea
        label={t('replacementLabel')}
        value={text}
        rows={2}
        maxLength={256}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex justify-center">
        <Button type="submit" variant="primary" disabled={!valid} className="w-full sm:w-auto">
          {t('repair')}
        </Button>
      </div>
    </form>
  );
}
