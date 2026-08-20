import { Trans } from 'react-i18next';
import { cn } from '@/components/lib/cn';

export interface AppWordmarkProps {
  className?: string;
}

/**
 * The app name with its own joke drawn on it: the word meaning "context" sits in a redaction block,
 * so the title reads as something with the context taken out.
 *
 * WHICH word gets the block is a translation decision, not a layout one - the locale string marks it
 * with an <ink> tag and `Trans` substitutes the element. That keeps the marked span wherever the
 * grammar puts it, rather than assuming (as a prefix + highlighted-suffix pair would) that it is
 * always the last word.
 *
 * Sizing and face are inherited, so this works in the 3xl menu heading and the 6xl gallery specimen
 * without variants. The block's padding is in `em` for the same reason.
 */
export function AppWordmark({ className }: AppWordmarkProps) {
  return (
    <span className={cn('tracking-tight', className)}>
      <Trans
        i18nKey="common:app.wordmark"
        components={{
          ink: (
            <span
              // Nudged off-axis so it reads as ink laid over the word rather than a UI chip.
              className="inline-block rounded-[0.08em] bg-ink px-[0.14em] pt-[0.04em] pb-0 text-ink-on"
              style={{ transform: 'rotate(-0.8deg)' }}
            />
          ),
        }}
      />
    </span>
  );
}
