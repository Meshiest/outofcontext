import { useTranslation } from 'react-i18next';
import type { TamperMode } from './redactedUtils';

export interface InkBudgetProps {
  /** Total ink available this edit phase. */
  ink: number;
  /** Ink cost per redacted word, by mode. */
  cost: { truncate: number; censor: number };
  /** Words already redacted in the current selection. */
  used: number;
  mode: TamperMode;
}

/**
 * Compact inline readout of how many more words can be redacted given the current ink level and the
 * selected tamper mode's per-word cost.
 */
export function InkBudget({ ink, cost, used, mode }: InkBudgetProps) {
  const { t } = useTranslation('game-redacted');
  const perWord = cost[mode];
  const capacity = Math.floor(ink / perWord);
  const remaining = Math.max(0, capacity - used);

  return (
    <div className="text-sm text-text-subtle">
      <span className="tabular-nums">{t('inkRemaining', { remaining, capacity })}</span>{' '}
      <span className="text-text-muted">{t('inkDetail', { ink, cost: perWord })}</span>
    </div>
  );
}
