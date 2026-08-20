import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import { Select } from '@/components/ui/Select/Select';
import { gameCopy } from '@/lib/gameCopy';

export interface GameSelectorProps {
  /** The lobby's currently selected game key (empty string when none). */
  value: string;
  /** Emits the chosen game key. */
  onSelect: (game: string) => void;
}

/**
 * Admin-only game picker. Options come from gameInfo (hidden games excluded). Shows a spinner from
 * the moment a choice is made until the server echoes the new game back as `value`.
 */
export function GameSelector({ value, onSelect }: GameSelectorProps) {
  const { t, i18n } = useTranslation('lobby');
  const [loading, setLoading] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Clear the spinner once the confirmed game changes (render-time "adjust state on prop change").
  if (prevValue !== value) {
    setPrevValue(value);
    setLoading(false);
  }

  const options = (Object.entries(GAMES) as Array<[string, GameMeta]>)
    .filter(([, meta]) => !meta.hidden)
    .map(([key]) => ({ value: key, text: gameCopy(i18n, key, 'title') }));

  const handleChange = (game: string) => {
    if (!game || game === value) return;
    setLoading(true);
    onSelect(game);
  };

  return (
    <Select
      label={t('gameSelect.label')}
      placeholder={t('gameSelect.placeholder')}
      value={value || undefined}
      options={options}
      loading={loading}
      onChange={handleChange}
    />
  );
}
