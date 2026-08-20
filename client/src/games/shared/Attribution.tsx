import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';

export interface AttributionProps {
  /** Who to credit. Callers with several authors for one link join them before passing them in. */
  name: string;
  className?: string;
}

/**
 * The right-aligned author credit under a story line, drawing, or panel. Shared by every game that
 * shows one so the dash, the space after it, and the type treatment cannot drift apart per game -
 * the dash itself lives in the locale, since a translation may want different punctuation.
 */
export function Attribution({ name, className }: AttributionProps) {
  const { t } = useTranslation('game-common');
  return (
    <div className={cn('text-right text-sm text-text-muted', className)}>
      {t('attribution', { name })}
    </div>
  );
}
